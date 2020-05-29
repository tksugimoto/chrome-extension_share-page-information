import templates from './templates.js';
import i18n from './i18n.js';

const createIdForNormal = (template) => `normal-${template.id}`;
const createIdForQuotation = (template) => `quotation-${template.id}`;

const updateContextMenus = () => {
	chrome.contextMenus.removeAll(() => {
		const parentMenuForNormal = {
			title: i18n.getMessage('extension_name'),
			id: 'parent-menu-for-normal',
			contexts: [
				'page',
			],
		};
		chrome.contextMenus.create(parentMenuForNormal, () => {
			templates.forEach(template => {
				const formatType = i18n.getMessage(`format_type_${template.id}`);
				chrome.contextMenus.create({
					title: formatType,
					id: createIdForNormal(template),
					contexts: parentMenuForNormal.contexts,
					parentId: parentMenuForNormal.id,
					visible: template.enabled,
				});
			});
		});
		const parentMenuForQuotation = {
			title: i18n.getMessage('quote_copy_selected_text'),
			id: 'parent-menu-for-quotation',
			contexts: [
				'selection',
			],
		};
		chrome.contextMenus.create(parentMenuForQuotation, () => {
			templates.forEach(template => {
				const formatType = i18n.getMessage(`format_type_${template.id}`);
				chrome.contextMenus.create({
					title: template.quotationSupported ? formatType : i18n.getMessage('quoted_copy_not_supported', formatType),
					id: createIdForQuotation(template),
					contexts: parentMenuForQuotation.contexts,
					parentId: parentMenuForQuotation.id,
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
	if (createIdForNormal(template) === menuItemId) return true;
	if (createIdForQuotation(template) === menuItemId) return true;
	return false;
});

export {
	createContextMenus,
	updateContextMenus,
	findTemplateFrom,
};
