/**
 * ============================================================
 * 七宗罪MBTI — 答题页逻辑（index.html）
 * ============================================================
 * 职责：起始拖拽排序、逐题作答、进度与导航、提交。
 * 提交时把答卷写入 localStorage，并跳转到 result.html 生成画像。
 * 支持 ?mode=review 返回审阅：恢复已选答案、可修改后重新提交。
 * 依赖：questions.js / texts-config.js / common.js
 * ============================================================
 */

(function () {
  // 页面存在的元素（答题页固定结构，取自 index.html）
  var sortRankingEl = document.getElementById('sortRanking');
  var progressWrapEl = document.getElementById('progressWrap');
  var testFormEl = document.getElementById('testForm');
  var questionsContainer = document.getElementById('questionsContainer');
  var btnStart = document.getElementById('btnStart');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');
  var submitWrap = document.getElementById('submitWrap');
  var btnSubmit = document.getElementById('btnSubmit');

  // 题目配置与统一问题映射
  var dimensions = window.dimensions;
  var allQuestions = TestStore.buildQuestions(dimensions);
  // 每次运行随机打乱题目顺序（物理顺序与展示顺序均打乱），
  // 计分仍按各题的 dimId 聚合，与展示顺序无关
  (function shuffleQuestions(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
  })(allQuestions);
  var totalQuestions = allQuestions.length;
  var currentIndex = 0;
  var answers = {}; // 键为 qId

  // ===== 固定文案注入（仅注入本页存在的元素） =====
  TestStore.injectTexts();

  // 页眉徽章与进度条初始化（总题数动态计算）
  var badgeLabel = document.getElementById('badgeLabel');
  if (badgeLabel) badgeLabel.textContent = totalQuestions + ' 题 · 约 10 分钟';
  var progressFill = document.getElementById('progressFill');
  var progressLabel = document.getElementById('progressLabel');
  var progressPercent = document.getElementById('progressPercent');
  if (progressFill) progressFill.style.width = '0%';
  if (progressLabel) progressLabel.textContent = '第 1 / ' + totalQuestions + ' 题';
  if (progressPercent) progressPercent.textContent = '0%';

  // ===== 拖拽排序（七宗罪初始排序） =====
  var sortList = document.getElementById('sortList');
  var rankOrder = TestStore.SIN_ORDER.slice();

  function renderSortList() {
    sortList.innerHTML = '';
    rankOrder.forEach(function (dimId, idx) {
      var dim = dimensions.find(function (d) { return d.id === dimId; });
      var li = document.createElement('li');
      li.className = 'sort-item';
      li.dataset.dimId = dimId;
      li.innerHTML =
        '<span class="sort-handle">⋮⋮</span>' +
        '<span class="sort-rank" style="background:' + dim.color + '">' + (idx + 1) + '</span>' +
        '<span class="sort-name">' + dim.icon + ' ' + dim.name + '</span>';
      sortList.appendChild(li);
    });
  }
  function updateRankOrder() {
    rankOrder = Array.from(sortList.querySelectorAll('.sort-item')).map(function (item) { return item.dataset.dimId; });
  }
  function refreshRankNumbers() {
    Array.from(sortList.querySelectorAll('.sort-item')).forEach(function (item, idx) {
      var badge = item.querySelector('.sort-rank');
      var dim = dimensions.find(function (d) { return d.id === item.dataset.dimId; });
      badge.textContent = idx + 1;
      badge.style.background = dim.color;
    });
  }
  function getUserRankOrder() {
    return Array.from(sortList.querySelectorAll('.sort-item')).map(function (item) { return item.dataset.dimId; });
  }
  renderSortList();
  // 指针拖拽排序（被拖项跟手、松手原地放下），落位后刷新排名序号与顺序
  SortableDom.attach(sortList, {
    onReorder: function () {
      refreshRankNumbers();
      updateRankOrder();
    }
  });

  // ===== 逐题渲染（一题一页） =====
  questionsContainer.innerHTML = '';

  function buildCardInnerHTML(q, qNumber) {
    var dimIcon = (q.dim && q.dim.icon) ? q.dim.icon : '';
    var text = q.qObj.text;
    var labelA = 'A', labelB = 'B', displayText = text;
    var match = text.match(/^(.+?)A[：:]\s*(.+?)\s*B[：:]\s*(.+)$/);
    if (match) {
      displayText = match[1].trim();
      labelA = match[2].trim();
      labelB = match[3].trim();
    }
    // 不计分二选一题：两个按钮 + 不计分标签
    if (q.qObj.type === 'choice') {
      return '<p class="question-text">' +
        '<span class="question-icon">' + dimIcon + '</span>' +
        '<span class="question-number">Q' + qNumber + '.</span>' +
        '<span class="no-score-tag">不计分</span>' + displayText +
        '</p>' +
        '<div class="choice-options" data-q="' + q.id + '">' +
          '<button type="button" class="choice-btn" data-choice="A">A • ' + labelA + '</button>' +
          '<button type="button" class="choice-btn" data-choice="B">B • ' + labelB + '</button>' +
        '</div>';
    }
    return '<p class="question-text">' +
        '<span class="question-icon">' + dimIcon + '</span>' +
        '<span class="question-number">Q' + qNumber + '.</span>' + displayText + '</p>' +
      '<div class="option-subtitle">' +
        '<div class="option-subtitle-item">A：' + labelA + '</div>' +
        '<div class="option-subtitle-item">B：' + labelB + '</div>' +
      '</div>' +
      '<div class="scale">' +
        '<span class="scale-label-left">A</span>' +
        '<div class="scale-options">' +
          (function () {
            var values = [-3, -2, -1, 0, 1, 2, 3];
            return values.map(function (v, i) {
              var size = 38 + Math.abs(i - 3) * 6; // 圈尺寸继续放大
              var color;
              if (v < 0) color = 'hsl(145, 63%, ' + (50 - Math.abs(v) * 6) + '%)';
              else if (v === 0) color = 'hsl(0, 0%, 74%)';
              else color = 'hsl(282, 39%, ' + (50 - v * 6) + '%)';
              return '<div class="scale-circle" data-q="' + q.id + '" data-v="' + v + '" style="width:' + size + 'px;height:' + size + 'px;--circle-color:' + color + ';"></div>';
            }).join('');
          })() +
        '</div>' +
        '<span class="scale-label-right">B</span>' +
      '</div>';
  }

  allQuestions.forEach(function (row, idx) {
    var page = document.createElement('div');
    page.className = 'question-page';
    page.id = row.pageId;
    page.style.display = 'none';
    var card = document.createElement('div');
    card.className = 'question-card';
    card.id = row.cardId;
    card.innerHTML = buildCardInnerHTML(row, idx + 1);
    page.appendChild(card);
    questionsContainer.appendChild(page);
  });

  // ===== 进度与导航 =====
  // 进度条刷新：跟随"当前题号"而非"是否作答"，进入下一题/上一题/结果页时随上方数字联动
  function updateProgress() {
    var position = currentIndex + 1;
    var percent = Math.round((position / totalQuestions) * 100);
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressLabel) progressLabel.textContent = '第 ' + position + ' / ' + totalQuestions + ' 题';
    if (progressPercent) progressPercent.textContent = percent + '%';
  }

  // 剩余未作答提示刷新：跟随"已作答数"（位于按钮下方，非进度条本体）
  function updateRemainingHint() {
    var answered = allQuestions.filter(function (q) { return q.answered; }).length;
    var remaining = totalQuestions - answered;
    var remainingHint = document.getElementById('remainingHint');
    if (!remainingHint) return;
    if (remaining === 0) {
      remainingHint.textContent = '全部作答完毕，点击查看你的七宗罪人格画像';
      remainingHint.style.color = 'var(--accent2)';
    } else {
      remainingHint.textContent = '还有 ' + remaining + ' 题未作答';
      remainingHint.style.color = 'var(--muted)';
    }
  }

  // 按钮可用态：下一题=当前题已回答；查看结果=所有计分题已回答（未达条件时按钮置灰不可点）
  function updateButtons() {
    var cur = allQuestions[currentIndex];
    if (btnNext) btnNext.disabled = !(cur && cur.answered);
    if (btnSubmit) {
      var hasUnanswered = allQuestions.some(function (q) { return q.scored && !q.answered; });
      btnSubmit.disabled = hasUnanswered;
    }
  }

  function showQuestion(index) {
    currentIndex = index;
    updateButtons();
    allQuestions.forEach(function (row, i) {
      var page = document.getElementById(row.pageId);
      if (page) page.style.display = (i === index) ? 'block' : 'none';
    });
    var isLast = (index === totalQuestions - 1);
    btnPrev.disabled = (index === 0);
    btnNext.style.display = isLast ? 'none' : 'inline-block';
    // "查看结果"按钮恒定可见，其可用性由 updateButtons 控制（所有计分题答完后才可点）
    if (submitWrap) submitWrap.style.display = 'block';
    updateProgress();
    updateRemainingHint();
  }

  // 作答后自动跳转下一题：非最后一题时直接展示下一题，无需手动点击"下一题"
  function autoAdvance() {
    if (currentIndex < totalQuestions - 1) showQuestion(currentIndex + 1);
  }

  // 开始作答
  if (btnStart) {
    btnStart.addEventListener('click', function () {
      if (sortRankingEl) sortRankingEl.style.display = 'none';
      if (progressWrapEl) progressWrapEl.style.display = '';
      if (testFormEl) testFormEl.style.display = '';
      showQuestion(0);
    });
  }
  if (btnPrev) {
    btnPrev.addEventListener('click', function () { if (currentIndex > 0) showQuestion(currentIndex - 1); });
    btnPrev.disabled = true;
  }
  if (btnNext) {
    btnNext.addEventListener('click', function () {
      // 当前题未答时按钮已被置灰（updateButtons），此处仅防程序异常触发
      if (btnNext.disabled) return;
      if (currentIndex < totalQuestions - 1) showQuestion(currentIndex + 1);
    });
  }

  // 量表圆圈选择
  document.querySelectorAll('.scale-circle').forEach(function (circle) {
    circle.addEventListener('click', function () {
      var qId = this.dataset.q;
      var value = parseInt(this.dataset.v, 10);
      this.parentElement.querySelectorAll('.scale-circle').forEach(function (s) { s.classList.remove('selected'); });
      this.classList.add('selected');
      var card = document.getElementById(defaultCardId(qId));
      if (card) card.classList.add('answered');
      answers[qId] = value;
      allQuestions.forEach(function (q) { if (q.id === qId) { q.answered = true; q.value = value; } });
      updateRemainingHint();
      updateButtons();
      autoAdvance();
    });
  });

  // 不计分二选一题
  document.querySelectorAll('.choice-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrapper = btn.closest('.choice-options');
      var qId = wrapper.dataset.q;
      wrapper.querySelectorAll('.choice-btn').forEach(function (s) { s.classList.remove('selected'); });
      btn.classList.add('selected');
      var card = document.getElementById(defaultCardId(qId));
      if (card) card.classList.add('answered');
      allQuestions.forEach(function (q) { if (q.id === qId) { q.answered = true; q.choice = btn.dataset.choice; } });
      updateRemainingHint();
      updateButtons();
      autoAdvance();
    });
  });

  // 由 qId 推导卡片 id（与 common.buildQuestions 的命名保持一致）
  function defaultCardId(qId) {
    return qId + '_card';
  }

  // ===== 提交：未作答拦截 + 写入存储 + 跳转结果页 =====
  if (btnSubmit) {
    btnSubmit.addEventListener('click', function () {
      // 未答完所有计分题时按钮已置灰；此处兜底（如异常直接触发）则跳回第一个未答计分题
      for (var i = 0; i < allQuestions.length; i++) {
        if (allQuestions[i].scored && !allQuestions[i].answered) {
          showQuestion(i);
          return;
        }
      }

      // 组装答卷：计分题存数值，choice 题存 'A'/'B' 字符串（不参与计分）
      var answersOut = {};
      allQuestions.forEach(function (q) {
        if (q.answered) {
          answersOut[q.id] = (q.type === 'choice') ? (q.choice || 'A') : q.value;
        }
      });

      // 初始排序：首次提交才记录；返回重算时沿用已保存的用户原始排序
      var prev = TestStore.getState();
      var initialRankOrder = (prev && prev.initialRankOrder && prev.initialRankOrder.length)
        ? prev.initialRankOrder
        : getUserRankOrder();

      // 记录用户是在哪一题点"查看结果"的（需求二：返回审阅时跳回该题）
      TestStore.setState({
        version: 1,
        answers: answersOut,
        initialRankOrder: initialRankOrder,
        finalRankOrder: (prev && prev.finalRankOrder) || [],
        lastViewedQuestionIndex: currentIndex
      });
      window.location.href = 'result.html';
    });
  }

  // ===== 返回审阅模式（?mode=review）：恢复已选答案 =====
  function getUrlParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) { return null; }
  }

  function restoreAnswersFromState(state) {
    var saved = state.answers || {};
    allQuestions.forEach(function (q) {
      if (!Object.prototype.hasOwnProperty.call(saved, q.id)) return;
      var v = saved[q.id];
      var card = document.getElementById(q.cardId);
      if (q.type === 'choice') {
        q.answered = true;
        q.choice = v;
        if (card) {
          card.classList.add('answered');
          var btn = card.querySelector('.choice-btn[data-choice="' + v + '"]');
          if (btn) btn.classList.add('selected');
        }
      } else if (typeof v === 'number') {
        q.answered = true;
        q.value = v;
        if (card) {
          card.classList.add('answered');
          var circle = card.querySelector('.scale-circle[data-v="' + v + '"]');
          if (circle) circle.classList.add('selected');
        }
      }
    });
  }

  function enterReviewMode(state) {
    restoreAnswersFromState(state);
    if (sortRankingEl) sortRankingEl.style.display = 'none';
    if (progressWrapEl) progressWrapEl.style.display = '';
    if (testFormEl) testFormEl.style.display = '';
    // 跳回用户之前点"查看结果"的那一题（需求二），无有效记录时回第 1 题
    var restoreIdx = (typeof state.lastViewedQuestionIndex === 'number' &&
      state.lastViewedQuestionIndex >= 0 &&
      state.lastViewedQuestionIndex < totalQuestions)
      ? state.lastViewedQuestionIndex
      : 0;
    showQuestion(restoreIdx);
  }

  if (getUrlParam('mode') === 'review' && TestStore.hasState()) {
    enterReviewMode(TestStore.getState());
  }
})();