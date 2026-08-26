/**
 * ============================================================
 * 七宗罪MBTI — 结果页逻辑（result.html）
 * ============================================================
 * 读取 localStorage 中的答卷，计算得分并渲染全部结果区块：
 * 画像标题 / 雷达图 / 倾向排名 / 原始解释 / 逐项深度解读 / 综合洞察 /
 * 善良认知 / 七美德之光 / 二次排序 / 初始排序侧栏 / 七宗罪得分排序。
 * "返回查看我的答案"跳回 index.html?mode=review 以便修改重算。
 * 依赖：questions.js / texts-config.js / interpretations.js
 *       / common.js / scoring.js / charts.js / echarts
 * ============================================================
 */

(function () {
  var dimensions = window.dimensions;
  var initialRankOrder = [];
  var finalRankOrder = [];
  var resultsEl = document.getElementById('results');

  /**
   * 用 RESULT_TEXTS 注入结果页各区块标题与文案（替代旧的 TestStore.injectTexts）
   */
  function injectResultTexts() {
    if (typeof RESULT_TEXTS === 'undefined') return;
    var plainMap = {
      resultsHeader: 'resultsTitle',
      resultsSubheader: 'resultsSubheader',
      chartCaption: 'chartCaption',
      rankTitle: 'rankTitle',
      detailTitle: 'detailTitle',
      insightTitle: 'insightTitle',
      resortTitle: 'resortTitle',
      resortHint: 'resortHint',
      scoreRankTitle: 'scoreRankTitle',
      scoreRankHint: 'scoreRankHint',
      footerNote: 'footerNote'
    };
    Object.keys(plainMap).forEach(function (key) {
      var el = document.getElementById(plainMap[key]);
      if (el && RESULT_TEXTS[key] != null) el.textContent = RESULT_TEXTS[key];
    });
    var originEl = document.getElementById('originExplanationText');
    if (originEl && RESULT_TEXTS.originHtml) originEl.innerHTML = RESULT_TEXTS.originHtml;
  }

  /**
   * 构建首屏"方法定位"卡（introLead）
   */
  function buildIntroLeadCard() {
    var card = document.getElementById('introLeadCard');
    if (!card || !RESULT_TEXTS.introLead) return;
    card.innerHTML =
      '<h3 class="intro-lead-title">' + RESULT_TEXTS.introLead.title + '</h3>' +
      '<div class="intro-lead-body">' + RESULT_TEXTS.introLead.body + '</div>';
  }

  /**
   * 构建"这套测试的逻辑"母卡片：母标题常驻，内部三个子折叠卡
   * 每个子卡对应 logicGroups 的一个分组，可独立展开/收起
   */
  function buildLogicCollapse() {
    var section = document.getElementById('logicCollapse');
    if (!section || !RESULT_TEXTS.logicTitle) return;
    var html = '<div class="logic-master">' +
      '<h3 class="logic-master-title">' + RESULT_TEXTS.logicTitle + '</h3>';
    if (RESULT_TEXTS.logicGroups) {
      RESULT_TEXTS.logicGroups.forEach(function (g) {
        var cards = (RESULT_TEXTS.logicCards || []).filter(function (c) { return c.group === g.id; });
        if (!cards.length) return;
        // 每个分组是一个可独立展开/收起的子折叠卡片
        html += '<div class="logic-group" data-group="' + g.id + '">' +
          '<button class="logic-toggle" type="button">' + g.title +
          ' <span class="logic-arrow">\u25B6</span></button>' +
          '<div class="logic-content" style="display:none;">';
        cards.forEach(function (c) {
          html += '<div class="logic-section"><h4>' + c.title + '</h4>' + c.body + '</div>';
        });
        html += '</div></div>';
      });
    } else if (RESULT_TEXTS.logicSections) {
      // 兼容旧字段：平铺为单个子折叠卡
      html += '<div class="logic-group">' +
        '<button class="logic-toggle" type="button">详见 <span class="logic-arrow">\u25B6</span></button>' +
        '<div class="logic-content" style="display:none;">';
      RESULT_TEXTS.logicSections.forEach(function (s) {
        html += '<div class="logic-section"><h4>' + s.title + '</h4>' + s.body + '</div>';
      });
      html += '</div></div>';
    }
    html += '</div>'; // .logic-master
    section.innerHTML = html;
    // 每个子折叠卡各自绑定展开/收起
    section.querySelectorAll('.logic-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var content = toggle.nextElementSibling;
        if (!content || !content.classList.contains('logic-content')) return;
        var isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        var arrow = toggle.querySelector('.logic-arrow');
        if (arrow) arrow.textContent = isHidden ? '\u25BC' : '\u25B6';
      });
    });
  }

  // ===== 固定文案注入（使用 RESULT_TEXTS） =====
  injectResultTexts();
  buildIntroLeadCard();
  buildLogicCollapse();

  var state = TestStore.getState();
  if (!state || !state.answers) {
    if (resultsEl) {
      resultsEl.innerHTML =
        '<div class="intro"><p>还没找到你的答题数据。<br>' +
        '请先到 <a href="index.html" style="color:var(--accent);font-weight:600;">答题页面</a> 完成测试，再回到这里查看你的七宗罪人格画像。</p></div>';
    }
    return;
  }

  // 得分计算 + 排序基础
  var scoreResults = calculateScores(state.answers, dimensions);
  initialRankOrder = (state.initialRankOrder && state.initialRankOrder.length)
    ? state.initialRankOrder.slice()
    : TestStore.SIN_ORDER.slice();
  finalRankOrder = (state.finalRankOrder && state.finalRankOrder.length)
    ? state.finalRankOrder.slice()
    : initialRankOrder.slice();

  // 分离善良认知与七宗罪
  var goodnessResult = scoreResults.find(function (r) { return r.dimId === 'goodness'; });
  var sinResults = scoreResults.filter(function (r) { return r.dimId !== 'goodness'; });

  // 七宗罪内部排序：同分按标准顺序（傲慢→嫉妒→暴怒→懒惰→贪婪→暴食→色欲）
  sinResults.sort(function (a, b) {
    if (b.pct !== a.pct) return b.pct - a.pct;
    return TestStore.SIN_ORDER.indexOf(a.dimId) - TestStore.SIN_ORDER.indexOf(b.dimId);
  });

  // ===== 排名列表 =====
  function renderRanking(sins) {
    var list = document.getElementById('rankList');
    if (!list) return;
    list.innerHTML = '';
    sins.forEach(function (r, idx) {
      var colors = TestStore.RANK_COLORS;
      var li = document.createElement('li');
      li.className = 'rank-item';
      li.innerHTML =
        '<div class="rank-badge" style="background:' + colors[idx] + '">' + (idx + 1) + '</div>' +
        '<div class="rank-info">' +
          '<div class="rank-name">' + r.dim.icon + ' ' + (r.dim.nameResult || r.dim.name) + '</div>' +
        '</div>' +
        '<div class="rank-bar-wrap">' +
          '<div class="rank-bar-fill" style="width:' + r.pct + '%;background:' + r.dim.color + '"></div>' +
        '</div>' +
        '<span class="rank-score" style="color:' + r.dim.color + '">' + r.pct + '</span>';
      list.appendChild(li);
    });
  }

  // ===== 逐项深度解读 =====
  function renderDetails(sins) {
    var container = document.getElementById('detailCards');
    if (!container) return;
    container.innerHTML = '';
    var cfg = INTERPRETATION_CONFIG;
    var order = TestStore.SIN_ORDER.slice();
    sins.slice().sort(function (a, b) {
      return order.indexOf(a.dimId) - order.indexOf(b.dimId);
    }).forEach(function (r) {
      var level, levelColor, levelBg, interp;
      if (r.pct >= cfg.SIN_HIGH_THRESHOLD) {
        level = cfg.sinLevels.high; levelColor = '#fff'; levelBg = r.dim.color;
        interp = cfg.dimensions[r.dimId].interpretation.high;
      } else if (r.pct >= cfg.SIN_MID_THRESHOLD) {
        level = cfg.sinLevels.mid; levelColor = r.dim.color; levelBg = r.dim.color + '1a';
        interp = cfg.dimensions[r.dimId].interpretation.mid;
      } else {
        level = cfg.sinLevels.low; levelColor = '#fff'; levelBg = 'var(--accent2)';
        interp = cfg.dimensions[r.dimId].interpretation.low;
      }
      var card = document.createElement('div');
      card.className = 'detail-card';
      card.innerHTML =
        '<div class="detail-card-header">' +
          '<div class="detail-card-icon" style="background:' + r.dim.color + '">' + r.dim.icon + '</div>' +
          '<span class="detail-card-title">' + (r.dim.nameResult || r.dim.name) + '（' + r.pct + '分）</span>' +
          '<span class="detail-card-level" style="background:' + levelBg + ';color:' + (r.pct >= 70 ? '#fff' : (r.pct >= 40 ? r.dim.color : '#fff')) + '">' + level + '</span>' +
        '</div>' +
        '<div class="detail-card-body">' +
          '<p>' + interp + '</p>' +
          '<div class="philosophy"><strong>解释：</strong>' + cfg.dimensions[r.dimId].philosophy + '</div>' +
        '</div>';
      container.appendChild(card);
    });
  }

  // ===== 综合洞察 =====
  function renderInsight(sins) {
    var el = document.getElementById('insightText');
    if (!el) return;
    var top = sins[0];
    var top2 = sins[1];
    var bottom = sins[6];
    var cfg = INTERPRETATION_CONFIG;
    var insightText = '';
    var topInsight = cfg.insight[top.dimId];
    if (topInsight) {
      if (top.pct >= cfg.SIN_HIGH_THRESHOLD && topInsight.high) {
        insightText = topInsight.high;
      } else if (topInsight.low) {
        insightText = topInsight.low;
      } else {
        insightText = topInsight.high || topInsight.low || '';
      }
    }
    if (top.dimId === 'pride' && top2.dimId === 'envy') insightText += cfg.insight.prideEnvyCombo;
    insightText += cfg.insight.bottomTemplate
      .replace('{name}', bottom.dim.nameResult || bottom.dim.name)
      .replace('{pct}', bottom.pct);
    // 把文案里的 \n\n/\n 渲染成换行（HTML 默认不体现 \n），使各段之间有可见的分隔
    el.innerHTML = insightText.replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
  }

  // ===== 善良认知结果 =====
  function renderGoodnessResult(result) {
    var insightBox = document.getElementById('insightBox');
    var goodnessSection = document.getElementById('goodnessSection');
    if (!insightBox || !result) return;
    if (!goodnessSection) {
      goodnessSection = document.createElement('div');
      goodnessSection.id = 'goodnessSection';
      goodnessSection.className = 'goodness-section';
      insightBox.parentNode.insertBefore(goodnessSection, insightBox.nextSibling);
    }
    goodnessSection.innerHTML = '';
    var cfg = INTERPRETATION_CONFIG;
    var pct = result.pct;
    var level, levelBg, interp, scoreNote;
    if (pct >= cfg.GOODNESS_HIGH) {
      level = cfg.goodnessLevels.high; levelBg = 'var(--accent2)';
      interp = cfg.dimensions.goodness.interpretation.low;
      scoreNote = cfg.dimensions.goodness.scoreNote.high;
    } else if (pct >= cfg.GOODNESS_MID) {
      level = cfg.goodnessLevels.mid; levelBg = result.dim.color + '1a';
      interp = cfg.dimensions.goodness.interpretation.mid;
      scoreNote = cfg.dimensions.goodness.scoreNote.mid;
    } else {
      level = cfg.goodnessLevels.low; levelBg = result.dim.color;
      interp = cfg.dimensions.goodness.interpretation.high;
      scoreNote = cfg.dimensions.goodness.scoreNote.low;
    }
    goodnessSection.innerHTML =
      '<div class="goodness-card">' +
        '<div class="goodness-header">' +
          '<div class="goodness-icon" style="background:' + result.dim.color + '">' + result.dim.icon + '</div>' +
          '<div class="goodness-title-wrap">' +
            '<span class="goodness-title">善良认知深度</span>' +
            '<span class="goodness-score">' + pct + ' 分</span>' +
          '</div>' +
          '<span class="goodness-level" style="background:' + levelBg + ';color:' + (pct >= 70 ? '#fff' : (pct >= 40 ? result.dim.color : '#fff')) + '">' + level + '</span>' +
        '</div>' +
        '<div class="goodness-body">' +
          '<p>' + interp + '</p>' +
          '<p class="goodness-score-note">' + scoreNote + '</p>' +
          '<div class="philosophy" style="margin-top:1rem;"><strong>解释：</strong>' + cfg.dimensions.goodness.philosophy + '</div>' +
        '</div>' +
      '</div>';
  }

  // ===== 二次排序（拖拽） =====
  function renderSecondRanking() {
    var finalList = document.getElementById('sortListFinal');
    if (!finalList) return;
    finalList.innerHTML = '';
    finalRankOrder.forEach(function (dimId, idx) {
      var dim = dimensions.find(function (d) { return d.id === dimId; });
      if (!dim || dimId === 'goodness') return;
      var li = document.createElement('li');
      li.className = 'sort-item';
      li.dataset.dimId = dimId;
      li.innerHTML =
        '<span class="sort-handle">⋮⋮</span>' +
        '<span class="sort-rank" style="background:' + dim.color + '">' + (idx + 1) + '</span>' +
        '<span class="sort-name">' + dim.icon + ' ' + (dim.nameResult || dim.name) + '</span>';
      finalList.appendChild(li);
    });
  }
  function syncFinalFromDom() {
    var finalList = document.getElementById('sortListFinal');
    if (!finalList) return;
    var items = finalList.querySelectorAll('.sort-item');
    finalRankOrder = Array.from(items).map(function (it) { return it.dataset.dimId; });
    items.forEach(function (item, idx) {
      var badge = item.querySelector('.sort-rank');
      var dim = dimensions.find(function (d) { return d.id === item.dataset.dimId; });
      badge.textContent = idx + 1;
      if (dim) badge.style.background = dim.color;
    });
    updateRankingChangeSummary();
    persistFinalRankOrder();
  }

  // 二次排序变化总结
  function updateRankingChangeSummary() {
    var finalList = document.getElementById('sortListFinal');
    var summary = document.getElementById('rankingChangeSummary');
    if (!finalList || !summary) return;
    var currentOrder = Array.from(finalList.querySelectorAll('.sort-item')).map(function (item) { return item.dataset.dimId; });
    var changes = [];
    var hasChange = false;
    for (var i = 0; i < currentOrder.length; i++) {
      var dimId = currentOrder[i];
      var dim = dimensions.find(function (d) { return d.id === dimId; });
      if (!dim) continue;
      var oldIdx = initialRankOrder.indexOf(dimId);
      if (oldIdx !== i) {
        hasChange = true;
        var arrow = oldIdx > i ? '↑' : '↓';
        changes.push(dim.icon + ' ' + (dim.nameResult || dim.name) + '：第' + (oldIdx + 1) + '名 → 第' + (i + 1) + '名 ' + arrow);
      }
    }
    summary.style.display = 'block';
    var cl = (typeof RESULT_TEXTS !== 'undefined' && RESULT_TEXTS.changeLines) ? RESULT_TEXTS.changeLines : null;
    summary.innerHTML = hasChange
      ? '<strong>' + (cl ? cl.prefix : '排序变化：') + '</strong><br>' + changes.join('<br>')
      : (cl ? cl.noChange : '你的排序没有发生变化——这说明你对七宗罪罪孽程度的认知在测试前后是一致的。');
  }

  // 二次排序结果持久化（刷新或返回重算后仍保留）
  function persistFinalRankOrder() {
    var s = TestStore.getState() || { answers: {} };
    TestStore.setState({
      version: 1,
      answers: s.answers || {},
      initialRankOrder: initialRankOrder,
      finalRankOrder: finalRankOrder
    });
  }

  // ===== 初始排序侧栏（只读） =====
  function renderInitialRankSidebar() {
    var container = document.getElementById('initialRankList');
    var toggleBtn = document.getElementById('toggleInitialRanking');
    var content = document.getElementById('initialRankingContent');
    if (!container) return;
    container.innerHTML = '';
    initialRankOrder.forEach(function (dimId, idx) {
      var dim = dimensions.find(function (d) { return d.id === dimId; });
      if (!dim) return;
      var row = document.createElement('div');
      row.className = 'true-rank-row';
      row.innerHTML = '<span class="true-rank-num">' + (idx + 1) + '</span><span class="true-rank-icon">' + dim.icon + '</span><span class="true-rank-name">' + (dim.nameResult || dim.name) + '</span>';
      container.appendChild(row);
    });
    if (toggleBtn && content) {
      toggleBtn.onclick = function () {
        if (content.style.display === 'block') {
          content.style.display = 'none';
          toggleBtn.textContent = '查看我的初始排序';
        } else {
          content.style.display = 'block';
          toggleBtn.textContent = '隐藏初始排序';
        }
      };
    }
  }

  // ===== 七宗罪得分排序 =====
  function renderUnforgivableRanking(sins) {
    var container = document.getElementById('unforgivableRankList');
    if (!container) return;
    container.innerHTML = '';
    var sorted = sins.slice().sort(function (a, b) { return b.pct - a.pct; });
    sorted.forEach(function (r, idx) {
      var colors = TestStore.RANK_COLORS;
      var row = document.createElement('div');
      row.className = 'true-rank-row';
      row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0;';
      row.innerHTML =
        '<span class="true-rank-num" style="background:' + colors[idx] + ';color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;flex-shrink:0;">' + (idx + 1) + '</span>' +
        '<span class="true-rank-icon">' + r.dim.icon + '</span>' +
        '<span class="true-rank-name" style="flex:1;">' + (r.dim.nameResult || r.dim.name) + '</span>' +
        '<span class="true-rank-match" style="background:' + r.dim.color + '15;color:' + r.dim.color + ';padding:0.15rem 0.5rem;border-radius:4px;font-size:0.82rem;font-weight:600;">' + r.pct + '分</span>';
      container.appendChild(row);
    });
    renderUnforgivableCommentary(sorted);
  }
  function renderUnforgivableCommentary(sorted) {
    var commentary = document.getElementById('unforgivableRankCommentary');
    if (!commentary) return;
    var scoreOrder = sorted.map(function (r) { return r.dimId; });
    var secondOrder = finalRankOrder.length > 0 ? finalRankOrder : initialRankOrder;
    var initialDiff = calcInversionScore(scoreOrder, initialRankOrder);
    var secondDiff = calcInversionScore(scoreOrder, secondOrder);
    var hasInversion = (initialDiff >= 12) || (secondDiff >= 12);
    var c = (typeof RESULT_TEXTS !== 'undefined' && RESULT_TEXTS.commentary) ? RESULT_TEXTS.commentary : null;
    var baseText = c ? c.base : '';
    var suffix = c ? (hasInversion ? c.hasInversionSuffix : c.noInversionSuffix) : '';
    var bg = hasInversion ? 'var(--accent2)08' : 'var(--bg2)';
    var borderClr = hasInversion ? 'var(--accent2)' : 'var(--accent3)';
    var text = '<p style="font-size:0.85rem;color:var(--ink);line-height:1.8;margin-top:1rem;padding:0.8rem 1rem;background:' + bg + ';border-radius:8px;border-left:3px solid ' + borderClr + ';">' +
      baseText + ' ' + suffix + '</p>';
    commentary.innerHTML = text;
  }

  // ===== 雷达图（委托 charts.js） =====
  function renderChartWithRetry(sins) {
    setTimeout(function () {
      if (typeof window.renderRadarChart === 'function') {
        window.renderRadarChart(sins);
      } else {
        setTimeout(function () { renderChartWithRetry(sins); }, 100);
      }
    }, 200);
  }

  // ===== 统一渲染入口 =====
  renderRanking(sinResults);
  renderDetails(sinResults);
  renderInsight(sinResults);
  if (goodnessResult) renderGoodnessResult(goodnessResult);
  
  renderSecondRanking();
  // 指针拖拽排序（被拖项跟手、松手原地放下），落位后同步最终顺序
  var finalListEl = document.getElementById('sortListFinal');
  if (finalListEl) {
    SortableDom.attach(finalListEl, { onReorder: syncFinalFromDom });
  }
  renderInitialRankSidebar();
  renderUnforgivableRanking(sinResults);
  renderChartWithRetry(sinResults);

  // 延迟定位：等 DOM 渲染完成后，将画像标题对齐到视口顶端
  setTimeout(function () {
    var target = document.querySelector('.results-header');
    if (target) {
      var top = target.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }, 300);

  // ===== 返回查看我的答案 =====
  var backBtn = document.getElementById('btnBackToTest');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      window.location.href = 'index.html?mode=review';
    });
  }

  // ===== 一键清空旧数据 / 重新开始 =====
  var restartLink = document.getElementById('restartLink');
  if (restartLink) {
    restartLink.addEventListener('click', function (e) {
      e.preventDefault();
      TestStore.clearState();
      window.location.href = 'index.html';
    });
  }
})();