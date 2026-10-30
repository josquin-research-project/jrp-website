function setupTooltips() {
	const messages = {
		'analysis-help': 'Click for a short description of the analysis tools.',
		'search-help': 'Click for help on expressing search queries.'
	};
	for (const [id, text] of Object.entries(messages)) {
		const trigger = document.getElementById(id);
		if (!trigger || trigger.dataset.helpTooltipBound) continue;
		trigger.dataset.helpTooltipBound = 'true';
		const tooltip = document.createElement('div');
		tooltip.id = id + '-tooltip';
		tooltip.className = 'help-tooltip';
		tooltip.setAttribute('role', 'tooltip');
		tooltip.textContent = text;
		tooltip.hidden = true;
		document.body.appendChild(tooltip);
		const descriptions = (trigger.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
		descriptions.push(tooltip.id);
		trigger.setAttribute('aria-describedby', descriptions.join(' '));
		let timer;
		let dismissed = false;

		function position() {
			if (tooltip.hidden) return;
			const anchor = trigger.getBoundingClientRect();
			if (!anchor.width || !anchor.height) {
				hide();
				return;
			}
			const width = tooltip.offsetWidth;
			const height = tooltip.offsetHeight;
			const left = Math.max(8, Math.min(anchor.right, document.documentElement.clientWidth - width - 8));
			const above = anchor.bottom + 7 + height > window.innerHeight && anchor.top > height + 7;
			tooltip.classList.toggle('is-above', above);
			tooltip.style.left = left + 'px';
			tooltip.style.top = (above ? anchor.top - height - 7 : anchor.bottom + 7) + 'px';
			tooltip.style.setProperty('--tip-left', Math.max(-1, Math.min(width - 9, anchor.right - left - 1)) + 'px');
		}

		function hide() {
			clearTimeout(timer);
			tooltip.hidden = true;
		}

		function show() {
			clearTimeout(timer);
			if (dismissed) return;
			tooltip.hidden = false;
			position();
		}

		function scheduleHide() {
			clearTimeout(timer);
			timer = setTimeout(function() {
				if (!trigger.matches(':hover, :focus') && !tooltip.matches(':hover')) hide();
			}, 100);
		}

		trigger.addEventListener('mouseenter', function() {
			dismissed = false;
			clearTimeout(timer);
			timer = setTimeout(show, 90);
		});
		trigger.addEventListener('mouseleave', scheduleHide);
		trigger.addEventListener('focus', function() {
			dismissed = false;
			show();
		});
		trigger.addEventListener('blur', scheduleHide);
		trigger.addEventListener('click', function() {
			dismissed = true;
			hide();
		});
		tooltip.addEventListener('mouseenter', show);
		tooltip.addEventListener('mouseleave', scheduleHide);
		document.addEventListener('keydown', function(event) {
			if (event.key === 'Escape') {
				dismissed = true;
				hide();
			}
		});
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
	}
}
