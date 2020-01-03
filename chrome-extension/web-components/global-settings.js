/* global i18n, util */
const templateHTML = `
	<style>
		:host {
			position: fixed;
			right: 0;
			top: 0;
			background: lightyellow;
			border: 2px black solid;
			border-radius: 5px;
			overflow: auto;
			box-sizing: border-box;
			max-height: 100%;
			direction: rtl;
		}
		* {
			direction: ltr;
		}
		h1 {
			font-size: 1em;
			text-align: center;
		}
		#details {
			overflow: hidden;
			max-width: 0;
			max-height: 0;
		}
		:host(:hover) {
			padding: 5px;
			border-radius: 10px;
		}
		:host(:hover) #details {
			white-space: nowrap;
			transition-duration: 1s;
			transition-timing-function: ease-out;
			max-width: 1500px;
			max-height: 500px;
		}
		* {
			margin: 0;
		}
		.setting {
			margin-top: 20px;
		}
		.setting-title {
			margin: 0;
			font-weight: bold;
			font-size: 1.2em;
		}


		:host([data-close_window_after_copied="true"]) #open_copy_action {
			pointer-events: none;
		}
		:host([data-close_window_after_copied="true"]) #open_copy_action,
		:host(:not([data-open_copy_action_id=""])) #close_window_after_copied {
			color: gray;
		}
		:host(:not([data-open_copy_action_id=""])) #close_window_after_copied:hover:after {
			content: attr(data-can_not_change_setting_by_other_setting_value);
			position: absolute;
			right: 0;
			left: 0;
			text-align: center;
			color: white;
			background-color: dimgray;
		}

		.annotation {
			font-size: 70%;
		}
		.annotation:before {
			content: "※ ";
		}
	</style>
	<h1 data-i18n-innerText="settings">設定</h1>
	<div id="details">
		<div class="setting">
			<h2
				class="setting-title"
				data-i18n-innerText="auto_copy_when_popup_open"
			>
				ポップアップを開いたときにコピー
			</h2>
			<select
				id="open_copy_action"
				tabindex="-1"
			>
				<option value="" data-i18n-innerText="do_not_copy">コピーしない</option>
			</select>
			<p
				class="annotation"
				data-i18n-innerText="can_not_use_with_close_popup_window_after_copied"
			>
				コピー完了時にポップアップを閉じる設定とは併用不可
			</p>
		</div>
		<div class="setting">
			<h2
				class="setting-title"
				data-i18n-innerText="after_copied"
				>コピー完了時</h2>
			<check-box
				tabindex="-1"
				id="close_window_after_copied"
				data-i18n-innerText="close_popup_window"
				data-i18n-data="can_not_change_setting_by_other_setting_value, can_not_change_setting_by_other_setting_value"
				>ポップアップを閉じる</check-box>
		</div>
		<div class="setting">
			<h2
				class="setting-title"
				data-i18n-innerText="compactification"
				>表示のコンパクト化</h2>
			<check-box
				tabindex="-1"
				id="hide_copy_target"
				data-i18n-innerText="hide_copy_target"
				>コピー対象を非表示にする</check-box>
		</div>
		<div class="setting">
			<h2
				class="setting-title"
				data-i18n-innerText="display_format"
				>表示する書式</h2>
			<ul id="enable_setting"></ul>
		</div>
	</div>
`;

(function (window, document) {
	'use strict';

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

			shadowRoot.innerHTML = templateHTML;

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
					innerText: template.type,
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
					template.type,
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
