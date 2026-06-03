# Portal 交互模式

## 问题

`createPortal` 渲染到 `document.body` 时，父组件的 `mousedown` outside-click handler 会把 portal 内的点击误判为"外部点击"，导致面板意外关闭。

## 解法

在 portal panel 元素上通过 `useEffect` 挂载原生 `mousedown` 事件，调用 `stopPropagation`：

```tsx
useEffect(() => {
  const el = panelRef.current;
  if (!el) return;
  const stop = (e: MouseEvent) => e.stopPropagation();
  el.addEventListener('mousedown', stop);
  return () => el.removeEventListener('mousedown', stop);
}, []);
```

## 禁忌

- **绝对不要** 用 `e.nativeEvent.stopImmediatePropagation()` — 会阻断 React 事件委托
- **不要** 在 Headless UI `Menu`/`MenuItems` 内嵌套自定义 portal — Headless UI v2 用 capture phase pointerdown 检测外部点击，会冲突

## 参考实现

`src/components/layout/Sidebar.tsx` 中的 `ProfileMenu` 组件。
