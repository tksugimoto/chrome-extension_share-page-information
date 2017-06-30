
const getMessage = (messageName, substitutions) => {
	const message = chrome.i18n.getMessage(messageName, substitutions);
	if (message) {
		return message;
	} else {
		console.warn(`I18n message of "${messageName}" is not found.`);
		return "";
	}
};

const Messages = {
	copy: getMessage("copy"),
	copyCompleted: getMessage("copy_completed")
};

class ShareTemplate {
	constructor(argObject) {
		["id", "selectableElement"].forEach(key => {
			if (typeof argObject[key] === "undefined") {
				throw new Error(`${key}プロパティが必要`);
			}
			this[key] = argObject[key];
		});
		this.type = getMessage(`format_descriptions_${this.id}`);
		// Option
		["accesskey"].forEach(key => {
			if (typeof argObject[key] !== "undefined") {
				this[key] = argObject[key];
			}
		});
		this._loadEnableSetting();
	}
	_loadEnableSetting() {
		const val = localStorage[`enabled_${this.id}`];
		this._enabled = (typeof val === "undefined") || (val === "true");
	}
	_saveEnableSetting() {
		localStorage[`enabled_${this.id}`] = this.enabled;
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
		const element = this.selectableElement.generateElement(data);
		element.classList.add("copy-target");
		const copyButton = createElement("button", {
			id: createCopyButtonId(this.id),
			innerText: Messages.copy,
			style: {
				"float": "right"
			},
			onclick: copy.bind(this)
		});
		if (this.accesskey) {
			copyButton.setAttribute("accesskey", this.accesskey);
			copyButton.title = getMessage("shortcut_by_accesskey", [this.accesskey.toUpperCase()]);
		}
		this._container = createElement("p", {
		}, [
			createElement("span", {
				innerText: this.type
			}),
			copyButton,
			createElement("br"),
			element
		]);
		if (!this.enabled) {
			this._hide();
		}
		parent.appendChild(this._container);

		let timeout_id = null;
		function copy() {
			this._copy();

			if (closeWindowAfterCopiedCheckBox.checked) {
				return window.close();
			}

			if (null !== timeout_id) clearTimeout(timeout_id);
			copyButton.innerText = Messages.copyCompleted;
			timeout_id = setTimeout(() => {
				copyButton.innerText = Messages.copy;
			}, 3000);
			copyButton.focus();
		}
	}
	_hide() {
		this._container.style.display = "none";
	}
	_show() {
		this._container.style.display = "";
	}
	update(data) {
		this.selectableElement.updateElement(data);
	}
	_copy() {
		this.selectableElement.show();
		this.selectableElement.selectElement();
		document.execCommand("copy");
		this.selectableElement.resetDisplay();
	}
}

class SelectableElement {
	generateElement() {
		// 返り値: HTMLElement
		throw new Error("実装が必要です");
	}
	updateElement(data) {
		// 返り値: 無し
		throw new Error("実装が必要です");
	}
	selectElement() {
		throw new Error("実装が必要です");
	}
	show() {
		this._element.style.display = "inline";
	}
	resetDisplay() {
		this._element.style.display = "";
	}
}

class SelectableTextarea extends SelectableElement {
	constructor(format) {
		super();
		this._setupGenerateTextByFormat(format);
	}
	_setupGenerateTextByFormat(format) {
		if (typeof format === "function") {
			this.generateTextByFormat = format;
		} else {
			format = String(format);
			this.generateTextByFormat = data => {
				return format.replace(/{{([a-z]+)}}/ig, (all, name) => {
					return data[name] || "";
				});
			};
		}
	}
	generateElement(data) {
		this._element = createElement("textarea", {
			value: this.generateTextByFormat(data),
			rows: 2,
			spellcheck: false,
			tabIndex: -1,
			style: {
				width: "100%",
				"word-break": "break-all"
			}
		});
		return this._element;
	}
	updateElement(data) {
		this._element.value = this.generateTextByFormat(data);
	}
	selectElement() {
		this._element.select();
	}
}

class SelectableLink extends SelectableElement{
	generateElement({title, url}) {
		this._element = createElement("a", {
			tabIndex: -1,
			innerText: title,
			href: url,
			style: {
				"word-break": "break-all"
			}
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
		id: "title_url",
		accesskey: "t",
		selectableElement: new SelectableTextarea("{{title}}\n{{url}}")
	}),
	new ShareTemplate({
		id: "hiki",
		accesskey: "h",
		selectableElement: new SelectableTextarea("[[{{title}}|{{url}}]]")
	}),
	new ShareTemplate({
		id: "backlog",
		accesskey: "b",
		selectableElement: new SelectableTextarea("[[{{title}}>{{url}}]]")
	}),
	new ShareTemplate({
		id: "markdown",
		accesskey: "m",
		selectableElement: new SelectableTextarea(data => {
			const text = data.title.replace(/\[|\]|\\/g, "\\$&");
			const url = data.url.replace(/\)/g, "\\)");
			let decodedUrl = data.url;
			try {
				decodedUrl = decodeURIComponent(data.url);
			} catch (e) {}
			const tooltip = decodedUrl.replace(/"\)/g, '"\\)');
			return `[${text}](${url} "${tooltip}")`;
		})
	}),
	new ShareTemplate({
		id: "link",
		accesskey: "l",
		selectableElement: new SelectableLink()
	})
];

const titleInput = document.getElementById("title");

chrome.tabs.query({
	active: true,
	currentWindow: true
}, tabs => {
	const tab = tabs[0];
	if (tab.url.match(/^(?:https?|file):/)) {
		const data = {
			url: tab.url,
			title: tab.title
		};
		// Firefox用
		// Firefoxはネットワークドライブの場合/が5つ必要
		// Chromeではfile:の後に/がいくつ並んでもOK
		data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, "file://///$1/");


		const container = document.getElementById("container");
		templates.forEach(template => {
			template.appendTo(data, container);
		});
		setupOpenCopyAction();
		setupEnableSetting();
		
		titleInput.value = data.title;
		titleInput.select();
		function change(e) {
			setTimeout(() => {
				data.title = titleInput.value;
				templates.forEach(template => {
					template.update(data);
				});
			}, 1);
		}
		titleInput.addEventListener("input", change);
	} else {
		document.body.innerText = getMessage("non_supported_page");
	}
});

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

const settingsContainer = document.getElementById("settings");

function setupOpenCopyAction() {
	const LOCALSTORAGE_KEY = "open_copy_action_id";
	const openCopyActionSelect = document.getElementById("open_copy_action");
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
}

{
	const LOCALSTORAGE_KEY = "close_window_after_copied";
	const checkBox = document.getElementById("close_window_after_copied");
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
	const hideCopyTargetCheckBox = document.getElementById("hide_copy_target");
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

function createCopyButtonId(id) {
	return `copy_button-${id}`;
}

function setupEnableSetting() {
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
	document.getElementById("enable_setting").appendChild(enableSettings);
}

function createElement(elem, attrs, childs){
	if (!elem) return null;
	if (typeof elem === "string") elem = document.createElement(elem);
	if (attrs) {
		for (const key_attr in attrs) {
			if (key_attr === "style") {
				const styles = attrs.style;
				if (styles) for (const key_style in styles) elem.style[key_style] = styles[key_style];
			} else if (key_attr === "class") {
				elem.className = attrs.class;
			} else if (key_attr.indexOf("-") !== -1) {
				// data-** etc
				elem.setAttribute(key_attr, attrs[key_attr]);
			} else {
				elem[key_attr] = attrs[key_attr];
			}
		}
	}
	if (childs) {
		if (childs instanceof Array) {
			childs.forEach(child => {
				if (child) {
					if (typeof child === "string") child = document.createTextNode(child);
					elem.appendChild(child);
				}
			});
		} else {
			if (typeof childs === "string") childs = document.createTextNode(childs);
			elem.appendChild(childs);
		}
	}
	return elem;
}

document.querySelectorAll("[data-i18n-innerText]").forEach(elem => {
	const messageKey = elem.getAttribute("data-i18n-innerText");
	const message = chrome.i18n.getMessage(messageKey);
	if (message) {
		elem.innerText = message;
	} else {
		console.warn(`I18n message of "${messageKey}" is not found.`, elem);
	}
});

document.querySelectorAll("[data-i18n-title]").forEach(elem => {
	const messageKey = elem.getAttribute("data-i18n-title");
	const message = chrome.i18n.getMessage(messageKey);
	if (message) {
		elem.title = message;
	} else {
		console.warn(`I18n message of "${messageKey}" is not found.`, elem);
	}
});
