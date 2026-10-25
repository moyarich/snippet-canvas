# SnippetCanvas playground

MoyaForge documentation renderer for repository-owned MDX in `../../docs`, with a live preview of the extension composer.

```sh
npm run dev --workspace @moyarich/snippet-canvas-playground
npm run build:playground
```

The documentation shell, outline, and code block components are installed from the pinned MoyaForge registry in `moyaforge.components.json`, with their license included. Routing uses URL hashes for GitHub Pages. The composer is built as a separate HTML entry using the extension’s actual React source.

The installed shell adapts page links and skip navigation for the host’s hash routing. React 18 matches the extension composer. Run `npm run test:e2e --workspace @moyarich/snippet-canvas-playground` to test the production site, documentation navigation, appearance switching, and embedded composer.
