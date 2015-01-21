//
// Programmer:	 Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Mon Aug 25 15:06:38 PDT 2014
// Last Modified: Thu Oct 30 20:38:36 PDT 2014 Split from scripts.local.html
// Filename:		.../work/listeners.js
// Web Address:	http://josquin.stanford.edu/work/scripts-local.html
// Syntax:		  JavaScript 1.8/ECMAScript 5
// vim:				ts=3: ft=javascript
//
// Description:	JavaScript management of the JRP work pages.
//


//////////////////////////////
//
// document DOMContentLoaded event listener -- This function
//    is called when the document has finished loading.
//

document.addEventListener("DOMContentLoaded", function() {

	AUDIO = document.getElementById("audio");
	AUDIO.addEventListener('ended', function(e) {
		AUDIO.setAttribute("controls", "");
		AUDIO.currentTime = 0;
		AUDIO.pause();
		var pauseelem = document.getElementById(AUDIOid);
		if (!!pauseelem) {
			if (pauseelem.className.match(/mp3/)) {
				pauseelem.className = "mp3play";
			} else {
				pauseelem.className = "play";
			}
		}
	}, false);

	sessionStorage.ERRORsubmitting  = "false";

	var CgiParameters = GetCgiParameters();

	if (typeof CgiParameters['id'] !== "undefined") {
		localStorage.WORKjrpid = CgiParameters['id'];
	} else {
		if (typeof localStorage.WORKjrpid === 'undefined') {
			localStorage.WORKjrpid = "Jos2721";
		}
	}
   JRPID = localStorage.WORKjrpid;

	var pieces = localStorage.WORKjrpid.match(/^([^\-]+)-.*/);
	if (pieces != null) {
		localStorage.WORKjrpid = pieces[1];
	}

	buildComposerSelect();
	buildRepertorySelect();
	buildGenreSelect();

	displayWork(localStorage.WORKjrpid);
	setupSearchOnEnter();

	var analysisbutton1 = document.getElementById("this-work-analysis-button");
	var analysisbutton2 = document.getElementById("all-works-analysis-button");

	analysisbutton1.addEventListener("click", function() {
		displayThisWorkRepertoryAnalyses();
		HideAnalysisRepertory();
	}, false);

	analysisbutton2.addEventListener("click", function() {
		displayAllWorksRepertoryAnalyses();
		ShowAnalysisRepertory();
	}, false);

	if (analysisbutton2.checked) {
		displayAllWorksRepertoryAnalyses();
		ShowAnalysisRepertory();
	} else {
		displayThisWorkRepertoryAnalyses();
		HideAnalysisRepertory();
	}

	// Hide the "All Works" reperotry select menu until the "All Works"
	// radio button has been clicked.
	HideAnalysisRepertory();

   setupTooltips();

}, false);



//////////////////////////////
//
// setupTooltips --
//

function setupTooltips() {

	$('#analysis-help').qtip({
		content: {
			text: 'Click for a short description of the analysis tools.'
		}
	});

	$('#search-help').qtip({
		content: {
			text: 'Click for help on expressing search queries.'
		}
	});

}



//////////////////////////////
//
// HideAnalysisRepertory --
//

function HideAnalysisRepertory() {
	var hiddens = document.querySelectorAll(".analysis-hide");
	var i;
	for (i=0; i<hiddens.length; i++) {
	   hiddens[i].style.visibility = 'hidden';
		hiddens[i].style.height = 0;
		hiddens[i].style.marginTop = '-40px';
	}
}



//////////////////////////////
//
// ShowAnalysisRepertory --
//

function ShowAnalysisRepertory() {
	var hiddens = document.querySelectorAll(".analysis-hide");
	var i;
	for (i=0; i<hiddens.length; i++) {
	   hiddens[i].style.visibility = '';
		hiddens[i].style.height = '';
		hiddens[i].style.marginTop = '-10px';
	}
}



//////////////////////////////
//
// window keydown event listener --
//

window.addEventListener('keydown', function(event) {

	if (event.metaKey) {
		// Don't mess with meta key (command key in OS X)
		return;
	}

	switch (event.keyCode) {

		case CKey:
			if (($(event.target).is('input') && event.ctrlKey) || 
					!$(event.target).is('input')) {
				ClearWorklistCache();
			}
			break;

		case DKey:
			if (($(event.target).is('input') && event.ctrlKey) || 
					!$(event.target).is('input')) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				event.preventDefault();
				event.stopPropagation();
				toggleRangeByDuration();
			}
			break;

		case IKey:
			if (($(event.target).is('input') && event.ctrlKey) || 
					!$(event.target).is('input')) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				event.preventDefault();
				event.stopPropagation();
				toggleIncipitDisplay();
			}
			break;

		case RKey:
			if (($(event.target).is('input') && event.ctrlKey) || 
					!$(event.target).is('input')) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				event.preventDefault();
				event.stopPropagation();
				toggleRangeDisplay();
			}
			break;

		case SKey:
			if (($(event.target).is('input') && event.ctrlKey) || 
					!$(event.target).is('input')) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				event.preventDefault();
				event.stopPropagation();
				toggleTitleType();
			}
			break;

		case RightArrowKey:
			if (event.shiftKey) {
				if (event.ctrlKey) {
					displayNextRepertoryPage();
				} else {
					displayNextWorkPage();
				}
			}
			break;

		case LeftArrowKey:
			if (event.shiftKey) {
				if (event.ctrlKey) {
					displayPreviousRepertoryPage();
				} else {
					displayPreviousWorkPage();
				}
			}
			break;

		case UpArrowKey:
			if (event.shiftKey) {
				if (!SECTIONS || SECTIONS.length < 2) {
					break;
				}

				var i;
				var si = -1;
				for (i=0; i<SECTIONS.length; i++) {
					if (SECTIONS[i].id == localStorage.WORKjrpid) {
						si = i;
						break;
					}
				}

				var ocount = SECTIONS.length;
				var current = si;

				// display previous section of multisection work
				if (si < 0) {
					var ocount = $('select#select-section option').length;
					var current = $('select#select-section option:selected').index();
				}
				current--;
				if (current < 0) {
					current = ocount - 1;
				}
				var sectionid = SECTIONS[current].id;
				$('select#select-section').prop('selectedIndex', current);
				if (SECTIONS && (MENUINDEX == 0)) {
					var downloads = document.getElementById("downloads");
					if (downloads) {
						downloads.textContent = "";
					}
				}
				displaySection(sectionid);
				StylizeFormElements();

			}
			break;

		case DownArrowKey:
			if (event.shiftKey) {
				displayNextSection();
			}
			break;

		case OneKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(1);
			break;

		case TwoKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(2);
			break;

		case ThreeKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(3);
			break;

		case FourKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(4);
			break;

		case FiveKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(5);
			break;

		case SixKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(6);
			break;

		case SevenKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(7);
			break;

		case EightKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(6);
			break;

		case NineKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			displaySectionNumber(9);
			break;

		case PKey:
			if ($(event.target).is('input') && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			PlayAudioFile(localStorage.WORKjrpid, document.getElementById("audio_" + localStorage.WORKjrpid));
			break;

		case SpaceKey:
			if ($(event.target).is('input') && (!event.shiftKey) && (!event.ctrlKey)) {
				// Ignore space command if typing input
				// Use shift-space in that case to stop.
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			if (!AUDIO) {
				break;
			}
			if (!AUDIOid) {
				break;
			}
			if (AUDIO.paused) {
				var audiobutton = document.getElementById(AUDIOid);
				if (!!audiobutton) {
					if (audiobutton.className.match(/mp3/)) {
						audiobutton.className = "mp3pause";
					} else {
						audiobutton.className = "pause";
					}
				}
				AUDIO.play();
			} else {
				var audiobutton = document.getElementById(AUDIOid);
				if (!!audiobutton) {
					if (audiobutton.className.match(/mp3/)) {
						audiobutton.className = "mp3play";
					} else {
						audiobutton.className = "play";
					}
				}
				AUDIO.pause();
			}
			return false;
			break;

		case HomeKey:
			if (event.shiftKey) {
				InitializeWorklist();
				localStorage.WORKjrpid = WORKLIST[0].works[0].id;
				displayWork(localStorage.WORKjrpid);
				return false;
			}
			break;

		case EndKey:
			if (event.shiftKey) {
				InitializeWorklist();
				localStorage.WORKjrpid = WORKLIST[WORKLIST.length-1]
					.works[WORKLIST[WORKLIST.length-1].works.length-1].id;
				displayWork(localStorage.WORKjrpid);
				return false;
			}
			break;

	}
});



