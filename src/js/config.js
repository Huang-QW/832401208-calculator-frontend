/**
 * 前端配置。
 *
 * 部署时只需要改这里（或在 index.html 里提前定义 window.CALCULATOR_API_BASE），
 * 就能把前端指向任意的后端地址，代码本身不需要改动。
 */

'use strict';

/** 后端接口前缀：本地开发默认指向本机 3000 端口 */
const DEFAULT_API_BASE = 'http://127.0.0.1:3000/api';

/** 历史记录每页条数 */
const PAGE_SIZE = 8;

const CONFIG = {
  API_BASE: window.CALCULATOR_API_BASE || DEFAULT_API_BASE,
  PAGE_SIZE,
  /** 请求超时时间（毫秒） */
  TIMEOUT: 8000,
  /** 搜索输入防抖时间（毫秒） */
  SEARCH_DEBOUNCE: 350,
};
