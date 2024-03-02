import $ from "./blissful-v2/$.js";
import $$ from "./blissful-v2/$$.js";
import create from "./blissful-v2/dom/create.js";
import bind from "./blissful-v2/events/bind.js";
import load from "./blissful-v2/async/load.js";

Object.assign($, { create, bind, load });
export { $, $$, create, bind, load };

/**
 * Utility for regexp construction
 * @param {*} s
 * @returns
 */
let escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
let _regexp = (flags, strings, ...values) => {
	let pattern = strings[0] + values.map((v, i) => escape(v) + strings[i + 1]).join("");
	return RegExp(pattern, flags);
};
let cache = {};

export const regexp = new Proxy(_regexp.bind(this, ""), {
	get: (t, property) => {
		return t[property] || cache[property] || (cache[property] = _regexp.bind(this, property));
	},
});
