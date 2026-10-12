// Historical SC fallback, using EA00/EA01 from Bravura (SIL OFL 1.1).
// Font copyright and license: /images/historical-signs/OFL.txt.
// Only the font subset below is covered by that license.
(function(root) {
  "use strict";
  const FONT = "JRP Historical Signs";
  const FONT_DATA = "d09GMk9UVE8AABFAAAsAAAAAPKQAABD2AAF7ZAAAAAAAAAAAAAAAAAAAAAAAAAAADad4GyAcIAZgADQBNgIkAwoEBgXNCgcgG987oyLYOACgslkRxawakVxyFkj+MsEmsukL9goGg1wMZkktVigWx3OGdlmCrdBt8opvyJ+qjAkM7fLMMeCOKlonxNfaW7/ZDSI4YAkubAkdTVJ1HpDUnTBA6HjH/f91WXqPXOSq0m7+Hrfs2eOuIhthk8XCA3gmU+UJ+BhlQJ9Iwo6LKqma46ybFFUQBzfiV4ahB8YlFqRsKBj9WPvEzGKWOlU1mUfSmbwz2RPzBt7Mv4REqZeLzPB+//v9r1pEv4Tmlew1/jcze2bx7ze9D/OLy5xzvwk08fYXEc9miUgjRBahEGlBQyQSIrETasKyZYnXEa8MUMToATJ0b/cWaJXGAa5GJ35aPXrkNOHm4v/jkKiRCTGgxtAQpNdqDV5Eso1effPZiG4ctpXe9nXX35qGgM9ECBHMKr4X1f/vPe9v62ijlIgjjogSEaXv8lrBVoiIZ7NV+9Gqzc8jx8Tx/w0xX/tiQBmwzE278TNLa+eimXSLDfYOOB0b8jw4Ntg/iI8UgicBhPo56FTQxaDr00YL/uTJ9xFPi/JLK4tvPwe0AyUXMV3ksnBq7lGbEu2ubnKg4biTZV+uQJuGOX3Y+uYRHX3um6oFD/NRmKEexcc2dzxXZoFIoAUoVLDEzfeBxtZbs0rr0W6/jv5e+axLgGkeJ30xyxnAYfQO1fE0f8IWLywtvQ3FNamHgEGeR27ZBnRzuoKIn4Ly7+jB6CNTpzugeojSKAm8834n3uSnGyHX1hNrXxx87EvMSywut6sRQo/eXZ/o3Z0Jvp4nIuhvWywDN40H4y5IowSC/iRP4LzuR3ZuLDaWrXKq2zTv2wrT7BexW/MJKn2gKRIt2+v4tq+qSz9cJ7DkjktM2Vr3YHzgR57noEcGaQxUGzvxYyASuOD4KMEhLs36JTcngtBVMLpPVefi8y1KHTR/cAf3gZpGQ59zAw3mO0YtMrZKBr7aFY9OJOq81NRMTd09TaPhvsS6HkfBfglpKVkYZxHdUEUc7U2Z9qvEw0hpTwzhP06Kf24OBF893FiwCXrAe03fJgBAn46l4fU9WFlUCI8zjPBZ33gDtyNFj1GhEphuir3ctkgWOLL3BMUMPxzvC4NkrBp/S5qEjMe8zihFGHtgTVZscRJHPMdvWAus61D8V4MV6q0Bz5VCar4nV45Fq8lhuffLB8lgbFQgmCTUTceAJ3DGfxOUnVBBt1eRRnEtGjyhhBGDfDckf4u9Qww+fqgW6S8lmmagJou540RPDGrs0K+Zw4AszEemdzo17HWR/cEiDe3jxDqmWUCsqC+sZomqDgVa+i6y7wSRmvxC/2Dy54LBA0gd5GF1fY54U5uK0CYjfHVfq6yNrpImgTaURAYi7+UpACFZF82ClZMZc28hdMcEFpUu7cpVFAboe5rKTkoP0Xhy3F+kYcY3X+QYPJ7PJOxJ2HBuqGEJP59VQB4geIIj7pUx0smFCN0/mm0mpefe2xmqLT/o5oG1Nigy/edE5jpDNtacp32JNyQfoLz7uixZSNb9jvEzcAsZo+o1BMVn59OGKxrTGClWMRH7JJGZIyTQtLII7oFCmuM2sFN473PIxFQnIAtxz+pKMs17kBYOUMfyfvNUpmf5TXJRlLUg73p9HeR9dw7Xq6a8vOgVoW7TXTh97tFG2SOIh3x7LTm8TMkWlVGspQAramX8joMSkBQuQ/uAXTwHo1tdMwmuv2MYMt1kRiTb2bOE6lAcQcFOYrXnSL+JAYT5vDgzSJ7YhTW6KFQLJCelDJtdq/ORG1wWw97I9xVeyE+MyQwd3DdjPN3nEMhqZimpRgO8h8GoseJlRMMBDuYQrLoD/YR+EYLCkCJF+O1ly6CgzsuK55MFo0kZy0GXt0EqVVU6R3wA6NHCfIZnx6Wt30vKinOVsn5ZkvDxgdoG0wtVq6SCzF7d4GkANIbGJqV29cgwHWchsDnoX4m7LpXz2AvxO3iL55v6bjG5kguox2ZcFheQRsDlhRc0UdxgetOsDDkavwQUi1THw4CDI7o0FnlLORagIqfBCujMWyGwhxCKTswbuAxBpjKWURbL5b8oUN/8lNe14Y4lZaGTyYt5BWAeBOyv5CyWIFNpk1ke3wLCxdMNKwsN7ZoLSOI/IaAskQHsIU6xu3h7HjfvCyPsKHAglMM02HecMCIxOaM74hDSgick6RpiYy5Ot2sLWE2mlRUkXaLdw2VxyyWj1ZN8txRpVvjxEwK9kwc3nehD6TYXg4BpA2+OXhSE5Big5UAoeLNCLvMcfOvsyYW8GvrfZTIRWReWQrD4JLcNct1/j7/OUccj/WD9tvLb9Rdrb0LOOJ56dK8OR2JxlMrnj/qupw50uP53HznLwkB1mgkw5IuFkojko8E4kWDamrNjuF1bfneAaLFcC9Xg8TNAP1hRl/aJDZ6cKPVQifU52zRo7eDy5y+3TlHQBAVNoN5gsghY9GYJ1aAImOPE+O9XIQ+ntEpFGSjPqUpEkbkci2BJlZMT7SE9OkWNKctWl5hdrM7JHtE3yLaHc/StgSXPP46ZDFtlN1OA6ogkrEdYxE3UgyabUGiwe7rs5DLJTyo4/braJ5DXX57cE3fMllgB/Qy4/bDWpLUzwk6H2+6Gyq61CsJAU9CchzXpjDEEJrLpONHKvh3Z+X8c34d/h+/4wzDGLRE1MT4WFvJZp5JSeZH1LZGXykRDUoxhIH1ZMXz79c3m20Hb7vmuZnfeE/H64z09Jz0ef8TX02s2Qp13YV+UK4A3sW640holxeRjbACXCwDwdltuSLiB2lImE9oW70yGJs/8ynhRoJfTt8Vy8s178XhtUpn0mxTS/BAkRF6BRB8CCrCAUNcQqLhOYqm9S+Cn0On4SX97uCC031cW63/dnvv+y9p/nqzvgK+7zfPavF/HnyVx8gy4owgpZHpkFiHKj1Mls8CrPXQTSwO41TrD9oLkA1UnZGatTuGffGKsdfyjsfZznRvRuVbnTmnu13nwNcWu86S5/qvzorBz67zFP3WgzofimVjVd6wf3v9if0pnDy3I4MjSdloe+JNEzzzxzCsMyHlIM0rI2gFrqKYpoIAqLYN0yI6GHLDUK62AB1qeN3jnxImDg4MZJ18xYzLvxEOAX+2B5rVABjnI2kM1ECGGBySlh8Atc5ayN7KUW2YCvOnX0tzku3Ok4R0oFoKhZ3W0CjKcWjYyav0EgOjla3OxBEgNkPltfCJSypIzgaKjxzLw1OyfVoCLaxtQUvnUqmGIVdYhB+FEoenwqUrHIcDgyxWto5Q6SDNRuEXu9PV23jvg0ZJOxdKGxHlFcsUZ8unQE6lIwvbPy/trbOBAzYYga1JSUYwtHlxdTvyagSkIOs0/G5WskWIdl+BvfeK1yXd70y0jcGtzCRHkIxHYIccT+NWCOcxA0kLCw/UPQfgrPDrV8bTeGJ5Wf5DzxU4doooa0n9a92HMBj1UExwJbWsXP5rPFE/PrAcN2ODAQsUPcK7nMJBsNBjmqentFZ67iiitvs6o0UwlZJZKRQF7z8GWxtbtpLEz0sZZPXvPoDe0phmWTSGBH/ZMXAEK1jaOk/zQx5pSSnS6BAhC2Fv90FpUC3NPOa78DJzWrd168UMP0+Eo68N49Ez0RWV3SAGn/+oAMnJQ03BonmjWBOdCNR2BrXzwK8chsmAdj2r6dOrRcUVD21Kb5suXllYa+bGRsnd0qHLTyUs7M9jtY7g74/4WSZej4TjsPerzzh6OmbyL5sjoxkpnZVR1I6blICFPww63VcKriZEQy1IJHRWB6cpYq88beCgzP9GBvcxnAO5xRVcOMGsegp9M7reFSxPivY4vHMdzG5U6axirSxhLb2OpCbRl6SqMMjYDXXdQlThsYhEGCsdHA0yPPOwjMuSXPxrpO+SfJVBtKWyUakHzPrFa/cca8R7NucpFdvHdpQjOpDLi5BkJAsEF95Bnv0XtZrBWdwF58fttJURiUqwQS0m5gOR+xVssvJEGHwBddLBE+oZWBrmf5RU+DD12XiGdjR/ygPOQPULISpeWuvf34XIB6apK0htNLn3eCVLDTL6ZjKwKkmUC9RLn/QtQFadRgObMmZNbct0LxKm06L0zsMrqmnk5G5wutONDlSt00Fga9Qb4TCeEXKdKza0lQugdA7KxQaBWCyZKvx+QogVntJy/G4ogrO5bl1/7c1vdsG86hjecJFX12iNMKNE/JFt+9ZRlF1p445BDHy11C0yixQyGiRPAzdtpnXZxrC0IgZlcVlrqMFjLYKGBXBsn0CfzHGwIB9g7PE8HAL7c0+ykRRnuTtwoLWrNTnZusWOqLKAh4vlY1tw1yNA/Cn7vjlpFaz6w9DoagbzkOOBskXPmzF4TcyC3sTICsod9mVmL5fJSmMC9BZH7fWFZeDfOcU9z/toma8hE99Q+DdoO69oCgzB09grEaJeNz6TkyxhNLkktyDZZhxr6T9Z1LxwxWeu8REj0vVofPv2x+aWbiPXW03dt+sqRGcgvFM7NGUZO2M5WDknX2NZgdC1egoBUnpx3kfGiUv5OQjqk7YvZmf02Z6jXnlpT+y3H5aikD3p9NXdMpSWtTSbd1Yp7hqKZX2yW5Z6KPdRdm2/AK+8df/KOcRZ2m5BaWywJwmLLmW+dk1KK1bsFGrL2OANfteOhyw8nxc0MrQ3geUTRf+i14pTaQYm5fPVPfL/rWu9fOW3m2/XFHNtTdTot15wDB6ryn6AvZ9jT1NqoKQyv9OfyX8Vz9HPb3UzTTKA+5REuxWBs9f2bRDfVKrK2Pk/drn0/fODQr5CvtOvzsOSWEi3Lmg8oYq69U6cbhhGSm7DkED+hjIKWm/WpFUsQtVfkgkWg3dE119D22vpovq2ojK1/oTnT+DPunddo2LstkFt9SEDokdFw6LDxPGxaBtzGnumlv417944hDn/XugXuUtGgs2VD7bHBpZzVMK4fEjPl68JFj4r8IU7E3ka0Samjpl012UjPegw8Wey+r6ChoJdK5RKRh+zf3YW83ABNclOskcRNv+2KtIWC64eNLJBF51FZa6sp9yeAVX89B7YJQVyCgFisVLS2EmLcLjbbLyrQBnO1Gxuk2nwV9l9z9dW+zzztX0h8c5FHdWylrj0T8BzTYXRquUf03dVa02DLfafen8tXr6h4u5gbNrBPFxJcbG1EwC+viE/Ifp5LRQrnuOwms78ONjKpM7GQEAK3cPnI29XnDDgX0Sm1lVOZKcPln10AhzM5/D1JD+ej8N2nWrIndtBlAntyIxETozIlRqat8H5eAnPNhZR+yicusYBdFFLlIpjHqgZnbOLCamDJzcWSYqFnQO6DRGV06zkQcZFdLmwlJ/Kg257cSOUECkNglzZiJLPjAkLdkEO35GnjYujk0kqBqbEYljMvLHkoIcqL9xhHpk7LfSLEGU9FEQ/CmbrnDOZEAuarKA5ux0QoH+cEf/JPJUEIL4jggDiFOPKRS0IOwdSHegygMsi5FOi4fkvhiw1hIXZqwZti2aOtQlYDbu6HhKMS0M+M46ntkEqWjNgqiAV7AWvy/4RFcmQ+U/o4Inmhfqgg4+dL91CI33JiJIYwMSWsi2g68JLbIIYULmds6hhtSwnIQT93UZgKK4Nkrtss3c98O2+AVWFdJPZSi/klmbs2zt0n04ftZ/rzC288k6wd6bFn+lz6zgi+T2EVxp1ch2Ozo93a7HMBZPlmvy1T3v6iMB7ELSpuGesomKzCDVZejYF9drNhvD6koob+hGHnjKVxCyCW9q06s+8XbfzIdxq0kD/zuzx3Dx58V+aOH5p9B2r9ah+v8edRrquKAQAA";
  const NS = "http://www.w3.org/2000/svg";

  // Label SC directions in the rendering copy; the stored score stays standard.
  // A supported segno reserves space before we substitute the historical glyph.
  // An empty [sc] otherwise has no height for Verovio's collision avoidance.
  function prepareData(baseId, text) {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      if (!line.startsWith("!") || line.startsWith("!!")) return line;
      return line.split("\t").map((token, field) => {
        if (!token.startsWith("!LO:TX:")) return token;
        const match = token.match(/:t=(\[sc\]|\[\[sc\]\]|\[sc-below\])$/);
        if (!match) return token;
        const tag = match[1] === "[sc-below]" ? "jrp-sc-down" : "jrp-sc-up";
        let prefix = token.slice(0, match.index);
        if (/:type=/.test(prefix)) {
          prefix = prefix.replace(/:type=([^:]*)/, (field, value) =>
            ":type=" + [...new Set(value.split(/\s+/).filter(Boolean).concat(tag))].join(" "));
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
        // Intentionally hidden signs should not reserve extra display space.
        const symbol = /:color=transparent(?=:|$)/.test(prefix)
          ? match[0] : match[0].replace(/sc(?:-below)?/, "segno");
        return prefix + symbol;
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

  // Substitute only labeled SC placeholders. Verovio retains control of staff,
  // time, size, color and editorial brackets. Ordinary segnos survive.
  function patch(container) {
    if (!container) return;
    container.querySelectorAll("svg").forEach(svg => {
      let filled = false;
      svg.querySelectorAll("g.dir.jrp-sc-up, g.dir.jrp-sc-down").forEach(direction => {
        direction.querySelectorAll(".symbol tspan[font-family]").forEach(span => {
          const glyph = span.textContent.trim();
          if (glyph && glyph !== "\uE047") return;
          span.setAttribute("font-family", FONT);
          span.textContent = direction.classList.contains("jrp-sc-down") ? "\uEA01" : "\uEA00";
          filled = true;
        });
        // Half a staff-space is one eighth of the music font's em. Move the
        // whole direction so editorial brackets retain their alignment.
        if (!direction.getAttribute("data-jrp-sc-clearance")) {
          const span = direction.querySelector(".symbol tspan[font-family]");
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
      if (filled && !svg.querySelector("style[data-jrp-historical-signs]")) {
        const style = svg.ownerDocument.createElementNS(NS, "style");
        style.setAttribute("data-jrp-historical-signs", "");
        style.textContent = '@font-face{font-family:"' + FONT + '";src:url("data:font/woff2;base64,' +
          FONT_DATA + '") format("woff2");font-weight:normal;font-style:normal}';
        svg.insertBefore(style, svg.firstChild);
      }
    });
  }

  const api = {prepareData, patch};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.JRPsignum = api;
})(typeof window !== "undefined" ? window : globalThis);
