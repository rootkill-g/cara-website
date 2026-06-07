# cara-website

Marketing & documentation site for **Cara** — a from-scratch web browser
written in Zig that renders Glyph (a custom markup language) scripted with Lua.

Built with **SolidJS + TypeScript**, **Vite**, **@solidjs/router**, and
**Tailwind CSS v4**. The site itself makes no third-party network requests — no
web fonts, no analytics, no trackers — matching the browser's stance.

## Develop

```sh
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-aware production build into dist/
npm run preview    # serve the production build locally
npm run typecheck  # tsc --noEmit
```

## Layout

```
src/
  index.tsx          # entry + router
  App.tsx            # root layout (nav · outlet · footer)
  index.css          # Tailwind v4 import + design tokens (@theme)
  components/        # Nav, Footer, Logo, shared UI primitives
  pages/             # Home, Architecture, Glyph, NotFound
public/
  favicon.svg        # the Cara mark
```

## Design tokens

All color and typography tokens live in `src/index.css` under `@theme`
(`--color-ink-*`, `--color-fog-*`, `--color-glyph-*`). Tailwind v4 generates the
utilities from them, so the palette has a single source of truth.

## License

MIT.
