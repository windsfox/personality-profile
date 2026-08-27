/**
 * 七宗罪×七美德 价值观MBTI测试 — 计分工具
 * 来源于 价值观MBTI测试.html 的计分系统
 *
 * 三阶段：
 *   阶段1：方向处理 — reverse 字段
 *   阶段2：阈值映射 — 非正→-3, 1→1, 2→2, 3→3
 *   阶段3：动态权重 — 每道题 (3-effectiveValue)/6 * 100/题目数
 *   阶段4：善良认知反转 — 善良方向与罪孽相反
 */

/**
 * 阈值映射：-3~0→-3（强烈同意A），1→1，2→2，3→3
 * @param {number} rawValue 原始选择值（-3~3）
 * @returns {number} 有效计分值
 */
function thresholdMap(rawValue) {
  if (rawValue <= 0) return -3;
  if (rawValue === 1) return 1;
  if (rawValue === 2) return 2;
  return 3;
}

/**
 * 计分核心：由 answers 与题目配置计算各维度得分
 * @param {Object} answers { qId: number }（choice 题存字符串，不计分）
 * @param {Array} [dims] 题目维度数组，省略时用全局 dimensions
 * @returns {Array} 得分结果数组，按分数降序（已包含善良认知反向处理）
 */
function calculateScores(answers, dims) {
  var dimsToUse = dims || (typeof dimensions !== 'undefined' ? dimensions : []);
  var allQuestions = [];
  dimsToUse.forEach(function (dim, dimIdx) {
    dim.questions.forEach(function (qObj, qIdx) {
      if (qObj.excluded) return; // 不计分题（如刻意设置的思考钩子）不参与计分
      allQuestions.push({
        id: 'q_' + dimIdx + '_' + qIdx,
        dimId: dim.id, dimIdx: dimIdx,
        reverse: qObj.reverse,
        value: answers['q_' + dimIdx + '_' + qIdx] || 0
      });
    });
  });

  var scores = {};
  dimsToUse.forEach(function (dim) {
    var count = dim.questions.filter(function (q) { return !q.excluded; }).length;
    scores[dim.id] = { total: 0, dim: dim, questionCount: count };
  });

  allQuestions.forEach(function (q) {
    // 防御：该维度无计分题时跳过，避免分母为 0
    var questionCount = scores[q.dimId].questionCount;
    if (!questionCount) return;
    var rawValue = q.reverse ? (-q.value) : q.value;
    var effectiveValue = thresholdMap(rawValue);
    var questionWeight = 100 / questionCount;
    var questionScore = ((3 - effectiveValue) / 6) * questionWeight;
    scores[q.dimId].total += questionScore;
  });

  var scoreResults = [];
  Object.keys(scores).forEach(function (key) {
    var s = scores[key];
    scoreResults.push({ dimId: key, dim: s.dim, pct: Math.round(s.total), questionCount: s.questionCount });
  });

  var goodnessEntry = scoreResults.find(function (r) { return r.dimId === 'goodness'; });
  if (goodnessEntry) { goodnessEntry.pct = 100 - goodnessEntry.pct; }

  return scoreResults;
}

/**
 * 计算逆序分：比较两组排序的差异程度
 * @param {Array} refOrder 参考排序（dimId 数组）
 * @param {Array} compareOrder 待比较排序
 * @returns {number} 总位移差（0=完全一致，越大差异越大）
 */
function calcInversionScore(refOrder, compareOrder) {
  if (!compareOrder || compareOrder.length === 0) return 0;
  var totalDiff = 0;
  for (var i = 0; i < refOrder.length; i++) {
    var dimId = refOrder[i];
    var refRank = i + 1;
    var compRank = compareOrder.indexOf(dimId) + 1;
    if (compRank === 0) compRank = refRank;
    totalDiff += Math.abs(refRank - compRank);
  }
  return totalDiff;
}
