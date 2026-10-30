window.JRPDropdowns = (() => {
	const states = new WeakMap();
	const live = new Set();
	let cleanupObserver;
	let active = null;
	let nextId = 0;
	const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

	function nameFor(select) {
		if (select.getAttribute('aria-label')) return select.getAttribute('aria-label');
		const labelledBy = (select.getAttribute('aria-labelledby') || '').split(/\s+/)
			.map(id => document.getElementById(id)?.textContent || '').join(' ').trim();
		if (labelledBy) return labelledBy;
		if (select.labels?.length) {
			const label = select.labels[0].cloneNode(true);
			label.querySelectorAll('select, input, button, .jrp-select').forEach(node => node.remove());
			return label.textContent.trim();
		}
		return select.name || select.id || 'Select';
	}

	function fill(state, option, node, query = '') {
		node.replaceChildren();
		if (!option) return;
		if (state.settings.renderOption) {
			state.settings.renderOption(option, node);
			return;
		}
		const text = option?.textContent || '';
		const start = query ? normalize(text).indexOf(normalize(query)) : -1;
		if (start < 0) node.textContent = text;
		else {
			const match = document.createElement('em');
			match.textContent = text.slice(start, start + query.length);
			node.append(text.slice(0, start), match, text.slice(start + query.length));
		}
	}

	function close() {
		if (!active) return;
		const state = active;
		active = null;
		state.popup.hidden = true;
		state.container.classList.remove('jrp-select-open', 'jrp-select-above');
		state.button.setAttribute('aria-expanded', 'false');
		state.button.removeAttribute('aria-activedescendant');
		state.query = '';
		state.status.textContent = '';
	}

	function position() {
		if (!active) return;
		const state = active;
		if (!state.select.isConnected || state.select.disabled) return close();
		const rect = state.container.getBoundingClientRect();
		if (!rect.width || !rect.height) return close();
		state.popup.style.width = rect.width + 'px';
		state.list.style.maxHeight = '200px';
		const below = window.innerHeight - rect.bottom - 8;
		const above = rect.top - 8;
		const upwards = state.popup.offsetHeight > below && above > below;
		state.list.style.maxHeight = Math.max(30, Math.min(200, (upwards ? above : below) - 9)) + 'px';
		state.container.classList.toggle('jrp-select-above', upwards);
		state.popup.classList.toggle('jrp-select-above', upwards);
		state.popup.style.left = Math.max(0, Math.min(rect.left, document.documentElement.clientWidth - rect.width)) + window.scrollX + 'px';
		state.popup.style.top = (upwards ? rect.top - state.popup.offsetHeight + 1 : rect.bottom - 1) + window.scrollY + 'px';
	}

	function highlight(state, index) {
		state.highlighted = index;
		state.rows.forEach((row, i) => row.classList.toggle('jrp-select-highlighted', i === index));
		const row = state.rows[index];
		if (!row) state.button.removeAttribute('aria-activedescendant');
		else {
			state.button.setAttribute('aria-activedescendant', row.id);
			if (row.offsetTop < state.list.scrollTop) state.list.scrollTop = row.offsetTop;
			else if (row.offsetTop + row.offsetHeight > state.list.scrollTop + state.list.clientHeight) {
				state.list.scrollTop = row.offsetTop + row.offsetHeight - state.list.clientHeight;
			}
		}
	}

	function render(state) {
		state.list.replaceChildren();
		state.options = [...state.select.options].filter(option => !option.hidden &&
			!option.closest('optgroup[hidden]') && normalize(option.textContent).includes(normalize(state.query)));
		state.rows = state.options.map((option, index) => {
			const row = document.createElement('li');
			row.id = state.list.id + '-' + index;
			row.setAttribute('role', 'option');
			row.setAttribute('aria-selected', String(option.selected));
			row.setAttribute('aria-label', option.textContent);
			const disabled = option.disabled || option.parentElement.disabled;
			row.setAttribute('aria-disabled', String(Boolean(disabled)));
			row.className = disabled ? 'jrp-select-disabled-option' : '';
			const label = document.createElement('div');
			label.className = 'jrp-select-result-label';
			fill(state, option, label, state.query);
			row.appendChild(label);
			row.addEventListener('pointermove', () => { if (!disabled) highlight(state, index); });
			row.addEventListener('pointerdown', event => event.preventDefault());
			row.addEventListener('click', () => { if (!disabled) choose(state, index); });
			state.list.appendChild(row);
			return row;
		});
		if (!state.options.length) {
			const empty = document.createElement('li');
			empty.className = 'jrp-select-no-results';
			empty.setAttribute('role', 'presentation');
			empty.textContent = 'No matches found';
			state.list.appendChild(empty);
		}
		let index = state.options.findIndex(option => option.selected && !option.disabled && !option.parentElement.disabled);
		if (index < 0) index = state.options.findIndex(option => !option.disabled && !option.parentElement.disabled);
		highlight(state, index);
		state.status.textContent = state.query ? state.options.length + ' matching options for ' + state.query : '';
		position();
	}

	function refresh(state) {
		const selected = state.select.options[state.select.selectedIndex];
		fill(state, selected, state.chosen);
		state.label.textContent = state.select.getAttribute('aria-label') || state.name;
		state.button.disabled = state.select.disabled;
		state.button.setAttribute('aria-required', String(state.select.required));
		state.container.classList.toggle('jrp-select-disabled', state.select.disabled);
		if (state.select.disabled && active === state) close();
		else if (active === state) render(state);
	}

	function open(state) {
		if (state.select.disabled) return;
		if (active === state) return;
		close();
		active = state;
		state.query = '';
		state.popup.style.left = '0px';
		state.popup.style.top = '0px';
		state.popup.hidden = false;
		state.container.classList.add('jrp-select-open');
		state.button.setAttribute('aria-expanded', 'true');
		render(state);
		state.button.focus({preventScroll: true});
	}

	function choose(state, index) {
		const option = state.options[index];
		if (!option || option.disabled || option.parentElement.disabled) return;
		const changed = state.select.selectedIndex !== option.index;
		state.select.selectedIndex = option.index;
		close();
		refresh(state);
		state.button.focus({preventScroll: true});
		if (changed) {
			state.select.dispatchEvent(new Event('input', {bubbles: true}));
			state.select.dispatchEvent(new Event('change', {bubbles: true}));
		}
	}

	function move(state, direction, edge) {
		const available = state.options.map((option, i) => option.disabled || option.parentElement.disabled ? -1 : i).filter(i => i >= 0);
		if (!available.length) return;
		let at = available.indexOf(state.highlighted);
		at = edge === 'first' ? 0 : edge === 'last' ? available.length - 1 : Math.max(0, Math.min(available.length - 1, at + direction));
		highlight(state, available[at]);
	}

	function keydown(state, event) {
		if (event.ctrlKey || event.metaKey || event.isComposing) return;
		const key = event.key;
		if (key === 'Tab') {
			if (active === state) choose(state, state.highlighted);
			close();
			return;
		}
		if (key === 'Escape') {
			if (active === state) { event.preventDefault(); event.stopPropagation(); close(); }
			return;
		}
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter', ' ', 'Backspace'].includes(key) && key.length !== 1) return;
		event.preventDefault();
		event.stopPropagation();
		if (key === 'Enter' || (key === ' ' && active !== state)) {
			if (active === state) choose(state, state.highlighted);
			else open(state);
			return;
		}
		const wasOpen = active === state;
		open(state);
		if (key === 'ArrowDown' || key === 'ArrowUp') { if (wasOpen) move(state, key === 'ArrowDown' ? 1 : -1); }
		else if (key === 'Home' || key === 'End') move(state, 0, key === 'Home' ? 'first' : 'last');
		else if (key === 'PageDown' || key === 'PageUp') move(state, key === 'PageDown' ? 8 : -8);
		else {
			state.query = key === 'Backspace' ? state.query.slice(0, -1) : state.query + key;
			render(state);
		}
	}

	function enhance(select, settings = {}) {
		if (!select || select.multiple || select.size > 1) return;
		let state = states.get(select);
		if (state) { Object.assign(state.settings, settings); refresh(state); return; }
		const name = nameFor(select);
		const id = 'jrp-dropdown-' + ++nextId;
		const container = document.createElement('div');
		container.className = 'jrp-select ' + select.className;
		container.id = id;
		container.style.width = settings.width || select.style.width;
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'jrp-select-choice';
		button.setAttribute('role', 'combobox');
		button.setAttribute('aria-expanded', 'false');
		button.setAttribute('aria-haspopup', 'listbox');
		const label = document.createElement('span');
		label.id = id + '-label';
		label.className = 'visually-hidden';
		const chosen = document.createElement('span');
		chosen.id = id + '-chosen';
		chosen.className = 'jrp-select-chosen';
		button.setAttribute('aria-labelledby', label.id + ' ' + chosen.id);
		const arrow = document.createElement('span');
		arrow.className = 'jrp-select-arrow';
		arrow.setAttribute('aria-hidden', 'true');
		arrow.appendChild(document.createElement('b'));
		button.append(chosen, arrow);
		const status = document.createElement('span');
		status.className = 'visually-hidden';
		status.setAttribute('role', 'status');
		container.append(button, label, status);
		const popup = document.createElement('div');
		popup.className = 'jrp-select-drop ' + (settings.dropdownClass || '');
		popup.hidden = true;
		const list = document.createElement('ul');
		list.id = id + '-options';
		list.className = 'jrp-select-results';
		list.setAttribute('role', 'listbox');
		list.setAttribute('aria-labelledby', label.id);
		button.setAttribute('aria-controls', list.id);
		popup.appendChild(list);
		document.body.appendChild(popup);
		select.before(container);
		const original = {tabindex: select.getAttribute('tabindex'), ariaHidden: select.getAttribute('aria-hidden')};
		select.classList.add('jrp-native-select');
		select.tabIndex = -1;
		select.setAttribute('aria-hidden', 'true');
		state = {select, container, button, chosen, label, status, popup, list, original, settings, name, query: '', rows: [], options: [], highlighted: -1};
		states.set(select, state);
		live.add(select);
		if (!cleanupObserver) {
			cleanupObserver = new MutationObserver(() => {
				for (const item of live) if (!item.isConnected) destroy(item);
			});
			cleanupObserver.observe(document.body, {childList: true, subtree: true});
		}
		button.addEventListener('click', () => active === state ? close() : open(state));
		button.addEventListener('keydown', event => keydown(state, event));
		button.addEventListener('focus', () => { container.classList.add('jrp-select-active'); refresh(state); });
		button.addEventListener('blur', () => { container.classList.remove('jrp-select-active'); if (active === state) close(); });
		state.onChange = () => { button.removeAttribute('aria-invalid'); refresh(state); };
		select.addEventListener('change', state.onChange);
		state.onFocus = () => button.focus();
		select.addEventListener('focus', state.onFocus);
		state.onInvalid = event => { event.preventDefault(); button.setAttribute('aria-invalid', 'true'); button.focus(); };
		select.addEventListener('invalid', state.onInvalid);
		state.observer = new MutationObserver(() => refresh(state));
		state.observer.observe(select, {childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['disabled', 'selected', 'value', 'label', 'hidden', 'required']});
		refresh(state);
	}

	function destroy(select) {
		const state = states.get(select);
		if (!state) return;
		if (active === state) close();
		state.observer.disconnect();
		select.removeEventListener('change', state.onChange);
		select.removeEventListener('focus', state.onFocus);
		select.removeEventListener('invalid', state.onInvalid);
		select.classList.remove('jrp-native-select');
		for (const [attribute, value] of [['tabindex', state.original.tabindex], ['aria-hidden', state.original.ariaHidden]]) {
			if (value === null) select.removeAttribute(attribute); else select.setAttribute(attribute, value);
		}
		state.container.remove();
		state.popup.remove();
		states.delete(select);
		live.delete(select);
	}

	document.addEventListener('pointerdown', event => {
		if (active && !active.container.contains(event.target) && !active.popup.contains(event.target)) close();
	}, true);
	document.addEventListener('reset', event => setTimeout(() => {
		event.target.querySelectorAll('select').forEach(select => { const state = states.get(select); if (state) refresh(state); });
	}, 0));
	window.addEventListener('resize', position);
	window.addEventListener('scroll', event => {
		if (!active || !(event.target instanceof Node) || !active.popup.contains(event.target)) position();
	}, true);
	return {enhance, destroy, refresh(select) { const state = states.get(select); if (state) refresh(state); }};
})();
