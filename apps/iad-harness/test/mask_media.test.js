import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PythonBridge, createIadHttpHandler } from "../lib/server/index.js";

const workspace = fileURLToPath(new URL("../../../", import.meta.url));

test("HTTP: Labelme mask media retains pixels, ownership and fingerprint", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "iad-mask-media-"));
  const bridge = new PythonBridge({ cwd: workspace, dbPath: path.join(root, "test.db") });
  execFileSync(bridge.pythonPath, ["-c", `
import base64,io,json,sys
from pathlib import Path
from PIL import Image
root=Path(sys.argv[1]);(root/'images').mkdir();(root/'labels').mkdir()
pixels=Image.new('L',(11,11),0)
for point in [(0,0),(2,3),(3,3),(10,10)]:pixels.putpixel(point,255)
buffer=io.BytesIO();pixels.save(buffer,'PNG')
mask={'label':'mask','shape_type':'mask','points':[[20,15],[30,25]],'mask':base64.b64encode(buffer.getvalue()).decode()}
rectangle={'label':'rectangle','shape_type':'rectangle','points':[[40,30],[50,40]]}
for name in ['part','other']:
 Image.new('RGB',(80,60),'#404040').save(root/'images'/f'{name}.png')
 (root/'labels'/f'{name}.json').write_text(json.dumps({'imageWidth':80,'imageHeight':60,'shapes':[mask,rectangle]}))
`, root]);
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  try {
    const imported = await fetch(base + "/datasets/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ format: "labelme", name: "Mask media", image_dir: path.join(root, "images"), annotation_dir: path.join(root, "labels") }) });
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    const sampleId = dataset.dataset_id + ":part.png";
    const detail = await (await fetch(`${base}/sample/${encodeURIComponent(sampleId)}`)).json();
    const mask = detail.annotations.find(annotation => annotation.annotation_type === "mask");
    const rectangle = detail.annotations.find(annotation => annotation.annotation_type === "bbox");
    const url = (annotation, id = sampleId, fingerprint = annotation.mask_sha256) => `${base}/media/sample/${dataset.task_id}/${encodeURIComponent(id)}/mask?annotation_id=${encodeURIComponent(annotation.annotation_id)}&sha256=${fingerprint}`;
    const response = await fetch(url(mask));
    assert.equal(response.status, 200, await response.clone().text());
    assert.equal(response.headers.get("content-type"), "image/png");
    const pixels = JSON.parse(execFileSync(bridge.pythonPath, ["-c", `
import io,json,sys
from PIL import Image
image=Image.open(io.BytesIO(sys.stdin.buffer.read()))
print(json.dumps({'mode':image.mode,'size':image.size,'foreground':image.getpixel((22,18)),'hole':image.getpixel((25,20)),'edge':image.getpixel((30,25)),'outside':image.getpixel((19,15))}))
`], { input: Buffer.from(await response.arrayBuffer()), encoding: "utf8" }));
    assert.deepEqual(pixels, { mode: "L", size: [80, 60], foreground: 255, hole: 0, edge: 255, outside: 0 });
    assert.equal((await fetch(url(mask, dataset.dataset_id + ":other.png"))).status, 404);
    assert.equal((await fetch(url(rectangle))).status, 422);
    assert.equal((await fetch(url(mask, sampleId, "0".repeat(64)))).status, 422);
    const source = await fs.readFile(mask.mask_path);
    await fs.writeFile(mask.mask_path, Buffer.from("invalid pixels"));
    const changed = await fetch(url(mask));
    assert.equal(changed.status, 422);
    assert.match(await changed.text(), /Mask pixels changed after import/);
    await fs.writeFile(mask.mask_path, source);
    assert.equal((await fetch(url(mask))).status, 200);
  } finally {
    bridge.destroy();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});
