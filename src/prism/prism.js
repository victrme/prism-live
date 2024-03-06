// src/shared/dom-util.ts
var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
function getLanguage(element) {
	let e = element;
	for (; e; e = e.parentElement) {
		const m = lang.exec(e.className);
		if (m) {
			return m[1].toLowerCase();
		}
	}
	return "none";
}
function setLanguage(element, language) {
	element.className = element.className.replace(RegExp(lang, "gi"), "");
	element.classList.add("language-" + language);
}

// src/shared/symbols.ts
var rest = Symbol.for("Prism rest");
var tokenize = Symbol.for("Prism tokenize");

// src/shared/util.ts
function htmlEncode(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/\u00a0/g, " ");
}
var isReadonlyArray = Array.isArray;
function forEach(value, callbackFn) {
	if (Array.isArray(value)) {
		value.forEach(callbackFn);
	} else if (value != null) {
		callbackFn(value, 0);
	}
}
function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
function kebabToCamelCase(kebab) {
	const [first, ...others] = kebab.split(/-/);
	return first + others.map(capitalize).join("");
}

// src/core/hook-state.ts
var HookState = class {
	constructor() {
		this._data = /* @__PURE__ */ new Map();
	}
	has(key) {
		return this._data.has(key);
	}
	get(key, defaultValue) {
		let current = this._data.get(key);
		if (current === void 0) {
			current = defaultValue;
			this._data.set(key, current);
		}
		return current;
	}
	set(key, value) {
		this._data.set(key, value);
	}
};

// src/core/hooks.ts
var Hooks = class {
	constructor() {
		// eslint-disable-next-line func-call-spacing
		this._all = /* @__PURE__ */ new Map();
	}
	/**
	 * Adds the given callback to the list of callbacks for the given hook and returns a function that
	 * removes the hook again when called.
	 *
	 * The callback will be invoked when the hook it is registered for is run.
	 * Hooks are usually directly run by a highlight function but you can also run hooks yourself.
	 *
	 * One callback function can be registered to multiple hooks.
	 *
	 * A callback function must not be registered for the same hook multiple times. Doing so will cause
	 * undefined behavior. However, registering a callback again after removing it is fine.
	 *
	 * @param name The name of the hook.
	 * @param callback The callback function which is given environment variables.
	 */
	add(name, callback) {
		let hooks = this._all.get(name);
		if (hooks === void 0) {
			hooks = [];
			this._all.set(name, hooks);
		}
		const list = hooks;
		list.push(callback);
		return () => {
			const index = list.indexOf(callback);
			if (index !== -1) {
				list.splice(index, 1);
			}
		};
	}
	/**
	 * Runs a hook invoking all registered callbacks with the given environment variables.
	 *
	 * Callbacks will be invoked synchronously and in the order in which they were registered.
	 *
	 * @param name The name of the hook.
	 * @param env The environment variables of the hook passed to all callbacks registered.
	 */
	run(name, env) {
		const callbacks = this._all.get(name);
		if (!callbacks || !callbacks.length) {
			return;
		}
		for (const callback of callbacks) {
			callback(env);
		}
	}
};

// src/core/linked-list.ts
var LinkedList = class {
	constructor() {
		const head = { value: null, prev: null, next: null };
		const tail = { value: null, prev: head, next: null };
		head.next = tail;
		this.head = head;
		this.tail = tail;
		this.length = 0;
	}
	/**
	 * Adds a new node with the given value to the list.
	 *
	 * @param node
	 * @param value
	 * @returns The added node.
	 */
	addAfter(node, value) {
		const next = node.next;
		const newNode = { value, prev: node, next };
		node.next = newNode;
		next.prev = newNode;
		this.length++;
		return newNode;
	}
	/**
	 * Removes `count` nodes after the given node. The given node will not be removed.
	 */
	removeRange(node, count) {
		let next = node.next;
		let i = 0;
		for (; i < count && next.next !== null; i++) {
			next = next.next;
		}
		node.next = next;
		next.prev = node;
		this.length -= i;
	}
	toArray() {
		const array = [];
		let node = this.head.next;
		while (node.next !== null) {
			array.push(node.value);
			node = node.next;
		}
		return array;
	}
};

// src/shared/language-util.ts
function extend(grammar, id, reDef) {
	const lang2 = cloneGrammar(grammar, id);
	for (const key in reDef) {
		lang2[key] = reDef[key];
	}
	return lang2;
}
function cloneGrammar(grammar, id) {
	const result = {};
	const visited = /* @__PURE__ */ new Map();
	function cloneToken(value) {
		if (!value.pattern) {
			return value;
		} else {
			const copy = { pattern: value.pattern };
			if (value.lookbehind) {
				copy.lookbehind = value.lookbehind;
			}
			if (value.greedy) {
				copy.greedy = value.greedy;
			}
			if (value.alias) {
				copy.alias = Array.isArray(value.alias) ? [...value.alias] : value.alias;
			}
			if (value.inside) {
				copy.inside = cloneRef(value.inside);
			}
			return copy;
		}
	}
	function cloneTokens(value) {
		if (!value) {
			return void 0;
		} else if (Array.isArray(value)) {
			return value.map(cloneToken);
		} else {
			return cloneToken(value);
		}
	}
	function cloneRef(ref) {
		if (ref === id) {
			return result;
		} else if (typeof ref === "string") {
			return ref;
		} else {
			return clone(ref);
		}
	}
	function clone(value) {
		let mapped = visited.get(value);
		if (mapped === void 0) {
			mapped = value === grammar ? result : {};
			visited.set(value, mapped);
			for (const [key, tokens] of Object.entries(value)) {
				mapped[key] = cloneTokens(tokens);
			}
			const r = value[rest];
			if (r != null) {
				mapped[rest] = cloneRef(r);
			}
			const t = value[tokenize];
			if (t) {
				mapped[tokenize] = t;
			}
		}
		return mapped;
	}
	return clone(grammar);
}

// src/core/registry.ts
var Registry = class {
	constructor(Prism2) {
		/**
		 * A map from the aliases of components to the id of the component with that alias.
		 */
		this.aliasMap = /* @__PURE__ */ new Map();
		/**
		 * A map from the aliases of components to the id of the component with that alias.
		 */
		this.entries = /* @__PURE__ */ new Map();
		this.Prism = Prism2;
	}
	/**
	 * If the given name is a known alias, then the id of the component of the alias will be returned. Otherwise, the
	 * `name` will be returned as is.
	 */
	resolveAlias(name) {
		return this.aliasMap.get(name) ?? name;
	}
	/**
	 * Returns whether this registry has a component with the given name or alias.
	 */
	has(name) {
		return this.entries.has(this.resolveAlias(name));
	}
	add(...components) {
		const added = /* @__PURE__ */ new Set();
		const register = (proto) => {
			const { id } = proto;
			if (this.entries.has(id)) {
				return;
			}
			this.entries.set(id, { proto });
			added.add(id);
			forEach(proto.alias, (alias) => this.aliasMap.set(alias, id));
			forEach(proto.require, register);
			if (proto.plugin) {
				this.Prism.plugins[kebabToCamelCase(id)] = proto.plugin(this.Prism);
			}
		};
		components.forEach(register);
		this.update(added);
	}
	update(changed) {
		const updateCache = /* @__PURE__ */ new Map();
		const idStack = [];
		const performUpdateUncached = (id) => {
			const circularStart = idStack.indexOf(id);
			if (circularStart !== idStack.length - 1) {
				throw new Error(`Circular dependency ${idStack.slice(circularStart).join(" -> ")} not allowed`);
			}
			const entry = this.entries.get(id);
			if (!entry) {
				return false;
			}
			if (!shouldRunEffects(entry.proto)) {
				return false;
			}
			entry.evaluatedGrammar = void 0;
			entry.evaluatedEffect?.();
			entry.evaluatedEffect = entry.proto.effect?.(this.Prism);
			return true;
		};
		const performUpdate = (id) => {
			let status = updateCache.get(id);
			if (status === void 0) {
				idStack.push(id);
				status = performUpdateUncached(id);
				idStack.pop();
				updateCache.set(id, status);
			}
			return status;
		};
		const shouldRunEffects = (proto) => {
			let depsChanged = false;
			forEach(proto.require, ({ id }) => {
				if (performUpdate(id)) {
					depsChanged = true;
				}
			});
			forEach(proto.optional, (id) => {
				if (performUpdate(this.resolveAlias(id))) {
					depsChanged = true;
				}
			});
			return depsChanged || changed.has(proto.id);
		};
		this.entries.forEach((_, id) => performUpdate(id));
	}
	getLanguage(id) {
		id = this.resolveAlias(id);
		const entry = this.entries.get(id);
		const grammar = entry?.proto.grammar;
		if (!grammar) {
			return void 0;
		}
		if (entry.evaluatedGrammar) {
			return entry.evaluatedGrammar;
		}
		if (typeof grammar === "object") {
			return (entry.evaluatedGrammar = grammar);
		}
		const required = (id2) => {
			const grammar2 = this.getLanguage(id2);
			if (!grammar2) {
				throw new Error(`The language ${id2} was not found.`);
			}
			return grammar2;
		};
		return (entry.evaluatedGrammar = grammar({
			getLanguage: required,
			getOptionalLanguage: (id2) => this.getLanguage(id2),
			extend: (id2, ref) => extend(required(id2), id2, ref),
		}));
	}
};

// src/core/token.ts
var Token = class {
	/**
	 * Creates a new token.
	 *
	 * @param type See {@link Token#type}
	 * @param content See {@link Token#content}
	 * @param alias The alias(es) of the token.
	 * @param matchedStr A copy of the full string this token was created from.
	 * @public
	 */
	constructor(type, content, alias, matchedStr = "") {
		this.type = type;
		this.content = content;
		this.alias = alias;
		this.length = matchedStr.length;
	}
	/**
	 * Adds the given alias to the list of aliases of this token.
	 */
	addAlias(alias) {
		let aliases = this.alias;
		if (!aliases) {
			this.alias = aliases = [];
		} else if (!Array.isArray(aliases)) {
			this.alias = aliases = [aliases];
		}
		aliases.push(alias);
	}
};

// src/core/prism.ts
var Prism = class {
	constructor() {
		this.hooks = new Hooks();
		this.components = new Registry(this);
		this.plugins = {};
	}
	/**
	 * This is the most high-level function in Prism’s API.
	 * It queries all the elements that have a `.language-xxxx` class and then calls {@link Prism#highlightElement} on
	 * each one of them.
	 *
	 * The following hooks will be run:
	 * 1. `before-highlightall`
	 * 2. `before-all-elements-highlight`
	 * 3. All hooks of {@link Prism#highlightElement} for each element.
	 */
	highlightAll(options = {}) {
		const { root, async, callback } = options;
		const env = {
			callback,
			root: root ?? document,
			selector:
				'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
			state: new HookState(),
		};
		this.hooks.run("before-highlightall", env);
		assertEnv(env);
		env.elements = [...env.root.querySelectorAll(env.selector)];
		this.hooks.run("before-all-elements-highlight", env);
		for (const element of env.elements) {
			this.highlightElement(element, { async, callback: env.callback });
		}
	}
	/**
	 * Highlights the code inside a single element.
	 *
	 * The following hooks will be run:
	 * 1. `before-sanity-check`
	 * 2. `before-highlight`
	 * 3. All hooks of {@link Prism#highlight}. These hooks will be run by an asynchronous worker if `async` is `true`.
	 * 4. `before-insert`
	 * 5. `after-highlight`
	 * 6. `complete`
	 *
	 * Some the above hooks will be skipped if the element doesn't contain any text or there is no grammar loaded for
	 * the element's language.
	 *
	 * @param element The element containing the code.
	 * It must have a class of `language-xxxx` to be processed, where `xxxx` is a valid language identifier.
	 */
	highlightElement(element, options = {}) {
		const { async, callback } = options;
		const language = getLanguage(element);
		const languageId = this.components.resolveAlias(language);
		const grammar = this.components.getLanguage(languageId);
		setLanguage(element, language);
		let parent = element.parentElement;
		if (parent && parent.nodeName.toLowerCase() === "pre") {
			setLanguage(parent, language);
		}
		const code = element.textContent;
		const env = {
			element,
			language,
			grammar,
			code,
			state: new HookState(),
		};
		const insertHighlightedCode = (highlightedCode) => {
			assertEnv(env);
			env.highlightedCode = highlightedCode;
			this.hooks.run("before-insert", env);
			env.element.innerHTML = env.highlightedCode;
			this.hooks.run("after-highlight", env);
			this.hooks.run("complete", env);
			callback?.(env.element);
		};
		this.hooks.run("before-sanity-check", env);
		parent = env.element.parentElement;
		if (parent && parent.nodeName.toLowerCase() === "pre" && !parent.hasAttribute("tabindex")) {
			parent.setAttribute("tabindex", "0");
		}
		if (!env.code) {
			this.hooks.run("complete", env);
			callback?.(env.element);
			return;
		}
		this.hooks.run("before-highlight", env);
		if (!env.grammar) {
			insertHighlightedCode(htmlEncode(env.code));
			return;
		}
		if (async) {
			async({
				language: env.language,
				code: env.code,
				grammar: env.grammar,
			}).then(insertHighlightedCode, (error) => console.log(error));
		} else {
			insertHighlightedCode(this.highlight(env.code, env.language, { grammar: env.grammar }));
		}
	}
	/**
	 * Low-level function, only use if you know what you’re doing. It accepts a string of text as input
	 * and the language definitions to use, and returns a string with the HTML produced.
	 *
	 * The following hooks will be run:
	 * 1. `before-tokenize`
	 * 2. `after-tokenize`
	 * 3. `wrap`: On each {@link Token}.
	 *
	 * @param text A string with the code to be highlighted.
	 * @param language The name of the language definition passed to `grammar`.
	 * @param options An object containing the tokens to use.
	 *
	 * Usually a language definition like `Prism.languages.markup`.
	 * @returns The highlighted HTML.
	 * @example
	 * Prism.highlight('var foo = true;', 'javascript');
	 */
	highlight(text, language, options) {
		const languageId = this.components.resolveAlias(language);
		const grammar = options?.grammar ?? this.components.getLanguage(languageId);
		const env = {
			code: text,
			grammar,
			language,
		};
		this.hooks.run("before-tokenize", env);
		if (!env.grammar) {
			throw new Error('The language "' + env.language + '" has no grammar.');
		}
		assertEnv(env);
		env.tokens = this.tokenize(env.code, env.grammar);
		this.hooks.run("after-tokenize", env);
		return stringify(env.tokens, env.language, this.hooks);
	}
	/**
	 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
	 * and the language definitions to use, and returns an array with the tokenized code.
	 *
	 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
	 *
	 * This method could be useful in other contexts as well, as a very crude parser.
	 *
	 * @param text A string with the code to be highlighted.
	 * @param grammar An object containing the tokens to use.
	 *
	 * Usually a language definition like `Prism.languages.markup`.
	 * @returns An array of strings and tokens, a token stream.
	 * @example
	 * let code = `var foo = 0;`;
	 * let tokens = Prism.tokenize(code, Prism.getLanguage('javascript'));
	 * tokens.forEach(token => {
	 *     if (token instanceof Token && token.type === 'number') {
	 *         console.log(`Found numeric literal: ${token.content}`);
	 *     }
	 * });
	 */
	tokenize(text, grammar) {
		const customTokenize = grammar[tokenize];
		if (customTokenize) {
			return customTokenize(text, grammar, this);
		}
		let restGrammar = resolve(this.components, grammar[rest]);
		while (restGrammar) {
			grammar = { ...grammar, ...restGrammar };
			restGrammar = resolve(this.components, restGrammar[rest]);
		}
		const tokenList = new LinkedList();
		tokenList.addAfter(tokenList.head, text);
		this._matchGrammar(text, tokenList, grammar, tokenList.head, 0);
		return tokenList.toArray();
	}
	_matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
		for (const token in grammar) {
			const tokenValue = grammar[token];
			if (!grammar.hasOwnProperty(token) || !tokenValue) {
				continue;
			}
			const patterns = Array.isArray(tokenValue) ? tokenValue : [tokenValue];
			for (let j = 0; j < patterns.length; ++j) {
				if (rematch && rematch.cause === `${token},${j}`) {
					return;
				}
				const patternObj = toGrammarToken(patterns[j]);
				let { pattern, lookbehind = false, greedy = false, alias, inside } = patternObj;
				const insideGrammar = resolve(this.components, inside);
				if (greedy && !pattern.global) {
					patternObj.pattern = pattern = RegExp(pattern.source, pattern.flags + "g");
				}
				for (
					let currentNode = startNode.next, pos = startPos;
					currentNode.next !== null;
					pos += currentNode.value.length, currentNode = currentNode.next
				) {
					if (rematch && pos >= rematch.reach) {
						break;
					}
					let str = currentNode.value;
					if (tokenList.length > text.length) {
						return;
					}
					if (str instanceof Token) {
						continue;
					}
					let removeCount = 1;
					let match;
					if (greedy) {
						match = matchPattern(pattern, pos, text, lookbehind);
						if (!match || match.index >= text.length) {
							break;
						}
						const from2 = match.index;
						const to = match.index + match[0].length;
						let p = pos;
						p += currentNode.value.length;
						while (from2 >= p) {
							currentNode = currentNode.next;
							if (currentNode.next === null) {
								throw new Error("The linked list and the actual text have become de-synced");
							}
							p += currentNode.value.length;
						}
						p -= currentNode.value.length;
						pos = p;
						if (currentNode.value instanceof Token) {
							continue;
						}
						let k = currentNode;
						for (; k.next !== null && (p < to || typeof k.value === "string"); k = k.next) {
							removeCount++;
							p += k.value.length;
						}
						removeCount--;
						str = text.slice(pos, p);
						match.index -= pos;
					} else {
						match = matchPattern(pattern, 0, str, lookbehind);
						if (!match) {
							continue;
						}
					}
					const from = match.index;
					const matchStr = match[0];
					const before = str.slice(0, from);
					const after = str.slice(from + matchStr.length);
					const reach = pos + str.length;
					if (rematch && reach > rematch.reach) {
						rematch.reach = reach;
					}
					let removeFrom = currentNode.prev;
					if (before) {
						removeFrom = tokenList.addAfter(removeFrom, before);
						pos += before.length;
					}
					tokenList.removeRange(removeFrom, removeCount);
					const wrapped = new Token(
						token,
						insideGrammar ? this.tokenize(matchStr, insideGrammar) : matchStr,
						alias,
						matchStr
					);
					currentNode = tokenList.addAfter(removeFrom, wrapped);
					if (after) {
						tokenList.addAfter(currentNode, after);
					}
					if (removeCount > 1) {
						const nestedRematch = {
							cause: `${token},${j}`,
							reach,
						};
						this._matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
						if (rematch && nestedRematch.reach > rematch.reach) {
							rematch.reach = nestedRematch.reach;
						}
					}
				}
			}
		}
	}
};
function assertEnv(env) {}
function matchPattern(pattern, pos, text, lookbehind) {
	pattern.lastIndex = pos;
	const match = pattern.exec(text);
	if (match && lookbehind && match[1]) {
		const lookbehindLength = match[1].length;
		match.index += lookbehindLength;
		match[0] = match[0].slice(lookbehindLength);
	}
	return match;
}
function stringify(o, language, hooks) {
	if (typeof o === "string") {
		return htmlEncode(o);
	}
	if (Array.isArray(o)) {
		let s = "";
		o.forEach((e) => {
			s += stringify(e, language, hooks);
		});
		return s;
	}
	const env = {
		type: o.type,
		content: stringify(o.content, language, hooks),
		tag: "span",
		classes: ["token", o.type],
		attributes: {},
		language,
	};
	const aliases = o.alias;
	if (aliases) {
		if (Array.isArray(aliases)) {
			env.classes.push(...aliases);
		} else {
			env.classes.push(aliases);
		}
	}
	hooks.run("wrap", env);
	let attributes = "";
	for (const name in env.attributes) {
		attributes += " " + name + '="' + (env.attributes[name] || "").replace(/"/g, "&quot;") + '"';
	}
	return (
		"<" + env.tag + ' class="' + env.classes.join(" ") + '"' + attributes + ">" + env.content + "</" + env.tag + ">"
	);
}
function toGrammarToken(pattern) {
	if (!pattern.pattern) {
		return { pattern };
	} else {
		return pattern;
	}
}
function resolve(components, reference) {
	if (reference) {
		if (typeof reference === "string") {
			return components.getLanguage(reference);
		}
		return reference;
	}
	return void 0;
}
export { Prism, Token };
/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 */
