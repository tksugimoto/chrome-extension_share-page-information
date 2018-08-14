/* global i18n, util */
const createElement = util.createElement;

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
				const checkBox = createElement('check-box', {
					innerText: option.name,
					checked: localStorage[localStorageKey] === 'true',
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

class SelectableElement {
	generateElement() {
		// 返り値: HTMLElement
		throw new Error('実装が必要です');
	}
	updateElement(/* data */) {
		// 返り値: 無し
		throw new Error('実装が必要です');
	}
	selectElement() {
		throw new Error('実装が必要です');
	}
	show() {
		this._element.style.display = 'inline';
	}
	resetDisplay() {
		this._element.style.display = '';
	}
}

class SelectableTextarea extends SelectableElement {
	constructor(format) {
		super();
		this._setupGenerateTextByFormat(format);
	}
	_setupGenerateTextByFormat(format) {
		if (typeof format === 'function') {
			this.generateTextByFormat = format;
		} else {
			format = String(format);
			this.generateTextByFormat = data => {
				return format.replace(/{{([a-z]+)}}/ig, (all, name) => {
					return data[name] || '';
				});
			};
		}
	}
	generateElement(data, optionObject) {
		this._element = createElement('textarea', {
			value: this.generateTextByFormat(data, optionObject),
			rows: 2,
			spellcheck: false,
			tabIndex: -1,
			style: {
				width: '100%',
				'word-break': 'break-all',
			},
		});
		return this._element;
	}
	updateElement(data, optionObject) {
		this._element.value = this.generateTextByFormat(data, optionObject);
	}
	selectElement() {
		this._element.select();
	}
}

class SelectableLink extends SelectableElement{
	generateElement({title, url}) {
		this._element = createElement('a', {
			tabIndex: -1,
			innerText: title,
			href: url,
			style: {
				'word-break': 'break-all',
			},
		});
		return this._element;
	}
	updateElement({title, url}) {
		this._element.innerText = title;
		this._element.href = url;
	}
	selectElement() {
		const range = document.createRange();
		range.selectNodeContents(this._element);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

const templates = [
	new ShareTemplate({
		id: 'title_url',
		accesskey: 't',
		selectableElement: new SelectableTextarea('{{title}}\n{{url}}'),
	}),
	new ShareTemplate({
		id: 'hiki',
		accesskey: 'h',
		selectableElement: new SelectableTextarea('[[{{title}}|{{url}}]]'),
	}),
	new ShareTemplate({
		id: 'backlog',
		accesskey: 'b',
		selectableElement: new SelectableTextarea('[[{{title}}>{{url}}]]'),
	}),
	new ShareTemplate({
		id: 'markdown',
		accesskey: 'm',
		options: [{
			key: 'exclude-tooltip',
			name: i18n.getMessage('exclude_tooltip'),
		}],
		selectableElement: new SelectableTextarea((data, option) => {
			const text = data.title.replace(/\[|\]|\\/g, '\\$&');
			const url = data.url.replace(/\)|\\/g, '\\$&');
			if (option['exclude-tooltip']) {
				return `[${text}](${url})`;
			}
			let decodedUrl = data.url;
			try {
				decodedUrl = decodeURIComponent(data.url);
			} catch (e) {}
			const tooltip = decodedUrl.replace(/"\)/g, '"\\)');
			return `[${text}](${url} "${tooltip}")`;
		}),
	}),
	new ShareTemplate({
		id: 'link',
		accesskey: 'l',
		selectableElement: new SelectableLink(),
	}),
];

const globalSettings = document.querySelector('global-settings');
const titleInput = document.getElementById('title');

chrome.tabs.query({
	active: true,
	currentWindow: true,
}, tabs => {
	const tab = tabs[0];
	if (tab.url.match(/^(?:https?|file):/)) {
		const data = {
			url: tab.url,
			title: tab.title,
		};
		// Firefox用
		// Firefoxはネットワークドライブの場合/が5つ必要
		// Chromeではfile:の後に/がいくつ並んでもOK
		data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, 'file://///$1/');


		const container = document.getElementById('container');
		templates.forEach(template => {
			template.appendTo(data, container);
		});
		globalSettings.setupOpenCopyAction(templates, {
			createCopyButtonId,
		});
		globalSettings.setupEnableSetting(templates);

		titleInput.value = data.title;
		titleInput.select();
		const change = () => {
			setTimeout(() => {
				data.title = titleInput.value;
				templates.forEach(template => {
					template.update(data);
				});
			}, 1);
		};
		titleInput.addEventListener('input', change);
	} else {
		document.body.innerText = i18n.getMessage('non_supported_page');
	}
});


function createCopyButtonId(id) {
	return `copy_button-${id}`;
}



i18n.setup(document);

{
	const dataKey = 'data-show-accesskey';
	document.body.addEventListener('keydown', ({key}) => {
		if (key === 'Alt') {
			document.body.setAttribute(dataKey, 'true');
		}
	});
	document.body.addEventListener('keyup', ({key}) => {
		if (key === 'Alt') {
			document.body.removeAttribute(dataKey);
		}
	});
}
