const i18n = (() => {
	const i18n = {};

	i18n.getMessage = (messageName, substitutions) => {
		const message = chrome.i18n.getMessage(messageName, substitutions);
		if (message) {
			return message;
		} else {
			console.warn(`I18n message of "${messageName}" is not found.`);
			return "";
		}
	};

	i18n.setup = (target) => {
		target.querySelectorAll("[data-i18n-innerText]").forEach(elem => {
			const messageKey = elem.getAttribute("data-i18n-innerText");
			const message = chrome.i18n.getMessage(messageKey);
			if (message) {
				elem.innerText = message;
			} else {
				console.warn(`I18n message of "${messageKey}" is not found.`, elem);
			}
		});

		target.querySelectorAll("[data-i18n-title]").forEach(elem => {
			const messageKey = elem.getAttribute("data-i18n-title");
			const message = chrome.i18n.getMessage(messageKey);
			if (message) {
				elem.title = message;
			} else {
				console.warn(`I18n message of "${messageKey}" is not found.`, elem);
			}
		});
	};

	return i18n;
})();
