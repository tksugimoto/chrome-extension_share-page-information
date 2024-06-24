import {
	createContextMenus,
	findTemplateFrom,
 } from '../ContextMenuUtil.js';

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
	const template = findTemplateFrom(info.menuItemId);
	if (!template) return;

	new Promise((resolve) => {
		if (typeof info.selectionText === 'undefined') {
			return resolve(null);
		}
		if (!tab.url.match(/^(?:https?|file):/)) {
			return resolve(info.selectionText);
		}
		// 改行込みで取得するため
		chrome.tabs.executeScript(tab.id, {
			frameId: info.frameId,
			code: 'window.getSelection().toString()',
		}, (result) => {
			if (!result) {
				// executeScript できないページ(例: Chrome ウェブストア)の場合
				return resolve(info.selectionText);
			}
			const [ selectionText ] = result;
			if (selectionText) {
				return resolve(selectionText);
			}
			resolve(info.selectionText);
		});
	}).then(selectionText => {
		const url = (() => {
			if (!selectionText) return tab.url;

			const _url = new URL(tab.url);

			if (_url.hash && !_url.hash.startsWith('#:~:text=')) return tab.url;

			const [ firstLineSelectionText ] = selectionText.trim().split(/\n+/);
			_url.hash = `:~:text=${encodeURIComponent(firstLineSelectionText)}`;
			return _url.toString();
		})();
		const data = {
			url,
			title: tab.title,
		};
		// Firefox用
		// Firefoxはネットワークドライブの場合/が5つ必要
		// Chromeではfile:の後に/がいくつ並んでもOK
		data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, 'file://///$1/');

		const container = document.createElement('div');
		document.body.append(container);

		template.appendTo(container);
		template.update(data, {
			selectionText,
		});
		template.copy();

		container.remove();
	});
});
