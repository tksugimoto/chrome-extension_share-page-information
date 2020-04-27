import util from './util.js';

const createElement = util.createElement;

class SelectableElement extends HTMLElement {
	constructor() {
		super();
	}
	updateElement(/* data */) {
		// 返り値: 無し
		throw new Error('実装が必要です');
	}
	selectElement() {
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

		this._element = createElement('textarea', {
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
		shadowRoot.append(this._element);
	}
	updateElement({text}) {
		this._element.value = text;
	}
	selectElement() {
		this._element.select();
	}
}

window.customElements.define('selectable-textarea', SelectableTextarea);

class SelectableLink extends SelectableElement{
	constructor() {
		super();

		this._element = createElement('a', {
			tabIndex: -1,
			style: {
				'word-break': 'break-all',
			},
		});

		const shadowRoot = this.attachShadow({
			mode: 'closed',
		});
		shadowRoot.append(this._element);
	}
	updateElement({text, url}) {
		this._element.innerText = text;
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

window.customElements.define('selectable-link', SelectableLink);

export {
	SelectableTextarea,
	SelectableLink,
};
