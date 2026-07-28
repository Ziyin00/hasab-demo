import { execSync } from "node:child_process";

function run(command) {
  execSync(command, { stdio: "inherit" });
}

// Cloudflare Workers Builds sets WORKERS_CI=1 and runs `npm run build`
// before `npx wrangler deploy`. OpenNext must run in the build step so
// deploy can find `.open-next/.build/open-next.config.edge.mjs`.
if (process.env.WORKERS_CI === "1") {
  run("pnpm exec opennextjs-cloudflare build");
} else {
  run("pnpm run build:next");
}
