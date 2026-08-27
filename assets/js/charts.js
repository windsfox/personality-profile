// 七宗罪测试 - 左右对称双雷达图：左侧七宗罪 + 右侧七美德
// 每个罪孽与其对应美德在180°对角线上，傲慢与贞洁在同一水平面
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#c0392b';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#2e86c1';
  var ink = style.getPropertyValue('--ink').trim() || '#2c2416';
  var muted = style.getPropertyValue('--muted').trim() || '#9b8b78';
  var rule = style.getPropertyValue('--rule').trim() || '#e0d6c5';

  // 14个指标，顺时针排列（镜像后：左侧罪孽 + 右侧美德）
  // 左侧罪孽（0-6，从上到下）：傲慢→嫉妒→暴怒→懒惰→贪婪→暴食→色欲
  // 右侧美德（7-13，从下到上）：谦逊+正义→宽容+明辨→温和+勇敢→勤奋+希望→慷慨→节制→贞洁
  // 每个罪孽（位置i）与对应美德（位置i+7）在180°对角线上
  // startAngle=103° 使傲慢（位置0）与贞洁（位置13）处于同一水平面
  var indicators = [
    // 左侧罪孽（位置0-6），统一max=100保证所有轴同比例
    { name: '👑 傲慢（Pride）', max: 100 },
    { name: '🐍 嫉妒（Envy）', max: 100 },
    { name: '🔥 暴怒（Wrath）', max: 100 },
    { name: '🦥 懒惰（Sloth）', max: 100 },
    { name: '💰 贪婪（Greed）', max: 100 },
    { name: '🍷 暴食（Gluttony）', max: 100 },
    { name: '💋 色欲（Lust）', max: 100 },
    // 右侧美德（位置7-13），统一max=100保证所有轴同比例
    { name: '🕊️ 谦逊+正义', max: 100 },
    { name: '🌟 宽容+明辨', max: 100 },
    { name: '🌿 温和+勇敢', max: 100 },
    { name: '⚡ 勤奋+希望', max: 100 },
    { name: '🤲 慷慨（Charity）', max: 100 },
    { name: '⚖️ 节制（Temperance）', max: 100 },
    { name: '💎 贞洁（Chastity）', max: 100 }
  ];

  // 罪/美德维度顺序统一取自 common.js 的 SIN_ORDER（傲慢→嫉妒→暴怒→懒惰→贪婪→暴食→色欲），
  // 用 slice() 拷贝，避免共享引用被外部修改
  var sinDimIds = (typeof TestStore !== 'undefined' && TestStore.SIN_ORDER)
    ? TestStore.SIN_ORDER.slice()
    : ['pride', 'envy', 'wrath', 'sloth', 'greed', 'gluttony', 'lust'];
  var virtueDimIds = sinDimIds.slice();

  // 暴露到全局
  window.renderRadarChart = function(scoreResults, retryCount) {
    if (typeof retryCount === 'undefined') retryCount = 0;
    if (retryCount > 30) {
      var chartDom = document.getElementById('chart-radar');
      if (chartDom) {
        chartDom.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem;">雷达图加载超时，请刷新页面重试。</p>';
      }
      return;
    }

    var chartDom = document.getElementById('chart-radar');
    if (!chartDom) return;

    var rect = chartDom.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(function() { window.renderRadarChart(scoreResults, retryCount + 1); }, 150);
      return;
    }

    if (typeof echarts === 'undefined') {
      if (retryCount < 10) {
        setTimeout(function() { window.renderRadarChart(scoreResults, retryCount + 1); }, 200);
      } else {
        chartDom.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem;">雷达图组件加载失败，请检查网络后刷新页面重试。</p>';
      }
      return;
    }

    try {
      var existing = echarts.getInstanceByDom(chartDom);
      if (existing) existing.dispose();

      var chart = echarts.init(chartDom, null, { renderer: 'canvas' });

      // 辅助函数：获取分数
      function getScore(dimId) {
        var found = scoreResults.find(function(r) { return r.dimId === dimId; });
        return found ? found.pct : 0;
      }

      // 七宗罪系列：前7个位置（左侧罪孽区）填罪孽分数，后7个位置（右侧美德区）填0
      var sinValues = [];
      sinDimIds.forEach(function(id) { sinValues.push(getScore(id)); });
      virtueDimIds.forEach(function() { sinValues.push(0); });

      // 七美德系列：前7个位置（左侧罪孽区）填0，后7个位置（右侧美德区）填100-罪孽分数
      var virtueValues = [];
      sinDimIds.forEach(function() { virtueValues.push(0); });
      virtueDimIds.forEach(function(id) { virtueValues.push(100 - getScore(id)); });

      // 提取纯文本名称（去掉emoji前缀），用于tooltip展示
      var sinNames = indicators.slice(0, 7).map(function(ind) {
        return ind.name.replace(/^[^\s]+ /, '');
      });
      var virtueNames = indicators.slice(7, 14).map(function(ind) {
        return ind.name.replace(/^[^\s]+ /, '');
      });
      // 提取纯分数（不含填充的0）
      var sinRaw = sinValues.slice(0, 7);
      var virtueRaw = virtueValues.slice(7);

      // 计算两系列总分，总分高的后渲染（在上层，更显眼）
      var sinTotal = sinRaw.reduce(function(a, b) { return a + b; }, 0);
      var virtueTotal = virtueRaw.reduce(function(a, b) { return a + b; }, 0);

      // 定义两个系列对象
      var sinSeries = {
        name: '七宗罪倾向',
        type: 'radar',
        data: [{
          value: sinValues,
          name: '罪孽倾向',
          areaStyle: { color: 'rgba(192, 57, 43, 0.2)' },
          lineStyle: { color: '#c0392b', width: 2 },
          itemStyle: { color: '#c0392b', borderColor: '#fff', borderWidth: 2 }
        }],
        symbol: 'circle',
        symbolSize: 13
      };
      var virtueSeries = {
        name: '七美德之光',
        type: 'radar',
        data: [{
          value: virtueValues,
          name: '美德得分',
          areaStyle: { color: 'rgba(46, 134, 193, 0.2)' },
          lineStyle: { color: '#2e86c1', width: 2 },
          itemStyle: { color: '#2e86c1', borderColor: '#fff', borderWidth: 2 }
        }],
        symbol: 'circle',
        symbolSize: 13
      };

      // 总分高的后渲染，覆盖在上层
      var series = sinTotal > virtueTotal
        ? [virtueSeries, sinSeries]
        : [sinSeries, virtueSeries];

      var option = {
        color: ['#c0392b', '#2e86c1'],
        animation: true,
        animationDuration: 800,
        tooltip: {
          trigger: 'item',
          appendToBody: true,
          formatter: function(params) {
            if (params.seriesName === '七宗罪倾向') {
              var lines = sinNames.map(function(name, i) {
                return name + '：<b>' + sinRaw[i] + '</b> 分';
              });
              return '罪孽倾向<br/>' + lines.join('<br/>');
            } else {
              var lines = virtueNames.map(function(name, i) {
                return name + '：<b>' + virtueRaw[i] + '</b> 分';
              });
              return '美德得分<br/>' + lines.join('<br/>');
            }
          }
        },
        legend: {
          show: true,
          data: ['七宗罪倾向', '七美德之光'],
          bottom: 0,
          textStyle: { color: ink, fontSize: 18 }
        },
        radar: {
          center: ['50%', '50%'],
          radius: '72%',
          startAngle: 103,
          indicator: indicators,
          axisName: {
            color: ink,
            fontSize: 18,
            fontWeight: 600
          },
          splitArea: {
            areaStyle: {
              color: [
                accent2 + '06',
                accent2 + '06',
                accent2 + '0a',
                accent2 + '0a',
                accent + '0a'
              ]
            }
          },
          splitLine: {
            lineStyle: { color: rule }
          },
          axisLine: {
            lineStyle: { color: rule }
          }
        },
        series: series
      };

      chart.setOption(option);

      if (!window._radarResizeBound) {
        window._radarResizeBound = true;
        window.addEventListener('resize', function() {
          var inst = echarts.getInstanceByDom(chartDom);
          if (inst) {
            try { inst.resize(); } catch(e) {}
          }
        });
      }

      setTimeout(function() {
        try { chart.resize(); } catch(e) {}
      }, 200);
    } catch(e) {
      chartDom.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem;">雷达图渲染失败，请刷新页面重试。</p>';
    }
  };
})();