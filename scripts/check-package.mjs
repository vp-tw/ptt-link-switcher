import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const tarball = process.argv[2];
if (!tarball) throw new Error("Pass the path to a packed PTT Link Switcher tarball.");

const consumer = mkdtempSync(join(tmpdir(), "ptt-link-switcher-consumer-"));
const typescript = fileURLToPath(import.meta.resolve("typescript/lib/tsc.js"));
const fixture = "package-consumer.mts";

try {
  writeFileSync(join(consumer, "package.json"), '{"private":true,"type":"module"}\n');
  copyFileSync(new URL(fixture, import.meta.url), join(consumer, fixture));
  const options = { cwd: consumer, stdio: "inherit" };
  execFileSync(
    "npm",
    ["install", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", resolve(tarball)],
    options,
  );
  execFileSync(
    process.execPath,
    [typescript, "--strict", "--noEmit", "--module", "NodeNext", fixture],
    options,
  );
  execFileSync(process.execPath, [fixture], options);
} finally {
  rmSync(consumer, { force: true, recursive: true });
}
