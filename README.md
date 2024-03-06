# Prism Live

Editable code areas powered by [Prism](https://prismjs.com/).  
WIP, use at your own risk and do not assume that the API will not change.

$-----------$

-   Npm: [@victr/prism-live](https://www.npmjs.com/package/@victr/prism-live)
-   Demo: [prism-live.pages.dev](https://prism-live.pages.dev)
-   Original demo: [live.prismjs.com](https://live.prismjs.com)

## Install

```bash
npm install @victr/prism-live
```

Use a Prism theme stylesheet first

```html
<head>
	<link rel="stylesheet" href="/prism.css" />
</head>
```

Import prism-live in a javascript file

```javascript
import PrismLive from "@victr/prism-live";
import "@victr/prism-live/style.css";

PrismLive.createAll();
```

Or in a script tag

```html
<head>
	<script type="module">
		import "@victr/prism-live";
		import "@victr/prism-live/style.css" assert { type: "css" };

		PrismLive.createAll();
	</script>
</head>
```

Then create a code editor like this

```html
<textarea class="prism-live language-css" />
```

## Why

I needed a lightweight code-editor and chose prism-code-editor. But Prism live offers cool and annoying to implement features like auto indent or auto quotes! This is a working package based on the current development.

This will die once prism-live is available 😲

## What changed

### Broken

-   Did not check if line numbers styling is working, oops

### Development

-   Use Prettier with config close to original formatting style
-   Use dev files of blissfuljs & Prism version 2
-   Prism v2 and languages built with `esbuild ./src/core.ts --bundle --format=esm --outfile=prism.js`

### Demo

-   Demo website as a static site generated by Vite
-   Self hosted images and stylesheets
-   No blissful in demo
-   Constant strings as html/css/javascript example

###
