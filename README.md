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

## Lead capture setup

The local server uses a mock Kit response so the email form and immediate download can be previewed without sending data. The production endpoint is `functions/api/subscribe.js`; configure `KIT_API_KEY` as a server-side secret and `KIT_FORM_ID` as a server-side variable. Keep `KIT_MOCK_MODE` unset or set it to `false` in production. The endpoint records the required consent in a Kit custom field and adds the subscriber to the selected Form. No separate email service or sequence is required: enable the Form's confirmation/incentive email (double opt-in) and use it for the backup delivery. Set its post-confirmation destination to the public ZIP URL so the email button confirms the subscription and then opens the download; do not attach the ZIP.

Suggested confirmation email:

- Subject: `你的 AI 总舵手到了`
- Body: `谢谢你来领取 AI 总舵手。点击下面按钮即可随时下载。第一次使用时，把脑子里的事情直接倒给它，不需要自己先分类。`
- Button: `下载 AI 总舵手`

