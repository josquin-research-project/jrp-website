{% include scripts/native-controls.js %}
//////////////////////////////
//
// DOMContentLoaded event listener -- Things to do on a page after 
// 	the document has fininshed loading.
//

document.addEventListener('DOMContentLoaded', function() {
	StylizeFormElements();
	MakeNewLinkTargets();
}, false);



//////////////////////////////
//
// StylizeFormElements -- Enhance dropdowns while retaining their native values.
//

function StylizeFormElements() {
	if (!window.JRPDropdowns) return;
	document.querySelectorAll('select').forEach(function(select) {
		if (!select.matches('#download-section-select, #citation-format, [data-native-select]')) {
			JRPDropdowns.enhance(select);
		}
	});
}

///////////////////////////////
//
// MakeNewLinkTargets -- Assign a target to "new" for all <a> elements 
// 	in the document which are not relative.  If the link already
// 	has a target, then do not change it.
//

function MakeNewLinkTargets() {
	var alist = document.querySelectorAll("a");
	for (var i=0; i<alist.length; i++) {
		if (alist[i].getAttribute('target')) {
			continue;
		}
		var href = alist[i].getAttribute('href');
		if (!href) {
			continue;
		}
		if (href && !href.match(/^[A-Z-a-z]+:\/\//)) {
			continue;
		}
		alist[i].setAttribute('target', 'new');
	}
}




// Keep legacy controls visually identical while supporting Enter and Space.
document.addEventListener('keydown', function(event) {
	if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return;
	var control = event.target.closest && event.target.closest('[role="button"][tabindex="0"]');
	if (!control || control.matches('button, input, select, textarea, a[href]')) return;
	if (control.getAttribute('aria-disabled') === 'true') return;
	event.preventDefault();
	if (!event.repeat) control.click();
}, false);
