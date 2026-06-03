# CdsTable 列宽控制模式

## 背景

CdsTable 内部使用 `<table className="w-max min-w-full">`，表格至少撑满容器宽度。当容器比内容宽时，浏览器会把剩余空间按比例分配给所有列。

## 问题

如果某列（如 actions 列）不设 `width`，它会被分配到多余空间，导致视觉上出现不必要的空白。

## 解法：`width: '1%'` 收缩技巧

对于希望"刚好包裹内容、不要多余空间"的列，设置 `width: '1%'`：

```tsx
{
  key: '_actions',
  header: '',
  width: '1%',       // ← 收缩到内容最小宽度
  align: 'right',
  frozen: 'right',
  render: ...
}
```

这是 HTML table 的经典技巧 — 百分比宽度极小时，浏览器会把该列收缩到 `min-content`，剩余空间全部分给其他列。

## 适用场景

- Actions 列（按钮列）— 不需要多余空间
- Icon 列 — 固定内容宽度
- Status badge 列 — 内容宽度可预测

## 不适用场景

- 需要固定像素宽度的列 — 直接用 `width: '180px'`
- frozen left 列 — 需要固定 px 宽度来计算 offset（CdsTable 内部用 `parseInt(width)` 累加）
- 希望按比例分配空间的列 — 不设 width 即可

## 注意

- frozen right 列可以安全使用 `width: '1%'`，因为它只用 `sticky right-0` 定位，不依赖宽度计算
- frozen left 列**必须**用固定 px 宽度，否则 offset 计算会归零导致列重叠
