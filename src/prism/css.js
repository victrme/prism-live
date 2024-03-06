// src/shared/symbols.ts
var rest = Symbol.for("Prism rest");
var tokenize = Symbol.for("Prism tokenize");

// src/shared/language-util.ts
function insertBefore(grammar, before, insert) {
	if (!(before in grammar)) {
		throw new Error(`"${before}" has to be a key of grammar.`);
	}
	const grammarEntries = Object.entries(grammar);
	for (const [key] of grammarEntries) {
		delete grammar[key];
	}
	for (const [key, value] of grammarEntries) {
		if (key === before) {
			for (const insertKey of Object.keys(insert)) {
				grammar[insertKey] = insert[insertKey];
			}
		}
		if (!insert.hasOwnProperty(key)) {
			grammar[key] = value;
		}
	}
}

// src/languages/prism-css.ts
var prism_css_default = {
	id: "css",
	optional: "css-extras",
	grammar({ getOptionalLanguage }) {
		const string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
		const css = {
			comment: /\/\*[\s\S]*?\*\//,
			atrule: {
				pattern: RegExp(
					"@[\\w-](?:" + /[^;{\s"']|\s+(?!\s)/.source + "|" + string.source + ")*?" + /(?:;|(?=\s*\{))/.source
				),
				inside: {
					rule: /^@[\w-]+/,
					"selector-function-argument": {
						pattern:
							/(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
						lookbehind: true,
						alias: "selector",
						inside: "css-selector",
					},
					keyword: {
						pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
						lookbehind: true,
					},
					[rest]: "css",
				},
			},
			url: {
				// https://drafts.csswg.org/css-values-3/#urls
				pattern: RegExp(
					"\\burl\\((?:" + string.source + "|" + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ")\\)",
					"i"
				),
				greedy: true,
				inside: {
					function: /^url/i,
					punctuation: /^\(|\)$/,
					string: {
						pattern: RegExp("^" + string.source + "$"),
						alias: "url",
					},
				},
			},
			selector: {
				pattern: RegExp(`(^|[{}\\s])[^{}\\s](?:[^{};"'\\s]|\\s+(?![\\s{])|` + string.source + ")*(?=\\s*\\{)"),
				lookbehind: true,
				inside: "css-selector",
			},
			string: {
				pattern: string,
				greedy: true,
			},
			variable: {
				pattern: /(^|[^-\w\xA0-\uFFFF])--(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*/i,
				lookbehind: true,
			},
			property: {
				pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
				lookbehind: true,
			},
			important: /!important\b/i,
			function: {
				pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
				lookbehind: true,
			},
			punctuation: /[(){};:,]/,
		};
		const extras = getOptionalLanguage("css-extras");
		if (extras) {
			insertBefore(css, "function", extras);
		}
		return css;
	},
};
export { prism_css_default as default };
