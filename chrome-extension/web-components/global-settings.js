/* global i18n, util */
(function (window, document) {
	'use strict';

	const ownerDocument = document.currentScript.ownerDocument;

	const templateContent = ownerDocument.querySelector('template').content;

	const fixConflictedSetting = () => {
		// ポップアップが自動で閉じて設定変更できなくなる設定値を自動修正
		if (localStorage['close_window_after_copied'] === 'true') {
			delete localStorage['open_copy_action_id'];
		}
	};

	const canChangeSetting = (key, value) => {
		if (key === 'close_window_after_copied' && value === 'true') {
			return !localStorage['open_copy_action_id'];
		}

		if (key === 'open_copy_action_id' && value) {
			return localStorage['close_window_after_copied'] !== 'true';
		}

		return true;
	};

	class GlobalSettingsElement extends HTMLElement {
		constructor() {
			super();

			const shadowRoot = this.attachShadow({
				mode: 'open',
			});

			const clone = templateContent.cloneNode(true);
			shadowRoot.appendChild(clone);

			fixConflictedSetting();
			this._setupCloseWindowSetting();
			this._setupHideTarget();
			i18n.setup(shadowRoot);
		}

		setupOpenCopyAction(templates, { createCopyButtonId }) {
			const LOCALSTORAGE_KEY = 'open_copy_action_id';
			const openCopyActionSelect = this.shadowRoot.getElementById('open_copy_action');
			const openCopyActionOptions = document.createDocumentFragment();
			templates.forEach(template => {
				const id = template.id;
				const selected = id === localStorage[LOCALSTORAGE_KEY];

				const option = util.createElement('option', {
					value: template.id,
					innerText: template.type.replace(/\n.*/, ''),
					selected,
				});
				openCopyActionOptions.appendChild(option);

				if (selected) {
					document.getElementById(createCopyButtonId(id)).onclick();
				}
			});
			openCopyActionSelect.appendChild(openCopyActionOptions);
			openCopyActionSelect.addEventListener('change', () => {
				const selectedValue = openCopyActionSelect.selectedOptions[0].value;
				if (canChangeSetting(LOCALSTORAGE_KEY, selectedValue)) {
					localStorage[LOCALSTORAGE_KEY] = selectedValue;
				} else {
					openCopyActionSelect.value = '';
				}
				this.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || '');
			});
			this.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || '');
		}
		
		setupEnableSetting(templates) {
			const enableSettings = document.createDocumentFragment();
			templates.forEach(template => {
				const checkBox = util.createElement('check-box', {
					tabIndex: -1,
					checked: template.enabled,
				}, [
					template.type.replace(/\n.*/, ''),
				]);
				checkBox.addEventListener('change', evt => {
					template.enabled = evt.checked;
				});
				const li = util.createElement('li', {}, checkBox);
				enableSettings.appendChild(li);
			});
			this.shadowRoot.getElementById('enable_setting').appendChild(enableSettings);
		}

		_setupCloseWindowSetting() {
			const LOCALSTORAGE_KEY = 'close_window_after_copied';
			const checkBox = this.shadowRoot.getElementById('close_window_after_copied');
			checkBox.checked = localStorage[LOCALSTORAGE_KEY] === 'true';
			checkBox.addEventListener('change', ({checked}) => {
				const value = String(checked);
				if (canChangeSetting(LOCALSTORAGE_KEY, value)) {
					localStorage[LOCALSTORAGE_KEY] = value;
				} else {
					checkBox.checked = false;
				}
				this.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || '');
			});
			this.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || '');
		}

		get closeWindowAfterCopied() {
			return this.shadowRoot.getElementById('close_window_after_copied').checked;
		}

		_setupHideTarget() {
			const LOCALSTORAGE_KEY = 'hide_copy_target';
			const HIDE_COPY_TARGET_CLASSNAME = 'hide-copy-target';
			const hideCopyTargetCheckBox = this.shadowRoot.getElementById('hide_copy_target');
			hideCopyTargetCheckBox.checked = localStorage[LOCALSTORAGE_KEY] === 'true';
			if (hideCopyTargetCheckBox.checked) {
				document.body.classList.add(HIDE_COPY_TARGET_CLASSNAME);
			}
			hideCopyTargetCheckBox.addEventListener('change', ({checked}) => {
				localStorage[LOCALSTORAGE_KEY] = String(checked);
				const method = checked ? 'add' : 'remove';
				document.body.classList[method](HIDE_COPY_TARGET_CLASSNAME);
			});
		}
	}

	window.customElements.define('global-settings', GlobalSettingsElement);
})(window, document);