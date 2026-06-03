# cadmin — 工作交接 / 跨设备续接

> 给「换电脑后重新接上下文」用。新机器上 `git clone` 本仓后，让 AI agent 先读这份文件。
> ⚠️ AI 的本地 memory 不跨设备同步，所以**唯一可靠的背景载体是本仓里的文件**。

## 这个项目是什么

一个**全空的 admin 前端脚手架**，建立在 Camp Design System (CDS) 之上。
- 它是从一个 PSP（支付服务商）项目 `psp-export` **复制出来、删干净业务逻辑**得到的。
- 保留了：完整 CDS 组件库（`src/components/cds/`，56 组件）、设计 token、字号体系、layout 壳、一个**静态 Assets 参考页**（风格锚点）、CDS Guideline 展示页。
- 删掉了：所有 PSP 业务（services/types/mocks/i18n/大部分 pages）、i18n、mock、react-query、原 PRD/planning。
- 目的：拿这个干净底子手搓新的 admin，**不再联动原项目**。

技术栈：React 18 + Vite 5 + TypeScript(strict) + Tailwind v4 + Headless UI v2 + React Router v6 + lucide-react + recharts。**无 i18n、无数据层、无 mock**。

详见根目录 `CLAUDE.md`（已精简成只剩 CDS/样式/TS 规范 + 目录结构）。

## 当前状态（截至 2026-06-03）

- ✅ 项目已砍干净、`tsc`+`build` 通过、dev server 能跑
- ✅ 已 `git init` 并推到 GitHub：`git@github.com:eleveian011/cadmin.git`（SSH 认证，分支 main）
- ✅ git 身份：`eleveian011 <eleveian@gmail.com>`

## 进行中的大事：CDS 抽离 + token 分层

**决策已定，执行挪到 `psp-export` 项目里做**（因为 CDS 的 canonical source 在那边）。

核心目标：
1. 把 CDS 从 psp-export 拆成「可抽离的自包含单元」，不破坏正在用的 psp（中文+SPA 路由要保留）
2. **UI 能力 与 Theme 分层**：`cds-core`（组件+radius+type+keyframes，无色）/ `cds-theme-default`（调色板+语义映射+字体，可替换）。组件只消费 `--surface` 这类语义 token 名字，换主题=换一个 CSS import。
3. 用**注入式 context**（`CdsConfigProvider`，注入 translate + linkComponent）让 cds/ 甩掉 react-i18next 和 react-router 依赖，调用点零改动。
4. cadmin 通过一个 `sync-cds.mjs` 脚本 vendored 同步 canonical 版本（只覆盖 cds/ + cds-core.css，theme 和 globals 归项目自己）。
5. 本轮**不发 npm/registry 包**，只把代码改成「随时能发包」的形状。以后 registry 就位再正式发一次。

已确认的子决策：路由也解耦 / token 拆两层 / 契约纯约定不兜底 / cadmin 先用默认紫主题 / cadmin 已 git init。

**完整 plan 的权威副本**：在 `psp-export` 项目里（执行方）。cadmin 本地也有一份历史副本在 `.claude/plans/cds-extraction-sync.md`，但 `.claude/` 不进仓、不跨设备 → **以 psp-export 那边的为准**。

### 还讨论过、暂缓的想法
- 生成一个 **CDS 消费 skill**（带安装地址+使用教程+UI 规范约定），让任何项目的 agent 一做 UI 就自动遵循 CDS 约定。结论：**等 CDS 拆分落地、信息定稿后再做**，否则会把待定信息固化进去。消费侧 skill 与 psp 那边的维护侧 skill 是两个，别揉一起。

## 环境 / 操作备忘
- 包管理：pnpm（`pnpm dev` / `pnpm build` / `pnpm exec tsc --noEmit`）
- 新机器记得先 `pnpm install`（node_modules 不进仓）
- GitHub 认证走 SSH；新机器需把该机的 SSH 公钥加到 GitHub
- 改代码前看根目录 `CLAUDE.md` 的 CDS 铁律（用 `type-*` 不用 `text-sm`、用语义 token 不用 hex/palette stop、不加 CSS Module）

## 模型分工（经验）
拍板/架构/权衡用 Opus；照图施工（按既定 plan 改文件）用 Sonnet，又快又省。
