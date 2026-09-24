//////////////////////////////
//
// DisplayScoreCredit --
//

function DisplayScoreCredit(jrpid, target) {
	DisplayWorkCommentary(jrpid);
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

	var citationTemplate = document.getElementById("citation-button-template");
	if (citationTemplate) {
		var citationButton = citationTemplate.content.firstElementChild.cloneNode(true);
		citationButton.addEventListener("click", function() { showWorkCitation(jrpid); });
		element.appendChild(citationButton);
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


// Source formatting shared with The 1520s Project.
function escapeCommentaryText(value) {
	return String(value || "").trim().replace(/[&<>"']/g, character => ({
		"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
	}[character]));
}

function formatCommentarySource(source, diamm, rism) {
	let name = String(source || "").trim();
	// Printed sources use the editors' convention: Printer, Title (date).
	let print = name.match(/^([^,]+),\s*(.+?)(\s+\([^()]*\))$/);
	let label = print
		? `${escapeCommentaryText(print[1])}, <i>${escapeCommentaryText(print[2])}</i> ${escapeCommentaryText(print[3])}`
		: escapeCommentaryText(name);
	let links = [diamm, rism].map(value => String(value || "").trim());
	let link = links.find(value => /^https?:\/\//i.test(value));
	if (!link) {
		return label;
	}
	let output = `<a target="_blank" rel="noopener noreferrer" href="${escapeCommentaryText(link)}">${label}</a>`;
	if (link === links[0] && /^https?:\/\//i.test(links[1]) && links[1] !== link) {
		output += ` (<a target="_blank" rel="noopener noreferrer" href="${escapeCommentaryText(links[1])}">RISM</a>)`;
	}
	return output;
}

function formatWorkAlias(jrpid, workHeading = false) {
	const metadata = GetScoreCreditMetadata(jrpid);
	const alias = String(metadata && metadata.Alias || "").trim();
	if (!alias) return "";
	const label = `(${escapeCommentaryText(alias)})`;
	return workHeading ? `<span class="work-alias">${label}</span>` : ` ${label}`;
}

function formatRepertoireSourceSuffix(jrpid) {
	if (typeof COMMENTARY === "undefined" || !Array.isArray(COMMENTARY)) return "";
	const id = String(jrpid || "").trim();
	if (!id) return "";
	const names = new Set(COMMENTARY.filter(entry => {
		const entryId = String(entry.WORK_ID || "").trim();
		return entryId === id || entryId === id.slice(0, 7);
	}).map(entry => String(entry.Source || "").trim()).filter(Boolean));
	// Multiple occurrences in one source still represent a single source.
	if (names.size !== 1) return "";
	const label = formatCommentarySource([...names][0])
		.replace(/<\/i>\s+\(([^()]*)\)$/, "</i>, $1");
	return ` (${label})`;
}

function formatCommentaryMovements(value, workinfo) {
	let movements = String(value || "").trim();
	if (!movements || /^all$/i.test(movements)) {
		return "";
	}
	let names = {K: "Kyrie", G: "Gloria", C: "Credo", S: "Sanctus", A: "Agnus"};
	if (workinfo.Genre === "mass" && /requiem/i.test(workinfo.Title || "")) {
		names = {I: "Introit", K: "Kyrie", G: "Gradual", R: "Responsorium", V: "Versus", O: "Offertory", S: "Sanctus", A: "Agnus", C: "Communion"};
	}
	let codes = Array.from(movements);
	if (!codes.every(code => names[code])) {
		// Preserve edited prose or unrecognized abbreviations as entered.
		return movements;
	}
	let labels = codes.map(code => names[code]);
	let last = labels.pop();
	return `${labels.length ? labels.join(", ") + " and " : ""}${last}, only`;
}

function formatCommentaryDetails(entry, workinfo, includeMovements = true) {
	let details = [];
	let attribution = String(entry.Attribution || "").trim();
	if (attribution && !/^anonymous$/i.test(attribution)) {
		details.push(`attribution: ${attribution}`);
	}
	if (includeMovements) {
		let movements = formatCommentaryMovements(entry.Movements, workinfo);
		if (movements) details.push(movements);
	}
	return details.length ? ` (${escapeCommentaryText(details.join("; "))})` : "";
}

function formatCommentaryNotes(entry) {
	let notes = escapeCommentaryText(entry.Notes);
	return notes ? `<span class="commentary-notes">${notes}</span>` : "";
}

function compareCommentarySources(a, b) {
	let [left, right] = [a, b].map(entry => {
		let name = String(entry.Source || "").trim();
		// Printed sources follow Printer, Title (date); use the date, not the title.
		let print = name.match(/^([^,]+),\s*(.+?)\s+\(([^()]*)\)$/);
		let year = print && print[3].match(/\b\d{4}\b/);
		return {name, group: print ? print[1].trim() : name, year: year ? Number(year[0]) : Infinity};
	});
	let options = {sensitivity: "base", numeric: true, ignorePunctuation: true};
	return left.group.localeCompare(right.group, "en", options)
		|| left.year - right.year
		|| left.name.localeCompare(right.name, "en", options);
}


function DisplayWorkCommentary(jrpid) {
	var element = document.getElementById("work-commentary");
	if (!element) return;
	element.innerHTML = "";
	var work = GetScoreCreditMetadata(jrpid);
	if (!work || typeof COMMENTARY === "undefined" || !Array.isArray(COMMENTARY)) return;
	var id = String(jrpid || "").trim();
	if (!id) return;
	var baseId = id.slice(0, 7);
	// Retain every occurrence; JRP has no separate earliest-source list.
	// A base WORK_ID applies to the whole work and each movement/version.
	// A full WORK_ID applies only to that exact movement/version.
	var entries = COMMENTARY.filter(entry => {
		var entryId = String(entry.WORK_ID || "").trim();
		return (entryId === id || entryId === baseId) && String(entry.Source || "").trim();
	}).sort(compareCommentarySources);
	if (!entries.length) return;
	var sourceLabel = entries.length === 1 ? "Source" : "Sources";
	var heading = `${sourceLabel}:`;
	var sources = entries.map((entry, index) => {
		var source = formatCommentarySource(entry.Source, entry["DIAMM link"], entry["RISM link"]);
		var folios = escapeCommentaryText(entry["Fols./pp./no."]);
		return `<li class="commentary-source"${index >= 3 ? " hidden" : ""}>${source}${folios ? ", " + folios : ""}${formatCommentaryDetails(entry, work)}${formatCommentaryNotes(entry)}</li>`;
	}).join("");
	var toggle = entries.length > 3
		? '<button type="button" class="commentary-toggle work-view-toggle work-score-toggle" aria-expanded="false" aria-controls="commentary-source-list" onclick="toggleCommentarySources(this)">See more</button>' : "";
	element.innerHTML = `<div class="commentary-sources"><span>${heading}</span><ul id="commentary-source-list" class="commentary-source-list" role="list">${sources}</ul>${toggle}</div>`;
}

function toggleCommentarySources(button) {
	let expanded = button.getAttribute("aria-expanded") !== "true";
	let sources = button.closest(".commentary-sources").querySelectorAll(".commentary-source");
	sources.forEach((source, index) => {
		if (index >= 3) source.hidden = !expanded;
	});
	button.setAttribute("aria-expanded", String(expanded));
	button.textContent = expanded ? "See fewer sources" : "See more";
}
