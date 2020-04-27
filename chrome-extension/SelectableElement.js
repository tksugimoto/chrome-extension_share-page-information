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

		this._textarea = createElement('textarea', {
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
	update({text}) {
		this._textarea.value = text;
	}
	selectElement() {
		this._textarea.select();
	}
}

window.customElements.define('selectable-textarea', SelectableTextarea);

class SelectableLink extends SelectableElement{
	constructor() {
		super();

		this._link = createElement('a', {
			tabIndex: -1,
		});

		this.style.wordBreak = 'break-all';

		const shadowRoot = this.attachShadow({
			mode: 'closed',
		});
		shadowRoot.append(this._link);
	}
	update({text, url}) {
		this._link.innerText = text;
		this._link.href = url;
	}
	selectElement() {
		const range = document.createRange();
		range.selectNodeContents(this._link);
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
