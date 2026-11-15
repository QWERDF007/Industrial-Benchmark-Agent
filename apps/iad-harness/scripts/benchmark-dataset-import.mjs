import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {PythonBridge} from '../lib/server/python-bridge/index.js';

const cwd = fileURLToPath(new URL('../../../', import.meta.url));
const cases = [
  {name: '11_13', images: '/data1/wt/data/领益640-657尺寸外观检测/11_13/ExportImage_ALL_data',
    labels: '/data1/wt/data/领益640-657尺寸外观检测/11_13/ExportLabel_ALL_data', imageCount: 1133, annotationCount: 1575},
  {name: 'Train', images: '/data1/wt/data/框胶数据集/ExportImage_框胶10x连线蓝色背面厚_0904-Train',
    labels: '/data1/wt/data/框胶数据集/ExportLabel_框胶10x连线蓝色背面厚_0904-Train', imageCount: 4508, annotationCount: 6042},
];
process.env.OPENBLAS_NUM_THREADS = '1';
process.env.OMP_NUM_THREADS = '1';

for (const source of cases) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'iad-import-benchmark-'));
  const bridge = new PythonBridge({cwd, dbPath: path.join(directory, 'benchmark.db')});
  try {
    const started = performance.now();
    const imported = await bridge.execute('dataset_import', {format: 'labelme', name: source.name,
      image_dir: source.images, annotation_dir: source.labels});
    const elapsedMs = performance.now() - started;
    assert.equal(imported.total_samples, source.imageCount);
    assert.equal(imported.annotation_count, source.annotationCount);
    assert.equal(imported.feature_coverage_pct, 0);
    console.log(JSON.stringify({dataset: source.name, operation: 'dataset_import',
      elapsed_ms: Math.round(elapsedMs), target_ms: 10000, passed: elapsedMs <= 10000,
      image_count: imported.total_samples, annotation_count: imported.annotation_count,
      cache_condition: 'existing OS cache; worker startup included'}));
    if (elapsedMs > 10000) process.exitCode = 1;
  } finally {
    bridge.destroy();
    await rm(directory, {recursive: true, force: true});
  }
}
