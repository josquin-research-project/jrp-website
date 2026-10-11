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
// StylizeFormElements -- Apply CSS styling to form-like elements which
// 	are handled by the select2 and ezmark JavaScript libraries.
//

function StylizeFormElements() {
	LabelFormSelects();
	// Movement downloads manage Select2; the citation dialog uses a native select.
	$('select').not('.tricky, #download-section-select, #citation-format').select2({
		width: 'off'
	});

	$('select.tricky').select2({
		width: "off",
		containerCssClass: 'tricky-choice',
		dropdownCssClass: 'tricky-dropdown',
		dropdownAutoWidth: true
	});

	LabelFormSelects();
	$('input[type=checkbox]').ezMark();
	$('input[type=radio]').ezMark();
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




// Name both the native select and the focusable controls created by Select2.
function LabelFormSelects() {
	$('select').each(function() {
		var name = this.getAttribute('aria-label');
		if (!name && this.labels && this.labels.length) {
			var label = this.labels[0].cloneNode(true);
			label.querySelectorAll('select, input, button').forEach(function(control) {
				control.remove();
			});
			name = label.textContent.trim();
			if (name) this.setAttribute('aria-label', name);
		}
		var widget = $(this).data('select2');
		if (!name || !widget) return;
		if (widget.focusser && widget.focusser.length) {
			// Retain the selected option in the name along with the field label.
			widget.focusser.prev('label').text(name);
			var labelId = widget.focusser.attr('id') + '-label';
			widget.focusser.prev('label').attr('id', labelId);
			var chosenId = widget.selection.find('.select2-chosen').attr('id');
			widget.focusser.attr('aria-labelledby', labelId + (chosenId ? ' ' + chosenId : ''));
		}
		if (widget.search && widget.search.length) {
			widget.search.attr('aria-label', 'Filter options: ' + name);
		}
	});
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
