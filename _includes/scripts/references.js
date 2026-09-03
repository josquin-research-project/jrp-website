//////////////////////////////
//
// DisplayScoreCredit --
//

function DisplayScoreCredit(jrpid, target) {
	var element = document.getElementById(target);
	if (!element) {
		return;
	}

	element.textContent = "";

	var entry = GetScoreCreditMetadata(jrpid);
	if (!entry) {
		return;
	}

	var editor = FormatCreditNames(entry["Edition source"]) ||
		"the Josquin Research Project";
	var editorLink = String(entry["Edition URL"] || "").trim();
	AppendScoreCreditLine(element, "Edited by ", editor, editorLink);

	var transcriber = FormatCreditNames(entry.Transcriber);
	if (transcriber) {
		AppendScoreCreditLine(element, "Transcribed by ", transcriber, "");
	}
}



/////////////////////////////
//
// AppendScoreCreditLine --
//

function AppendScoreCreditLine(container, label, value, url) {
	var line = document.createElement("div");
	line.className = "work-score-credit-line";
	line.appendChild(document.createTextNode(label));

	if (url) {
		var link = document.createElement("a");
		link.href = url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = value;
		line.appendChild(link);
	} else {
		line.appendChild(document.createTextNode(value));
	}

	container.appendChild(line);
}



/////////////////////////////
//
// FormatCreditNames -- Convert the metadata's semicolon-separated names to
//    a natural-language list.
//

function FormatCreditNames(value) {
	var names = String(value || "")
		.split(";")
		.map(function(name) { return name.trim(); })
		.filter(Boolean);

	if (names.length < 2) {
		return names[0] || "";
	}
	if (names.length === 2) {
		return names[0] + " and " + names[1];
	}

	return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}



/////////////////////////////
//
// GetScoreCreditMetadata --
//

function GetScoreCreditMetadata(jrpid) {
	if (!Array.isArray(WORKS)) {
		return null;
	}

	var entry = WORKS.find(function(work) {
		return work.WORK_ID === jrpid;
	});

	// Complete multi-movement works have a conceptual base ID but no
	// corresponding metadata row. In that case, use the first movement's
	// score credit.
	if (!entry) {
		var baseId = getBaseWorkId(jrpid);
		entry = WORKS.find(function(work) {
			return getBaseWorkId(work.WORK_ID) === baseId;
		});
	}

	return entry || null;
}
