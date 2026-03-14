const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const standaloneServer = path.join(rootDir, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const build = spawnSync(npmCommand, ["run", "build"], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

require(standaloneServer);
