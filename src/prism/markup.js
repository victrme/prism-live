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

// src/shared/languages/patterns.ts
var MARKUP_TAG =
	/<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/;
var JS_TEMPLATE_INTERPOLATION = /\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})+\}/;
var JS_TEMPLATE = RegExp(
	/`(?:\\[\s\S]|<i>|[^\\`$]|\$(?!\{))*`/.source.replace("<i>", () => JS_TEMPLATE_INTERPOLATION.source)
);

// src/languages/prism-xml.ts
var prism_xml_default = {
	id: "xml",
	alias: ["ssml", "atom", "rss"],
	grammar() {
		const entity = [
			{
				pattern: /&[\da-z]{1,8};/i,
				alias: "named-entity",
			},
			/&#x?[\da-f]{1,8};/i,
		];
		return {
			comment: {
				pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
				greedy: true,
			},
			prolog: {
				pattern: /<\?[\s\S]+?\?>/,
				greedy: true,
			},
			doctype: {
				// https://www.w3.org/TR/xml/#NT-doctypedecl
				pattern:
					/<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
				greedy: true,
				inside: {
					"internal-subset": {
						pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
						lookbehind: true,
						greedy: true,
						inside: "xml",
					},
					string: {
						pattern: /"[^"]*"|'[^']*'/,
						greedy: true,
					},
					punctuation: /^<!|>$|[[\]]/,
					"doctype-tag": /^DOCTYPE/i,
					name: /[^\s<>'"]+/,
				},
			},
			cdata: {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				greedy: true,
			},
			tag: {
				pattern: MARKUP_TAG,
				greedy: true,
				inside: {
					tag: {
						pattern: /^(<\/?)[^\s>\/]+/,
						lookbehind: true,
						inside: {
							namespace: /^[^\s>\/:]+:/,
						},
					},
					"attr-value": {
						pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
						inside: {
							punctuation: [
								{
									pattern: /^=/,
									alias: "attr-equals",
								},
								{
									pattern: /^(\s*)["']|["']$/,
									lookbehind: true,
								},
							],
							entity: entity,
						},
					},
					punctuation: /^<\/?|\/?>$/,
					"attr-name": {
						pattern: /[^\s>\/]+/,
						inside: {
							namespace: /^[^\s>\/:]+:/,
						},
					},
				},
			},
			entity: entity,
		};
	},
	effect(Prism) {
		return Prism.hooks.add("wrap", (env) => {
			if (env.type === "entity") {
				env.attributes["title"] = env.content.replace(/&amp;/, "&");
			}
		});
	},
};

// src/languages/prism-markup.ts
function inlineEmbedded(tagName, lang) {
	return {
		pattern: RegExp(
			/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(
				/__/g,
				() => tagName
			),
			"i"
		),
		lookbehind: true,
		greedy: true,
		inside: {
			"included-cdata": {
				pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
				inside: {
					["language-" + lang]: {
						pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
						lookbehind: true,
						inside: lang,
					},
					cdata: /^<!\[CDATA\[|\]\]>$/i,
				},
			},
			["language-" + lang]: {
				pattern: /[\s\S]+/,
				inside: lang,
			},
		},
	};
}
function attributeEmbedded(attrName, lang) {
	return {
		pattern: RegExp(
			/(^|["'\s])/.source + "(?:" + attrName + ")" + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
			"i"
		),
		lookbehind: true,
		inside: {
			"attr-name": /^[^\s=]+/,
			"attr-value": {
				pattern: /=[\s\S]+/,
				inside: {
					value: {
						pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
						lookbehind: true,
						alias: [lang, "language-" + lang],
						inside: lang,
					},
					punctuation: [
						{
							pattern: /^=/,
							alias: "attr-equals",
						},
						/"|'/,
					],
				},
			},
		},
	};
}
var prism_markup_default = {
	id: "markup",
	require: prism_xml_default,
	alias: ["html", "svg", "mathml"],
	grammar({ extend }) {
		const markup = extend("xml", {});
		insertBefore(markup, "cdata", {
			style: inlineEmbedded("style", "css"),
			script: inlineEmbedded("script", "javascript"),
		});
		const tag = markup.tag;
		insertBefore(tag.inside, "attr-value", {
			"special-attr": [
				attributeEmbedded("style", "css"),
				// add attribute support for all DOM events.
				// https://developer.mozilla.org/en-US/docs/Web/Events#Standard_events
				attributeEmbedded(
					/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/
						.source,
					"javascript"
				),
			],
		});
		return markup;
	},
};
export { prism_markup_default as default };
