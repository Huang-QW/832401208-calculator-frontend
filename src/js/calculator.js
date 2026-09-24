/**
 * 计算器交互模块。
 *
 * 职责非常明确：只负责**拼算式**和**显示结果**，绝不参与计算。
 * 这是本作业"前后端分离"的关键——把 calculate 相关的一行行代码删掉，
 * 计算器就完全算不出东西了，必须依赖后端。
 */

'use strict';

const Calculator = (() => {
  /** DOM 引用 */
  const els = {
    expression: document.getElementById('expression'),
    result: document.getElementById('result'),
    error: document.getElementById('error'),
    keys: document.getElementById('keys'),
  };

  /** 正在编辑的算式字符串 */
  let expression = '';

  /** 上一次计算得到的数值结果，用于"算完之后接着算" */
  let lastResult = null;

  /** 是否刚刚按过等号：决定下一个按键是开新算式还是接着算 */
  let justCalculated = false;

  /** 算式最大长度，与后端限制保持一致，避免白跑一趟网络请求 */
  const MAX_LENGTH = 200;

  /** 运算符集合 */
  const OPERATORS = '+-*/';

  /**
   * 刷新算式显示区。
   */
  function renderExpression() {
    els.expression.textContent = expression === '' ? '0' : expression;
    // 算式变长时自动滚到最右侧，保证刚输入的内容可见
    els.expression.scrollLeft = els.expression.scrollWidth;
  }

  /**
   * 显示结果（后端返回的结果）。
   * @param {number} value
   */
  function showResult(value) {
    els.result.textContent = `= ${value}`;
    els.result.classList.add('is-active');
  }

  /**
   * 清空结果与错误提示。
   */
  function resetOutput() {
    els.result.textContent = '=';
    els.result.classList.remove('is-active');
    hideError();
  }

  /**
   * 显示后端返回的错误信息。
   * @param {string} message
   */
  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = false;
    els.result.textContent = '=';
    els.result.classList.remove('is-active');
    els.expression.classList.add('is-error');
  }

  function hideError() {
    els.error.hidden = true;
    els.expression.classList.remove('is-error');
  }

  /**
   * 追加一个字符到算式末尾。
   * @param {string} char
   */
  function append(char) {
    if (expression.length >= MAX_LENGTH) {
      showError(`算式过长，最多 ${MAX_LENGTH} 个字符`);
      return;
    }
    // 刚出过错就重新开始输入，避免用户对着一个报错的算式继续加字符
    if (!els.error.hidden) {
      clear();
    }

    // 刚按过等号时的两种走法：
    //   按运算符 -> 拿刚才的结果继续算（屏幕变成 "3+"）
    //   按数字   -> 开始一道全新的算式
    if (justCalculated) {
      expression = OPERATORS.includes(char) && lastResult !== null ? String(lastResult) : '';
      justCalculated = false;
    }

    expression += char;
    resetOutput();
    renderExpression();
  }

  /**
   * 退格：删掉最后一个字符。
   */
  function backspace() {
    if (!els.error.hidden) {
      clear();
      return;
    }
    justCalculated = false;
    expression = expression.slice(0, -1);
    resetOutput();
    renderExpression();
  }

  /**
   * AC：全部清空。
   */
  function clear() {
    expression = '';
    lastResult = null;
    justCalculated = false;
    resetOutput();
    renderExpression();
  }

  /**
   * 把外部算式（例如点击历史记录）载入到显示屏。
   * @param {string} value
   */
  function setExpression(value) {
    expression = String(value || '').slice(0, MAX_LENGTH);
    lastResult = null;
    justCalculated = false;
    resetOutput();
    renderExpression();
  }

  /**
   * 提交算式给后端计算，并展示后端返回的结果。
   * 注意：整个函数里没有任何数学运算，只有"发请求 + 显示"。
   * @returns {Promise<{id: number, expression: string, result: number, createdAt: string}|null>}
   */
  async function submit() {
    const current = expression.trim();
    if (current === '') {
      showError('请先输入算式');
      return null;
    }

    try {
      const record = await Api.calculate(current);
      expression = record.expression;
      lastResult = record.result;
      justCalculated = true;
      renderExpression();
      showResult(record.result);
      return record;
    } catch (error) {
      showError(error.message);
      return null;
    }
  }

  /**
   * 绑定按钮点击事件（事件委托：只在容器上挂一个监听）。
   */
  function bindKeys(onCalculated) {
    els.keys.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) {
        return;
      }

      const { key, action } = button.dataset;

      if (key !== undefined) {
        append(key);
        return;
      }
      if (action === 'clear') {
        clear();
        return;
      }
      if (action === 'backspace') {
        backspace();
        return;
      }
      if (action === 'equals') {
        button.disabled = true;      // 防止连点造成重复请求
        try {
          const record = await submit();
          if (record && typeof onCalculated === 'function') {
            onCalculated(record);
          }
        } finally {
          button.disabled = false;
        }
      }
    });
  }

  /**
   * 绑定键盘快捷键。
   * @param {(record: object) => void} onCalculated
   */
  function bindKeyboard(onCalculated) {
    const allowedKeys = '0123456789.+-*/()';

    document.addEventListener('keydown', async (event) => {
      // 输入框里打字时不拦截
      if (event.target instanceof HTMLInputElement) {
        return;
      }

      if (allowedKeys.includes(event.key) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        append(event.key);
        return;
      }
      if (event.key === 'Enter' || event.key === '=') {
        event.preventDefault();
        const record = await submit();
        if (record && typeof onCalculated === 'function') {
          onCalculated(record);
        }
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        backspace();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        clear();
      }
    });
  }

  return {
    append,
    backspace,
    bindKeyboard,
    bindKeys,
    clear,
    setExpression,
    submit,
  };
})();
