import i18n from './i18n.js';
import ShareTemplate from './ShareTemplate.js';
import {
	SelectableTextarea,
	SelectableLink,
} from './SelectableElement.js';

const templates = [
	new ShareTemplate({
		id: 'title_url',
		accesskey: 'P',
		format: '{{title}}\n{{url}}',
		quotationFormat: (text) => text.replace(/^/gm, '> '),
		blockFormat: (text) => '```\n' + text + '\n```',
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'hiki',
		accesskey: 'H',
		format: '[[{{title}}|{{url}}]]',
		quotationFormat: (text) => text.replace(/^/gm, '"" '),
		blockFormat: (text) => `<<<\n${text}\n>>>`,
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'textile',
		accesskey: 'T',
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
		quotationFormat: (text) => text.replace(/^/gm, '> '),
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'backlog',
		accesskey: 'B',
		format: '[[{{title}}>{{url}}]]',
		quotationFormat: (text) => text.replace(/^/gm, '>'),
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'markdown',
		accesskey: 'M',
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
		quotationFormat: (text) => text.split('\n').map(line => `> ${line}  `).join('\n'),
		blockFormat: (text) => '```\n' + text + '\n```',
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'link',
		accesskey: 'L',
		format: (data) => {
			return {
				text: data.title,
				url: data.url,
			};
		},
		quotationFormat: (text) => text,
		blockFormat: (text) => text,
		selectableElement: new SelectableLink(),
	}),
];

export default templates;
