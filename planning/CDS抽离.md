# CDS 抽离 — 待启动

**状态：等待 psp-export 那边完成拆分工作后启动。**

---

## 背景

CDS 的 canonical source 目前在 `psp-export` 项目的 `src/components/cds/`。cadmin 里的 `src/components/cds/` 是手动复制过来的副本，两边目前内容一致（截至 2026-06-03）。

`psp-export` 那边正在进行 CDS 拆分工程：把 CDS 改造成可抽离的自包含单元，解除对 react-i18next / react-router 的直接依赖，同时把 UI 能力和 Theme 分成两层（`cds-core` + `cds-theme-default`）。

---

## cadmin 这边要做的事（等 psp-export 完成后）

1. **更新导入**：把页面里对 `src/components/cds/` 的相对路径引用，切换到新的导入形式（具体形式待 psp-export 那边确定）
2. **接入 sync 脚本**：运行 `sync-cds.mjs` 把最新 canonical 版本同步过来（只覆盖 `cds/` + `cds-core.css`，theme 和 globals 归 cadmin 自己）
3. **Theme 层**：cadmin 延续默认紫主题，不需要自定义 theme

---

## 不做的事

- 不发 npm/registry 包（本轮目标只是让代码随时能发包的形状）
- 不自己维护 CDS 组件——所有 CDS 组件变更走 psp-export → sync 脚本 → cadmin

---

## 当前 CDS 状态

`src/components/cds/` 现有 56 个组件，完整展示页在 `/cds-guideline`。

任何需要新增或修改 CDS 组件的需求，**先去 psp-export 那边改，再 sync 过来**，不在 cadmin 直接改。
