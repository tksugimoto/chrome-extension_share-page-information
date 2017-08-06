(function (window, document) {
	"use strict";

	const ownerDocument = document.currentScript.ownerDocument;

	const template = ownerDocument.querySelector("template").content;

	class GlobalSettingsElement extends HTMLElement {
		constructor() {
			super();

			const shadowRoot = this.attachShadow({
				mode: "closed",
			});

			const clone = template.cloneNode(true);
			shadowRoot.appendChild(clone);

			setupGlobalSettings(shadowRoot);
		}
	}

	window.customElements.define("global-settings", GlobalSettingsElement);
})(window, document);
