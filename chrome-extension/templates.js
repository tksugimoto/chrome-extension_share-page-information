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
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.replace(/^/gm, '> '),
			[ShareTemplate.QuotationType.CODE]: (text) => '```\n' + text + '\n```',
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'hiki',
		accesskey: 'H',
		format: '[[{{title}}|{{url}}]]',
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.replace(/^/gm, '"" '),
			[ShareTemplate.QuotationType.CODE]: (text) => text.replace(/^/gm, '"" '), // FIXME
		},
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
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.replace(/^/gm, '> '),
			[ShareTemplate.QuotationType.CODE]: (text) => text.replace(/^/gm, '> '), // FIXME
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'backlog',
		accesskey: 'B',
		format: '[[{{title}}>{{url}}]]',
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.replace(/^/gm, '>'),
			[ShareTemplate.QuotationType.CODE]: (text) => text.replace(/^/gm, '>'), // FIXME
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'gitlab',
		accesskey: 'G',
		// TODO: title に含まれる ` の数 +1 個の ` で囲む
		format: '{{url}} ``{{title}}``',
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.split('\n').map(line => `> ${line}  `).join('\n'),
			[ShareTemplate.QuotationType.CODE]: (text) => '```\n' + text + '\n```',
		},
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
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text.split('\n').map(line => `> ${line}  `).join('\n'),
			[ShareTemplate.QuotationType.CODE]: (text) => '```\n' + text + '\n```',
		},
		selectableElement: new SelectableTextarea(),
	}),
	new ShareTemplate({
		id: 'link',
		accesskey: 'L',
		options: [{
			key: 'escape-dot',
			name: 'URLをescapeする(SlackでtitleにURLが含まれているとリンクが壊れる問題対策)',
			defaultValue: true,
		}],
		format: (data, option) => {
			let title = data.title;
			if (option['escape-dot']) {
				const zeroWidthSpace = '​';
				title = title.replace(/[.:]/g, `${zeroWidthSpace}$&`);
			}
			return {
				text: title,
				url: data.url,
			};
		},
		quotationFormat: {
			[ShareTemplate.QuotationType.QUOTATION]: (text) => text,
			[ShareTemplate.QuotationType.CODE]: (text) => text,
		},
		selectableElement: new SelectableLink(),
	}),
];

export default templates;
