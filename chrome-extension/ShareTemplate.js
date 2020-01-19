import './web-components/check-box.js';
import i18n from './i18n.js';
import util from './util.js';
import createCopyButtonId from './createCopyButtonId.js';

const createElement = util.createElement;

const globalSettings = document.querySelector('global-settings');

const Messages = {
	copy: i18n.getMessage('copy'),
	copyCompleted: i18n.getMessage('copy_completed'),
};

class ShareTemplate {
	constructor(argObject) {
		['id', 'selectableElement'].forEach(key => {
			if (typeof argObject[key] === 'undefined') {
				throw new Error(`${key}プロパティが必要`);
			}
			this[key] = argObject[key];
		});
		this.type = i18n.getMessage(`format_type_${this.id}`);
		this.description = i18n.getMessage(`format_description_${this.id}`);
		// Option
		['accesskey', 'options'].forEach(key => {
			if (typeof argObject[key] !== 'undefined') {
				this[key] = argObject[key];
			}
		});
		this.optionObject = {};
		this._loadEnableSetting();
	}
	_loadEnableSetting() {
		if (typeof localStorage[`enabled_${this.id}`] !== 'undefined') {
			// 旧形式の設定が残っている場合は移行
			localStorage[`enabled.${this.id}`] = localStorage[`enabled_${this.id}`];
			delete localStorage[`enabled_${this.id}`];
		}
		const val = localStorage[`enabled.${this.id}`];
		this._enabled = (typeof val === 'undefined') || (val === 'true');
	}
	_saveEnableSetting() {
		localStorage[`enabled.${this.id}`] = this.enabled;
	}
	get enabled() {
		return this._enabled;
	}
	set enabled(val) {
		this._enabled = !!val;
		this._saveEnableSetting();
		if (this._enabled) {
			this._show();
		} else {
			this._hide();
		}
	}
	appendTo(data, parent) {
		this._latestData = data;
		const optionContainer = this.options && (() => {
			const optionsFragment = document.createDocumentFragment();
			this.options.forEach(option => {
				const localStorageKey = `options.${this.id}.${option.key}`;
				const savedValueString = localStorage[localStorageKey];
				const checkBox = createElement('check-box', {
					innerText: option.name,
					checked: savedValueString ? savedValueString === 'true' : !!option.defaultValue,
				});
				checkBox.addEventListener('change', () => {
					localStorage[localStorageKey] = checkBox.checked;
					this.update();
				});
				optionsFragment.appendChild(checkBox);
				Object.defineProperty(this.optionObject, option.key, {
					get() {
						return checkBox.checked;
					},
				});
			});
			const _optionContainer = createElement('div');
			_optionContainer.appendChild(optionsFragment);
			return _optionContainer;
		})();

		const element = this.selectableElement.generateElement(data, this.optionObject);
		element.classList.add('copy-target');

		const copy = (() => {
			let timeout_id = null;
			return () => {
				this._copy();

				if (globalSettings.closeWindowAfterCopied) {
					return window.close();
				}

				if (null !== timeout_id) clearTimeout(timeout_id);
				copyButton.innerText = Messages.copyCompleted;
				timeout_id = setTimeout(() => {
					copyButton.innerText = Messages.copy;
				}, 3000);
				copyButton.focus();
			};
		})();

		const copyButton = createElement('button', {
			id: createCopyButtonId(this.id),
			innerText: Messages.copy,
			onclick: copy,
		});
		if (this.accesskey) {
			copyButton.setAttribute('accesskey', this.accesskey);
			copyButton.title = i18n.getMessage('shortcut_by_accesskey', [this.accesskey.toUpperCase()]);
		}
		this._container = createElement('div', {
			class: 'share-item',
		}, [
			createElement('div', {
				'data-content-name': 'type',
				innerText: this.type,
			}),
			createElement('div', {
				'data-content-name': 'description',
				innerText: this.description,
			}),
			createElement('div', {
				'data-content-name': 'copy-button',
			}, copyButton),
			createElement(optionContainer, {
				'data-content-name': 'options',
			}),
			createElement(element, {
				'data-content-name': 'element',
			}),
		]);
		if (!this.enabled) {
			this._hide();
		}
		parent.appendChild(this._container);
	}
	_hide() {
		this._container.style.display = 'none';
	}
	_show() {
		this._container.style.display = '';
	}
	update(data = this._latestData) {
		this._latestData = data;
		this.selectableElement.updateElement(data, this.optionObject);
	}
	_copy() {
		this.selectableElement.show();
		this.selectableElement.selectElement();
		document.execCommand('copy');
		this.selectableElement.resetDisplay();
	}
}

export default ShareTemplate;
