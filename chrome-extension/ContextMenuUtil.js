import templates from './templates.js';
import i18n from './i18n.js';

const createIdForPage = (template) => `page-${template.id}`;
const createIdForSelection = (template) => `selection-${template.id}`;

const updateContextMenus = () => {
	chrome.contextMenus.removeAll(() => {
		const parentMenuForPage = {
			title: '&h: ' + i18n.getMessage('extension_name'),
			id: 'parent-menu-for-page',
			contexts: [
				'page',
			],
		};
		chrome.contextMenus.create(parentMenuForPage, () => {
			templates.forEach(template => {
				const formatType = i18n.getMessage(`format_type_${template.id}`);
				chrome.contextMenus.create({
					title: formatType,
					id: createIdForPage(template),
					contexts: parentMenuForPage.contexts,
					parentId: parentMenuForPage.id,
					visible: template.enabled,
				});
			});
		});
		const parentMenuForSelection = {
			title: '&h: ' + i18n.getMessage('quote_copy_selected_text'),
			id: 'parent-menu-for-selection-text',
			contexts: [
				'selection',
			],
		};
		chrome.contextMenus.create(parentMenuForSelection, () => {
			templates.forEach(template => {
				const formatType = i18n.getMessage(`format_type_${template.id}`);
				chrome.contextMenus.create({
					title: template.quotationSupported ? formatType : i18n.getMessage('quoted_copy_not_supported', formatType),
					id: createIdForSelection(template),
					contexts: parentMenuForSelection.contexts,
					parentId: parentMenuForSelection.id,
					enabled: template.quotationSupported,
					visible: template.enabled,
				});
			});
		});
	});
};

const createContextMenus = updateContextMenus;

/**
 * menuItemId から対応する template を返却する
 * @param {string} menuItemId
 * @returns shareTemplate
 */
const findTemplateFrom = (menuItemId) => templates.find((template) => {
	if (createIdForPage(template) === menuItemId) return true;
	if (createIdForSelection(template) === menuItemId) return true;
	return false;
});

export {
	createContextMenus,
	updateContextMenus,
	findTemplateFrom,
};
