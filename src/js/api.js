/**
 * API 请求封装层。
 *
 * 前端对后端的全部访问都收敛在这里，业务代码只调用 Api.xxx()，
 * 不直接写 fetch。好处：
 *   1. 后端换地址 / 换协议时只改一处；
 *   2. 网络异常、超时、非 JSON 响应在这里统一转成友好的中文提示。
 */

'use strict';

/** 自定义错误类型：携带后端返回的 success/message，便于上层直接展示 */
class ApiError extends Error {
  /**
   * @param {string} message 面向用户的提示
   * @param {number} [status] HTTP 状态码
   */
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * 带超时的 fetch。
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('请求超时，请检查后端服务是否正常运行');
    }
    throw new ApiError('无法连接后端服务，请确认后端已启动且地址配置正确');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 统一请求方法：自动处理 JSON、HTTP 状态码与后端返回的 success 字段。
 * @param {string} path 以 / 开头的接口路径
 * @param {RequestInit} [options]
 * @returns {Promise<any>} 后端返回的 JSON
 * @throws {ApiError}
 */
async function request(path, options = {}) {
  const response = await fetchWithTimeout(`${CONFIG.API_BASE}${path}`, options);

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(`后端返回了非 JSON 内容（HTTP ${response.status}）`, response.status);
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || `请求失败（HTTP ${response.status}）`, response.status);
  }
  return payload;
}

const Api = {
  /**
   * 提交表达式给后端计算。
   * 注意：这里传的是**表达式**，不是结果，结果由后端算出来再返回。
   * @param {string} expression 例如 "(1+2)*3"
   * @returns {Promise<{id: number, expression: string, result: number, createdAt: string}>}
   */
  calculate(expression) {
    return request('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression }),
    });
  },

  /**
   * 分页 + 关键字查询历史记录。
   * @param {{page?: number, pageSize?: number, keyword?: string}} [params]
   * @returns {Promise<{list: Array, total: number, page: number, pageSize: number, totalPages: number}>}
   */
  async getHistory(params = {}) {
    const query = new URLSearchParams();
    query.set('page', String(params.page || 1));
    query.set('pageSize', String(params.pageSize || CONFIG.PAGE_SIZE));
    if (params.keyword) {
      query.set('keyword', params.keyword);
    }
    const payload = await request(`/history?${query.toString()}`);
    return payload.data;
  },

  /**
   * 删除指定 ID 的历史记录。
   * @param {number} id
   */
  deleteHistory(id) {
    return request(`/history/${id}`, { method: 'DELETE' });
  },

  /** 清空全部历史记录 */
  clearHistory() {
    return request('/history', { method: 'DELETE' });
  },

  /** 健康检查，用于页面上显示后端连接状态 */
  health() {
    return request('/health');
  },
};
