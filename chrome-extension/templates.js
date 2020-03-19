import i18n from './i18n.js';
import ShareTemplate from './ShareTemplate.js';
import {
	SelectableTextarea,
	SelectableLink,
} from './SelectableElement.js';

const templates = [
	new ShareTemplate({
		id: 'title_url',
		accesskey: 'p',
		format: '{{title}}\n{{url}}',
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'hiki',
		accesskey: 'h',
		format: '[[{{title}}|{{url}}]]',
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'textile',
		accesskey: 't',
		format: (data) => {
			const title = data.title
				.replace(/[(]/g, '[')
				.replace(/[)]/g, ']')
				.replace(/"/g, '&quot;')
			;
			const url = data.url;
			return {
				text: `"${title}":${url}`,
			};
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'backlog',
		accesskey: 'b',
		format: '[[{{title}}>{{url}}]]',
		selectableElement: new SelectableTextarea(),
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
		format: (data, option) => {
			const text = data.title.replace(/\[|\]|\\/g, '\\$&');
			let url = data.url.replace(/\\/g, '\\$&');
			if (option['escape-parenthesis']) {
				url = data.url.replace(/\)/g, '\\$&');
			}
			if (option['exclude-tooltip']) {
				return {
					text: `[${text}](${url})`,
				};
			}
			let decodedUrl = data.url;
			try {
				decodedUrl = decodeURIComponent(data.url);
			} catch (e) {}
			const tooltip = decodedUrl.replace(/"\)/g, '"\\)');
			return {
				text: `[${text}](${url} "${tooltip}")`,
			};
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'link',
		accesskey: 'l',
		format: (data) => {
			return {
				text: data.title,
				url: data.url,
			};
		},
		selectableElement: new SelectableLink(),
	}),
];

export default templates;
