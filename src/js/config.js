/**
 * 前端配置。
 *
 * 这里区分了「本地开发」和「线上部署」两套后端地址，
 * 页面会根据当前访问的域名自动选择，因此同一份代码在两种环境下都能直接用。
 *
 * 也可以在 index.html 里提前定义 window.CALCULATOR_API_BASE 来强制指定地址。
 */

'use strict';

/** 后端接口前缀：本地开发时指向本机 3000 端口 */
const LOCAL_API_BASE = 'http://127.0.0.1:3000/api';

/**
 * 后端接口前缀：线上部署后的地址。
 * 部署完后端（Render）之后，把下面的地址换成你自己的服务地址即可。
 */
const PROD_API_BASE = 'https://calculator-backend-arto.onrender.com/api';

/**
 * 判断当前是否运行在本地。
 * 直接双击 HTML 文件时 hostname 为空字符串，也归入本地。
 * @returns {boolean}
 */
function isLocalEnvironment() {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
}

/** 历史记录每页条数 */
const PAGE_SIZE = 8;

const CONFIG = {
  API_BASE: window.CALCULATOR_API_BASE || (isLocalEnvironment() ? LOCAL_API_BASE : PROD_API_BASE),
  PAGE_SIZE,
  /** 请求超时时间（毫秒） */
  TIMEOUT: 8000,
  /** 搜索输入防抖时间（毫秒） */
  SEARCH_DEBOUNCE: 350,
};
