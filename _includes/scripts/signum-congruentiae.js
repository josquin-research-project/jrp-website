// Native historical SC font resources, using Bravura EA00/EA01 (SIL OFL 1.1).
// Font copyright and license: /images/historical-signs/OFL.txt.
// Only the font subset below is covered by that license.
(function(root) {
  "use strict";
  const FONT = "JRPRenaissance";
  // Original Bravura outlines; bounding boxes also reserve editorial clearance.
  const FONT_ZIP = "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";

  // Label SC directions in the rendering copy; the stored score stays standard.
  // The stored score stays standard; native font resources reserve layout space.
  function prepareData(baseId, text) {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (!line.startsWith("!") || line.startsWith("!!")) return line;
      return line.split("\t").map((token, field) => {
        if (!token.startsWith("!LO:TX:")) return token;
        const match = token.match(/:t=(\[sc\]|\[\[sc\]\]|\[sc-below\])$/);
        if (!match) return token;
        const hidden = /:color=transparent(?=:|$)/.test(token);
        const tag = (match[1] === "[sc-below]" ? "jrp-sc-down" : "jrp-sc-up") +
          (hidden ? " jrp-sc-hidden" : "");
        let prefix = token.slice(0, match.index);
        if (/:type=/.test(prefix)) {
          prefix = prefix.replace(/:type=([^:]*)/, (field, value) =>
            ":type=" + [...new Set(value.split(/\s+/).filter(Boolean).concat(tag.split(/\s+/)))].join(" "));
        } else {
          prefix += ":type=" + tag;
        }
        // Retain the exact Humdrum attachment across layout and redraws.
        for (let next = index + 1; !/\bjrp-sc-target-L\d+F\d+\b/.test(prefix) && next < lines.length; next++) {
          if (!lines[next] || /^[!* =]/.test(lines[next])) continue;
          const event = lines[next].split("\t")[field];
          if (!event || event === ".") continue;
          prefix = prefix.replace(/:type=([^:]*)/, "$& jrp-sc-target-L" +
            (next + 1) + "F" + (field + 1));
          break;
        }
        return prefix + match[0];
      }).join("\t");
    }).join("\n");
  }

  function centerSign(svg, direction) {
    if (direction.getAttribute("data-jrp-sc-centered")) return;
    const span = direction.querySelector('.symbol tspan[font-family="' + FONT + '"]');
    const attachment = (direction.getAttribute("class") || "").match(/\bjrp-sc-target-(L\d+F\d+)\b/);
    if (!span || !attachment || !direction.getCTM) return;
    const id = attachment[1];
    const target = svg.querySelector('[id="chord-' + id + '"]') ||
      svg.querySelector('[id="note-' + id + '"]') ||
      svg.querySelector('[id="rest-' + id + '"]');
    if (!target) return;
    const shape = target.querySelector(".notehead") || target;
    try {
      const box = shape.getBBox();
      const matrix = direction.getCTM();
      if (!matrix || !box.width) return; // Hidden/unfinished render: retry later.
      const point = svg.createSVGPoint();
      point.x = box.x + box.width / 2;
      point.y = box.y + box.height / 2;
      const targetCenter = point.matrixTransform(shape.getCTM()).matrixTransform(matrix.inverse());
      const start = span.getStartPositionOfChar(0);
      // Both embedded Bravura outlines span x=0..285 in a 1000-unit em.
      // Use ink width, rather than the text advance or the old segno's box.
      point.x = start.x + parseFloat(span.getAttribute("font-size")) * 0.1425;
      point.y = start.y;
      const glyphCenter = point.matrixTransform(span.getCTM()).matrixTransform(matrix.inverse());
      const shift = targetCenter.x - glyphCenter.x;
      if (!Number.isFinite(shift)) return;
      direction.setAttribute("transform", (direction.getAttribute("transform") || "") +
        " translate(" + shift + ",0)");
      direction.setAttribute("data-jrp-sc-centered", "true");
    } catch (_) { /* Detached SVGs will be retried after insertion. */ }
  }

  // Convert only tagged SC directions in Verovio-generated MEI before layout.
  // Custom fonts do not extend Verovio's built-in glyph-name lookup table.
  function prepareMEI(mei) {
    return mei.replace(/<dir\b([^>]*)>([\s\S]*?)<\/dir>/g, (whole, attrs, content) => {
      if (!/\bjrp-sc-(?:up|down)\b/.test(attrs)) return whole;
      // Previously hidden signs had no glyph or reserved height. Leave them
      // unresolved so the native font does not add invisible layout padding.
      if (/\bjrp-sc-hidden\b/.test(attrs) || /color="transparent"/.test(attrs)) return whole;
      content = content.replace(/<symbol\b([^>]*)\/>/g, (symbol, fields) => {
        const name = fields.match(/glyph\.name="(mensuralSignumUp|mensuralSignumDown)"/);
        if (!name) return symbol;
        fields = fields.replace(/\s+glyph\.num="[^"]*"/g, "");
        return '<symbol' + fields + ' glyph.num="U+' +
          (name[1] === "mensuralSignumUp" ? "EA00" : "EA01") + '" />';
      });
      if (/jrp-sc-native/.test(attrs)) return '<dir' + attrs + '>' + content + '</dir>';
      attrs = attrs.replace(/type="([^"]*)"/, 'type="$1 jrp-sc-native"');
      content = content.replace(/<rend\b([^>]*)>/g, (_, fields) =>
        '<rend' + fields.replace(/\s+fontstyle="[^"]*"/g, "") + ' fontstyle="normal">');
      return '<dir' + attrs + '><rend fontstyle="normal">' + content + '</rend></dir>';
    });
  }

  function fontOptions() {
    return {font: FONT, fontFallback: "Leipzig", fontAddCustom: [FONT_ZIP]};
  }

  // Retain the approved ink centering and half-staff-space clearance. Glyph
  // selection, font embedding, size and bracket layout are native to Verovio.
  function patch(container) {
    if (!container) return;
    container.querySelectorAll("svg").forEach(svg => {
      svg.querySelectorAll("g.dir.jrp-sc-up, g.dir.jrp-sc-down").forEach(direction => {
        if (!direction.getAttribute("data-jrp-sc-clearance")) {
          const span = direction.querySelector('.symbol tspan[font-family="' + FONT + '"]');
          const size = span && parseFloat(span.getAttribute("font-size"));
          if (Number.isFinite(size)) {
            const shift = size / 8 * (direction.classList.contains("jrp-sc-down") ? 1 : -1);
            direction.setAttribute("transform", (direction.getAttribute("transform") || "") +
              " translate(0," + shift + ")");
            direction.setAttribute("data-jrp-sc-clearance", "true");
          }
        }
        centerSign(svg, direction);
      });
    });
  }

  const api = {prepareData, prepareMEI, fontOptions, patch};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JRPsignum = api;
})(typeof window !== "undefined" ? window : globalThis);
