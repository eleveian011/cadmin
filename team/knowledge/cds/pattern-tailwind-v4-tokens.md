# Tailwind v4 + CDS Token 集成模式

## Token 引用语法

Tailwind v4 使用括号语法引用 CSS 变量：

```html
<div class="text-(--text) bg-(--surface) border-(--border)">
```

## 主题架构 (v2, 2026-05)

**调色盘**（`:root` 单层，不随主题切换）：
- 0=最浅, 1000=最深, 与主题无关
- 8 组完整色阶（purple / cyan / neutral / blue / green / amber / orange / red）+ 5 组图表色

**语义 Token**（按主题分别定义）：
- `:root` → 浅色主题 token 定义，每个 token 显式映射到调色盘档位
- `[data-theme="dark"]` → 深色主题 token 定义，同一 token 可映射到不同档位
- 旧方案是调色盘整体翻转（0↔1000），新方案显式逐 token 定义，支持白标扩展

**圆角 Token**：
- `--cds-radius` (8px)、`--cds-radius-lg` (12px)、`--cds-radius-full` (9999px)
- 命名不回 Tailwind 的 `--radius-*` 混淆
- 按主题定义，未来不同 theme 可有不同圆角值

## @theme 覆盖

在 `globals.css` 中通过 `@theme` block 将 Tailwind 的 radius 指向 CDS token：

```css
@theme {
  --radius-md:   var(--cds-radius);       /* rounded-md   = 8px  */
  --radius-lg:   var(--cds-radius-lg);    /* rounded-lg   = 12px */
  --radius-full: var(--cds-radius-full);  /* rounded-full = 9999px */
}
```

IDE 自动补全的 `rounded-md` / `rounded-lg` / `rounded-xl` 已对齐 CDS token，可直接使用。
在 CSS Module 中引用圆角：`border-radius: var(--cds-radius)`。

## Type Scale

字号通过 `globals.css` 中的 `.type-*` utility class 定义，不使用 Tailwind 原生 `text-*`：

```css
.type-body { font-size: 14px; line-height: 20px; }
.type-h1   { font-size: 34px; line-height: 48px; }
```

Type class 只管 size + line-height，weight 和 color 用 Tailwind utilities 单独设。

## 注意事项

- `@import "tailwindcss"` 是 v4 的入口语法（不是 `@tailwind base` 那套了）
- 语义 token 在 `:root` 和 `[data-theme="dark"]` 中分别定义，主题切换靠 `data-theme` attribute
- 严禁在组件中直接引用调色盘变量（`--neutral-*`、`--purple-*` 等），必须通过语义 token
