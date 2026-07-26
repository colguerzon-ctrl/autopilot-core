import fs from "fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const errors = [];

if (!pkg.name) errors.push("Missing package.json name.");
if (!pkg.version) errors.push("Missing package.json version.");
if (!pkg.scripts?.start) errors.push("Missing scripts.start.");
if (!pkg.dependencies?.express) errors.push("Missing dependency: express.");
if (!pkg.engines?.node) errors.push("Missing engines.node.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Railway validation passed.");
