/**
 * 轻量混淆/压缩工具（浏览器版）
 * 用途：发布前隐藏计分、判罚解读等敏感逻辑，避免普通用户、脚本或 AI 轻易读懂源码。
 * 注意：这是"压缩混淆"，能显著提高解读门槛，但并非绝对保密，专业逆向仍可还原。
 *
 * 浏览器版用法：
 *   var compressed = Obfuscate.minify(sourceCode);  // 返回压缩后的单行代码
 *   Obfuscate.obfuscateScript('scoring');            // 压缩页面上 id="scoring" 的 inline script
 *
 * —— 未来如何修改计分规则 ——
 * 1. 直接编辑对应的清晰源码文件（例如 scoring.js），保存即可（开发/预览仍用清晰版，方便排错）；
 * 2. 在浏览器控制台运行 Obfuscate.minify(...) 获取压缩版代码字符串；
 * 3. 用压缩版内容覆盖回源文件，即为发布的"防读取"版本。
 */

var Obfuscate = (function () {

  /**
   * 去除注释 + 压缩空白（状态机实现，逐字符安全遍历）
   * - 正确处理字符串、模板串与正则字面量，不误删字符串内部内容；
   * - 在两个相邻"单词字符"之间保留一个空格，避免 `return x` 被压成非法的 `returnx`。
   * @param {string} code 原始清晰源码
   * @returns {string} 压缩后的单行代码
   */
  function minify(code) {
    var out = '';
    var i = 0, n = code.length;
    var inStr = false, strCh = '';
    var inLine = false, inBlock = false;
    var pendingSpace = false;

    while (i < n) {
      var c = code[i];
      var nxt = code[i + 1];

      // 行注释：直接跳过至行尾
      if (inLine) {
        if (c === '\n') inLine = false;
        i++; continue;
      }
      // 块注释：直接跳过至 */
      if (inBlock) {
        if (c === '*' && nxt === '/') { inBlock = false; i += 2; }
        else i++;
        continue;
      }
      // 字符串内部：原样保留（含转义），不压缩
      if (inStr) {
        out += c;
        if (c === '\\') { out += nxt || ''; i += 2; continue; }
        if (c === strCh) inStr = false;
        i++; continue;
      }
      // 进入字符串
      if (c === '"' || c === "'" || c === '`') {
        inStr = true; strCh = c; out += c; i++; continue;
      }
      // 注释起始
      if (c === '/' && nxt === '/') { inLine = true; i += 2; continue; }
      if (c === '/' && nxt === '*') { inBlock = true; i += 2; continue; }
      // 空白：记录待填充，等待下一个非空白字符时按需插入一个空格
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { pendingSpace = true; i++; continue; }

      // 非空白字符：判断是否需要保留分隔空格，避免两个单词 token 粘连
      var prev = out.length ? out[out.length - 1] : '';
      if (pendingSpace && prev && /\w/.test(prev) && /\w/.test(c)) out += ' ';
      out += c;
      pendingSpace = false;
      i++;
    }
    return out;
  }

  /**
   * 压缩页面上某个 inline <script> 的内容并替换
   * @param {String} scriptId 该 script 标签的 id
   * @returns {String|null} 压缩后的代码（替换成功时），找不到时返回 null
   */
  function obfuscateScript(scriptId) {
    var el = document.getElementById(scriptId);
    if (!el || el.tagName.toLowerCase() !== 'script') return null;
    var original = el.textContent;
    var compressed = minify(original);
    el.textContent = compressed;
    return compressed;
  }

  return {
    minify: minify,
    obfuscateScript: obfuscateScript
  };
})();
