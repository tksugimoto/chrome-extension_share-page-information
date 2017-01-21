
class ShareTemplate {
	constructor(argObject) {
		["id", "type", "selectableElement"].forEach(key => {
			if (typeof argObject[key] === "undefined") {
				throw new Error(`${key}プロパティが必要`);
			}
			this[key] = argObject[key];
		});
	}
	appendTo(data, parent) {
		const element = this.selectableElement.generateElement(data);
		const copyButton = createElement("button", {
			id: createCopyButtonId(this.id),
			innerText: "コピー",
			style: {
				"float": "right"
			},
			onclick: copy.bind(this)
		});
		parent.appendChild(createElement("p", {
		}, [
			createElement("span", {
				innerText: this.type
			}),
			copyButton,
			createElement("br"),
			element
		]));

		let timeout_id = null;
		function copy() {
			this._copy(element);

			if (null !== timeout_id) clearTimeout(timeout_id);
			copyButton.innerText = "コピー完了";
			timeout_id = setTimeout(() => {
				copyButton.innerText = "コピー";
			}, 3000);
			copyButton.focus();
		}
	}
	_copy(element) {
		this.selectableElement.selectElement(element);
		document.execCommand("copy");
	}
}

class SelectableElement {
	generateElement() {
		// 返り値: HTMLElement
		throw new Error("実装が必要です");
	}
	selectElement(element) {
		throw new Error("実装が必要です");
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
		return createElement("textarea", {
			value: this.generateTextByFormat(data),
			rows: 5,
			spellcheck: false,
			tabIndex: -1,
			style: {
				width: "100%",
				"word-break": "break-all"
			}
		});
	}
	selectElement(element) {
		element.select();
	}
}

class SelectableLink extends SelectableElement{
	generateElement({title, url}) {
		return createElement("a", {
			tabIndex: -1,
			innerText: title,
			href: url
		});
	}
	selectElement(element) {
		const range = document.createRange();
		range.selectNodeContents(element);
		const selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
	}
}

const templates = [
	new ShareTemplate({
		id: "title_url",
		type: "タイトル + URL\n タイトル<改行>URL",
		selectableElement: new SelectableTextarea("{{title}}\n{{url}}")
	}),
	new ShareTemplate({
		id: "hiki",
		type: "Hiki (Wikiクローン) \n [[リンクテキスト: タイトル|リンク先: URL]]",
		selectableElement: new SelectableTextarea("[[{{title}}|{{url}}]]")
	}),
	new ShareTemplate({
		id: "markdown",
		type: "Markdown\n [リンクテキスト: タイトル](リンク先: URL \"Tooltip: URL(decoded)\")",
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
		type: "リンク",
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
		function create(data) {
			templates.forEach(template => {
				template.appendTo(data, container);
			});
		}

		create(data);
		setupOpenCopyAction();
		
		titleInput.value = data.title;
		titleInput.select();
		function change(e) {
			setTimeout(() => {
				data.title = titleInput.value;
				container.innerText = "";
				create(data);
			}, 1);
		}
		titleInput.addEventListener("input", change);
	} else {
		document.body.innerText = "非対応ページ";
	}
});

function setupOpenCopyAction() {
	const openCopyActionSelect = document.getElementById("open_copy_action");
	const openCopyActionOptions =  document.createDocumentFragment();
	templates.forEach(template => {
		const id = template.id;
		const selected = id === localStorage["open_copy_action_id"];

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
		localStorage["open_copy_action_id"] = selectedValue;
	});
}

function createCopyButtonId(id) {
	return `copy_button-${id}`;
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
