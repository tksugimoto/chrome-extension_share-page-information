import util from './util.js';

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

export {
	SelectableTextarea,
	SelectableLink,
};
