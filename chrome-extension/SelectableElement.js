import util from './util.js';

const createElement = util.createElement;

class SelectableElement extends HTMLElement {
	constructor() {
		super();
	}
	update(/* data */) {
		// 返り値: 無し
		throw new Error('実装が必要です');
	}
	select() {
		throw new Error('実装が必要です');
	}
	show() {
		this.style.display = 'inline';
	}
	resetDisplay() {
		this.style.display = '';
	}
}

class SelectableTextarea extends SelectableElement {
	constructor() {
		super();

		this._textarea = document.createElement('textarea');
		createElement(this._textarea, {
			rows: 2,
			spellcheck: false,
			tabIndex: -1,
			style: {
				width: '100%',
				'word-break': 'break-all',
			},
		});

		const shadowRoot = this.attachShadow({
			mode: 'closed',
		});
		shadowRoot.append(this._textarea);
	}
	update({text, quotationText}) {
		if (quotationText) {
			text += `\n\n${quotationText}`;
		}
		this._textarea.value = text;
	}
	select() {
		this._textarea.select();
	}
}

window.customElements.define('selectable-textarea', SelectableTextarea);

class SelectableLink extends SelectableElement{
	constructor() {
		super();

		this._link = document.createElement('a');
		this._blockquote = document.createElement('blockquote');
		this._pre = document.createElement('pre');

		this.tabIndex = -1;

		this.style.wordBreak = 'break-all';

		const shadowRoot = this.attachShadow({
			mode: 'closed',
		});
		this._container = document.createElement('div');
		this._container.append(this._link);
		this._container.append(this._blockquote);
		this._container.append(this._pre);
		shadowRoot.append(this._container);
	}
	update({text, url, quotationText, useCodeFormat}) {
		this._link.innerText = text;
		this._link.href = url;
		if (quotationText) {
			if (useCodeFormat) {
				this._pre.innerText = quotationText;
				this._pre.style.display = '';
				this._blockquote.innerText = '';
				this._blockquote.style.display = 'none';
			} else {
				this._pre.innerText = '';
				this._pre.style.display = 'none';
				this._blockquote.innerText = quotationText;
				this._blockquote.style.display = '';
			}
		} else {
			this._pre.innerText = '';
			this._pre.style.display = 'none';
			this._blockquote.innerText = '';
			this._blockquote.style.display = 'none';
		}
	}
	select() {
		const range = document.createRange();
		range.selectNodeContents(this._container);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

window.customElements.define('selectable-link', SelectableLink);

export {
	SelectableTextarea,
	SelectableLink,
};
