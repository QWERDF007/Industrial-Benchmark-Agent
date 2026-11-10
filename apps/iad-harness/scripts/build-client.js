import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs/promises";
import {parseArgs} from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function build() {
  const {values}=parseArgs({options:{outdir:{type:'string'}}});
  const destination=path.resolve(values.outdir||path.join(rootDir,'lib'));
  const result=await esbuild.build({
    write:false,
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

  await fs.mkdir(destination,{recursive:true});
  for(const file of result.outputFiles){
    const content=file.path.endsWith('.js')?file.text.replace(/\/\*! Bundled license information:[\s\S]*?\*\//g,comment=>comment.replace(/[\t ]+$/gm,'')):file.contents;
    await fs.writeFile(path.join(destination,path.basename(file.path)),content);
  }
  const report=await esbuild.build({
    entryPoints:[path.join(rootDir,'src/client/audit-report-offline.tsx')],bundle:true,format:'iife',
    target:['es2022'],minify:true,legalComments:'none',write:false,
    define:{'process.env.NODE_ENV':'"production"'},jsx:'automatic',
  });
  const asset=path.resolve(rootDir,'../../python/iad_core/workbench/assets/audit-report.js');
  await fs.mkdir(path.dirname(asset),{recursive:true});
  await fs.writeFile(asset+'.tmp',report.outputFiles[0].contents);await fs.rename(asset+'.tmp',asset);
  console.log('Successfully bundled DSH client plugin into '+destination);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
