/**
 * 计算历史模块。
 *
 * 所有历史数据都来自后端接口，页面本身不缓存、不使用 LocalStorage。
 * 每次增删之后都重新向后端查询一次，保证界面与数据库一致。
 */

'use strict';

const History = (() => {
  const els = {
    list: document.getElementById('history-list'),
    count: document.getElementById('history-count'),
    search: document.getElementById('search-input'),
    refreshBtn: document.getElementById('refresh-btn'),
    clearBtn: document.getElementById('clear-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info'),
  };

  /** 当前页码（从 1 开始） */
  let page = 1;
  /** 当前搜索关键字 */
  let keyword = '';
  /** 上一次查询返回的总页数 */
  let totalPages = 1;
  /** 记录点击某条历史时把算式回填到计算器 */
  let onReuseExpression = null;

  /**
   * 渲染提示行（加载中 / 空列表 / 查询失败）。
   * @param {string} text
   * @param {boolean} [isError]
   */
  function renderPlaceholder(text, isError = false) {
    els.list.replaceChildren();
    const li = document.createElement('li');
    li.className = isError ? 'history-empty is-error' : 'history-empty';
    li.textContent = text;
    els.list.appendChild(li);
  }

  /**
   * 创建一条历史记录的 DOM 节点。
   * 全部使用 textContent 赋值而不是 innerHTML，从根本上避免 XSS。
   * @param {{id: number, expression: string, result: number, createdAt: string}} item
   * @returns {HTMLLIElement}
   */
  function createItemElement(item) {
    const li = document.createElement('li');
    li.className = 'history-item';

    // 点击左侧区域：把这条算式填回计算器，方便继续修改
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'history-main';
    main.title = '点击可载入该算式';
    main.addEventListener('click', () => {
      if (typeof onReuseExpression === 'function') {
        onReuseExpression(item.expression);
      }
    });

    const expressionEl = document.createElement('span');
    expressionEl.className = 'history-expression';
    expressionEl.textContent = item.expression;

    const metaEl = document.createElement('span');
    metaEl.className = 'history-meta';
    metaEl.textContent = `#${item.id} · ${item.createdAt}`;

    main.append(expressionEl, metaEl);

    const resultEl = document.createElement('span');
    resultEl.className = 'history-result';
    resultEl.textContent = `= ${item.result}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'history-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = `删除第 ${item.id} 条记录`;
    deleteBtn.addEventListener('click', () => remove(item.id, deleteBtn));

    li.append(main, resultEl, deleteBtn);
    return li;
  }

  /**
   * 渲染历史列表。
   * @param {{list: Array, total: number, page: number, totalPages: number}} data
   */
  function render(data) {
    page = data.page;
    totalPages = data.totalPages;
    els.count.textContent = `共 ${data.total} 条`;
    els.pageInfo.textContent = `第 ${data.page} / ${data.totalPages} 页`;
    els.prevBtn.disabled = data.page <= 1;
    els.nextBtn.disabled = data.page >= data.totalPages;

    if (data.list.length === 0) {
      renderPlaceholder(keyword ? `没有找到包含「${keyword}」的记录` : '暂无计算历史，算一道题试试');
      return;
    }

    els.list.replaceChildren();
    for (const item of data.list) {
      els.list.appendChild(createItemElement(item));
    }
  }

  /**
   * 从后端重新加载当前页数据。
   */
  async function load() {
    renderPlaceholder('加载中…');
    try {
      const data = await Api.getHistory({ page, pageSize: CONFIG.PAGE_SIZE, keyword });
      render(data);
    } catch (error) {
      renderPlaceholder(error.message, true);
      els.count.textContent = '共 - 条';
      els.pageInfo.textContent = '第 - / - 页';
    }
  }

  /**
   * 删除一条记录，成功后重新查询以刷新界面。
   * @param {number} id
   * @param {HTMLButtonElement} button
   */
  async function remove(id, button) {
    if (!window.confirm(`确定要删除这条计算记录吗？（ID: ${id}）`)) {
      return;
    }
    button.disabled = true;
    try {
      await Api.deleteHistory(id);
      // 删掉当前页最后一条时，页码需要往前退一页
      await load();
      if (els.list.querySelector('.history-empty') && page > 1) {
        page -= 1;
        await load();
      }
    } catch (error) {
      window.alert(error.message);
      button.disabled = false;
    }
  }

  /**
   * 清空全部记录。
   */
  async function clearAll() {
    if (!window.confirm('确定要清空全部计算历史吗？此操作不可恢复。')) {
      return;
    }
    try {
      await Api.clearHistory();
      page = 1;
      await load();
    } catch (error) {
      window.alert(error.message);
    }
  }

  /**
   * 绑定历史面板上的各类事件。
   * @param {{onReuseExpression: (expression: string) => void}} options
   */
  function init(options = {}) {
    onReuseExpression = options.onReuseExpression;

    els.refreshBtn.addEventListener('click', () => load());
    els.clearBtn.addEventListener('click', () => clearAll());
    els.prevBtn.addEventListener('click', () => {
      if (page > 1) {
        page -= 1;
        load();
      }
    });
    els.nextBtn.addEventListener('click', () => {
      if (page < totalPages) {
        page += 1;
        load();
      }
    });

    // 搜索防抖：停止输入 350ms 后才真正请求后端
    let timer = null;
    els.search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        keyword = els.search.value.trim();
        page = 1;
        load();
      }, CONFIG.SEARCH_DEBOUNCE);
    });

    return load();
  }

  return {
    init,
    load,
    reset() {
      page = 1;
    },
  };
})();
