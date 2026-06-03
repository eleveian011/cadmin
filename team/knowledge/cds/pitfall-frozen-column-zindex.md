# CdsTable 冻结列内弹出层 z-index 规则

## 问题

CdsTable 的 frozen 列使用 `sticky` + `z-10` 定位。如果在 frozen 列的单元格内放置下拉菜单（CdsDropdownPanel），菜单的 `z-index` 必须高于 `z-10`，否则会被相邻的 frozen 单元格遮挡。

## 规则

在 CdsTable frozen 列内使用弹出层时：
- 弹出层容器必须使用 `z-200` 或更高
- 不要使用 `z-100`（不够高，仍会被遮挡）
- CdsTable 内部 frozen 列 = `z-10`，表头 = `z-10`

## 示例

```tsx
// 在 frozen: 'right' 列的 render 中
{open && (
  <div className="absolute right-0 top-[calc(100%+4px)] z-200">
    <CdsDropdownPanel>...</CdsDropdownPanel>
  </div>
)}
```

## 适用场景

- Actions 列（frozen right）内的 MoreMenu
- 任何 frozen 列内的 popover / dropdown / tooltip
