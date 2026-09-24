/**
 * 入口模块：把各个模块装配起来，并处理页面级的状态（后端连接提示）。
 */

'use strict';

const App = (() => {
  const els = {
    status: document.getElementById('status'),
    statusText: document.getElementById('status-text'),
  };

  /**
   * 更新后端连接状态提示。
   * @param {'ok'|'fail'|'unknown'} state
   * @param {string} text
   */
  function setStatus(state, text) {
    els.status.dataset.state = state;
    els.statusText.textContent = text;
  }

  /**
   * 探测后端是否可用。
   */
  async function checkBackend() {
    setStatus('unknown', '连接中…');
    try {
      await Api.health();
      setStatus('ok', '后端已连接');
      return true;
    } catch {
      setStatus('fail', '后端未连接');
      return false;
    }
  }

  /**
   * 启动应用。
   */
  async function start() {
    // 计算完成 -> 刷新历史列表
    const onCalculated = () => {
      History.reset();
      History.load();
    };

    Calculator.bindKeys(onCalculated);
    Calculator.bindKeyboard(onCalculated);

    // 点击历史记录 -> 把算式载回计算器
    await History.init({
      onReuseExpression: (expression) => {
        Calculator.setExpression(expression);
      },
    });

    await checkBackend();
  }

  return { checkBackend, setStatus, start };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.start();
});
