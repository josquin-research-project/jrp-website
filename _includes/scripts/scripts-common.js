//
// Programmer:    Craig Stuart Sapp <craig@ccrma.stanford.edu>
// Creation Date: Thu Aug 21 12:59:01 PDT 2014
// Last Modified: Mon Sep  1 22:01:13 PDT 2014
// Filename:      _includes/scripts/scripts-common.js
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
const JOSQUIN_DATA = "https://data.josqu.in/"; // data server
const JOSQUIN_LEGACY = "https://josquin.stanford.edu"; // old website

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

function getJosquinDataUrl(jrpid, type) {
  switch (type) {

    // Core score formats
    case "humdrum":  return `${JOSQUIN_DATA}${jrpid}.krn`;
    case "musedata": return `${JOSQUIN_DATA}${jrpid}.mds`;
    case "mei":      return `${JOSQUIN_DATA}${jrpid}.mei`;
    case "musicxml": return `${JOSQUIN_DATA}${jrpid}.musicxml`;
    case "midi":     return `${JOSQUIN_DATA}${jrpid}.mid`;
    case "mp3":      return `${JOSQUIN_DATA}${jrpid}.mp3`;

    // Notation & graphics
    case "incipit":  return `${JOSQUIN_DATA}${jrpid}-incipit.svg`;
    case "prange-attack":   return `${JOSQUIN_DATA}${jrpid}-prange-attack.svg`;
    case "prange-duration": return `${JOSQUIN_DATA}${jrpid}-prange-duration.svg`;

    // Activity plots
    case "activity-merged":
      return `${JOSQUIN_DATA}${jrpid}-activity-merged.png`;
    case "activity-separate":
      return `${JOSQUIN_DATA}${jrpid}-activity-separate.png`;

    // Lyrics
    case "lyrics":
      return `${JOSQUIN_DATA}${jrpid}.lyrics`;
    case "lyrics-modern":
      return `${JOSQUIN_DATA}${jrpid}.lyrics-modern`;

    default:
      return "";
  }
}

// Composer lookup indexed by COMPOSER_ID
var COMPOSER_INDEX = null;

function InitializeComposerIndex() {
  if (COMPOSER_INDEX) return;

  COMPOSER_INDEX = {};

  for (let i = 0; i < COMPOSERS.length; i++) {
    const c = COMPOSERS[i];
    if (!c.COMPOSER_ID) continue;

    const birth = formatDateToken(c.Birth, "birth");
    const death = formatDateToken(c.Death, "death");
    const flour = formatDateToken(c.Flourished, "flourished");

    let dates = "";

    // Birth–death range
    if (birth && death) {
      let b = birth.replace(/^.*?(\d.*)$/, "$1");
      let d = death.replace(/^.*?(\d.*)$/, "$1");

      dates = `${b}–${d}`;

      if (birth.includes("ca.") || death.includes("ca.")) {
        dates = "ca. " + dates.replace(/^ca.\s*/, "");
      }

    // Single known date
    } else if (birth) {
      dates = birth;
    } else if (death) {
      dates = death;
    } else if (flour) {
      dates = flour;
    }

    COMPOSER_INDEX[c.COMPOSER_ID] = {
      short: c["Display Short"] || "",
      long:  c["Display Long"]  || "",

      // raw (still useful elsewhere)
      birth: c.Birth || "",
      death: c.Death || "",
      flourished: c.Flourished || "",

      // formatted display string
      dates: dates,

      complete:
        c.Complete === true ||
        /^yes$/i.test(c.Complete || "") ||
        /^yes$/i.test(c["Complete?"] || "")
    };
  }
}

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
  if (WORKLIST && WORKLIST.length) return;

  InitializeComposerIndex();
  WORKLIST = [];

  const byComposer = {};

  for (const w of WORKS) {

    // Untitled works do not exist conceptually
    if (!w.Title || !w.Title.trim()) continue;
    if (!w.COMPOSER_ID || !w.WORK_ID) continue;

    const baseId = w.WORK_ID.replace(/[a-z]$/, "");
    const composerIds = w.COMPOSER_ID.split(/\s*;\s*/);

    for (const cid of composerIds) {
      const cinfo = COMPOSER_INDEX[cid];
      if (!cinfo) continue;

      if (!byComposer[cid]) {
        byComposer[cid] = {
          repid: cid,
          comshort: cinfo.short,
          comlong:  cinfo.long,
          comdates: cinfo.dates || "",
          repwork: 0,
          works: []
        };
      }

      // conceptual work = same base WORK_ID
      let cw = byComposer[cid].works.find(x => x.baseId === baseId);

      if (!cw) {
        cw = {
          baseId: baseId,
          id: baseId,
          title: w.Title,
          genre: w.Genre,
          voices: w.Voices,
          Texted: w.Texted,
          fragment: w.Fragment || false,
          attr: w.Attribution || 0,

          // short display
          composers: getComposerShortFromIds(w.COMPOSER_ID),

          sections: []
        };

        byComposer[cid].works.push(cw);
        byComposer[cid].repwork++;
      }

      // record the physical part (movement/file)
      cw.sections.push({
        id: w.WORK_ID,
        subtitle: w.Subtitle || "",
        filename: w.Filename || ""
      });
    }
  }

  // Alphabetical by composer
  WORKLIST = Object.values(byComposer).sort((a, b) =>
    a.comlong.localeCompare(b.comlong, "fr", { sensitivity: "base" })
  );
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
  if (WORKLISTjrpid && Object.keys(WORKLISTjrpid).length) return;

  InitializeWorklist();

  WORKLISTjrpid = {};
  WORKLISTrecent = [];

  for (const composer of WORKLIST) {
    for (const work of composer.works) {
      WORKLISTjrpid[work.id] = work;   // work.id === baseId
      WORKLISTrecent.push(work);
    }
  }
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
  if (!Array.isArray(worklist)) return "";

  InitializeComposerIndex();

  // composer → Set of base work IDs
  const counts = {};

  for (const w of WORKS) {
    if (!w.WORK_ID || !w.COMPOSER_ID || !w.Title) continue;

    const baseId = getBaseWorkId(w.WORK_ID);
    const ids = w.COMPOSER_ID.split(/\s*;\s*/);

    for (const cid of ids) {
      if (!counts[cid]) counts[cid] = new Set();
      counts[cid].add(baseId);
    }
  }

  const keys = Object.keys(counts).sort((a, b) => {
    const A = COMPOSER_INDEX[a]?.long || "";
    const B = COMPOSER_INDEX[b]?.long || "";
    return A.localeCompare(B, "fr", { sensitivity: "base" });
  });

  let output = "";

  for (const cid of keys) {
    const c = COMPOSER_INDEX[cid];
    if (!c) continue;

    output += `<option value="${cid}">${c.long} (${counts[cid].size})</option>\n`;
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
  const seen = {};
  let output = '';

  for (let i = 0; i < WORKS.length; i++) {
    const g = WORKS[i].Genre;
    if (!g) continue;
    seen[g] = true;
  }

  const genres = Object.keys(seen).sort();

  for (let i = 0; i < genres.length; i++) {
    const g = genres[i];
    output += `<option value="${g}">${formatGenreLabel(g)}</option>\n`;
  }

  return output;
}

function formatGenreLabel(g) {
  switch (g.toLowerCase()) {
    case 'mass':  return 'Masses';
    case 'motet': return 'Motets';
    case 'song':  return 'Songs';
    default:      return g;
  }
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

  // Ensure audio element exists
  if (!AUDIO) {
    AUDIO = document.getElementById('audio');
  }
  if (!AUDIO) {
    document.body.innerHTML += '<audio id="audio"></audio>\n';
    AUDIO = document.getElementById('audio');
  }
  if (!AUDIO) {
    console.log('Error: could not set up audio interface');
    return false;
  }

  AUDIO.setAttribute('controls', 'controls');
  AUDIO.style.position = 'fixed';
  AUDIO.style.bottom = '0';
  AUDIO.style.right = '0';
  AUDIO.style.zIndex = '1';

  var audiobutton;

  // ------------------------------------------------------------
  // NEW FILE (or first playback)
  // ------------------------------------------------------------
  if (jrpid !== AUDIOjrpid) {

    // Reset previous button
    if (AUDIOid) {
      audiobutton = document.getElementById(AUDIOid);
      if (audiobutton && audiobutton.className) {
        if (audiobutton.className.match(/mp3/)) {
          audiobutton.className = 'mp3play';
        } else {
          audiobutton.className = 'play';
        }
      }
    }

    AUDIO.pause();
    AUDIO.removeAttribute('controls');

    AUDIOid = element.id;

    // 🔹 MP3 from Josquin data server
    var source = '';
    source += '<source src="' + JOSQUIN_DATA + jrpid + '.mp3" ';
    source += 'type="audio/mpeg"/>\n';

    AUDIO.innerHTML = source;

    AUDIOjrpid = jrpid;
    AUDIO.load();
    AUDIO.play();
    AUDIO.setAttribute('controls', 'controls');

    var newelement = document.getElementById(AUDIOid);
    if (newelement) {
      if (newelement.className.match(/mp3/)) {
        newelement.className = 'mp3pause';
      } else {
        newelement.className = 'pause';
      }
    }
    return;
  }

  // ------------------------------------------------------------
  // SAME FILE → toggle play / pause
  // ------------------------------------------------------------
  if (AUDIO.paused) {

    audiobutton = document.getElementById(AUDIOid);
    if (!audiobutton) return;

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
    if (!audiobutton) return;

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
   ReadFileAsync(JOSQUIN_LEGACY + "/data?id=" + jrpid + "&a=critical", function(responseText) {
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

function getBaseWorkId(workId) {
  return workId.replace(/[a-z]$/, "");
}

function getComposerShortFromIds(composerIdString) {
  if (!composerIdString) return "";

  return composerIdString
    .split(/\s*;\s*/)
    .map(cid => COMPOSER_INDEX[cid]?.short)
    .filter(Boolean)
    .join("; ");
}

function extractYear(v) {
  const m = v.match(/(\d{4})/);
  return m ? m[1] : "";
}

function formatDateToken(value, role) {
  if (!value || !value.trim()) return "";

  let v = value.trim();

  // detect ca. anywhere
  let circa = v.includes("~");
  v = v.replace(/~/g, "").trim();

  // before / after
  let prefix = "";
  if (v.startsWith("<")) {
    prefix = "before ";
    v = v.slice(1).trim();
  } else if (v.startsWith(">")) {
    prefix = "after ";
    v = v.slice(1).trim();
  }

  // range support (1518–1520 or 1518-1520)
  let years = v
    .split(/[–-]/)
    .map(s => extractYear(s.trim()))
    .filter(Boolean);

  let yearText = "";
  if (years.length === 2) {
    yearText = `${years[0]}–${years[1]}`;
  } else if (years.length === 1) {
    yearText = years[0];
  } else {
    return "";
  }

  let label = "";
  if (role === "birth")      label = "b. ";
  if (role === "death")      label = "d. ";
  if (role === "flourished") label = "fl. ";

  return label + (circa ? "ca. " : "") + prefix + yearText;
}