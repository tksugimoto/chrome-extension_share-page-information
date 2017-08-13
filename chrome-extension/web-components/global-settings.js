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

	const setupGlobalSettings = (shadowRoot) => {
		const canChangeSetting = (key, value) => {
			if (key === "close_window_after_copied" && value === "true") {
				return !localStorage["open_copy_action_id"];
			}

			if (key === "open_copy_action_id" && value) {
				return localStorage["close_window_after_copied"] !== "true"
			}

			return true;
		};

		// ポップアップが自動で閉じて設定変更できなくなる設定値を自動修正
		if (localStorage["close_window_after_copied"] === "true") {
			delete localStorage["open_copy_action_id"];
		}

		const settingsContainer = shadowRoot.getElementById("settings");

		window.setupOpenCopyAction = (templates, { createCopyButtonId }) => {
			const LOCALSTORAGE_KEY = "open_copy_action_id";
			const openCopyActionSelect = shadowRoot.getElementById("open_copy_action");
			const openCopyActionOptions = document.createDocumentFragment();
			templates.forEach(template => {
				const id = template.id;
				const selected = id === localStorage[LOCALSTORAGE_KEY];

				const option = createElement("option", {
					value: template.id,
					innerText: template.type.replace(/\n.*/, ""),
					selected: selected
				});
				openCopyActionOptions.appendChild(option);

				if (selected) {
					document.getElementById(createCopyButtonId(id)).onclick();
				}
			});
			openCopyActionSelect.appendChild(openCopyActionOptions);
			openCopyActionSelect.addEventListener("change", evt => {
				const selectedValue = openCopyActionSelect.selectedOptions[0].value;
				if (canChangeSetting(LOCALSTORAGE_KEY, selectedValue)) {
					localStorage[LOCALSTORAGE_KEY] = selectedValue;
				} else {
					openCopyActionSelect.value = "";
				}
				settingsContainer.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || "");
			});
			settingsContainer.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || "");
		};

		{
			const LOCALSTORAGE_KEY = "close_window_after_copied";
			const checkBox = shadowRoot.getElementById("close_window_after_copied");
			checkBox.checked = localStorage[LOCALSTORAGE_KEY] === "true";
			checkBox.addEventListener("change", ({checked}) => {
				const value = String(checked);
				if (canChangeSetting(LOCALSTORAGE_KEY, value)) {
					localStorage[LOCALSTORAGE_KEY] = value;
				} else {
					checkBox.checked = false;
				}
				settingsContainer.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || "");
			});
			settingsContainer.setAttribute(`data-${LOCALSTORAGE_KEY}`, localStorage[LOCALSTORAGE_KEY] || "");
			window.closeWindowAfterCopiedCheckBox = checkBox;
		}

		{
			const LOCALSTORAGE_KEY = "hide_copy_target";
			const HIDE_COPY_TARGET_CLASSNAME = "hide-copy-target";
			const hideCopyTargetCheckBox = shadowRoot.getElementById("hide_copy_target");
			hideCopyTargetCheckBox.checked = localStorage[LOCALSTORAGE_KEY] === "true";
			if (hideCopyTargetCheckBox.checked) {
				document.body.classList.add(HIDE_COPY_TARGET_CLASSNAME);
			}
			hideCopyTargetCheckBox.addEventListener("change", ({checked}) => {
				localStorage[LOCALSTORAGE_KEY] = String(checked);
				const method = checked ? "add" : "remove";
				document.body.classList[method](HIDE_COPY_TARGET_CLASSNAME);
			});
		}

		window.setupEnableSetting = (templates) => {
			const enableSettings = document.createDocumentFragment();
			templates.forEach(template => {
				const checkBox = createElement("check-box", {
					tabIndex: -1,
					checked: template.enabled
				}, [
					template.type.replace(/\n.*/, "")
				]);
				checkBox.addEventListener("change", evt => {
					template.enabled = evt.checked;
				});
				const li = createElement("li", {}, checkBox);
				enableSettings.appendChild(li);
			});
			shadowRoot.getElementById("enable_setting").appendChild(enableSettings);
		};
	};

	window.customElements.define("global-settings", GlobalSettingsElement);
})(window, document);
