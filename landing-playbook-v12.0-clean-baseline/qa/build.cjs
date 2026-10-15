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
    minify: true,
    external: ["./vendor/hls-stream-optimized.js"],
    legalComments: "inline",
    banner: {
      js: "/* Generated from js/bootstrap.js. Rebuild with: cd qa && npm run build */",
    },
  });
  const vendor = await esbuild.build({
    absWorkingDir: root,
    entryPoints: ["js/vendor/hls.light.mjs"],
    outfile: "js/vendor/hls-stream-optimized.js",
    banner: {
      js: "/*! Hls.js 1.7.3 light — Apache-2.0. See LICENSE.hls.js.txt. Minified build. */",
    },
    bundle: true,
    format: "esm",
    target: "es2020",
    minify: true,
    legalComments: "inline",
    write: false,
  });
  const vendorFile = path.join(root, "js/vendor/hls-stream-optimized.js");
  const vendorOutput = Buffer.from(vendor.outputFiles[0].contents);
  const output = Buffer.from(result.outputFiles[0].contents);
  const file = path.join(root, "js/app.js");
  const script = fs
    .readFileSync(path.join(root, "index.html"), "utf8")
    .match(/<script\s+src="(js\/app[^"?]*\.js)(?:\?[^" ]*)?"/);
  const deployed = script && path.join(root, script[1]);
  if (process.argv.includes("--check")) {
    if (!fs.readFileSync(vendorFile).equals(vendorOutput))
      throw new Error("Lazy HLS library is stale; run npm run build");
    if (!fs.readFileSync(file).equals(output))
      throw new Error(
        "js/app.js does not match its component sources; run npm run build",
      );
    if (deployed && !fs.readFileSync(deployed).equals(output))
      throw new Error(
        "The bundle loaded by index.html is stale; run npm run build",
      );
    console.log(
      "Classic bundle and deployed file match their component sources.",
    );
  } else {
    fs.writeFileSync(vendorFile, vendorOutput);
    fs.writeFileSync(file, output);
    if (deployed && deployed !== file) fs.writeFileSync(deployed, output);
    console.log("Built js/app.js:", output.length, "bytes");
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
