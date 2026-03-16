function ensureAnalysisState() {
  if (!localStorage.ANALYSISrepertory || localStorage.ANALYSISrepertory === "Select a repertory") {
    localStorage.ANALYSISrepertory = "";
  }
  if (!localStorage.ANALYSISgenre || localStorage.ANALYSISgenre === "All genres") {
    localStorage.ANALYSISgenre = "";
  }
  if (!localStorage.ANALYSISwork || localStorage.ANALYSISwork === "All works") {
    localStorage.ANALYSISwork = "";
  }
}

function loadCgiParameters() {
  const params = GetCgiParameters();
  if (typeof params.repertory !== "undefined") {
    localStorage.ANALYSISrepertory = params.repertory;
  }
  if (typeof params.genre !== "undefined") {
    localStorage.ANALYSISgenre = params.genre;
  }
  if (typeof params.work !== "undefined") {
    localStorage.ANALYSISwork = params.work;
  }
}

function analysisDataUrl(type, repertory, genre, work) {
  let url = "/data?repertory=" + encodeURIComponent(type);
  if (repertory) {
    url += "&composer=" + encodeURIComponent(repertory);
  }
  if (genre) {
    url += "&genre=" + encodeURIComponent(genre);
  }
  if (work) {
    url += "&work=" + encodeURIComponent(work);
  }
  return url;
}

function getLegacyDataFileUrl(file) {
  const base = JOSQUIN_LEGACY.replace(/\/+$/, "");
  return base + "/data/" + file;
}

function getLegacyDataActionUrl(action, jrpid) {
  const base = JOSQUIN_LEGACY.replace(/\/+$/, "");
  return base + "/data?a=" + encodeURIComponent(action) + "&f=" + encodeURIComponent(jrpid);
}

function getLegacyPlotFallbackList(jrpid, type) {
  if (!jrpid || !type) {
    return [];
  }

  switch (type) {
    case "activity-merged-notitle":
      return [
        getLegacyDataFileUrl(jrpid + "-activity-merged-notitle.png"),
        getLegacyDataFileUrl(jrpid + "-activity-merged.png"),
        getLegacyDataActionUrl("activity-merged-notitle", jrpid),
        getLegacyDataActionUrl("activity-merged", jrpid)
      ];
    case "activity-separate-notitle":
      return [
        getLegacyDataFileUrl(jrpid + "-activity-separate-notitle.png"),
        getLegacyDataFileUrl(jrpid + "-activity-separate.png"),
        getLegacyDataActionUrl("activity-separate-notitle", jrpid),
        getLegacyDataActionUrl("activity-separate", jrpid)
      ];
    case "prange-attack":
      return [
        getLegacyDataFileUrl(jrpid + "-prange-attack.svg"),
        getLegacyDataActionUrl("prange-attack", jrpid)
      ];
    case "prange-duration":
      return [
        getLegacyDataFileUrl(jrpid + "-prange-duration.svg"),
        getLegacyDataActionUrl("prange-duration", jrpid)
      ];
    default:
      return [];
  }
}

function useLegacyPlotFallback(img) {
  if (!img) {
    return;
  }

  const raw = img.getAttribute("data-fallbacks") || "";
  if (!raw) {
    img.onerror = null;
    return;
  }

  const urls = raw.split("||").filter(Boolean);
  let index = parseInt(img.getAttribute("data-fallback-index") || "0", 10);
  if (!Number.isFinite(index) || index < 0) {
    index = 0;
  }

  if (index >= urls.length) {
    img.onerror = null;
    markAnalysisAssetFailure(img);
    return;
  }

  const nextUrl = urls[index];
  img.setAttribute("data-fallback-index", String(index + 1));

  const link = img.closest ? img.closest("a") : null;
  if (link) {
    link.setAttribute("href", nextUrl);
  }

  img.src = nextUrl;
}

function getAnalysisVisibilityConfig(section) {
  if (!section) {
    return null;
  }

  const raw = section.getAttribute("data-required-assets") || "0";
  const requiredAssets = parseInt(raw, 10) || 0;
  return {
    requiredAssets: requiredAssets,
    loadedAssets: 0,
    failedAssets: 0
  };
}

function updateAnalysisSectionVisibility(section) {
  if (!section) {
    return;
  }

  let state = section._analysisVisibility;
  if (!state) {
    state = getAnalysisVisibilityConfig(section);
    if (!state) {
      return;
    }
    section._analysisVisibility = state;
  }

  if (state.loadedAssets >= state.requiredAssets && state.requiredAssets > 0) {
    section.style.display = "";
    return;
  }

  if (state.loadedAssets + state.failedAssets >= state.requiredAssets && state.loadedAssets < state.requiredAssets) {
    section.style.display = "none";
    const label = section.getAttribute("data-entry-label") || "Unknown analysis entry";
    const page = section.getAttribute("data-analysis-page") || "analysis";
    console.warn(page + ": hiding entry with missing files:", label);
  }
}

function markAnalysisAssetLoaded(img) {
  if (!img) {
    return;
  }

  const section = img.closest ? img.closest("[data-analysis-entry]") : null;
  if (!section) {
    return;
  }

  let state = section._analysisVisibility;
  if (!state) {
    state = getAnalysisVisibilityConfig(section);
    if (!state) {
      return;
    }
    section._analysisVisibility = state;
  }

  if (img.getAttribute("data-analysis-loaded") === "true") {
    return;
  }

  img.setAttribute("data-analysis-loaded", "true");
  state.loadedAssets += 1;
  updateAnalysisSectionVisibility(section);
}

function markAnalysisAssetFailure(img) {
  if (!img) {
    return;
  }

  const section = img.closest ? img.closest("[data-analysis-entry]") : null;
  if (!section) {
    return;
  }

  let state = section._analysisVisibility;
  if (!state) {
    state = getAnalysisVisibilityConfig(section);
    if (!state) {
      return;
    }
    section._analysisVisibility = state;
  }

  if (img.getAttribute("data-analysis-failed") === "true") {
    return;
  }

  img.onerror = null;
  img.setAttribute("data-analysis-failed", "true");
  state.failedAssets += 1;
  updateAnalysisSectionVisibility(section);
}

function getAnalysisPagingPrefix(storagePrefix) {
  return storagePrefix || "ANALYSIS";
}

function getAnalysisCurrentPageKey(storagePrefix) {
  return getAnalysisPagingPrefix(storagePrefix) + "currentpage";
}

function getAnalysisPageViewKey(storagePrefix) {
  return getAnalysisPagingPrefix(storagePrefix) + "pageview";
}

function getAnalysisPageSizeKey(storagePrefix) {
  return getAnalysisPagingPrefix(storagePrefix) + "pagesize";
}

function ensureAnalysisPagingState(storagePrefix) {
  const pageViewKey = getAnalysisPageViewKey(storagePrefix);
  const pageSizeKey = getAnalysisPageSizeKey(storagePrefix);
  const currentPageKey = getAnalysisCurrentPageKey(storagePrefix);

  if (sessionStorage[pageViewKey] !== "all") {
    sessionStorage[pageViewKey] = "paged";
  }
  if (typeof sessionStorage[pageSizeKey] === "undefined") {
    sessionStorage[pageSizeKey] = 20;
  }
  if (typeof sessionStorage[currentPageKey] === "undefined") {
    sessionStorage[currentPageKey] = 1;
  }
}

function resetAnalysisPaging(storagePrefix) {
  sessionStorage[getAnalysisCurrentPageKey(storagePrefix)] = 1;
  sessionStorage[getAnalysisPageViewKey(storagePrefix)] = "paged";
}

function getAnalysisPagedItems(items, storagePrefix, page) {
  ensureAnalysisPagingState(storagePrefix);

  const currentPageKey = getAnalysisCurrentPageKey(storagePrefix);
  const pageViewKey = getAnalysisPageViewKey(storagePrefix);
  const pageSizeKey = getAnalysisPageSizeKey(storagePrefix);
  const pageSize = parseInt(sessionStorage[pageSizeKey], 10) || 20;
  const totalEntries = items.length;
  let totalPages = Math.ceil(totalEntries / pageSize);

  if (totalPages < 1) {
    totalPages = 1;
  }

  if (typeof page === "undefined" || page === null || page === "") {
    page = parseInt(sessionStorage[currentPageKey], 10) || 1;
  }

  page = parseInt(page, 10) || 1;
  if (page < 1) {
    page = 1;
  }
  if (page > totalPages) {
    page = totalPages;
  }

  sessionStorage[currentPageKey] = page;

  if (sessionStorage[pageViewKey] === "all") {
    return {
      currentPage: page,
      totalPages: totalPages,
      items: items.slice(0),
      totalEntries: totalEntries
    };
  }

  const startIndex = (page - 1) * pageSize;
  let stopIndex = startIndex + pageSize;
  if (stopIndex > totalEntries) {
    stopIndex = totalEntries;
  }

  return {
    currentPage: page,
    totalPages: totalPages,
    items: items.slice(startIndex, stopIndex),
    totalEntries: totalEntries
  };
}

function getAnalysisPaginationShell() {
  let output = "";
  output += "<div class=\"pagination\">\n";
  output += "<span class=\"pagination\" id=\"page-list\"></span>\n";
  output += "</div>\n";
  return output;
}

function renderAnalysisPaginatedResults(items, options) {
  const settings = options || {};
  const storagePrefix = settings.storagePrefix || "ANALYSIS";
  const page = settings.page;
  const renderItem = settings.renderItem || function(item) { return String(item); };
  const beforeItemsHtml = settings.beforeItemsHtml || "";
  const emptyMessage = settings.emptyMessage || "";
  const rerenderFunction = settings.rerenderFunction || "runAnalysis";

  const paged = getAnalysisPagedItems(items, storagePrefix, page);
  let html = "";

  html += getAnalysisPaginationShell();
  html += beforeItemsHtml;

  for (let i = 0; i < paged.items.length; i++) {
    html += renderItem(paged.items[i], i);
  }

  if (!paged.items.length && emptyMessage) {
    html += emptyMessage;
  }

  return {
    html: html,
    currentPage: paged.currentPage,
    totalPages: paged.totalPages,
    storagePrefix: storagePrefix,
    rerenderFunction: rerenderFunction
  };
}

function printAnalysisPageList(currentPage, totalPages, storagePrefix, rerenderFunction) {
  const rightArrow = "&#10095;";
  const leftArrow = "&#10094;";
  const pagelist = document.getElementById("page-list");
  const pageViewKey = getAnalysisPageViewKey(storagePrefix);

  if (!pagelist) {
    return;
  }

  if (sessionStorage[pageViewKey] === "all") {
    printAnalysisPageListAll(totalPages, storagePrefix, rerenderFunction);
    return;
  }

  if (totalPages <= 1) {
    pagelist.innerHTML = "<ul><li>&nbsp;</li></ul>";
    return;
  }

  let output = "<ul>\n";
  let previousPage = currentPage - 1;
  if (previousPage < 1) {
    previousPage = totalPages;
  }

  output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
  output += " onclick=\"analysisRenderPage('" + storagePrefix + "', " + previousPage + ", '" + rerenderFunction + "');\">";
  output += leftArrow + "</span></li>\n";

  if (currentPage === 1) {
    output += "<li class=\"active\">1</li>\n";
  } else {
    output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
    output += " onclick=\"analysisRenderPage('" + storagePrefix + "', 1, '" + rerenderFunction + "');\">1</span></li>\n";
  }

  if (totalPages > 2) {
    const ellipsis = "&#8943;";
    let needPreDots = 0;
    let needPostDots = 0;

    if (totalPages > 3) {
      if (currentPage > 2) {
        needPreDots = 1;
      }
      if (currentPage < totalPages - 1) {
        needPostDots = 1;
      }
    } else if ((totalPages === 3) && (currentPage !== 2)) {
      if (currentPage === 1) {
        needPostDots = 1;
      } else {
        needPreDots = 1;
      }
    }

    if (needPreDots) {
      output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
      output += " onclick=\"analysisRenderPage('" + storagePrefix + "', " + (currentPage - 1) + ", '" + rerenderFunction + "');\">";
      output += ellipsis + "</span></li>\n";
    }

    if ((currentPage > 1) && (currentPage < totalPages)) {
      output += "<li class=\"active\">" + currentPage + "</li>\n";
    }

    if (needPostDots) {
      output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
      output += " onclick=\"analysisRenderPage('" + storagePrefix + "', " + (currentPage + 1) + ", '" + rerenderFunction + "');\">";
      output += ellipsis + "</span></li>\n";
    }
  }

  if (currentPage === totalPages) {
    output += "<li class=\"active\">" + currentPage + "</li>\n";
  } else {
    output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
    output += " onclick=\"analysisRenderPage('" + storagePrefix + "', " + totalPages + ", '" + rerenderFunction + "');\">";
    output += totalPages + "</span></li>\n";
  }

  let nextPage = currentPage + 1;
  if (nextPage > totalPages) {
    nextPage = 1;
  }

  output += "<li><span style=\"cursor:hand; cursor:pointer;\"";
  output += " onclick=\"analysisRenderPage('" + storagePrefix + "', " + nextPage + ", '" + rerenderFunction + "');\">";
  output += rightArrow + "</span></li>\n";

  output += "<li>";
  output += "<span style=\"cursor:hand; cursor:pointer; letter-spacing:-0.5px;\"";
  output += " onclick=\"analysisSetPageView('" + storagePrefix + "', 'all', '" + rerenderFunction + "');\">view all</span>";
  output += "</li>\n";
  output += "</ul>\n";

  pagelist.innerHTML = output;
}

function printAnalysisPageListAll(totalPages, storagePrefix, rerenderFunction) {
  const pagelist = document.getElementById("page-list");
  let output = "";

  if (!pagelist) {
    return;
  }

  if (totalPages === 1) {
    pagelist.innerHTML = "<ul><li>&nbsp;</li></ul>";
    return;
  }

  output += "<ul><li>";
  output += "<span style=\"cursor:hand; cursor:pointer; letter-spacing:-0.5px;\"";
  output += " onclick=\"analysisSetPageView('" + storagePrefix + "', 'paged', '" + rerenderFunction + "');\">paged view</span>";
  output += "</li></ul>\n";
  pagelist.innerHTML = output;
}

function analysisRenderPage(storagePrefix, page, rerenderFunction) {
  sessionStorage[getAnalysisCurrentPageKey(storagePrefix)] = page;
  if (typeof window[rerenderFunction] === "function") {
    window[rerenderFunction](page);
  }
}

function analysisSetPageView(storagePrefix, view, rerenderFunction) {
  sessionStorage[getAnalysisPageViewKey(storagePrefix)] = view;
  sessionStorage[getAnalysisCurrentPageKey(storagePrefix)] = 1;
  if (typeof window[rerenderFunction] === "function") {
    window[rerenderFunction](1);
  }
}

function getAnalysisGenreOptions(repertory) {
  if (!repertory) {
    return "";
  }

  InitializeWorklist();
  const set = new Set();

  for (let i = 0; i < WORKLIST.length; i++) {
    if (WORKLIST[i].repid !== repertory) {
      continue;
    }
    const works = WORKLIST[i].works || [];
    for (let j = 0; j < works.length; j++) {
      if (works[j].genre) {
        set.add(works[j].genre);
      }
    }
  }

  const genres = Array.from(set).sort();
  let output = "";
  for (let i = 0; i < genres.length; i++) {
    output += '<option value="' + genres[i] + '">' + formatGenreLabel(genres[i]) + '</option>\n';
  }
  return output;
}

function buildSelectionMenus() {
  buildRepertorySelect();
  buildGenreSelect(localStorage.ANALYSISrepertory);
  buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
}

function displayContents(repertory) {
  if (typeof repertory === "undefined" || repertory === null) {
    repertory = localStorage.ANALYSISrepertory || "";
  }

  localStorage.ANALYSISrepertory = repertory;
  buildSelectionMenus();

  const genre = localStorage.ANALYSISgenre || "";
  const work = localStorage.ANALYSISwork || "";

  const repElem = document.getElementById("repertory");
  const genreElem = document.getElementById("genre");
  const workElem = document.getElementById("work");

  if (repElem) {
    repElem.value = repertory || "";
  }
  if (genreElem) {
    genreElem.value = genre || "";
  }
  if (workElem) {
    workElem.value = work || "";
  }

  StylizeFormElements();

  if (workElem && workElem.value) {
    analyzeWork();
  } else if (genreElem && genreElem.value) {
    analyzeGenre();
  } else {
    analyzeRepertory();
  }
}

function buildRepertorySelect() {
  const repertoryselect = document.getElementById("repertory-select");
  if (!repertoryselect) {
    return;
  }

  let output = "";
  output += '<table><tr valign="baseline"><td><span align="left" class="grey" style="margin-top:-36px;" class="text">Choose&nbsp;repertory&nbsp;&nbsp;</span></td><td>';
  output += '<select style="width:230px;" id="repertory" onchange="analyzeRepertory();">\n';
  output += '<option value="">Select a repertory</option>\n';
  output += GetComposerOptions(WORKS || []);
  output += "</select></td></tr></table>\n";
  repertoryselect.innerHTML = output;
}

function buildGenreSelect() {
  const genreselect = document.getElementById("genre-select");
  if (!genreselect) {
    return;
  }

  let output = "";
  output += '<table><tr valign="baseline"><td><span align="left" class="grey" style="margin-top:-36px;" class="text">&nbsp;genre&nbsp;&nbsp;</span></td><td>';
  output += '<select style="width:120px;" id="genre" onchange="analyzeGenre();">\n';
  output += '<option value="">All genres</option>\n';
  output += getAnalysisGenreOptions(localStorage.ANALYSISrepertory || "");
  output += "</select></td></tr></table>\n";
  genreselect.innerHTML = output;
}

function buildWorkSelect(repertory, genre) {
  const workselect = document.getElementById("work-select");
  if (!workselect) {
    return;
  }

  let output = "";
  output += '<table><tr valign="baseline"><td><span align="left" class="grey" style="margin-top:-36px;" class="text">&nbsp;work&nbsp;&nbsp;</span></td><td>';
  output += '<select style="width:320px;" id="work" onchange="analyzeWork();">\n';
  output += '<option value="">All works</option>\n';
  output += GetWorkOptions(repertory, genre || "");
  output += "</select></td></tr></table>\n";
  workselect.innerHTML = output;
}

function analyzeRepertory(repertory) {
  const repElem = document.getElementById("repertory");
  if (typeof repertory === "undefined" || repertory === null) {
    repertory = repElem ? repElem.value : "";
  }

  localStorage.ANALYSISrepertory = repertory || "";
  localStorage.ANALYSISgenre = "";
  localStorage.ANALYSISwork = "";

  buildGenreSelect(localStorage.ANALYSISrepertory);
  buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
  StylizeFormElements();
  if (typeof resetPageState === "function") {
    resetPageState();
  }
  runAnalysis();
}

function analyzeGenre(genre) {
  const genreElem = document.getElementById("genre");
  if (typeof genre === "undefined" || genre === null) {
    genre = genreElem ? genreElem.value : "";
  }

  localStorage.ANALYSISgenre = genre || "";
  localStorage.ANALYSISwork = "";

  buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
  StylizeFormElements();
  if (typeof resetPageState === "function") {
    resetPageState();
  }
  runAnalysis();
}

function analyzeWork() {
  const workElem = document.getElementById("work");
  localStorage.ANALYSISwork = workElem ? workElem.value : "";
  if (typeof resetPageState === "function") {
    resetPageState();
  }
  runAnalysis();
}

function analysisKeyDownFunction(event) {
  if (event.metaKey === 1) {
    return;
  }

  switch (event.keyCode) {
    case DownArrowKey:
    case RightArrowKey:
      if (event.ctrlKey || event.shiftKey) {
        $('#repertory option:selected').next().attr('selected', 'selected');
        localStorage.ANALYSISrepertory = $('#repertory').val();
        displayContents(localStorage.ANALYSISrepertory);
      }
      break;

    case UpArrowKey:
    case LeftArrowKey:
      if (event.ctrlKey || event.shiftKey) {
        $('#repertory option:selected').prev().attr('selected', 'selected');
        localStorage.ANALYSISrepertory = $('#repertory').val();
        displayContents(localStorage.ANALYSISrepertory);
      }
      break;
  }
}
