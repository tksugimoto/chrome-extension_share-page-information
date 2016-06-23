
var templates = [
    {
        type: "タイトル + URL\n タイトル<改行>URL",
        format: "{{title}}\n{{url}}"
    }, {
        type: "Hiki (Wikiクローン) \n [[リンクテキスト: タイトル|リンク先: URL]]",
        format: "[[{{title}}|{{url}}]]"
    }, {
        type: "Markdown\n [リンクテキスト: タイトル](リンク先: URL \"Tooltip: URL(decoded)\")",
        format: function (data) {
            var text = data.title.replace(/\[|\]|\\/g, "\\$&");
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

chrome.tabs.query({
    active: true,
    currentWindow: true
}, function (tabs) {
    var tab = tabs[0];
    if (tab.url.match(/^(?:https?|file):/)) {
        var data = {
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
        var oldValue = titleInput.value;
        titleInput.onkeypress = function () {
            data.title = oldValue = titleInput.value;
            create(data);
        };
        window.setInterval(function () {
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
        spellcheck: false,
        style: {
            width: "100%",
            "word-break": "break-all"
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