/**
 * ============================================================
 * 七宗罪MBTI — 共享工具层
 * ============================================================
 * 被 index.html（答题页）与 result.html（结果页）共同引用：
 *  - 浏览器本地存储读写（答题数据在两个页面间传递）
 *  - 题目映射构建
 *  - 七宗罪顺序与排名徽章配色常量
 *  - 问题页固定文案注入
 * 计分核心已迁至 scoring.js（calculateScores）。
 * 依赖：questions.js / texts-config.js 已先行加载。
 * ============================================================
 */

var TestStore = (function () {
  // 本地存储键名（本测试的数据均存放于此）
  var STORAGE_KEY = 'qzxz_mbti_state_v1';

  // 七宗罪标准顺序：傲慢 → 嫉妒 → 暴怒 → 懒惰 → 贪婪 → 暴食 → 色欲
  var SIN_ORDER = ['pride', 'envy', 'wrath', 'sloth', 'greed', 'gluttony', 'lust'];

  // 排名徽章配色（由分数/位置映射）
  var RANK_COLORS = ['#c0392b', '#d35400', '#e67e22', '#f39c12', '#8e44ad', '#7f8c8d', '#95a5a6'];

  /**
   * 从题目配置构建统一的问题映射数组
   * @param {Array} dimensions 题目维度数组
   * @returns {Array} 每条含 { id, dimId, dimIdx, dim, qObj, pageId, cardId, reverse, scored, type }
   */
  function buildQuestions(dimensions) {
    var allQuestions = [];
    dimensions.forEach(function (dim, dimIdx) {
      dim.questions.forEach(function (qObj, qIdx) {
        var qId = 'q_' + dimIdx + '_' + qIdx;
        allQuestions.push({
          id: qId,
          dimId: dim.id,
          dimIdx: dimIdx,
          dim: dim,
          qObj: qObj,
          pageId: qId + '_page',
          cardId: qId + '_card',
          reverse: !!qObj.reverse,
          scored: qObj.scored !== false && !qObj.excluded,
          excluded: !!qObj.excluded,
          type: qObj.type || 'scale',
          answered: false,
          value: 0,
          choice: null
        });
      });
    });
    return allQuestions;
  }

  /**
   * 读取本地存储的答题状态
   * @returns {Object|null}
   */
  function getState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * 写入本地存储的答题状态
   */
  function setState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 判断是否已有已保存的答题状态
   */
  function hasState() {
    return !!getState();
  }

  /**
   * 清空本地存储的答题状态
   * @returns {Boolean} 是否清除成功
   */
  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 固定文案注入：按当前页面中实际存在的元素就地注入，
   * 缺失的元素（getElementById 返回 null）会被安全跳过，
   * 因此本方法可同时用于答题页与结果页。
   */
  function injectTexts() {
    if (typeof TEXTS_CONFIG === 'undefined') return;

    // 含 HTML 的文案（innerHTML 注入）；仅保留 TEXTS_CONFIG 实际提供的键，
    // 结果页文案由 result-texts.js 的 RESULT_TEXTS 单独注入
    var htmlTexts = {
      friendHook: 'friendHook',
      guidance: 'guidanceText'
    };
    // 纯文本标题/提示（textContent 注入，避免被当作 HTML 解析）
    var plainTexts = {
      sortTitle: 'sortTitle'
    };

    Object.keys(htmlTexts).forEach(function (key) {
      var el = document.getElementById(htmlTexts[key]);
      if (el && TEXTS_CONFIG[key] != null) el.innerHTML = TEXTS_CONFIG[key];
    });
    Object.keys(plainTexts).forEach(function (key) {
      var el = document.getElementById(plainTexts[key]);
      if (el && TEXTS_CONFIG[key] != null) el.textContent = TEXTS_CONFIG[key];
    });
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    SIN_ORDER: SIN_ORDER,
    RANK_COLORS: RANK_COLORS,
    buildQuestions: buildQuestions,
    getState: getState,
    setState: setState,
    hasState: hasState,
    clearState: clearState,
    injectTexts: injectTexts
  };
})();