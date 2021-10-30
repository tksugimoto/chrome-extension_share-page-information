import i18n from '../i18n.js';
import templates from '../templates.js';

const globalSettings = document.querySelector('global-settings');
const titleInput = document.getElementById('title');

chrome.tabs.query({
	active: true,
	currentWindow: true,
}, tabs => {
	const tab = tabs[0];
	const data = {
		url: tab.url,
		title: tab.title,
	};
	// Firefox用
	// Firefoxはネットワークドライブの場合/が5つ必要
	// Chromeではfile:の後に/がいくつ並んでもOK
	data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, 'file://///$1/');

	const copyCallBack = () => {
		if (globalSettings.closeWindowAfterCopied) {
			window.setTimeout(() => {
				window.close();
			}, 50 /* ms */);
		}
	};

	const container = document.getElementById('container');
	templates.forEach(template => {
		template.appendTo(container, {
			copyCallBack,
		});
		template.update(data);
	});
	globalSettings.setupOpenCopyAction(templates);
	globalSettings.setupUsingFormat(templates);

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
});


i18n.setup(document);
