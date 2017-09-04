window.util = (() => {
	const util = {};

	util.createElement = (elem, attrs, childs) => {
		if (!elem) return null;
		if (typeof elem === 'string') elem = document.createElement(elem);
		if (attrs) {
			for (const key_attr in attrs) {
				if (key_attr === 'style') {
					const styles = attrs.style;
					if (styles) for (const key_style in styles) elem.style[key_style] = styles[key_style];
				} else if (key_attr === 'class') {
					elem.className = attrs.class;
				} else if (key_attr.indexOf('-') !== -1) {
					// data-** etc
					elem.setAttribute(key_attr, attrs[key_attr]);
				} else {
					elem[key_attr] = attrs[key_attr];
				}
			}
		}
		if (childs) {
			if (childs instanceof Array) {
				childs.forEach(child => {
					if (child) {
						if (typeof child === 'string') child = document.createTextNode(child);
						elem.appendChild(child);
					}
				});
			} else {
				if (typeof childs === 'string') childs = document.createTextNode(childs);
				elem.appendChild(childs);
			}
		}
		return elem;
	};

	return util;
})();
