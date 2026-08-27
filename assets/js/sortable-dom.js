/**
 * ============================================================
 * sortable-dom.js — 坐标驱动的拖拽排序（Pointer Events 版）
 * ============================================================
 * 替代原生 HTML5 拖拽（原生 ghost 无法"跟手"，松手会从画面飞回原位）。
 *
 * 实现要点：
 *  - 拖动中用 Pointer Events 让被拖项跟随指针实时移动；
 *  - 原位置插入一个等高的占位元素，其余项围绕占位符让位（两阶段 FLIP，防首帧跳变）；
 *  - 松手时被拖项直接落入指针所在的槽位，视觉上"原地放下"，无往返飞行。
 *
 * 用法：
 *   SortableDom.attach(listEl, { onReorder: function () { 在这里同步最终顺序 } });
 * 前置：列表项使用 <li class="sort-item" data-dimId="...">，容器需 .sort-list。
 * ============================================================
 */
(function () {
  var MOVE_THRESHOLD = 6;   // 判定为"拿起"的位移阈值（px），低于它视为点击
  var SETTLE_MS = 180;      // 让位/落位过渡时长（ms）
  var EASE = 'cubic-bezier(0.2, 0.7, 0.3, 1)';

  /**
   * 给一个排序容器启用指针拖拽
   * @param {HTMLElement} container 排序列表容器（.sort-list）
   * @param {Object} opts 配置；opts.onReorder 在落位后调用，用于同步最终顺序
   */
  function attach(container, opts) {
    opts = opts || {};
    if (!container) return;
    if (container.getAttribute('data-sortable')) return; // 防止重复挂载
    container.setAttribute('data-sortable', '1');
    container.style.position = 'relative';

    var state = null; // 当前拖拽会话

    // 目标项 = 除被拖项(.sorting)与占位符(.sort-placeholder)外的排序项
    function getTargets() {
      return Array.from(container.querySelectorAll('.sort-item:not(.sorting):not(.sort-placeholder)'));
    }

    container.addEventListener('pointerdown', function (e) {
      if (state) return;
      if (e.button !== undefined && e.button !== 0) return; // 仅响应鼠标左键
      var item = e.target && e.target.closest ? e.target.closest('.sort-item') : null;
      if (!item || !container.contains(item)) return;

      state = {
        item: item,
        startY: e.clientY,
        grabbed: false,
        grabOffset: 0,
        placeholder: null
      };

      var onMove = function (ev) { if (state) update(ev); };
      var onUp = function (ev) {
        if (ev.pointerType !== 'touch' && ev.button !== undefined && ev.button !== 0) return;
        finish();
      };
      var onCancel = function () { cancel(); };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onCancel);
      state.cleanup = function () {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
      };
    });

    // 拖拽移动：跟手 + 占位槽位实时跟随
    function update(ev) {
      if (!state) return;
      var dy = ev.clientY - state.startY;
      if (!state.grabbed) {
        if (Math.abs(dy) < MOVE_THRESHOLD) return; // 未达到拿起阈值，视为点击
        grab(ev);
      }
      state.item.style.transform = 'translateY(' + (dy - state.grabOffset) + 'px)';
      movePlaceholder(ev.clientY);
    }

    // 拿起被拖项：离流、插占位、随指针
    function grab(ev) {
      var item = state.item;
      var rect = item.getBoundingClientRect();
      var crect = container.getBoundingClientRect();
      state.grabbed = true;
      state.grabOffset = ev.clientY - state.startY; // 拿起瞬间累计偏移，避免跳变
      // 占位符：与原项等高，占住原位置
      state.placeholder = document.createElement('li');
      state.placeholder.className = 'sort-item sort-placeholder';
      state.placeholder.style.height = rect.height + 'px';
      container.insertBefore(state.placeholder, item);
      // 被拖项脱离文档流，定位到当前视觉位置
      item.style.position = 'absolute';
      item.style.left = (rect.left - crect.left) + 'px';
      item.style.top = (rect.top - crect.top) + 'px';
      item.style.width = rect.width + 'px';
      item.style.boxSizing = 'border-box';
      item.style.zIndex = '1000';
      item.style.transition = 'none';
      item.classList.add('sorting');
      movePlaceholder(ev.clientY);
    }

    // 指针应插入的槽位：返回目标项，超出最后一行中线则 null（追加末尾）
    function targetAt(y) {
      var targets = getTargets();
      for (var i = 0; i < targets.length; i++) {
        var r = targets[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return targets[i];
      }
      return null;
    }

    // 把占位符移动到指针所在槽位（仅当槽位变化时），并对让位项做平滑过渡
    function movePlaceholder(y) {
      var ph = state.placeholder;
      if (!ph || !state.grabbed) return;
      var target = targetAt(y);
      var changed = false;
      var firstTops;
      if (target) {
        if (ph.nextSibling !== target) { changed = true; firstTops = recordTops(); container.insertBefore(ph, target); }
      } else if (ph.nextSibling !== null) {
        changed = true; firstTops = recordTops(); container.appendChild(ph);
      }
      if (changed) settle(firstTops);
    }

    function recordTops() {
      return getTargets().map(function (o) { return o.getBoundingClientRect().top; });
    }

    // 两阶段 FLIP：先把让位项钉回旧位（禁用过渡），下一渲染帧再带过渡归位，避免首帧跳变
    function settle(firstTops) {
      var list = getTargets();
      void firstTops;
      list.forEach(function (o, i) {
        o.style.transition = 'none';
        o.style.transform = 'translateY(' + (firstTops[i] - o.getBoundingClientRect().top) + 'px)';
      });
      void container.offsetWidth; // 强制 reflow 落实初始位移
      list.forEach(function (o) {
        o.style.transition = 'transform ' + SETTLE_MS + 'ms ' + EASE;
        o.style.transform = 'translateY(0)';
      });
      if (state) state._settleTimers = setTimeout(function () {
        list.forEach(function (o) {
          o.style.transition = '';
          o.style.transform = '';
          o.style.willChange = '';
        });
      }, SETTLE_MS + 60);
    }

    // 落位：被拖项从当前视觉位置（指针处）平滑过渡到槽位，避免"吸进去"瞬移
    function finish() {
      if (!state) return;
      if (state.grabbed && state.placeholder) {
        var item = state.item;
        var next = state.placeholder.nextSibling;
        var others = getTargets(); // 此刻仍不含被拖项（.sorting）
        var othersFirst = others.map(function (o) { return o.getBoundingClientRect().top; });
        var itemVisualTop = item.getBoundingClientRect().top; // 指针处视觉位置（FLIP 起点）

        if (state.placeholder.parentNode) state.placeholder.parentNode.removeChild(state.placeholder);
        item.style.cssText = '';
        item.style.position = '';
        item.classList.remove('sorting');
        container.insertBefore(item, next);

        // 量测落位后的最终位置（同步强制布局，进程内无中间绘制，无闪帧）
        var othersLast = others.map(function (o) { return o.getBoundingClientRect().top; });
        var itemSlotTop = item.getBoundingClientRect().top;
        var animate = [item].concat(others);
        var from = [itemVisualTop - itemSlotTop].concat(
          othersFirst.map(function (f, i) { return f - othersLast[i]; })
        );
        // FLIP：先把各项钉回视觉旧位（被拖项钉回指针处），再带缓动过渡归位
        animate.forEach(function (el, i) {
          el.style.transition = 'none';
          el.style.transform = 'translateY(' + from[i] + 'px)';
        });
        void container.offsetWidth; // 强制 reflow，落实初始位移
        animate.forEach(function (el) {
          el.style.transition = 'transform ' + SETTLE_MS + 'ms ' + EASE;
          el.style.transform = 'translateY(0)';
        });
        setTimeout(function () {
          animate.forEach(function (el) {
            el.style.transition = '';
            el.style.transform = '';
            el.style.willChange = '';
          });
        }, SETTLE_MS + 60);

        if (typeof opts.onReorder === 'function') opts.onReorder();
      }
      cleanup();
    }

    // 取消：被拖项回原位
    function cancel() {
      if (!state) return;
      if (state.grabbed && state.placeholder) {
        if (state.placeholder.parentNode) {
          container.insertBefore(state.item, state.placeholder);
          state.placeholder.parentNode.removeChild(state.placeholder);
        }
      }
      state.item.style.cssText = '';
      state.item.style.position = '';
      state.item.classList.remove('sorting');
      container.querySelectorAll('.sort-item').forEach(function (o) {
        o.style.transition = '';
        o.style.transform = '';
        o.style.willChange = '';
      });
      cleanup();
    }

    function cleanup() {
      if (state && state.cleanup) state.cleanup();
      state = null;
    }
  }

  window.SortableDom = { attach: attach };
})();