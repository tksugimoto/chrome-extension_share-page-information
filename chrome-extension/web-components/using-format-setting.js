import './check-box.js';
import util from '../util.js';
import {
	updateContextMenus,
 } from '../ContextMenuUtil.js';

const templateHTML = `
	<ul id="using_format_container"></ul>
`;

class UsingFormatSetting extends HTMLElement {
	constructor() {
		super();

		this._shadowRoot = this.attachShadow({
			mode: 'closed',
		});

		this._shadowRoot.innerHTML = templateHTML;
	}

	setup(templates) {
		const liContainer = document.createDocumentFragment();
		templates.forEach(template => {
			const checkBox = util.createElement('check-box', {
				tabIndex: -1,
				checked: template.enabled,
			}, [
				template.type,
			]);
			checkBox.addEventListener('change', evt => {
				template.enabled = evt.checked;
				updateContextMenus();
			});
			template.addEventListener('change-enabled', evt => {
				checkBox.checked = evt.enabled;
			});
			const li = util.createElement('li', {}, checkBox);
			liContainer.appendChild(li);
		});
		this._shadowRoot.getElementById('using_format_container').appendChild(liContainer);
	}
}

window.customElements.define('using-format-setting', UsingFormatSetting);
