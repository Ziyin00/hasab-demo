import { execSync } from "node:child_process";

// Cloudflare Workers Builds should use this as the deploy command:
//   node scripts/cloudflare-deploy.mjs
//
// Do NOT use `npx wrangler deploy` alone — wrangler calls opennext deploy
// without running the OpenNext build step first.

function run(command) {
  execSync(command, { stdio: "inherit" });
}

run("pnpm exec opennextjs-cloudflare build");
run("pnpm exec opennextjs-cloudflare deploy");
