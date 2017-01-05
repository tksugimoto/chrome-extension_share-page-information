
const templates = [
	{
		type: "タイトル + URL\n タイトル<改行>URL",
		format: "{{title}}\n{{url}}"
	}, {
		type: "Hiki (Wikiクローン) \n [[リンクテキスト: タイトル|リンク先: URL]]",
		format: "[[{{title}}|{{url}}]]"
	}, {
		type: "Markdown\n [リンクテキスト: タイトル](リンク先: URL \"Tooltip: URL(decoded)\")",
		format: data => {
			const text = data.title.replace(/\[|\]|\\/g, "\\$&");
			const url = data.url.replace(/\)/g, "\\)");
			let decodedUrl = data.url;
			try {
				decodedUrl = decodeURIComponent(data.url);
			} catch (e) {}
			const tooltip = decodedUrl.replace(/"\)/g, '"\\)');
			return `[${text}](${url} "${tooltip}")`;
		}
	}, {
		type: "リンク",
		format: data => {
			return createElement("a", {
				tabIndex: -1,
				innerText: data.title,
				href: data.url
			});
		},
		select: element => {
			const range = document.createRange();
			range.selectNodeContents(element);
			const selection = window.getSelection();
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}
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
		create(data);
		
		titleInput.value = data.title;
		titleInput.select();
		let oldValue = titleInput.value;
		titleInput.onkeypress = () => {
			data.title = oldValue = titleInput.value;
			create(data);
		};
		window.setInterval(() => {
			// 右クリックからの貼付けなど
			if (oldValue !== titleInput.value) {
				data.title = oldValue = titleInput.value;
				create(data);
			}
		}, 50);
	} else {
		document.body.innerText = "非対応ページ";
	}
});

function create(data) {
	container.innerText = "";

	templates.forEach(template => {
		if (typeof template.format === "function") {
			const target = template.format(data);
			display(template.type, target, template.select);
		} else if (typeof template.format === "string") {
			const str = template.format.replace(/{{([a-z]+)}}/ig, (all, name) => {
				return data[name] || "";
			});
			display(template.type, str);
		}
	});
}

const container = document.getElementById("container");
function display(type, target, select) {
	if (!type || !target) return;
	const element = (typeof target !== "string") ? target : createElement("textarea", {
		value: target,
		rows: 5,
		spellcheck: false,
		tabIndex: -1,
		style: {
			width: "100%",
			"word-break": "break-all"
		}
	});
	const copyButton = createElement("button", {
		innerText: "コピー",
		style: {
			"float": "right"
		},
		onclick: copy
	});
	container.appendChild(createElement("p", {
	}, [
		createElement("span", {
			innerText: type
		}),
		copyButton,
		createElement("br"),
		element
	]));

	if (typeof select !== "function") {
		select = textarea => {
			textarea.select();
		}
	}

	let timeout_id = null;
	function copy(){
		select(element);
		document.execCommand("copy", null, null);

		if (null !== timeout_id) clearTimeout(timeout_id);
		copyButton.innerText = "コピー完了";
		timeout_id = setTimeout(() => {
			copyButton.innerText = "コピー";
		}, 3000);
		copyButton.focus();
	}
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
