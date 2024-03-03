export default {
	id: "clike",
	comments: {
		singleline: "//",
		multiline: ["/*", "*/"],
	},
	snippets: {
		if: `if ($1) {
	$2
}`,
	},
};
