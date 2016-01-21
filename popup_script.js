
var templates = [
    {
        type: "タイトル + URL\n タイトル<改行>URL",
        format: "{{title}}\n{{url}}"
    }, {
        type: "Wiki (Hiki) \n [[タイトル|URL]]",
        format: "[[{{title}}|{{url}}]]"
    }, {
        type: "マークダウン\n [リンクテキスト](URL \"タイトル(tooltip)\")",
        format: function (data) {
            var text = data.title.replace(/\]/g, "\\]");
            var url = data.url.replace(/\)/g, "\\)");
            var decodedUrl = data.url;
            try {
                decodedUrl = decodeURIComponent(data.url);
            } catch (e) {}
            var tooltip = decodedUrl.replace(/"\)/g, '"\\)');
            return `[${text}](${url} "${tooltip}")`;
        }
    }
];

var titleInput = document.getElementById("title");


chrome.tabs.getSelected(null, function (tab) {
    if (tab.url.match(/^(?:https?|file):/)) {
        var data = {
            url: tab.url,
            title: tab.title
        };
        create(data);
        
        titleInput.value = data.title;
        titleInput.select();
        titleInput.onkeyup = function () {
            data.title = this.value;
            create(data);
        };
    } else {
        document.body.innerText = "非対応ページ";
    }
});

function create(data) {
    container.innerText = "";
    templates.forEach(function (template) {
        if (typeof template.format === "function") {
            var str = template.format(data);
            display(template.type, str);
        } else if (typeof template.format === "string") {
            var str = template.format.replace(/{{([a-z]+)}}/ig, function (all, name) {
                return data[name] || "";
            });
            display(template.type, str);
        }
    });
}

var container = document.getElementById("container");
function display(type, str) {
    if (!type || !str) return;
    var textarea = createElement("textarea", {
        value: str,
        rows: 5,
        style: {
            width: "100%"
        }
    });
    var copyButton = createElement("button", {
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
        createElement("button", {
            innerText: "コピー（「参考：」）",
            title: "「参考：」を先頭に追加してコピー",
            style: {
                "float": "right"
            },
            onclick: function () {
                textarea.value = "参考：" + textarea.value;
                this.disabled = true;
                copy();
            }
        }),
        createElement("br"),
        textarea
    ]));

    var timeout_id = null;
    function copy(){
        textarea.select();
        document.execCommand("copy", null, null);

        if (null !== timeout_id) clearTimeout(timeout_id);
        copyButton.innerText = "コピー完了";
        timeout_id = setTimeout(function () {
            copyButton.innerText = "コピー";
        }, 3000);
        copyButton.focus();
    }
}


function createElement(elem, attrs, childs){
	if (!elem) return null;
	if (typeof elem === "string") elem = document.createElement(elem);
	if (attrs) {
		for (var key_attr in attrs) {
			if (key_attr === "style") {
				var styles = attrs.style;
				if (styles) for (var key_style in styles) elem.style[key_style] = styles[key_style];
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
			childs.forEach(function (child){
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