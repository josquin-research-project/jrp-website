//
// Programmer:		Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date:	Thu Sep 18 16:54:01 PDT 2014
// Last Modified:	Thu Sep 18 16:54:04 PDT 2014
// Filename:		.../analysis/scripts-common.html
// Web Address:	http://josquin.stanford.edu/analysis/scripts-common.html
// Syntax:			JavaScript 1.8/ECMAScript 5
// vim:				ts=3: ft=javascript
//
// Description:	JavaScript management of the JRP repertory/genre/work 
//					 selection for analyses.
//


if (typeof localStorage.ANALYSISrepertory === 'undefined') {
   localStorage.ANALYSISrepertory = "";
} else if (localStorage.ANALYSISrepertory == "Select a repertory") {
   localStorage.ANALYSISrepertory = "";
}

if (typeof localStorage.ANALYSISgenre === 'undefined') {
   localStorage.ANALYSISgenre = "";
} else if (localStorage.ANALYSISgenre == "All genres") {
   localStorage.ANALYSISgenre = "";
}

if (typeof localStorage.ANALYSISwork === 'undefined') {
   localStorage.ANALYSISwork = "";
} else if (localStorage.ANALYSISwork == "All works") {
   localStorage.ANALYSISwork = "";
}



//////////////////////////////
//
// loadCgiParameters --
//

function loadCgiParameters() {
	var CgiParameters = null;
	if (CgiParameters === null) {
		CgiParameters = GetCgiParameters();
	}
	if (typeof CgiParameters['repertory'] !== "undefined") {
		localStorage.ANALYSISrepertory = CgiParameters['repertory'];
	}
	if (typeof CgiParameters['genre'] !== "undefined") {
		localStorage.ANALYSISgenre = CgiParameters['genre'];
	}
	if (typeof CgiParameters['repertory'] !== "undefined") {
		localStorage.ANALYSISwork = CgiParameters['work'];
	}
}



//////////////////////////////
//
// buildSelectionMenus --
//

function buildSelectionMenus() {
	buildRepertorySelect();
	buildGenreSelect(localStorage.ANALYSISrepertory);
	buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
}



//////////////////////////////
//
// displayContents -- Load an analysis set based on the selected repertory.
//

function displayContents(repertory) {
	if ((typeof repertory === 'undefined') || (repertory == "")) {
		repertory = localStorage.ANALYSISrepertory;
		if (typeof repertory === 'undefined') {
			repertory = "";
		}
	}
	localStorage.ANALYSISrepertory = repertory;
	buildSelectionMenus();
	
	var genre = localStorage.ANALYSISgenre;
	var work = localStorage.ANALYSISwork;

	if (typeof genre === 'undefined') {
		genre = "";
		localStorage.ANALYSISgenre = "";
	}
	if (typeof work === 'undefined') {
		work = "";
		localStorage.ANALYSISwork = "";
	}

	if (!repertory.match(/^\s*$/)) {
		$('#repertory').val(repertory);
	} else {
		$('#repertory').val("default");
	}

	if (!genre.match(/^\s*$/)) {
		$('#genre').val(genre);
	} else {
		$('#genre').val("default");
	}

	if (!work.match(/^\s*$/)) {
		$('#work').val(work);
	} else {
		$('#work').val("default");
	}

   var genre = document.getElementById("genre");
   var work  = document.getElementById("work");

   if (genre.value == "") {
      genre.value = "default";
   }
   if (work.value == "") {
      work.value = "default";
   }

	UpdateEzMark();

	if (work != "") {
		analyzeWork();
	} else if (genre != "") {
		analyzeGenre();
	} else {
		analyzeRepertory();
	}
}



//////////////////////////////
//
// buildRepertorySelect
//

function buildRepertorySelect() {
	var repertoryselect = document.getElementById("repertory-select");
	if (repertoryselect == null) {
		return;
	}

	var output = "";
	output += "<table><tr valign=\"baseline\"><td><span align=\"left\"";
	output += " class=\"grey\" style=\"margin-top:-36px;\"";
	output += " class=\"text\">Choose&nbsp;repertory&nbsp;&nbsp;</td><td>";
	output += "<select style=\"width:230px;\" id=\"repertory\">\n";
	output += "<option label=\"default\">Select a repertory</option>\n";
	var clist = GetComposerOptions();
	output += clist;
	output += "</select></td></tr></table>\n";
	repertoryselect.innerHTML = output;
	if ((typeof localStorage.ANALYSISrepertory !== 'undefined') &&
			!localStorage.ANALYSISrepertory.match(/^\s*$/)) {
		$('#genre option[value=\"" + localStorage.ANALYSISrepertory + "\"]')
				.attr('selected', 'selected');
	}
	UpdateEzMark();
}



//////////////////////////////
//
// buildRepertoryGenreSelect --
//

function buildGenreSelect() {
	var repertoryselect = document.getElementById("genre-select");
	if (repertoryselect == null) {
		return;
	}

	var output = "";
	output += "<table><tr valign=\"baseline\"><td><span align=\"left\"";
	output += " class=\"grey\" style=\"margin-top:-36px;\"";
	output += " class=\"text\">&nbsp;genre&nbsp;&nbsp;</td><td>";
	output += "<select style=\"width:120px;\" id=\"genre\">\n";
	output += "<option label=\"default\">All genres</option>\n";
	var glist = GetGenreOptions(localStorage.ANALYSISrepertory);
	output += glist;
	output += "</select></td></tr></table>\n";
	repertoryselect.innerHTML = output;
	if ((typeof localStorage.ANALYSISgenre !== 'undefined') &&
			!localStorage.ANALYSISgenre.match(/^\s*$/)) {
		$('#genre option[value=\"" + localStorage.ANALYSISgenre + "\"]')
				.attr('selected', 'selected');
	}
	UpdateEzMark();
}



//////////////////////////////
//
// buildWorkSelect --
//

function buildWorkSelect(repertory, genre) {
	var workselect = document.getElementById("work-select");
	if (workselect == null) {
		return;
	}

	var output = "";
	output += "<table><tr valign=\"baseline\"><td>";
	output += "<span align=\"left\" class=\"grey\" style=\"margin-top:-36px;\"";
	output += " class=\"text\">&nbsp;work&nbsp;&nbsp;</td><td>";
	output += "<select style=\"width:430px;\" id=\"work\">\n";
	output += "<option label=\"default\">All works</option>\n";
	var clist = GetWorkOptions(repertory, genre);
	output += clist;
	output += "</select></td></tr></table>\n";
	workselect.innerHTML = output;
	if ((typeof localStorage.ANALYSISwork !== 'undefined') &&
			!localStorage.ANALYSISwork.match(/^\s*$/)) {
		$('#work option[value=\"" + localStorage.ANALYSISwork + "\"]')
				.attr('selected', 'selected');
	}
	UpdateEzMark();
}



//////////////////////////////
//
// analyzeRepertory --
//

function analyzeRepertory(repertory) {
	if ((typeof repertory === 'undefined') || (repertory == "")) {
		repertory = document.getElementById("repertory").value;
	}
	if (!repertory.match(/Select a repertory/)) {
		localStorage.ANALYSISrepertory = repertory;
	} else {
		repertory = "";
	}

	localStorage.ANALYSISgenre = "";
	localStorage.ANALYSISwork = "";
	buildGenreSelect(localStorage.ANALYSISrepertory);
	buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
	runAnalysis();
}



//////////////////////////////
//
// analyzeGenre --
//

function analyzeGenre(genre) {
	if ((typeof genre === 'undefined') || (repertory == "")) {
		genre = document.getElementById("genre").value;
	}
	if (!genre.match(/All genres/)) {
		localStorage.ANALYSISgenre = genre;
	} else {
		genre = "";
	}

	localStorage.ANALYSISwork = "";
	buildWorkSelect(localStorage.ANALYSISrepertory, localStorage.ANALYSISgenre);
	runAnalysis();
}



//////////////////////////////
//
// analyzeWork --
//

function analyzeWork(genre) {
	if ((typeof genre === 'undefined') || (repertory == "")) {
		genre = document.getElementById("genre").value;
	}
	if (!genre.match(/All genres/)) {
		localStorage.ANALYSISgenre = genre;
	} else {
		genre = "";
	}

	runAnalysis();
}



//////////////////////////////
//
// process Window keys down:
//

function analysisKeyDownFunction(event) {
	// don't process any command- key combinations.
	if (event.metaKey == 1) {
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



