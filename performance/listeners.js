//
// Programmer:		Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Thu Aug 21 12:59:01 PDT 2014
// Last Modified: Thu Oct 30 21:36:07 PDT 2014 Split from scripts.local.html
// Filename:		.../browse/listeners.js
// Web Address:	http://josquin.stanford.edu/browse/listeners.js
// Syntax:			JavaScript 1.8/ECMAScript 5
// vim:				ts=3: ft=javascript
//
// Description:	Event listeners for the Browse page.
//


//////////////////////////////
//
// DOMContentLoaded event listener -- automatic setup of the page 
//    after everything has been loaded.
//

document.addEventListener("DOMContentLoaded", function() {

	AUDIO = document.getElementById("audio");
	AUDIO.addEventListener('ended', function(e) {
		AUDIO.pause();
		var pauseelem = document.getElementById(AUDIOid);
		pauseelem.className = "play";
	}, false);

	buildComposerSelect();
	buildGenreSelect();
	buildVoiceSelect();
	createJoaJobLists();

	if (typeof sessionStorage.BROWSEshowjrpid === 'undefined') {
		sessionStorage.BROWSEshowjrpid = "false";
	}

	var CgiParameters = GetCgiParameters();

	var home = CgiParameters['home'];
	if (typeof home === 'undefined') {
		home = sessionStorage.BROWSEhome;
	}
	if (typeof home === 'undefined') {
		home = "false";
	}

	var text = CgiParameters['text'];
	if (text) {
		home = "true";
		OnlyText = 1;
	}
	if (window.location.pathname.match(/performance/)) {
		home = "true";
		OnlyText = 1;
	}

	var composers = document.getElementById("composers");
	if (home == "true") {
		composers.value = "default";
	} else if (CgiParameters['c'] != null) {
		composers.value = CgiParameters['c'];
	} else if (sessionStorage.BROWSEcomposers != "") {
		composers.value = sessionStorage.BROWSEcomposers;
	}

	var genres = document.getElementById("genres");
	if (home == "true") {
		genres.value = "default";
	} else if (CgiParameters['g'] != null) {
		genres.value = CgiParameters['g'];
	} else if (sessionStorage.BROWSEgenres != "") {
		genres.value = sessionStorage.BROWSEgenres;
	}

	var voices = document.getElementById("voices");
	if (home == "true") {
		voices.value = "default";
	} else if (CgiParameters['v'] != null) {
		voices.value = CgiParameters['v'];
	} else if (sessionStorage.BROWSEvoices != "") {
		voices.value = sessionStorage.BROWSEvoices;
	}

	var titlebox = document.getElementById("titlebox");
	if (home == "true") {
		titlebox.value = "";
	} else if (typeof CgiParameters['t'] !== 'undefined') {
		titlebox.value = CgiParameters['t'];
	} else if (typeof sessionStorage.BROWSEtitlebox !== 'undefined') {
		titlebox.value = sessionStorage.BROWSEtitlebox;
	}

	if (home == "true") {
		var composers = document.getElementById("composers");
		composers.value = "All Composers";
		displayAboutBrowse();
		StylizeFormElements();
		return;
	}

	StylizeFormElements();

	if (home == "census") {
		showCensusInfo();
		return;
	}

	browseDisplay(1);

}, true);



//////////////////////////////
//
// window keydown event listener --
//

window.addEventListener('keydown', function(event) {

	if (event.keyCode == ControlKey) {
		ControlKeyState = 1;
	} else if (event.keyCode == ShiftKey) {
		ShiftKeyState = 1;
	} else if (event.keyCode == AltKey) {
		AltKeyState = 1;
	} else if (event.keyCode == CommandLeftKey) {
		CommandKeyState = 1;
	} else if (event.keyCode == CommandRightKey) {
		CommandKeyState = 1;
	}
  
	// don't process any command- key combinations.
	if (CommandKeyState == 1) {
		return;
	}

	var titlebox = document.getElementById("titlebox");

	switch (event.keyCode) {
		case AKey:
			if (ControlKeyState) {
				if (sessionStorage.BROWSEpageview == "all") {
					sessionStorage.BROWSEpageview = "paged";
					browseDisplay(1);
				} else {
					sessionStorage.BROWSEpageview = "all";
					browseDisplay(1);
				}
			}
			break;

		case JKey:
			if (ControlKeyState) {
				if (typeof sessionStorage.BROWSEshowjrpid === 'undefined') {
					sessionStorage.BROWSEshowjrpid = "false";
				}
				if (sessionStorage.BROWSEshowjrpid == "false") {
					sessionStorage.BROWSEshowjrpid = "true";
				} else {
					sessionStorage.BROWSEshowjrpid = "false";
				}
				browseDisplay();
			}
			break;

		case RightArrowKey:
		case DownArrowKey:
			if (ControlKeyState || ShiftKeyState) {
				displayNextPage();
			}
			break;
		case LeftArrowKey:
		case UpArrowKey:
			if (ControlKeyState || ShiftKeyState) {
				displayPreviousPage();
			}
			break;
		case PageUpKey:
			displayPreviousPage();
			break;
		case PageDownKey:
			displayNextPage();
			break;
		case HomeKey:
			displayFirstPage();
			break;
		case EndKey:
			displayLastPage();
			break;

		case EqualsKey:	// (include Plus key which is shift-EqualsKey):
			if (ControlKeyState) {
				var value = parseInt(sessionStorage.BROWSEpagesize);
				sessionStorage.BROWSEpagesize = value + 1;
				displayFirstPage();
			}
			break;
		case MinusKey:	   // decrease search results table entries by one
			if (ControlKeyState) {
				var value = parseInt(sessionStorage.BROWSEpagesize);
				if (value <= 1) {
					value = 1;
				} else {
					value = value - 1;
				}
				sessionStorage.BROWSEpagesize = value;
				sessionStorage.SEARCHcurrentpage = 1;
				displayFirstPage();
			}
			break;

		case BackspaceKey:
		case DeleteKey:
			if (ControlKeyState == 1) {
				titlebox.value = '';
				browseDisplay(1);
			}
			break;

		case NKey:
			if (ControlKeyState == 1) {
				CountInfo = !CountInfo;
				if (CountInfo && (WORKCOUNT > 0)) {
					showCountInfo();
				} else if (!CountInfo) {
					hideCountInfo();
				}
			}
			break;

		case TKey:
			if (ControlKeyState == 1) {
				TextInfo = !TextInfo;
				if (TextInfo) {
					console.log("Text underlay markers turned on.");
				} else {
					console.log("Text underlay markers turned off.");
				}
				browseDisplay();
			}
			break;

	}

	// Maybe remove ShiftKeyState from list:
	if (!(ControlKeyState || ShiftKeyState || AltKeyState || CommandKeyState)) {
		if ((event.keyCode >= AKey && event.keyCode <= ZKey)) {
			if (titlebox != document.activeElement) {
				var character = String.fromCharCode(event.keyCode);
				if (!ShiftKeyState) {
					character = character.toLowerCase();
				}
				titlebox.value += character;
				browseDisplay(1);
			}
		} else if (titlebox != document.activeElement) {
			// What to do out of titlebox focus
			switch (event.keyCode) {
				case SpaceKey:
					titlebox.value += String.fromCharCode(event.keyCode);
					break;
				case DeleteKey:
				case BackspaceKey:
					var str = titlebox.value;
					titlebox.value = str.slice(0, -1);
					browseDisplay(1);
					event.preventDefault();
					event.stopPropagatin();
				// add apostrophe here...
			}
		}
	}

}
);



//////////////////////////////
//
// Process window key ups --
//

window.onkeyup = function(event) {

	if (event.keyCode == ControlKey) {
		ControlKeyState = 0;
	} else if (event.keyCode == ShiftKey) {
		ShiftKeyState = 0;
	} else if (event.keyCode == AltKey) {
		AltKeyState = 0;
	} else if (event.keyCode == CommandLeftKey) {
		CommandKeyState = 0;
	} else if (event.keyCode == CommandRightKey) {
		CommandKeyState = 0;
	}
}



//////////////////////////////
//
// Prevent backspace from being interpreted by the web browser:
//
// Maybe deal with by using: event.preventDefault() in window
//	  key processing code.
//

trapfunction = function(event) {
	if (event.keyCode == BackspaceKey) {
		var titlebox = document.getElementById("titlebox");
		var str = titlebox.value;
		titlebox.value = str.slice(0, -1);
		event.preventDefault();
		event.stopPropagation();
		return false;
	}

	return event;
}
document.addEventListener('keydown',  trapfunction); // Most browsers
document.addEventListener('keypress', trapfunction); // Opera browser



