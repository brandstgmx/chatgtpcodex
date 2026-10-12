const fs = require("node:fs");
const path = require("node:path");
const esbuild = require("esbuild");
const root = path.resolve(__dirname, "..");
(async () => {
  const result = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ["js/bootstrap.js"],
    outfile: "js/app.js",
    bundle: true,
    format: "iife",
    target: "es2020",
    write: false,
    legalComments: "inline",
    banner: {
      js: "/* Generated from js/bootstrap.js. Rebuild with: cd qa && npm run build */",
    },
  });
  const output = Buffer.from(result.outputFiles[0].contents);
  const file = path.join(root, "js/app.js");
  if (process.argv.includes("--check")) {
    if (!fs.readFileSync(file).equals(output))
      throw new Error(
        "js/app.js does not match its component sources; run npm run build",
      );
    console.log("Classic bundle matches its component sources.");
  } else {
    fs.writeFileSync(file, output);
    console.log("Built js/app.js:", output.length, "bytes");
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
