export const isReadonlyArray = Array.isArray;

export function htmlEncode(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/\u00a0/g, " ");
}

export function capitalize(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Converts the given kebab case identifier to a camel case identifier.
 */
export function kebabToCamelCase(kebab) {
	const [first, ...others] = kebab.split(/-/);
	return first + others.map(capitalize).join("");
}

/**
 * Converts the given value to an array.
 * If the given value is already an error, it will be returned as is.
 */
export function toArray(value) {
	if (isReadonlyArray(value)) {
		return value;
	} else if (value == null) {
		return [];
	} else {
		return [value];
	}
}

/**
 * Invokes the given callback for all elements of the given value.
 *
 * If the given value is an array, the callback will be invokes for all elements. If the given value is `null` or
 * `undefined`, the callback will not be invoked. In all other cases, the callback will be invoked with the given
 * value as parameter.
 */
export function forEach(value, callbackFn) {
	if (Array.isArray(value)) {
		value.forEach(callbackFn);
	} else if (value != null) {
		callbackFn(value, 0);
	}
}
