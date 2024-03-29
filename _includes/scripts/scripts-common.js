

<script>
//
// Programmer:    Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Thu Aug 21 12:59:01 PDT 2014
// Last Modified: Mon Sep  1 22:01:13 PDT 2014
// Filename:      _includes/scripts/scripts-common.js
// Web Address:   https://josquin.stanford.edu/scripts/scripts-common.js
// Syntax:        JavaScript 1.8/ECMAScript 5
// vim:				ts=3: ft=javascript
//
// Description:   JRP-specific JavaScript functions common to all pages.
//

// GLOBAL VARIABLES:
var WORKLIST;										 // Master index of works in JRP database.
var WORKLISTrecent = [];						 // List of works reverse sorted by add date.
var WORKLISTjrpid  = {};						 // Hash of works by JRP ID.
var BASEADDR       = window.location.host; // Base address of URL.
var TARGET         = "_blank";             // target for new things
var PDFTARGET      = TARGET;					 // Display PDF files in separate tab/window.
var AUDIO          = null;						 // HTML5 audio interface ID.
var AUDIOjrpid     = '';  						 // currently playing audio file.
var AUDIOid        = '';                   // currently playing audio button.


// List of Key Codes.  More can be extracted from this page:
// https://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
const AKey            = 65; // Letters
const BKey            = 66;
const CKey            = 67;
const DKey            = 68;
const EKey            = 69;
const FKey            = 70;
const GKey            = 71;
const HKey            = 72;
const IKey            = 73;
const JKey            = 74;
const KKey            = 75;
const LKey            = 76;
const MKey            = 77;
const NKey            = 78;
const OKey            = 79;
const PKey            = 80;
const QKey            = 81;
const RKey            = 82;
const SKey            = 83;
const TKey            = 84;
const UKey            = 85;
const VKey            = 86;
const WKey            = 87;
const XKey            = 88;
const YKey            = 89;
const ZKey            = 90;
const ZeroKey         = 48; // Numbers
const OneKey          = 49;
const TwoKey          = 50;
const ThreeKey        = 51;
const FourKey         = 52;
const FiveKey         = 53;
const SixKey          = 54;
const SevenKey        = 55;
const EightKey        = 56;
const NineKey         = 57;
const BackspaceKey    =  8; // Other
const TabKey          =  9;
const EnterKey        = 13;
const EscKey          = 27;
const SpaceKey        = 32;
const EqualsKey       = 187;
const MinusKey        = 189;
const PageUpKey       = 33;
const PageDownKey     = 34;
const EndKey          = 35;
const HomeKey         = 36;
const DeleteKey       = 46;
const ControlKey      = 17; // State keys
const AltKey          = 18;
const ShiftKey        = 16;
const CommandLeftKey  = 91; // or Window key in MSWindows, and Meta key in Unix
const CommandRightKey = 93;
const F1Key           = 112; // Function keys
const F2Key           = 113;
const F3Key           = 114;
const F4Key           = 115;
const F5Key           = 116;
const F6Key           = 117;
const F7Key           = 118;
const F8Key           = 119;
const F9Key           = 120;
const F10Key          = 121;
const SlashKey        = 191;
const SquareLeftKey   = 219;
const SquareRightKey  = 221;

// Arrows:
const UpArrowKey      = 38;    // maybe also 30 & 57373
const DownArrowKey    = 40;    // maybe also 31 & 57374
const LeftArrowKey    = 37;    // maybe also 28 & 57375
const RightArrowKey   = 39;    // maybe also 29 & 57376



//////////////////////////////
//
// InitializeWorklist -- manages setup of the WORKLIST object which 
//    contains a list of the works in the database categorized by composer.
//    If the WORKLIST object is already generated, then do nothing (so call
//    this function whenever the WORKLIST is needed).  Otherwise, the WORKLIST
//    data will be downloaded from the server, typically from 
//    /include/worklist.json.
//

function InitializeWorklist() {
/*
   if (WORKLIST != null) {
      return;
   }

   // Eventually request a timestamp from the server, and compare
   // to WORKLIST store in localStorage, and only re-download if the
   // server has a newer WORKLIST.  For now, update once a day.
   var refreshtime = 3600 * 1;  // update once an hour
   var currenttime = parseInt(new Date() / 1000);  // convert from ms to sec.

   if ((typeof localStorage.WORKLISTrefreshtime !== 'undefined') && 
       (localStorage.WORKLISTrefreshtime < currenttime)) {
      localStorage.WORKLIST = null;
   }

   if ((typeof localStorage.WORKLIST === 'undefined') ||
         (localStorage.WORKLIST == 'null') || (localStorage.WORKLIST == '')) {
      // need to download the WORKLIST data from the server.
      localStorage.WORKLIST = ReadFile('/includes/worklist.json');
      if (localStorage.WORKLIST.match(/^\s*$/)) {
         localStorage.WORKLIST = ReadFile('/data?a=worklist-json'); 
      }
      WORKLIST = JSON.parse(localStorage.WORKLIST);
      localStorage.WORKLISTrefreshtime = currenttime + refreshtime;
   } else {
      // already have the worklist in local storage, so read from there.
      WORKLIST = JSON.parse(localStorage.WORKLIST);
   }
*/
}



//////////////////////////////
//
// InitializeWorklistFlat -- Create a flattened list of works.  Two 
//    (global) objects will be created from the WORKLIST object: 
//    (1) WORKLISTrecent -- an array which is a list of works 
//        reverse-sorted by date added.   Also stored in 
//        sessionStorage.WORKLISTrecent.
//    (2) WORKLISTjrpid -- an object which contains works indexed by
//    JRP ID.  Also stored in sessionStorage.WORKLISTjrpid.
//

function InitializeWorklistFlat() {
/*

console.log("IN INITIALIZEWORKLISTFLAT");
   if ((WORKLISTrecent != null) && (WORKLISTrecent.length != 0)) {
      // WORILISTjrpid is presumed to be in a similar state.
      return;
   }

   InitializeWorklist();

   WORKLISTrecent = [];
   WORKLISTjrpid  = {};

   var i;
   var works;
   var jrpid;

   for (i=0; i<WORKLIST.length; i++) {
      works = WORKLIST[i].works;
      for (j=0; j<works.length; j++) {
         if (typeof works[j].comshort === 'undefined') {
            works[j].comshort = WORKLIST[i].comshort;
         }
         WORKLISTrecent.push(works[j]);
         jrpid = works[j].id;
         WORKLISTjrpid[jrpid] = works[j];
      }
   }

   WORKLISTrecent.sort(byReverseAddDate);
*/
}



//////////////////////////////
//
// byReverseAddDate -- sort a work by reverse add date.
//


function byReverseAddDate(a, b) {
   var date1 = a.ud;
   var date2 = b.ud;

	if (!date1) { date1 = a.ad; }
	if (!date2) { date2 = b.ad; }
	if (!date1) { date1 = 0; }
	if (!date2) { date2 = 0; }
   if (date1 > date2) { return -1; } 
   if (date1 < date2) { return +1; }
   if (a.id  < b.id)  { return -1; }
   if (a.id  > b.id)  { return +1; }

   return 0;
}



//////////////////////////////
//
// GetDataFile -- download a data file from the server and keep it for
//    use later.
//

function GetDataFile(jrpid, prefix, action) {
   var variable = prefix + jrpid;

   if (typeof localStorage[variable] != 'undefined') {
      return localStorage[variable];
   }
   
   InitializeWorklistFlat();

   // Get the first section's incipit if a multi-section work:
   var pieces = jrpid.match(/^([A-Z][a-z][a-z]\d{4}[.\d]*)([a-z]*.*)/);
   var workid = pieces[1];
   var work = WORKLISTjrpid[workid];
   if (work == null) {
      work = WORKLISTjrpid[workid + pieces[2]];
   }
   if (work == null) {
      console.log('Error: ' + workid + ' not in WORKLISTjrpid.');
      return;
   }
   var i;
   if (typeof work.sections === 'undefined') {
      jrpid = workid;
   }

   // content is not in localStorage, so download, store, and return.
   var imagedata = ReadFile('https://' + BASEADDR + '/data?a=' + action + '&f=' + jrpid);
   localStorage[variable] = imagedata;
   return imagedata;
}



//////////////////////////////
//
// GetDataFileAsync -- get a data file asynchronously.
//

function GetDataFileAsync(jrpid, prefix, action, callback) {
   var variable = prefix + jrpid;

   if (typeof localStorage[variable] != 'undefined') {
      return localStorage[variable];
   }
   
   InitializeWorklistFlat();

   // Get the first section's incipit if a multi-section work:
   var pieces = jrpid.match(/^([A-Z][a-z][a-z]\d{4}[.\d]*)([a-z]*.*)/);
   var workid = pieces[1];
   var work = WORKLISTjrpid[workid];
   if (work == null) {
      work = WORKLISTjrpid[workid + pieces[2]];
   }
   if (work == null) {
      console.log('Error2: ' + workid + ' not in WORKLISTjrpid.');
      return;
   }
   var i;
   if (typeof work.sections === 'undefined') {
      jrpid = workid;
   }

   // content is not in localStorage, so download, store, and return.
   ReadFileAsync('https://' + BASEADDR + '/data?a=' + action + '&f=' + jrpid, callback);
   //localStorage[variable] = imagedata;
   // return imagedata;
}



//////////////////////////////
//
// ReadFile -- Download URL content which is returned as a string.
//      The URL must be on the same domain as index.html due to
//      JavaScript Same-Origin policy:
//         https://en.wikipedia.org/wiki/Same-origin_policy
// XMLHttpRequest object:
//         https://www.w3.org/TR/2007/WD-XMLHttpRequest-20070618
//         https://xhr.spec.whatwg.org
//         
//         See:
//  https://codingforums.com/ajax-design/123705-make-script-wait-until-request-comes-back.html
//

function ReadFile(url) {
   var request = new XMLHttpRequest();

   request.open('GET', url, false);
   request.send(null);

   var string = request.responseText;
   if ((string.length < 1000) && string.match(/Not Found/)) {
      return '';
   } else {
      return request.responseText;
   }
}



function ReadFileAsync(url, callback) {
console.log("READFILEA SYN", url, "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
   var request = new XMLHttpRequest();
   request.open('GET', url, true);
   request.onload = function (e) {
      if (this.readyState == 4) {
         callback(this.responseText);
      }
   };
   request.onerror = function(e) {
      console.error(request.statusText);
   };
   request.send(null);
}



//////////////////////////////
//
// GetCgiParameters -- Returns an associative array containing the
//     page's URL's CGI parameters
//

function GetCgiParameters() {
   var url = window.location.search.substring(1);
   var output = {};
   var settings = url.split('&');
   for (var i=0; i<settings.length; i++) {
      var pair = settings[i].split('=');
      pair[0] = decodeURIComponent(pair[0]);
      pair[1] = decodeURIComponent(pair[1]);
      if (typeof output[pair[0]] === 'undefined') {
         output[pair[0]] = pair[1];
      } else if (typeof output[pair[0]] === 'string') {
         var arr = [ output[pair[0]], pair[1] ];
         output[pair[0]] = arr;
      } else {
         output[pair[0]].push(pair[1]);
      }
   }
   return output;
}




//////////////////////////////
//
// GetComposerOptions -- Return an option list of composers in the worklist.
//    This is used to fill in the Composer/Repertory section list in forms
//    on various webpages.
//

function GetComposerOptions(worklist) {
   let output = '';
	let longNames = {}; // Long names of composers indexed by COMPOSER_ID
	let counts = {};    // Number of scores for a composer indexed by COMPOSER_ID

	// First count all of the works by composer, and
	// build a database of the composer long names indexed
	// by the COMPOSER_ID.  A complication is that there may
	// be more than one composer for a musical score (such as
	// one primary composer, and another who writes an extra voice).
	for (let i=0; i<worklist.length; i++) {
		let entry = worklist[i];
		let cid = entry.COMPOSER_ID.trim();
		let matches = cid.match(';');
		if (matches) {
			let pieces = cid.split(/\s*;\s*/);
			cid = pieces;
		} else {
			cid = [ cid ];
		}

		// let longName = entry.Composer.trim().replace(/[{}]/g, '');
		let longName = entry.COM.trim();
		matches = longName.match(';');
		if (matches) {
			let pieces = longName.split(/\s*;\s*/);
			longName = pieces;
		} else {
			longName = [ longName ];
		}

		for (let j=0; j<cid.length; j++) {
			longNames[cid[j]] = longName[j];
			if (typeof counts[cid[j]] === 'undefined') {
				counts[cid[j]] = 1;
			} else {
				counts[cid[j]]++;
			}
		}
	}

	// Sort the list of composers, placing Anonymous
	// at the end of the list.
	let keys = Object.keys(counts);
	keys.sort(function(a, b) {
		let name1 = longNames[a];
		let name2 = longNames[b];
		if (name1 === "Anonymous") {
			return +1;
		}
		if (name2 === "Anonymous") {
			return -1;
		}
		name1.localeCompare(name2);
	});
	
   for (let i=0; i<keys.length; i++) {
      let cid = keys[i];
      let longName = longNames[cid];
		let count = counts[cid];
      output += `<option value="${cid}">${longName} (${count})</option>\n`;
      if (cid == 'Jos') {
         output += '<option value="Joa">Josquin&nbsp;(secure)</option>\n';
         output += '<option value="Job">Josquin&nbsp;(probable)</option>\n';
         output += '<option value="Joc">Josquin&nbsp;(improbable)</option>\n';
         output += '<option value="Jod">Josquin&nbsp;(implausible)</option>\n';
      }
   }
   return output;
}



//////////////////////////////
//
// GetGenreOptions -- Return an option list of genres.  
//     This is used to fill in the Composer/Repertory section list 
//     in forms on various webpages.  If there is an input repe
//     Mass, Motet, or Song.
//

function GetGenreOptions(repertory) {
   if ((typeof repertory === 'undefined') || 
			(repertory == null) || (repertory == '')) {
	   // Avoiding displaying the genre list without a repertory.
	   // This is because analyses mostly need to be limited to a single repertory
	   // So that not too many images are shown on the same page.
		var opts = '<option value="mass">Masses</option>\n';
		opts += '<option value="motet">Motets</option>\n';
		opts += '<option value="song">Songs</option>\n';
      return opts;
   }

   InitializeWorklist();
   var output = '';
   var longname;
   var abbr;
   var i, j;
   var rep;
   var gen;

   var genlist1 = {};

   for (i=0; i<WORKLIST.length; i++) {
		rep = WORKLIST[i].repid;
		if (!repertory.match(/^\s*$/) && (!rep.match(repertory))) {
			continue;
		}
      gen = WORKLIST[i].genres;
      for (j=0; j<gen.length; j++) {
			genlist1[gen[j].name] = gen[j].name;
		}
	}
   var genlist2 = [];
   for (entry in genlist1) genlist2.push(entry);
	genlist2.sort();

	var output = '';
   for (i=0; i<genlist2.length; i++) {
      output += '<option value="' + genlist2[i] + '">';
	   if (genlist2[i].match('mass')) {
			output += 'Masses';
	   } else if (genlist2[i].match('motet')) {
			output += 'Motets';
	   } else if (genlist2[i].match('song')) {
			output += 'Songs';
		} else {
			output += genlist2[i];
		}
		output += '</option>\n';
   }
   return output;
}



//////////////////////////////
//
// GetGenreBrowseOptions -- Return an option list of genres.  
//     This is used to fill in the Composer/Repertory section list 
//     in forms on various webpages.  If there is an input repe
//     Mass, Motet, or Song.
//

function GetGenreBrowseOptions() {
   InitializeWorklist();
   var output = '';
   var longname;
   var abbr;
   var i, j;
   var rep;
   var gen;

   var genlist1 = {};

   for (i=0; i<WORKLIST.length; i++) {
		rep = WORKLIST[i].repid;
      gen = WORKLIST[i].genres;
      for (j=0; j<gen.length; j++) {
			genlist1[gen[j].name] = gen[j].name;
		}
	}
   var genlist2 = [];
   for (entry in genlist1) genlist2.push(entry);
	genlist2.sort();

	var output = '';
   for (i=0; i<genlist2.length; i++) {
      output += '<option value="' + genlist2[i] + '">';
	   if (genlist2[i].match('mass')) {
			output += 'Masses';
	   } else if (genlist2[i].match('motet')) {
			output += 'Motets';
	   } else if (genlist2[i].match('song')) {
			output += 'Songs';
		} else {
			output += genlist2[i];
		}
		output += '</option>\n';
   }
   return output;
}



//////////////////////////////
//
// GetWorkOptions -- Return an option list of works (for a specific
//     repertory and genre.    The repertory is required, the genre
//     is optional (show all works regardless of genre in that case).
//     This is used to fill in the Work section list in forms on 
//     various webpages.  
//

function GetWorkOptions(repertory, genre) {
   if ((typeof repertory === 'undefined') || (repertory == null)) {
      return '';
	}

   if ((typeof genre === 'undefined') || (genre == null)) {
      genre = '';
   }
   InitializeWorklist();
   var output = '';
   var longname;
   var abbr;
   var i, j;
   var works;

   var output = '';
   for (i=0; i<WORKLIST.length; i++) {
		if (!repertory.match(WORKLIST[i].repid)) {
			continue;
		}
		works = WORKLIST[i].works;
      for (j=0; j<works.length; j++) {
			if (!genre.match(/^\s*$/) && !genre.match(works[j].genre)) {
				continue;
			}
      	output += '<option value="' + works[j].id + '">';
			output += works[j].title;
			if (typeof works[j].variant !== 'undefined') {
				output += ' (' + works[j].variant + ' )';
			}
			output += '</option>\n';
		}
	}
	return output;
}



//////////////////////////////
//
// GetVoiceOptions -- Return an option list of voices.  This is used to
//     fill in the Composer/Repertory section list in forms on various
//     webpages.
//

function GetVoiceOptions() {
   output = '';
   output += '<option value="3">3 voices</option>\n';
   output += '<option value="4">4 voices</option>\n';
   output += '<option value="5+">more voices</option>\n';
   return output;
}



//////////////////////////////
//
// ClearBrowseFields -- Erase the browse filter options (useful to force
//     display of the Browse home page).
//

function ClearBrowseFields() {
   localStorage.BROWSEcomposers = '';
   localStorage.BROWSEgenres    = '';
   localStorage.BROWSEvoices    = '';
   localStorage.BROWSEtitlebox  = '';
}



//////////////////////////////
//
// ClearWorklist --
//

function ClearWorklist() {
	localStorage.removeItem('WORKLIST');
	localStorage.removeItem('WORKLISTrefreshtime');
  	localStorage.removeItem('WORKjrpid');
  	localStorage.removeItem('RECENTLYADDEDHTML');
}



/*
//////////////////////////////
//
// UpdateEzMark --
//

function UpdateEzMark() {
   $('select').not('.tricky').select2({
      width: 'off'
   });

   $('select.tricky').select2({
      width: 'off',
      containerCssClass: 'tricky-choice',
      dropdownCssClass: 'tricky-dropdown',
      dropdownAutoWidth: true
   });

//   $('input[type=checkbox]').ezMark();
//   $('input[type=radio]').ezMark();
}
*/



//////////////////////////////
//
// PlayAudioFile -- play/pause an audio file.
//

function PlayAudioFile(jrpid, element) {
	// The JRPID is not the same as the currently playing file
	// (or there is no file playing).  So start the new one.
	if (!AUDIO) {
	   AUDIO = document.getElementById('audio');
   }
	if (!AUDIO) {
		document.body.innerHTML += '<audio id="audio"></audio>\n';
	   AUDIO = document.getElementById('audio');
	}
   if (!AUDIO) {
		console.log('Error: could not set up audio interface\n');
		return false;
   }
	AUDIO.setAttribute('controls', 'controls');
	AUDIO.style.position = 'fixed';
	AUDIO.style.bottom = '0';
	AUDIO.style.right = '0';
	AUDIO.style.zIndex = '1';

	var audiobutton;
   if (jrpid != AUDIOjrpid) {
		if (!!AUDIOid) {
			// turn of previously playing audio file:
			audiobutton = document.getElementById(AUDIOid);
			if (!!audiobutton && !!audiobutton.className) {
				if (audiobutton.className.match(/mp3/)) {
					audiobutton.className = 'mp3play';
				} else {
					audiobutton.className = 'play';
				}
			}
		}
		AUDIO.removeAttribute('controls');
      AUDIO.pause();
		
      AUDIOid = element.id;
		var source = '';
		// Can't have seekable dynamic content in audio element:
		//source += '<source src="/data?a=mp3&id=' + jrpid + '" ';
		if (window.location.href.match(/tasso/i)) {
			source += '<source src="https://data.tassomusic.org/audio/mp3/' + jrpid + '.mp3" ';
		} else {
			source += '<source src="/audio/mp3/' + jrpid + '.mp3" ';
		}
		source += 'type="audio/mpeg"/>\n';
		AUDIO.innerHTML = source;

		AUDIOjrpid = jrpid;
		AUDIO.load();
		AUDIO.play();
		AUDIO.setAttribute('controls', 'controls');
		var newelement = document.getElementById(AUDIOid);
		
		if (newelement.className.match(/mp3/)) {
			newelement.className = 'mp3pause';
		} else {
			newelement.className = 'pause';
		}
		return;
	}

	// The audio file is the same, so start it or pause it depending
	// on its current state:
	if (AUDIO.paused) {
		audiobutton = document.getElementById(AUDIOid);
 		if (!audiobutton) {
			return;
		}
		if (audiobutton.className.match(/mp3/)) {
			audiobutton.className = 'mp3play';
		} else {
			audiobutton.className = 'play';
		}
		if (element.className.match(/mp3/)) {
			element.className = 'mp3pause';
		} else {
			element.className = 'pause';
		}
		AUDIO.play();
		AUDIO.setAttribute('controls', 'controls');
	} else {
		audiobutton = document.getElementById(AUDIOid);
 		if (!audiobutton) {
			return;
		}
		if (audiobutton.className.match(/mp3/)) {
			audiobutton.className = 'mp3pause';
		} else {
			audiobutton.className = 'pause';
		}
		if (element.className.match(/mp3/)) {
			element.className = 'mp3play';
		} else {
			element.className = 'play';
		}
		AUDIO.pause();
		AUDIO.removeAttribute('controls');
	}
}



//////////////////////////////
//
// ClearWorklistCache --
//

function ClearWorklistCache() {
   localStorage.removeItem('WORKLIST');
   localStorage.removeItem('WORKLISTrefreshtime');
   localStorage.removeItem('WORKjrpid');
   sessionStorage.removeItem('RECENTLYADDEDHTML');
}



//////////////////////////////
//
// audioStoppedAction -- 
//

function audioStoppedAction(event) {



}



//////////////////////////////
//
// DisplayCriticalNotes --
//

function DisplayCriticalNotes(jrpid, target) {
   ReadFileAsync("/data?id=" + jrpid + "&a=critical", function(responseText) {
		if (responseText.match(/^\s*$/)) {
			return;
		}
	   var element = document.getElementById(target);
		if (!element) {
			return;
		}

		element.innerHTML = responseText;

		var i;
		var content;

		var h4s = element.querySelectorAll("h2");
		for (i=0; i<h4s.length; i++) {
			content = h4s[i].innerHTML;
		 	h4s[i].outerHTML = '<h4>' + content + '</h4>';
		}

		var h3s = element.querySelectorAll("h1");
		for (i=0; i<h3s.length; i++) {
			content = h3s[i].innerHTML;
		 	h3s[i].outerHTML = '<h3 class="brown-border">' + content + '</h3>';
		}

	});
}


</script>



