# Cloudflare Worker deployment configuration

This repository uses Wrangler to deploy `worker/ai-pipeline-worker.js` as
`langue-francaise-ai-pipeline`. The entry point uses Cloudflare's legacy
Service Worker event syntax (`addEventListener('fetch', ...)`). Cloudflare
still supports this format, although it recommends Module Workers for new code.

In Service Worker format, Cloudflare exposes bindings in the global scope. The
Worker reads the `GROQ_API_KEY` secret through that global binding. If it is
missing, requests return `local_requis`; there is no source-code default.

After deployment approval, configure the secret interactively with Wrangler:

```sh
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

Enter the secret only in Wrangler's prompt. Do not put it in Git, `wrangler.toml`,
the browser, or `worker-config.js`.

The browser URL is intentionally unconfigured in `worker-config.js`. Only after
the Worker has actually been deployed should its real HTTPS URL be set as
`window.AI_WORKER_CONFIG.workerUrl`. Until then, the application safely uses
its local fallback. No deployed URL is asserted by this repository.

References:

- [Service Worker and Module Worker formats](https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/)
- [Cloudflare Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
