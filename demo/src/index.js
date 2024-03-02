import "blissfuljs";
import "prismjs";
import "../node_modules/prismjs/themes/prism.css";
import "../../src/prism-live.mjs";

const html = `<html lang="en">
<head>
	<meta charset="UTF-8" />
	<title>Prism Live: Lightweight, extensible, powerful web-based code editor</title>
	<link rel="stylesheet" href="./src/style.css" />
</head>
<body>
	<header>
		<h1><img src="https://prismjs.com/assets/logo.svg" alt="Prism" /> Live!</h1>
		<h2>Lightweight, extensible, powerful web-based code editor</h2>
	</header>
</body>
</html>`;

const css = `div.prism-live {
	position: relative;
	box-sizing: border-box;
	display: flex;
	flex-flow: column;
}

textarea.prism-live,
pre.prism-live {
	padding: 0.2rem 0.5rem;
	box-sizing: border-box;
	margin: 0;
}

@supports (not (caret-color: black)) and (-webkit-text-fill-color: black) {
	textarea.prism-live {
		color: inherit;
		-webkit-text-fill-color: transparent;
	}
}`;

const js = `var ret = {};
var canonical = new WeakMap(
	Object.entries(Prism.languages)
		.map((x) => x.reverse())
		.reverse()
);

for (var id in Prism.languages) {
	var grammar = Prism.languages[id];

	if (typeof grammar !== "function") {
		ret[id] = canonical.get(grammar);
	}
}

return ret;`;

//

$$("textarea.language-html.fill").forEach((textarea) => {
	textarea.value = html;
});

$$("textarea.language-css.fill").forEach((t) => {
	t.value = css;
	t.dispatchEvent(new InputEvent("input"));
});

$$("textarea.language-js.fill").forEach((t) => {
	t.value = js;
	t.dispatchEvent(new InputEvent("input"));
});
