import i18n from './i18n.js';
import ShareTemplate from './ShareTemplate.js';
import createCopyButtonId from './createCopyButtonId.js';
import {
	SelectableTextarea,
	SelectableLink,
} from './SelectableElement.js';

const templates = [
	new ShareTemplate({
		id: 'title_url',
		accesskey: 'p',
		selectableElement: new SelectableTextarea('{{title}}\n{{url}}'),
	}),
	new ShareTemplate({
		id: 'hiki',
		accesskey: 'h',
		selectableElement: new SelectableTextarea('[[{{title}}|{{url}}]]'),
	}),
	new ShareTemplate({
		id: 'textile',
		accesskey: 't',
		selectableElement: new SelectableTextarea((data) => {
			const title = data.title
				.replace(/[(]/g, '[')
				.replace(/[)]/g, ']')
				.replace(/"/g, '&quot;')
			;
			const url = data.url;
			return `"${title}":${url}`;
		}),
	}),
	new ShareTemplate({
		id: 'backlog',
		accesskey: 'b',
		selectableElement: new SelectableTextarea('[[{{title}}>{{url}}]]'),
	}),
	new ShareTemplate({
		id: 'markdown',
		accesskey: 'm',
		options: [{
			key: 'exclude-tooltip',
			name: i18n.getMessage('exclude_tooltip'),
		}, {
			key: 'escape-parenthesis',
			name: i18n.getMessage('markdown_escape_parenthesis'),
			defaultValue: true,
		}],
		selectableElement: new SelectableTextarea((data, option) => {
			const text = data.title.replace(/\[|\]|\\/g, '\\$&');
			let url = data.url.replace(/\\/g, '\\$&');
			if (option['escape-parenthesis']) {
				url = data.url.replace(/\)/g, '\\$&');
			}
			if (option['exclude-tooltip']) {
				return `[${text}](${url})`;
			}
			let decodedUrl = data.url;
			try {
				decodedUrl = decodeURIComponent(data.url);
			} catch (e) {}
			const tooltip = decodedUrl.replace(/"\)/g, '"\\)');
			return `[${text}](${url} "${tooltip}")`;
		}),
	}),
	new ShareTemplate({
		id: 'link',
		accesskey: 'l',
		selectableElement: new SelectableLink(),
	}),
];

const globalSettings = document.querySelector('global-settings');
const titleInput = document.getElementById('title');

chrome.tabs.query({
	active: true,
	currentWindow: true,
}, tabs => {
	const tab = tabs[0];
	if (tab.url.match(/^(?:https?|file):/)) {
		const data = {
			url: tab.url,
			title: tab.title,
		};
		// Firefox用
		// Firefoxはネットワークドライブの場合/が5つ必要
		// Chromeではfile:の後に/がいくつ並んでもOK
		data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, 'file://///$1/');


		const container = document.getElementById('container');
		templates.forEach(template => {
			template.appendTo(data, container);
		});
		globalSettings.setupOpenCopyAction(templates, {
			createCopyButtonId,
		});
		globalSettings.setupEnableSetting(templates);

		titleInput.value = data.title;
		titleInput.select();
		const change = () => {
			setTimeout(() => {
				data.title = titleInput.value;
				templates.forEach(template => {
					template.update(data);
				});
			}, 1);
		};
		titleInput.addEventListener('input', change);
	} else {
		document.body.innerText = i18n.getMessage('non_supported_page');
	}
});


i18n.setup(document);

{
	const dataKey = 'data-show-accesskey';
	document.body.addEventListener('keydown', ({key}) => {
		if (key === 'Alt') {
			document.body.setAttribute(dataKey, 'true');
		}
	});
	document.body.addEventListener('keyup', ({key}) => {
		if (key === 'Alt') {
			document.body.removeAttribute(dataKey);
		}
	});
}
