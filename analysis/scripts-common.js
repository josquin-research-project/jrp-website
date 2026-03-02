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
  runAnalysis();
}

function analyzeWork() {
  const workElem = document.getElementById("work");
  localStorage.ANALYSISwork = workElem ? workElem.value : "";
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
