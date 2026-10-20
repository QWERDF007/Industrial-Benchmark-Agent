import esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function build() {
  await esbuild.build({
    entryPoints: [path.join(rootDir, "src/client/index.ts")],
    outfile: path.join(rootDir, "lib/client.js"),
    bundle: true,
    format: "iife",
    globalName: "__IadClientBundle__",
    target: ["es2022"],
    banner: {
      js: `window.__ModuleLoader__.load({
  id: "@industrial-benchmark/iad-harness",
  factory: (require) => {
`,
    },
    footer: {
      js: `
    return __IadClientBundle__;
  }
});
`,
    },
    external: [
      "react",
      "react/jsx-runtime",
      "react-dom",
      "@deepseek-ai/cordis",
      "@deepseek-ai/dsh-client-store",
      "@deepseek-ai/dsh-client-ui-slots",
      "@deepseek-ai/dsh-client-ui-primitives",
      "@deepseek-ai/dsh-client-ui-dockkit",
    ],
    jsx: "automatic",
    sourcemap: true,
  });

  console.log("Successfully bundled DSH client plugin into lib/client.js");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
