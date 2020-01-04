import i18n from './i18n.js';
import util from './util.js';
import ShareTemplate from './ShareTemplate.js';
import createCopyButtonId from './createCopyButtonId.js';

const createElement = util.createElement;

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
		}, {
			key: 'escape-parenthesis',
			name: i18n.getMessage('markdown_escape_parenthesis'),
			defaultValue: true,
		}],
		selectableElement: new SelectableTextarea((data, option) => {
			const text = data.title.replace(/\[|\]|\\/g, '\\$&');
			let url = data.url.replace(/\\/g, '\\$&');
			if (option['escape-parenthesis']) {
				url = data.url.replace(/\)/g, '\\$&');
			}
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
