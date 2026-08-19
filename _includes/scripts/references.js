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

	var text = String(entry["Edition source"] || "").trim();
	var link = String(entry["Edition URL"] || "").trim();
	if (!text) {
		return null;
	}

	return { text: text, link: link };
}
