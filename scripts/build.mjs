import { execSync } from "node:child_process";

process.env.NEXT_PRIVATE_STANDALONE = "true";
process.env.NEXT_PRIVATE_OUTPUT_TRACE_ROOT = process.cwd();

execSync("next build", { stdio: "inherit" });
execSync("pnpm exec opennextjs-cloudflare build --skipNextBuild", {
  stdio: "inherit",
});
