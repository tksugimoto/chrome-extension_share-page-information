import './web-components/check-box.js';
import i18n from './i18n.js';
import util from './util.js';

const createElement = util.createElement;

const Messages = {
	copy: i18n.getMessage('copy'),
	copyCompleted: i18n.getMessage('copy_completed'),
};

const QuotationType = {
	CODE: 'code',
	QUOTATION: 'quotation',
};

class ShareTemplate extends EventTarget {
	static get QuotationType() {
		return QuotationType;
	}
	constructor(argObject) {
		super();
		['id', 'selectableElement', 'format'].forEach(key => {
			if (typeof argObject[key] === 'undefined') {
				throw new Error(`${key}プロパティが必要`);
			}
			this[key] = argObject[key];
		});
		if (typeof this.format !== 'function') {
			const format = String(this.format);
			this.format = data => {
				const text = format.replace(/{{([a-z]+)}}/ig, (all, name) => {
					return data[name] || '';
				});
				return {
					text,
				};
			};
		}
		this.type = i18n.getMessage(`format_type_${this.id}`);
		this.description = i18n.getMessage(`format_description_${this.id}`);
		// Option
		['accesskey', 'options', 'quotationFormat'].forEach(key => {
			if (typeof argObject[key] !== 'undefined') {
				this[key] = argObject[key];
			}
		});
		this.optionObject = {};
		this._loadEnableSetting();
		this._listenStorageChange();
	}
	_listenStorageChange() {
		window.addEventListener('storage', ({ key, newValue }) => {
			if (key === null) {
				// localStorage.clear()
				return this._updateEnabled(true, { fromOtherPage: true });
			}
			if (key === `enabled.${this.id}`) {
				this._updateEnabled(newValue === 'true', { fromOtherPage: true });
			}
		});
	}
	get quotationSupported() {
		return !!this.quotationFormat;
	}
	_loadEnableSetting() {
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
		this._updateEnabled(val);
		this._saveEnableSetting();
	}
	_updateEnabled(val, {
		fromOtherPage = false,
	} = {}) {
		this._enabled = !!val;
		if (this._enabled) {
			this._show();
		} else {
			this._hide();
		}
		if (fromOtherPage) {
			const event = new CustomEvent('change-enabled');
			event.enabled = this.enabled;
			this.dispatchEvent(event);
		}
	}
	appendTo(parent, {
		copyCallBack,
	} = {}) {
		const optionContainer = this.options && (() => {
			const optionsFragment = document.createDocumentFragment();
			this.options.forEach(option => {
				const localStorageKey = `options.${this.id}.${option.key}`;
				const savedValueString = localStorage[localStorageKey];
				const checkBox = createElement('check-box', {
					innerText: option.name,
					checked: savedValueString ? savedValueString === 'true' : !!option.defaultValue,
				});
				this.optionObject[option.key] = checkBox.checked;
				checkBox.addEventListener('change', () => {
					localStorage[localStorageKey] = checkBox.checked;
					this.optionObject[option.key] = checkBox.checked;
					this.update();
				});
				optionsFragment.appendChild(checkBox);
			});
			const _optionContainer = createElement('div');
			_optionContainer.appendChild(optionsFragment);
			return _optionContainer;
		})();

		const element = this.selectableElement;
		element.classList.add('copy-target');

		const copyAndAnimate = (() => {
			let timeout_id = null;
			return () => {
				this.copy();

				if (copyCallBack) {
					copyCallBack();
				}

				if (null !== timeout_id) clearTimeout(timeout_id);
				copyButton.innerText = Messages.copyCompleted;
				timeout_id = setTimeout(() => {
					copyButton.innerText = Messages.copy;
				}, 3000);
				copyButton.focus();
			};
		})();
		this.clickCopyButton = copyAndAnimate;

		const copyButton = createElement('button', {
			innerText: Messages.copy,
			onclick: copyAndAnimate,
		});
		if (this.accesskey) {
			copyButton.setAttribute('accesskey', this.accesskey);
			copyButton.title = i18n.getMessage('shortcut_by_accesskey', [this.accesskey]);
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
		if (!this._container) return;
		this._container.style.display = 'none';
	}
	_show() {
		if (!this._container) return;
		this._container.style.display = '';
	}
	update(data = this._latestData, {
		selectionText,
	} = {}) {
		this._latestData = data;
		const optionObject = Object.freeze(Object.assign({}, this.optionObject));
		const formatted = this.format(data, optionObject);
		if (selectionText && this.quotationSupported) {
			const useCodeFormat = localStorage['use_code_format_for_quoting'] === 'true';
			const quotationFormat = this.quotationFormat[useCodeFormat ? QuotationType.CODE : QuotationType.QUOTATION];
			formatted.quotationText = quotationFormat(selectionText.trimEnd());
			formatted.useCodeFormat = useCodeFormat;
		}
		this.selectableElement.update(formatted);
	}
	copy() {
		this._show();
		this.selectableElement.show();
		this.selectableElement.select();
		document.execCommand('copy');
		this.selectableElement.resetDisplay();
		if (!this.enabled) this._hide();
	}
}

export default ShareTemplate;
