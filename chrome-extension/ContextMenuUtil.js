import templates from './templates.js';
import i18n from './i18n.js';
import ShareTemplate from './ShareTemplate.js';

const createIdForPage = (template) => `page-${template.id}`;
const createIdForSelection = (template) => `selection-${template.id}`;

const shortcutText = template => {
	return template.accesskey ? ` [&${template.accesskey}]` : '';
};

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
					title: formatType + shortcutText(template),
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
					title: template.quotationSupported ? formatType + shortcutText(template) : i18n.getMessage('quoted_copy_not_supported', formatType),
					id: createIdForSelection(template),
					contexts: parentMenuForSelection.contexts,
					parentId: parentMenuForSelection.id,
					enabled: template.quotationSupported,
					visible: template.enabled,
				});
			});
			const parentMenuForOption = {
				title: '引用書式 [&F]', // FIXME
				id: 'option-selection-format',
				contexts: parentMenuForSelection.contexts,
				parentId: parentMenuForSelection.id,
			};
			chrome.contextMenus.create(parentMenuForOption, () => {
				Object.values(ShareTemplate.QuotationType).sort().forEach(type => {
					chrome.contextMenus.create({
						title: `${type} [&${type[0].toUpperCase()}]`, // FIXME?
						id: `option-selection-format-${type}`,
						contexts: parentMenuForOption.contexts,
						parentId: parentMenuForOption.id,
						type: chrome.contextMenus.ItemType.RADIO,
						checked: (localStorage['quotation_type'] || ShareTemplate.QuotationType.QUOTATION) === type,
					});
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

/**
 * menuItemId から対応する QuotationType を返却する
 * @param {string} menuItemId
 * @returns quotationType
 */
const findQuotationType = (menuItemId) => Object.values(ShareTemplate.QuotationType).find((type) => {
	if (`option-selection-format-${type}` === menuItemId) return true; // FIXME: ハードコーディング
	return false;
});

export {
	createContextMenus,
	updateContextMenus,
	findTemplateFrom,
	findQuotationType,
};
