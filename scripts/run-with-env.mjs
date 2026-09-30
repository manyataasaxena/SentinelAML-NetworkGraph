import { spawnSync } from "node:child_process";

const [assignment, command, ...args] = process.argv.slice(2);
if (!assignment || !command || !assignment.includes("=")) {
  console.error("Usage: node run-with-env.mjs KEY=value command [args...]");
  process.exit(1);
}

const separator = assignment.indexOf("=");
const key = assignment.slice(0, separator);
const value = assignment.slice(separator + 1);
const result = spawnSync(command, args, {
  stdio: "inherit",
  env: { ...process.env, [key]: value },
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status ?? 1);