import {
	createContextMenus,
	findTemplateFrom,
 } from './ContextMenuUtil.js';

chrome.runtime.onInstalled.addListener(createContextMenus);
chrome.runtime.onStartup.addListener(createContextMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
	const template = findTemplateFrom(info.menuItemId);
	if (!template) return;

	const data = {
		url: tab.url,
		title: tab.title,
	};
	// Firefox用
	// Firefoxはネットワークドライブの場合/が5つ必要
	// Chromeではfile:の後に/がいくつ並んでもOK
	data.url = data.url.replace(/^file:[/][/]([^:/]+)[/]/, 'file://///$1/');

	const container = document.createElement('div');
	document.body.append(container);

	template.appendTo(container);
	template.update(data);
	template.copy();

	container.remove();
});
