//////////////////////////////
//
// DisplayEditorCredit --
//

function DisplayEditorCredit(jrpid, target) {
	var element = document.getElementById(target);
	if (!element) {
		return;
	}

	element.textContent = "";

	var editor = GetEditorCredit(jrpid);
	if (!editor || !editor.text) {
		return;
	}

	element.appendChild(document.createTextNode("Edited by "));

	if (editor.link) {
		var link = document.createElement("a");
		link.href = editor.link;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = editor.text;
		element.appendChild(link);
	} else {
		element.appendChild(document.createTextNode(editor.text));
	}
}



/////////////////////////////
//
// FormatEditorNames -- Convert the metadata's semicolon-separated names to
//    a natural-language list.
//

function FormatEditorNames(value) {
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
// GetEditorCredit --
//

function GetEditorCredit(jrpid) {
	if (!Array.isArray(WORKS)) {
		return null;
	}

	var entry = WORKS.find(function(work) {
		return work.WORK_ID === jrpid;
	});

	// Complete multi-movement works have a conceptual base ID but no
	// corresponding metadata row. In that case, use the first movement's
	// editor credit.
	if (!entry) {
		var baseId = getBaseWorkId(jrpid);
		entry = WORKS.find(function(work) {
			return getBaseWorkId(work.WORK_ID) === baseId &&
				String(work["Edition source"] || "").trim();
		});
	}

	if (!entry) {
		return null;
	}

	var text = FormatEditorNames(entry["Edition source"]);
	var link = String(entry["Edition URL"] || "").trim();
	if (!text) {
		return null;
	}

	return { text: text, link: link };
}
