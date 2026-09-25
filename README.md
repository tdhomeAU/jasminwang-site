# jasminwang-site

Static source for the 澳洲茉莉 AI 技能库.

## Stack

Plain HTML, CSS and browser ES modules. Node.js is only used for local serving and release-boundary validation.

## Commands

```bash
npm start
npm run build
```

`npm start` serves `dist/` at `http://localhost:4173`. `npm run build` validates the approved public-download boundary; this static site has no compilation step.

## Main directories

- `dist/` — deployed static site, routes and assets
- `scripts/` — local server and release validation
- `public-download-sources.json` — approved package provenance
- `.openai/hosting.json` — static-host configuration

## Deployment note

Deploy `dist/` as static assets. Only packages already approved for the public Skill library may be placed in `dist/downloads/`; never add private Skill masters or review candidates to this repository or the served download directory. Run `npm run build` before every deployment.
