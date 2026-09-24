# 代码规范（前端）

> **规范来源**
>
> 本文档以 **[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)**
> 为主要依据，并参考 **[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)**
> 与 **MDN Web Docs** 的推荐实践，结合本项目（原生 HTML / CSS / JavaScript）的实际情况做了裁剪与补充。
>
> - Google JavaScript Style Guide：<https://google.github.io/styleguide/jsguide.html>
> - Airbnb JavaScript Style Guide：<https://github.com/airbnb/javascript>
> - MDN Web Docs：<https://developer.mozilla.org/zh-CN/>
> - BEM 命名方法论：<http://getbem.com/naming/>

---

## 1. 文件组织

| 规则 | 说明 |
| --- | --- |
| 目录划分 | `src/` 放页面资源，`scripts/` 放开发脚本 |
| 一个文件一个职责 | `api.js` 只发请求，`calculator.js` 只处理交互，不互相掺和 |
| 脚本加载顺序 = 依赖顺序 | 被依赖的模块先加载，入口 `main.js` 最后加载 |
| 不使用构建工具 | 保持零依赖，克隆即可运行 |

## 2. 命名

| 类型 | 规范 | 示例 |
| --- | --- | --- |
| 变量 / 函数 | 小驼峰 | `expression`、`renderExpression` |
| 全局模块对象 | 大驼峰 | `Api`、`Calculator`、`History`、`App` |
| 常量 | 全大写下划线 | `MAX_LENGTH`、`LOCAL_API_BASE` |
| 私有变量 | 用 IIFE 作用域隐藏，不加下划线 | `let expression` |
| CSS 类名 | 小写 + 中划线（BEM 的块-元素写法） | `panel-header`、`history-item`、`key-op` |
| 状态类 | `is-` 前缀 | `is-active`、`is-error` |
| 状态属性 | `data-*` 属性 | `data-state="ok"` |
| DOM 引用集合 | 命名为 `els` | `const els = { expression, result }` |

### 模块模式

每个功能模块使用 **IIFE + 返回公开接口** 的写法，把内部状态和辅助函数藏在闭包里：

```js
const Calculator = (() => {
  let expression = '';            // 外部无法访问，保证状态只能通过公开方法修改
  function renderExpression() {}  // 内部辅助函数

  return { append, clear, submit };  // 只暴露必要的接口
})();
```

## 3. 格式化

| 项目 | 规定 |
| --- | --- |
| 缩进 | 2 个空格，禁止 Tab |
| 行宽 | 不超过 100 字符 |
| 分号 | 必须有 |
| 引号 | JS 用单引号；HTML 属性用双引号 |
| 尾随逗号 | 多行对象 / 数组 / 参数列表末尾保留 |
| 大括号 | 即使单行也必须写 |
| 空行 | 函数之间、逻辑块之间空一行 |

## 4. HTML

- 使用语义化标签：`<section>` `<header>` `<footer>` `<button>` `<ul>` `<li>`；
- 语言声明 `<html lang="zh-CN">`，编码 `<meta charset="UTF-8">`；
- 必须有 `<meta name="viewport">` 以支持移动端；
- 能点击的元素就用 `<button>`，不要用 `<div onclick>`（可访问性）；
- 自定义数据通过 `data-*` 传递，不与显示文本耦合：

  ```html
  <button class="key key-op" data-key="/">÷</button>
  ```
  按钮上显示 `÷`，但传给 JS 的是 `/`，这样界面文案与程序逻辑解耦。

- 纯装饰性图标按钮要有 `title` 或 `aria-label`。

## 5. CSS

- 使用 CSS 变量集中管理颜色与圆角，定义在 `:root` 中：

  ```css
  :root {
    --primary: #4f8cff;
    --radius-md: 12px;
  }
  ```

- 类名采用 BEM 思路：`块-元素`（`history-item`、`history-expression`）、`块--修饰符` 或独立状态类；
- 优先使用 Flexbox / Grid 布局，避免使用 `float` 与表格布局；
- **禁止使用 `!important`**，禁止行内样式；
- 布局使用相对单位与 `minmax()`，保证响应式；
- 至少提供一个响应式断点，保证窄屏可用。

## 6. JavaScript

- 默认 `const`，需要重新赋值才用 `let`，**禁止 `var`**；
- 使用严格相等 `===` / `!==`；
- 使用模板字符串拼接文本：`` `= ${value}` ``；
- 使用可选链与空值合并：`req?.body`、`params.keyword ?? ''`；
- 使用 `URLSearchParams` 构造查询字符串，不要手工拼接 `&` 与 `encodeURIComponent`；
- 每个文件的顶层加 `'use strict';`；
- 使用 IIFE 隔离模块作用域，避免污染全局。

## 7. 网络请求

- **所有 `fetch` 只能出现在 `api.js` 中**，其他模块一律调用 `Api.xxx()`；
- 请求必须带超时（`AbortController`），不能让用户无限等待；
- 统一处理：HTTP 状态码、`success` 字段、非 JSON 响应、网络异常，
  全部转成带中文提示的 `ApiError`；
- 每个请求函数都要有 JSDoc 说明参数与返回结构。

## 8. DOM 操作

- 事件绑定使用**事件委托**：在容器上挂一个监听，通过 `event.target.closest()` 找到目标按钮，
  避免为每个按钮单独绑定；
- 元素引用在模块初始化时统一缓存在 `els` 对象中，不在函数里反复 `getElementById`；
- **禁止使用 `innerHTML` 插入任何来自后端或用户的数据**，
  统一使用 `createElement` + `textContent`，这是本项目防 XSS 的核心措施；
- 批量更新列表使用 `replaceChildren()` 清空后重建。

## 9. 前后端职责边界

这是本作业最重要的一条规范：

- **前端禁止出现任何数学计算逻辑**（不能有 `+` `-` `*` `/` 的运算、不能有 `eval`）；
- 前端只负责：拼算式字符串 → 发请求 → 显示后端返回的结果或错误；
- 前端的输入校验仅限"体验优化"级别（例如算式长度上限），
  **真正的合法性校验必须在后端完成**；
- 后端返回的错误信息要原样展示给用户，不要在前端重新编造一套错误文案。

## 10. 注释

- 每个模块顶部写清职责边界（尤其是 `calculator.js` 要写明"不做运算"）；
- 导出的方法写 JSDoc，说明参数与返回值；
- 对"反直觉"的代码必须解释原因，例如：

  ```js
  // 刚按过等号时的两种走法：
  //   按运算符 -> 拿刚才的结果继续算（屏幕变成 "3+"）
  //   按数字   -> 开始一道全新的算式
  ```

- 禁止提交被注释掉的死代码。
