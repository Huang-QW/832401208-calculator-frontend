# 前后端分离计算器系统 · 前端

计算器系统的可视化客户端，使用 **原生 HTML + CSS + JavaScript** 实现。
负责界面展示、按键交互、算式输入，并通过 **HTTP API** 与后端通信。

> 核心原则：**前端不做任何数学运算**。
> 它只把用户输入的算式字符串发给后端，然后显示后端返回的结果。
> 把网络请求断掉，本页面就完全算不出答案。

---

## 一、项目简介

| 项目 | 说明 |
| --- | --- |
| 项目名称 | 前后端分离计算器系统 —— 前端 |
| 主要职责 | 界面呈现、按键交互、算式输入、调用后端接口、展示结果与历史、展示后端返回的错误 |
| 技术选型 | 原生 HTML / CSS / JavaScript（无框架、无构建步骤） |
| 与后端通信 | `fetch` + JSON |

### 为什么不用框架？

作业的主要目标是**理解前后端分离**，而不是堆砌技术。
原生 JavaScript 可以让每一行请求代码都清晰可见，不需要任何构建工具，
克隆下来就能运行，助教检查时也不需要配置 Node 环境（甚至可以直接双击 `index.html`）。

---

## 二、运行环境

- 任意现代浏览器（Chrome / Edge / Firefox / Safari）
- 可选：Node.js >= 18（仅用于启动自带的静态预览服务器，不影响页面本身）
- **必须先启动后端服务**，且后端地址配置正确

---

## 三、安装与启动

### 方式一：直接用浏览器打开（最简单）

直接双击 `src/index.html` 即可。页面会通过 `file://` 协议打开，
再向配置的后端地址发起跨域请求（后端已开启 CORS）。

### 方式二：用自带的静态服务器（推荐）

```bash
cd calculator_frontend
npm start          # 默认 5173 端口
# 或指定端口
node scripts/dev-server.js 8080
```

然后浏览器打开 <http://localhost:5173>。

> 推荐方式二的原因：更接近真实部署环境，浏览器对 `file://` 页面的跨域限制有时更严格；
> 也方便用手机在同一个局域网内访问。

### 完整启动顺序

```bash
# 终端 1：启动后端
cd calculator_backend
npm install
npm start                      # http://localhost:3000

# 终端 2：启动前端
cd calculator_frontend
npm start                      # http://localhost:5173
```

---

## 四、配置说明

前端的全部配置集中在 `src/js/config.js`，里面区分了**本地**和**线上**两套后端地址：

```js
const LOCAL_API_BASE = 'http://127.0.0.1:3000/api';   // 本地开发用的后端地址
const PROD_API_BASE  = 'https://xxx.onrender.com/api'; // 线上部署后的后端地址

// 页面会根据当前域名自动选择，不需要手动切换
const CONFIG = {
  API_BASE: window.CALCULATOR_API_BASE || (isLocalEnvironment() ? LOCAL_API_BASE : PROD_API_BASE),
  PAGE_SIZE: 8,             // 历史记录每页条数
  TIMEOUT: 8000,            // 请求超时（毫秒）
  SEARCH_DEBOUNCE: 350,     // 搜索防抖（毫秒）
};
```

判断规则：域名是 `localhost` / `127.0.0.1`，或直接用 `file://` 双击打开网页（域名为空）
时使用 `LOCAL_API_BASE`，其余情况使用 `PROD_API_BASE`。
**因此同一份代码在本地和线上都能直接用，不需要改代码。**

**部署时切换后端地址有三种方式：**

1. 修改 `PROD_API_BASE` 为你自己的后端地址；
2. 在 `index.html` 中、`config.js` **之前**插入一行，覆盖而不改源码：

   ```html
   <script>window.CALCULATOR_API_BASE = 'https://your-backend.example.com/api';</script>
   ```

3. 在 `index.html` 中定义 `window.CALCULATOR_API_BASE`，这条优先级最高。

---

## 五、与后端的连接方式

前端调用后端的全部代码都收敛在 `src/js/api.js` 一个文件里，业务代码只调用 `Api.xxx()`。

| 前端调用 | 对应后端接口 | 用途 |
| --- | --- | --- |
| `Api.calculate(expression)` | `POST /api/calculate` | 提交算式，拿回结果 |
| `Api.getHistory({page, pageSize, keyword})` | `GET /api/history` | 分页查询历史 |
| `Api.deleteHistory(id)` | `DELETE /api/history/:id` | 删除单条历史 |
| `Api.clearHistory()` | `DELETE /api/history` | 清空历史 |
| `Api.health()` | `GET /api/health` | 探测后端是否可用 |

统一请求方法 `request()` 负责：拼接地址、带超时、解析 JSON、检查 HTTP 状态码、
检查后端返回的 `success` 字段，任何异常都转换成带中文提示的 `ApiError`。

**后端未启动时**，页面右上角会显示红色「后端未连接」，按等号会提示
「无法连接后端服务，请确认后端已启动且地址配置正确」，并且**不会给出任何结果**。

---

## 六、功能说明

### 基础功能

| 功能 | 操作方式 |
| --- | --- |
| 输入算式 | 点击按键，或直接用键盘输入 |
| 计算 | 点击 `=` 或按 `Enter` |
| 退格 | 点击 `⌫` 或按 `Backspace` |
| 清空 | 点击 `AC` 或按 `Esc` |
| 括号 | 点击 `(` `)` 或键盘输入 |
| 展示结果 | 显示屏下方显示后端返回的结果 |
| 错误提示 | 显示屏下方红框显示后端返回的错误原因 |
| 历史展示 | 右侧面板显示历史记录（表达式、结果、时间、ID） |
| 删除历史 | 鼠标移到某条记录上，点击右侧 `✕`（有二次确认） |

### 扩展功能

| 扩展功能 | 说明 |
| --- | --- |
| **键盘快捷键** | 数字、`+ - * /`、`.`、`()`、`Enter`、`Backspace`、`Esc` 全部可用 |
| **历史记录搜索** | 关键字模糊搜索，输入停止 350ms 后自动查询后端 |
| **历史记录分页** | 上一页 / 下一页，每页条数可配置 |
| **一键清空历史** | 清空全部记录（有二次确认） |
| **点击历史回填** | 点击某条历史，可把它的算式载回计算器继续修改 |
| **后端连接状态指示** | 右上角实时显示「后端已连接 / 后端未连接」 |
| **算完接着算** | 按 `=` 后再按运算符，自动用上次结果继续算；按数字则开始新算式 |
| **响应式布局** | 宽屏左右两栏，窄屏自动改为上下布局，手机上也能用 |

---

## 七、项目结构

```text
calculator_frontend/
├── src/
│   ├── index.html              # 页面结构
│   ├── css/
│   │   └── style.css           # 样式（含响应式布局）
│   └── js/
│       ├── config.js           # 配置：后端地址、每页条数、超时
│       ├── api.js              # 【接口层】所有 fetch 请求都在这里
│       ├── calculator.js       # 【交互层】拼算式、显示结果与错误（不做运算）
│       ├── history.js          # 【历史层】列表渲染、删除、搜索、分页
│       └── main.js             # 【入口】装配各模块、检测后端连接
├── scripts/
│   └── dev-server.js           # 零依赖静态文件服务器（本地预览用）
├── package.json
├── codestyle.md                # 代码规范
└── README.md
```

脚本加载顺序（`index.html` 底部）体现了依赖关系：

```html
<script src="js/config.js"></script>      <!-- 被所有人依赖，最先加载 -->
<script src="js/api.js"></script>         <!-- 依赖 config -->
<script src="js/calculator.js"></script>  <!-- 依赖 api -->
<script src="js/history.js"></script>     <!-- 依赖 api、config -->
<script src="js/main.js"></script>        <!-- 依赖以上全部，最后装配 -->
```

---

## 八、安全说明

- 历史记录渲染使用 `document.createElement` + `textContent` 构建 DOM，
  **全程不使用 `innerHTML`**，从根本上避免 XSS（历史内容来自数据库中的用户输入）；
- 算式长度在前端限制为 200 字符，与后端限制保持一致；
- 点击 `=` 时按钮会临时禁用，避免网络慢时连点产生重复请求。

---

## 九、部署提示

这是纯静态站点，可以把 `src/` 目录内容直接部署到任意静态托管服务：

- GitHub Pages（本项目实际采用）
- Netlify / Vercel
- 任意 Nginx / Apache 静态目录

部署后记得把后端地址配置成线上的后端地址（见第四节）。

### 本项目的在线地址

| 内容 | 地址 |
| --- | --- |
| 前端页面 | https://huang-qw.github.io/832401208-calculator-frontend/ |
| 后端接口 | https://calculator-backend-arto.onrender.com/api |
| 后端健康检查 | https://calculator-backend-arto.onrender.com/api/health |

### GitHub Pages 自动部署说明

仓库内置了 `.github/workflows/deploy-pages.yml`，代码推送到 `main` 分支后会自动发布：

```yaml
on:
  push:
    branches: [main]     # 推送即触发
  workflow_dispatch:      # 也支持在 Actions 页面手动触发

permissions:
  contents: read
  pages: write           # 发布 Pages 所需
  id-token: write        # OIDC 令牌，deploy-pages 需要
```

工作流把仓库里的 `src/` 目录作为静态站点根目录上传，因此不需要任何构建步骤。

**首次部署需要先在仓库设置里做两件事**（之后就不用再管了）：

1. `Settings → Actions → General → Workflow permissions` 选择 **Read and write permissions**，
   否则工作流里的 `pages: write` 会被仓库的只读默认设置覆盖，导致配置 Pages 失败；
2. `Settings → Pages → Build and deployment → Source` 选择 **GitHub Actions**。

完成上述设置后，在 `Actions` 页面点 **Re-run all jobs** 重新执行一次即可。

