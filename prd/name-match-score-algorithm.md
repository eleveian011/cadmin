# Name Match Score — Algorithm Design

> 同名校验算法设计。独立模块，返回归一化匹配度 [0.0, 1.0]，由调用方自行决定阈值和分类逻辑。

---

## 1. Service Interface

```python
class MatchResult:
    score: float                    # [0.0, 1.0] 匹配度
    normalized_name_a: str          # 归一化后的输入 A
    normalized_name_b: str          # 归一化后的输入 B
    method: str                     # 实际使用的匹配方法: exact | subset | token_fuzzy | pinyin
    details: dict                   # 调试详情（分词、token 匹配矩阵等）

class NameMatchOptions:
    enable_transliteration: bool    # ASCII 转写（默认 true）
    enable_pinyin: bool             # 中文拼音匹配（默认 true）
    user_type: str                  # "individual" | "enterprise"
    custom_abbreviations: dict      # 额外缩写映射

class NameMatchService:
    def calculate(name_a: str, name_b: str, options: NameMatchOptions = None) -> MatchResult:
        ...

    def batch_calculate(pairs: list, options: NameMatchOptions = None) -> list[MatchResult]:
        ...
```

### 职责边界

| 负责 | 不负责 |
|------|--------|
| 计算两个名称之间的匹配度 | 判断是 1st / 3rd Party（调用方决定） |
| 处理语言差异（拼音、特殊字符） | 判断是否可以打款（调用方决定） |
| 返回归一化分数和调试信息 | 触发等待队列或通知（调用方决定） |
| 独立、无副作用的纯函数计算 | 访问数据库或缓存（调用方传入数据） |

---

## 2. Pipeline

```
name_a ─┐
         ├──→ 1. 归一化 → 2. 分词 → 3. 快速通道 → 4. Token 匹配 → 5. 分数计算 → 6. 结构校验 → score
name_b ─┘                      │                                  ↑
                                └── (可选) 拼音分支 ───────────────┘ 仅拼音分支
```

### 2.1 归一化 Normalization

```
normalize(name, options):
  1. 去除首尾空格
  2. 转小写
  3. Unicode NFKC 正规化（处理全角/半角）
  
  4. [transliteration] 如有特殊字符，执行 ASCII 转写
     - NFD 分解 + 去掉组合变音符号: José → Jose, Müller → Muller, Piñeiro → Pineiro
     - 特殊映射（不在 NFD 覆盖范围内的）:
       Ł/ł → L/l,  Ø/ø → O/o,  ß → ss,  Æ/æ → AE/ae,  Œ/œ → OE/oe
     - 使用 ICU Transliterator 或等价库
     - 示例:
       "José Müller"       → "jose muller"
       "Łukasz Wiśniewski" → "lukasz wisniewski"
       "François Noël"     → "francois noel"
  
  5. 替换逗号为空格（处理 "Tay, John" → "Tay  John"）
  6. 去掉除连字符和撇号外的标点
  7. 压缩连续空白为单个空格

  8. [pinyin] 如 enable_pinyin=true 且是个人用户，且 name 含中文字符：
     - 将中文部分转为拼音（小写、无音调）
     - 非中文部分保持原样
     - **生成多种分词变体**，因为 SWIFT 端的分词不可控：
       a. **字符级**: 每字一词，如 "王小华" → ["wang", "xiao", "hua"]
       b. **合并版**: 相邻拼音合并（尤其针对双字given name），如 "王小华" → ["wang", "xiaohua"]
       c. **全拼版**: 不空格，如 "王小华" → ["wangxiaohua"]
     - 后续 token 匹配时对所有变体都试，取最高分
```

**Transliteration 覆盖范围**：

| 语言 | 原字符 | 转写后 |
|------|--------|--------|
| 法语 | é è ê ë ç ô œ | e e e e c o oe |
| 西班牙语 | é í ó ú ü ñ | e i o u u n |
| 德语 | ä ö ü ß | ae oe ue ss |
| 丹麦/挪威 | æ ø å | ae oe aa |
| 波兰语 | ł ą ć ę ł ń ó ś ż | l a c e l n o s z |
| 瑞典语 | ä ö | ae oe |
| 捷克语 | á č ď é ě í ň ř š | a c d e e i n r s |

### 2.2 分词 Tokenization

```
tokenize(name, options):
  1. 按空白符切分 → tokens 列表
  
  2. [enterprise suffix] 如用户类型是企业：
     识别并分离公司后缀（从 tokens 末尾匹配）
     suffixes = {"pte ltd", "ltd", "private limited", "limited",
                 "inc", "llc", "llp", "corp", "corporation",
                 "sa", "sdn bhd", "berhad", "plc", "gmbh", "ag",
                 "kg", "nv", "bv", "sarl", "eurl", "sas", "spa", "srl",
                 "pty ltd", "co ltd", "co., ltd."}
     返回 (core_tokens, suffix_tokens)
  
  3. [pinyin] 如启用拼音且有个体户名称含中文字符：
     尝试两种分词方式：
       a. 标准空格分词（来自拼音库）
       b. 无空格拼接版
     两种都保留用于匹配
```

### 2.3 快速通道 Quick-Path Checks

| 条件 | 分数 | 适用场景 |
|------|------|----------|
| 归一化后字符串完全相同 | **1.0** | 精确匹配 |
| 企业名去掉后缀后核心部分相同 | **1.0** | "Linkens Technology Pte Ltd" vs "Linkens Technology" |
| 一方 core tokens 是另一方的真子集 | **0.95** | "John" vs "John Lim" |
| 拼音版本匹配（个人用户） | **1.0** | "张三" vs "Zhang San"（或 "zhang san"） |
| 拼音合并版匹配 | **1.0** | "张三" vs "Zhangsan"（或 "zhangsan"） |

### 2.4 Token 相似度矩阵

对剩余的、未通过快速通道的 case：

建 n×m 矩阵，sim[i][j] 计算 sender_token[i] 与 client_token[j] 的相似度：

| Token 条件 | 相似度 |
|------------|--------|
| 完全相同 | **1.0** |
| 缩写匹配（一方是另一方的已知缩写） | **0.90** |
| 短 token (≤ 3 字符) 非精确匹配 | **0.0**（太短不适合模糊） |
| 长 token (> 3 字符) 归一化编辑距离 ≥ 0.6 | **1 - edit_dist / max(len(t1), len(t2))** |
| 长 token 归一化编辑距离 < 0.6 | **0.0**（噪音地板） |
| 拼音 token vs 英文 token 匹配 | *见下方拼音分支* |

**拼音分支细则**（个人用户）：

如果一方有中文转拼音后的 tokens，另一方是英文 tokens：

```
# 举例: 张三 → pinyin tokens = ["zhang", "san"]
# sender: "Zhang San" → tokens = ["zhang", "san"]

# 如果客户端名字含中文，转拼音后 vs 英文字母名：
# 直接走上面的 Token 相似度矩阵，拼音 token 和英文 token 做精确匹配
# 因为拼音转写后已经是英文字母了

# 特殊处理：音近字（多音字容错）
# 如 "单" → pinyin 可能是 "dan" 或 "shan"
# 用拼音库的默认输出，如果匹配不上，不额外做多音字遍历（避免过度复杂化）
```

### 2.5 最优 Token 匹配

```
1. 收集所有 (i, j, sim[i][j]) 其中 sim[i][j] > 0
2. 按相似度降序排列
3. 贪心匹配（每个 token 最多匹配一次）
4. 结果：匹配对集合 + 未匹配 tokens
5. [pinyin] 如涉及拼音变体，记录每个 token 对应的原始汉字位置
   - 用于后续结构校验（§2.7）
```

### 2.6 分数计算

```
matched_score = Σ(已匹配对的相似度)
n = len(sender_tokens)
m = len(client_tokens)
unmatched = 双方未匹配的 token 总数

base = matched_score / max(n, m)

if token_subset_relationship:
    # "John" vs "John Lim" — 长的一方多出来的 token 权重降低
    final = base × (1 - 0.10 × unmatched / max(n, m))
else:
    # "John Lim" vs "John Tay" — 不匹配的 token 有惩罚
    final = base × (1 - 0.25 × unmatched / max(n, m))

# 位置一致性加分
if 匹配对的 token 在双方顺序一致:
    final += 0.05

return clamp(final, 0.0, 1.0)
```

### 2.7 拼音结构校验（仅限中文个人用户）

**问题**：当拼音转写 + token 集匹配时，"王小华" 的 token 集 {wang, xiao, hua} 和 "Hua Xiao Wang" 的 token 集完全相同，但明显不是同一个人。需要验证**中文汉字的组合方式是否一致**。

**校验逻辑**：

```
validate_pinyin_structure(char_count, matched_sender_tokens):
    """
    char_count: 中文名的汉字数
    matched_sender_tokens: 按 sender 原始顺序排列的匹配结果列表，
                           每个元素包含该 sender token 对应的汉字位置
                           
    例: "王小华"(3字) vs "Xiaohua Wang"
        sender token 顺序: ["xiaohua"(→位置1+2), "wang"(→位置0)]
        汉字位置序列: [1, 2, 0]
    """
    
    # 允许的汉字位置序列
    chinese_order = list(range(char_count))           # [0, 1, ..., n-1]
    western_order = list(range(1, char_count)) + [0]  # [1, ..., n-1, 0]
    
    return char_seq == chinese_order or char_seq == western_order
```

| 发送方 | 汉字位置序列 | 结果 | 原因 |
|--------|-------------|------|------|
| "Wang Xiaohua" | [0, 1+2]=[0,1,2] | ✓ 中文顺序 | "王小华"本人 |
| "Wang Xiao Hua" | [0, 1, 2] | ✓ 中文顺序 | 同上 |
| "Xiaohua Wang" | [1+2, 0]=[1,2,0] | ✓ 西文顺序 | 同上（西方命名习惯） |
| "Xiao Hua Wang" | [1, 2, 0] | ✓ 西文顺序 | 同上 |
| "Hua Xiao Wang" | [2, 1, 0] | ✗ 无效 | 不同名字组合，假阳性 |
| "Huaxiao Wang" | 无法分解 → 不触发拼音匹配 | N/A | token 级已过滤 |

**校验失败处理**：score *= 0.5（大幅降低匹配度，落入 < 0.85 → 3rd Party）

**不触发拼音校验的场景**：
- 企业用户（enable_pinyin=false）
- 双方名字都不含中文字符（纯英文名，不适用汉字结构概念）
- 发送方 token 无法匹配到任何汉字位置（如纯英文名匹配纯中文名，但拼音变体已经试过都匹配不上）

---

## 3. 阈值（法币入金场景）

| 匹配度 | 分类 | 说明 |
|--------|------|------|
| **S ≥ 0.85** | 1st Party | 较少必填字段 |
| **S < 0.85** | 3rd Party | 额外要求 Payment Reference |
| | | 两种分类都 proceed to screening |

> 阈值由 **调用方（法币入金规则引擎）** 定义和存储。NameMatchService 只负责返回分数，不做分类判断。这样其他模块（未来可能有的提现、转账等）可以用同一个模块但设不同的阈值。

---

## 4. 完整示例

### 4.1 基本匹配

| # | Name A | Name B | Score | Method | 说明 |
|---|--------|--------|-------|--------|------|
| 1 | "John Lim" | "John Lim" | 1.0 | exact | 精确匹配 |
| 2 | "LINKENS TECHNOLOGY" | "Linkens Technology" | 1.0 | exact | 忽略大小写 |
| 3 | "John" | "John Lim" | 0.95 | subset | 子集匹配 |
| 4 | "John Lim" | "John Tay" | ~0.44 | token_fuzzy | 不同人，"Lim" ≠ "Tay" |
| 5 | "John Tay" | "Tay, John" | 1.0 | exact | 逗号处理 |
| 6 | "Lim John" | "John Lim" | 1.0 | token_fuzzy | token 顺序不同，集合同 |
| 7 | "Linkens Technology Pte Ltd" | "Linkens Technology" | 1.0 | exact | 公司后缀分离 |
| 8 | "Linkens Technology Pte Ltd" | "Linkens Technlogy" | ~0.88 | token_fuzzy | 编辑距离容错 |

### 4.2 特殊字符示例

| # | Name A | Name B | Score | 说明 |
|---|--------|--------|-------|------|
| 9 | "José García" | "Jose Garcia" | 1.0 | 重音转 ASCII（transliteration） |
| 10 | "Müller GmbH" | "Mueller GmbH" | 1.0 | 德语 umlaut → ae（transliteration）或 → u |
| 11 | "François Noël" | "Francois Noel" | 1.0 | 法语特殊字符 |
| 12 | "Łukasz Wiśniewski" | "Lukasz Wisniewski" | 1.0 | 波兰语非 NFD 字符 |
| 13 | "Straße" | "Strasse" | 1.0 | 德语 ß → ss |

> **注意**：transliteration 可能有多种目标结果（如 ü → ue 或 u）。建议在归一化阶段同时保留两种转写结果用于匹配：一种是一对一 ASCII 替换（ü → u），一种是约定俗成的展开形式（ü → ue）。如果任意一种匹配上就算匹配成功。

### 4.3 中文拼音示例（个人用户）

| # | CAMP 注册名 | SWIFT 发来名 | Score | 说明 |
|---|-----------|-------------|-------|------|
| 14 | "张三" | "zhang san" | 1.0 | 拼音标准转换匹配 |
| 15 | "张三" | "Zhang San" | 1.0 | 拼音 + 大小写（归一化后一致） |
| 16 | "张三" | "Zhangsan" | 1.0 | 拼音合并版本匹配 |
| 17 | "李思远" | "Li Siyuan" | 1.0 | 拼音标准转换（三字名） |
| 18 | "王小华" | "Xiaohua Wang" | 1.0 | 拼音西文顺序：位置序列 [1,2,0] ✓ |
| 19 | "王小华" | "Wang Xiao Hua" | 1.0 | 拼音中文顺序：位置序列 [0,1,2] ✓ |
| 20 | "王小华" | "Hua Xiao Wang" | ~0.28 | 拼音结构校验失败，score × 0.5 → 3rd Party |
| 21 | "王小华" | "Huaxiao Wang" | ~0.28 | token 级 "huaxiao"≠"xiaohua" 已过滤，拼音变体匹配不上 → 低分 |
| 22 | "张三" | "San Zhang" | 1.0 | 二字名，西文顺序 [1,0] ✓ |

> 对 #18-19，"王小华" 的拼音变体分别匹配西文顺序和中文顺序，结构校验通过 → 1st Party。
> 对 #20，"Hua Xiao Wang" 的 token 集和 "王小华" 相同，但汉字位置序列 [2,1,0] 不符合任何允许模式 → 结构校验失败 → score × 0.5 → 3rd Party。

### 4.4 中文企业用户（不启用拼音）

| # | CAMP 注册名 | SWIFT 发来名 | Score | 说明 |
|---|-----------|-------------|-------|------|
| 23 | "联科思科技有限公司" | "Linkens Technology" | 无法匹配 | 企业中文名 vs 英文名无映射关系→不启用拼音 |
| 24 | "Linkens Technology Pte Ltd" | "Linkens Technology" | 1.0 | 企业注册英文名匹配 |

---

## 5. 部署方案

```
┌──────────────────────────┐
│     NameMatchService      │  ← 独立模块，无外部依赖
│  - normalize()            │
│  - tokenize()             │
│  - compute_score()        │
└──────────┬───────────────┘
           │ 返回 MatchResult
           ▼
┌──────────────────────────┐
│   Deposit Rule Engine    │  ← 调用方
│  - receives score        │
│  - checks threshold      │
│  - classifies 1st/3rd    │
│  - or returns match      │
│    candidates (S7.1.4)   │
└──────────────────────────┘
```

**依赖**：
- ICU 或等价 transliteration 库（特殊字符处理）
- pinyin 转换库（中文拼音）
- 标准库字符串处理

**阈值配置**（法币入金用）：
```
# Apollo / 数据库配置项
name_match.threshold.first_party = 0.85    # ≥ 此值 → 1st Party，< 此值 → 3rd Party
name_match.enable_transliteration = true
name_match.enable_pinyin = true
```

**未来可复用场景**：
- 提现同名校验（同名账户提现需匹配 sender name）
- 转账同名校验
- 其他需要比较两个名称是否指向同一实体的场景

---

## 6. 与 PRD S7.2 的关系

当前 S7.2 的 "Classification Rules" 表格（exact / case-insensitive / subset / different surname / token-order 等规则）**全部替换为**该算法的结果输出。业务结果保持一致（所有原表格例子都能产生预期的分类），同时覆盖更广泛的真实场景。

PRD S7.2 仅保留：
- 职责定义：在规则引擎 Step 5 执行，比较 sender name vs 已识别的 client 注册名
- 配置阈值
