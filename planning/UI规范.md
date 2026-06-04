# UI 规范 — cadmin 自定义约定

这份文档记录 CDS 之外 cadmin 自己的 UI 约定。随项目推进持续更新。

---

## 基本原则

CDS 是 UI primitive 的唯一来源——按钮、输入框、表格、badge、布局骨架等全用 CDS 组件，不另起炉灶。

本文档只管 **CDS 覆盖不到的部分**：页面级布局组合方式、特定业务 UI 模式、admin 场景特有的交互约定等。

---

## 页面结构约定

### 外层 padding
由 `AppLayout` 统一控制（`px-4 pt-3 pb-8 md:px-10`）。页面组件不自己加外边距。

### 页面标题区
用 `CdsPageHeader` + `CdsBreadcrumb`，不自己写 `<h1>`。

### 内容区域分组
用 `bg-(--surface) rounded-lg` 的卡片块，内边距统一 `p-6`。不用裸 div 直接排内容。

---

## 数据展示约定

### 表格页标准结构
```
CdsPageHeader（标题 + 操作按钮）
  过滤栏（搜索 + 筛选 pills）
  CdsTableState（isLoading / isError / children）
    CdsTable
```

`CdsTableState` 负责处理 loading / error / empty 三种状态，页面不自己写条件渲染。

### 金额显示
- 始终显示货币符号或代码：`$3,847.21` 或 `3,847.21 USD`
- 负数用红色 `text-(--danger-text)`，正数不加颜色
- 金额列右对齐

### 状态 badge
用 `CdsBadge` 的六个 tone：`neutral / primary / success / warning / danger / info`。
业务状态到 tone 的映射在各页面的数据层 hook 里处理（不在组件里 if/else）。

---

## admin 场景特有模式

### 确认危险操作
破坏性操作（删除、暂停、撤销）必须用二次确认 dialog，不直接执行。用 `CdsModal` 或 `CdsDialog`，标题用 `text-(--danger-text)`。

### 批量操作
表格行勾选后出现 bulk action bar，固定在表格底部，不遮挡内容。（具体实现模式待第一个有批量操作的页面落地后补充。）

---

## 待补充

本文档会随页面开发持续更新。每新增一个有复用价值的 UI 模式，在这里记录。
