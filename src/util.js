import create from "./bliss/dom/create.js";
import bind from "./bliss/events/bind.js";
import $ from "./bliss/$.js";
import $$ from "./bliss/$$.js";

Object.assign($, { create, bind });

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

export { $, $$ };
