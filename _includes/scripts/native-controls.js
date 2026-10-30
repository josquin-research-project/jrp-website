function setSelectIndex(id, index) {
	const select = document.getElementById(id);
	if (!select) return;
	select.selectedIndex = index;
	if (window.JRPDropdowns) JRPDropdowns.refresh(select);
}

function setupSearchOnEnter() {
	for (const id of ['pitch', 'interval', 'rhythm']) {
		const field = document.getElementById(id);
		if (!field || field.dataset.searchOnEnter) continue;
		field.dataset.searchOnEnter = 'true';
		field.addEventListener('keydown', function(event) {
			if (event.key !== 'Enter' || event.isComposing) return;
			event.preventDefault();
			if (!event.repeat) doSearch();
		});
	}
}

let pageScrollFrame = 0;
function scrollPageTo(top, duration = 300) {
	cancelAnimationFrame(pageScrollFrame);
	const start = window.scrollY;
	const target = Math.max(0, top);
	if (!duration || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		window.scrollTo(0, target);
		return;
	}
	const began = performance.now();
	function step(now) {
		const progress = Math.min(1, (now - began) / duration);
		const eased = .5 - Math.cos(progress * Math.PI) / 2;
		window.scrollTo(0, start + (target - start) * eased);
		if (progress < 1) pageScrollFrame = requestAnimationFrame(step);
	}
	pageScrollFrame = requestAnimationFrame(step);
}
