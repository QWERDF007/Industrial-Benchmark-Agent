import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {PythonBridge, createIadHttpHandler} from '../lib/server/index.js';
import {resolvePythonPath} from '../lib/server/python-bridge/index.js';
import {createDatasetSession} from './fixtures/dataset_session.js';
import {temporaryImageLimits} from '../lib/shared/consistency.parameters.generated.js';

async function saveEvidence(name, value) {
  const directory = process.env.IAD_RETRIEVAL_EVIDENCE_DIR;
  if (!directory) return;
  await fs.mkdir(directory, {recursive: true});
  await fs.writeFile(path.join(directory, name + '.json'), JSON.stringify(value, null, 2) + '\n');
}

test('public retrieval and the Python bridge share exact groups and partial readiness', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-image-retrieve-'));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL('fixtures/knowledge_dataset.py', import.meta.url)), root]);
  await fs.copyFile(path.join(root, 'images/part-0.png'), path.join(root, 'images/copy.png'));
  const bridge = new PythonBridge({dbPath: path.join(root, 'test.db')});
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (endpoint, body) => fetch(base + endpoint, {method: 'POST',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  try {
    const dataset = await bridge.execute('dataset_import', {format: 'labelme', name: '检索入口',
      image_dir: path.join(root, 'images'), annotation_dir: path.join(root, 'labels')});
    const request = {query: {kind: 'sample', sample_id: dataset.dataset_id + ':part-0.png'}, mode: 'exact', top_k: 1};
    const response = await post('/images/retrieve', request);
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.exact.member_count, 1);
    assert.equal(result.exact.groups[0].members[0].sample_id, dataset.dataset_id + ':copy.png');
    assert.equal(result.exact.groups[0].members[0].relation, 'EXACT');
    assert.equal(result.coverage.verification.completed, 1);
    assert.deepEqual(result, await bridge.execute('image_retrieve', {request}));
    const combined = await (await post('/images/retrieve', {...request, mode: 'combined'})).json();
    assert.equal(combined.exact.member_count, 1);
    assert.equal(combined.visual.error_code, 'PROFILE_NOT_CONFIGURED');
    assert.equal(combined.retrieval_completeness, 'PARTIAL');
    const invalid = await post('/images/retrieve', {...request, top_k: 0});
    assert.equal(invalid.status, 422);
    const missing = await post('/images/retrieve', {...request, query: {kind: 'sample', sample_id: 'missing'}});
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error.code, 'REFERENCE_NOT_FOUND');
    await saveEvidence('sample-retrieval', {exact: result, combined, invalid_status: invalid.status, missing_status: missing.status});
  } finally {
    await new Promise(resolve => server.close(resolve));
    bridge.destroy();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('multipart temporary images can be queried and released without importing samples', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-temporary-query-'));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL('fixtures/knowledge_dataset.py', import.meta.url)), root]);
  const bridge = new PythonBridge({dbPath: path.join(root, 'test.db')});
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  try {
    const dataset = await bridge.execute('dataset_import', {format: 'labelme', name: '上传检索',
      image_dir: path.join(root, 'images'), annotation_dir: path.join(root, 'labels')});
    const bytes = await fs.readFile(path.join(root, 'images/part-0.png'));
    const form = new FormData();
    form.append('image', new Blob([bytes], {type: 'image/png'}), 'upload.png');
    const uploaded = await fetch(base + '/images/temporary', {method: 'POST', body: form});
    assert.equal(uploaded.status, 200, await uploaded.clone().text());
    const image = await uploaded.json();
    assert.match(image.image_ref, /^image_/);
    assert.equal(image.source_bytes, bytes.length);
    const cookie = uploaded.headers.get('set-cookie').split(';')[0];
    const request = {query: {kind: 'temporary', image_ref: image.image_ref}, mode: 'exact'};
    const retrieve = (body = request, owner = cookie) => fetch(base + '/images/retrieve', {method: 'POST',
      headers: {'Content-Type': 'application/json', ...(owner ? {cookie: owner} : {})}, body: JSON.stringify(body)});
    const response = await retrieve();
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.exact.member_count, 1);
    assert.equal(result.exact.groups[0].members[0].sample_id, dataset.dataset_id + ':part-0.png');
    assert.equal(result.coverage.annotation.pending, 1);
    assert.equal((await retrieve(request, '')).status, 404);
    assert.equal((await retrieve({...request, query: {kind: 'temporary', image_ref: path.join(root, 'images/part-0.png')}})).status, 404);
    assert.equal((await bridge.execute('dataset_list', {})).datasets[0].total_samples, 3);
    const release = await fetch(base + '/images/temporary/' + image.image_ref, {method: 'DELETE', headers: {cookie}});
    assert.equal(release.status, 200);
    assert.equal((await retrieve()).status, 404);
    const invalid = new FormData();
    invalid.append('image', new Blob(['not an image'], {type: 'image/png'}), 'bad.png');
    const rejected = await fetch(base + '/images/temporary', {method: 'POST', body: invalid});
    assert.equal(rejected.status, 400);
    assert.equal((await rejected.json()).error.code, 'UNSUPPORTED_IMAGE');
    for (const fields of [['other'], ['image', 'image'], ['image', 'extra']]) {
      const invalidForm = new FormData();
      for (const field of fields) invalidForm.append(field, new Blob([bytes], {type: 'image/png'}), 'image.png');
      const rejectedForm = await fetch(base + '/images/temporary', {method: 'POST', body: invalidForm});
      assert.equal(rejectedForm.status, 400, await rejectedForm.clone().text());
      assert.equal((await rejectedForm.json()).error.code, 'UNSUPPORTED_IMAGE');
    }
    const malformed = await fetch(base + '/images/temporary', {method: 'POST',
      headers: {'Content-Type': 'multipart/form-data; boundary=incomplete'}, body: '--incomplete\r\n'});
    assert.equal(malformed.status, 400);
    const excessive = await new Promise((resolve, reject) => {
      const upload = http.request(base + '/images/temporary', {method: 'POST', headers: {
        'Content-Type': 'multipart/form-data; boundary=limited', 'Content-Length': temporaryImageLimits.max_source_bytes + 1024 * 1024,
        Connection: 'close'}}, response => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      });
      upload.on('error', reject);
      upload.end('x');
    });
    assert.equal(excessive, 413);
    const jpeg = execFileSync(resolvePythonPath(), ['-c',
      'import io,sys; from PIL import Image; output=io.BytesIO(); Image.new("RGB",(320,240),"red").save(output,format="JPEG"); sys.stdout.buffer.write(output.getvalue()[:-80])']);
    const truncated = new FormData();
    truncated.append('image', new Blob([jpeg], {type: 'image/jpeg'}), 'truncated.jpg');
    const incompletePixels = await fetch(base + '/images/temporary', {method: 'POST', body: truncated});
    assert.equal(incompletePixels.status, 400, 'Admission must decode the pixels before publishing an image_ref');
    assert.equal((await incompletePixels.json()).error.code, 'UNSUPPORTED_IMAGE');
    const largeTiff = execFileSync(resolvePythonPath(), ['-c',
      'import io,sys,numpy as np; from PIL import Image; output=io.BytesIO(); Image.fromarray(np.random.default_rng(17).integers(0,65536,(1024,1024),dtype=np.uint16)).save(output,format="TIFF"); sys.stdout.buffer.write(output.getvalue())'],
      {maxBuffer: 4 * 1024 * 1024});
    assert.ok(largeTiff.length > 1024 * 1024);
    const largeForm = new FormData();
    largeForm.append('image', new Blob([largeTiff], {type: 'image/tiff'}), 'raw-16bit.tiff');
    const largeUpload = await fetch(base + '/images/temporary', {method: 'POST', headers: {cookie}, body: largeForm});
    assert.equal(largeUpload.status, 200, await largeUpload.clone().text());
    const largeImage = await largeUpload.json();
    assert.equal(largeImage.source_bytes, largeTiff.length);
    const largeResult = await retrieve({...request, query: {kind: 'temporary', image_ref: largeImage.image_ref}});
    assert.equal(largeResult.status, 200);
    const largePage = await largeResult.json();
    assert.equal(largePage.exact.status, 'READY');
    assert.equal((await fetch(base + '/images/temporary/' + largeImage.image_ref,
      {method: 'DELETE', headers: {cookie}})).status, 200);
    await saveEvidence('multipart-retrieval', {accepted: image, exact: result, released: true,
      oversized_status: excessive, truncated_image_status: incompletePixels.status,
      large_16bit_image: largeImage, large_16bit_result: largePage});
  } finally {
    await new Promise(resolve => server.close(resolve));
    bridge.destroy();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('native image_retrieve accepts only current session attachments and releases them on disposal', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-native-image-query-'));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL('fixtures/knowledge_dataset.py', import.meta.url)), root]);
  const session = await createDatasetSession({root: path.join(root, 'session'), dbPath: path.join(root, 'test.db'),
    endpoint: 'http://127.0.0.1:9/v1', model: 'unused-model', apiKeyEnv: 'IAD_UNUSED_QUERY_KEY'});
  const {ctx, handle} = session;
  const bridge = ctx.iadPythonBridge;
  const execute = args => ctx.tools.execute({name: 'image_retrieve', arguments: args,
    callId: 'retrieve', agent: handle.agent, signal: new AbortController().signal});
  try {
    const dataset = await bridge.execute('dataset_import', {format: 'labelme', name: '会话图像',
      image_dir: path.join(root, 'images'), annotation_dir: path.join(root, 'labels')});
    const attachment = await ctx.attachments.saveImage({data: await fs.readFile(path.join(root, 'images/part-0.png')),
      mediaType: 'image/png', name: 'query.png'});
    handle.agent.session.append('user/message', {id: 'uploaded-image', role: 'user', source: {kind: 'user'},
      content: [{type: 'image', attachment}]}, {surfaceOp: 'append'});
    const request = {query: {kind: 'temporary', image_ref: attachment.attachmentId}, mode: 'exact'};
    const first = await execute(request);
    assert.equal(first.isError, false, JSON.stringify(first));
    assert.equal(first.value.exact.member_count, 1);
    assert.equal(first.value.exact.groups[0].members[0].sample_id, dataset.dataset_id + ':part-0.png');
    const tools = handle.agent.ctx.tools.schemas();
    assert.ok(tools.some(tool => tool.name === 'image_retrieve'));
    assert.ok(!tools.some(tool => tool.name === 'visual_search'));
    const second = await execute(request);
    assert.equal(second.isError, false, JSON.stringify(second));
    assert.equal(second.value.query.image_ref, first.value.query.image_ref);
    const denied = await execute({...request, query: {kind: 'temporary', image_ref: '/tmp/not-an-attachment.png'}});
    assert.equal(denied.isError, true);
    assert.match(denied.content.map(part => part.text || '').join(''), /REFERENCE_NOT_FOUND/);
    const other = await ctx.attachments.saveImage({data: await fs.readFile(path.join(root, 'images/part-1.png')),
      mediaType: 'image/png', name: 'not-in-session.png'});
    const unowned = await execute({...request, query: {kind: 'temporary', image_ref: other.attachmentId}});
    assert.equal(unowned.isError, true, 'An existing global attachment must belong to this session');
    assert.match(unowned.content.map(part => part.text || '').join(''), /REFERENCE_NOT_FOUND/);
    const owner = 'session:' + handle.agent.session.id;
    const internal = {request: {...request, query: first.value.query}, owner_id: owner};
    assert.equal((await bridge.execute('image_retrieve', internal)).exact.member_count, 1);
    await handle.dispose();
    await assert.rejects(bridge.execute('image_retrieve', internal), /missing|expired/);
    await saveEvidence('session-retrieval', {result: first.value, reused_image_ref: second.value.query.image_ref,
      unowned_attachment_rejected: unowned.isError, disposed_reference_rejected: true});
  } finally {
    await session.dispose();
    await fs.rm(root, {recursive: true, force: true});
  }
});

test('source ignore regions affect public annotation comparison and preserve raw quality', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'iad-ignore-http-'));
  execFileSync(resolvePythonPath(), [fileURLToPath(new URL('fixtures/knowledge_dataset.py', import.meta.url)), root]);
  await fs.copyFile(path.join(root, 'images/part-0.png'), path.join(root, 'images/copy.png'));
  const shape = (label, points, flags = {}) => ({label, points, flags, shape_type: 'rectangle'});
  await fs.writeFile(path.join(root, 'labels/part-0.json'), JSON.stringify({imageWidth: 320, imageHeight: 240,
    shapes: [shape('exclude', [[0, 0], [10, 10]], {ignore: true}), shape('dent', [[0, 0], [20, 10]])]}));
  const copyPath = path.join(root, 'labels/copy.json');
  const copy = {imageWidth: 320, imageHeight: 240, shapes: [shape('dent', [[10, 0], [20, 10]])]};
  await fs.writeFile(copyPath, JSON.stringify(copy));
  const bridge = new PythonBridge({dbPath: path.join(root, 'test.db')});
  const server = http.createServer(createIadHttpHandler(bridge));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/iad`;
  const post = (endpoint, body) => fetch(base + endpoint, {method: 'POST',
    headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  try {
    const imported = await post('/datasets/import', {format: 'labelme', name: 'ignore regions',
      image_dir: path.join(root, 'images'), annotation_dir: path.join(root, 'labels'),
      annotation_policy: {policy_id: 'surface', annotation_role: 'REFERENCE', annotation_coverage: 'EXHAUSTIVE'}});
    assert.equal(imported.status, 200, await imported.clone().text());
    const dataset = await imported.json();
    const request = {query: {kind: 'sample', sample_id: dataset.dataset_id + ':part-0.png'}, mode: 'exact'};
    const source = await bridge.execute('sample_get', {sample_id: request.query.sample_id});
    assert.equal(source.annotations[0].is_ignored, true);
    const response = await post('/images/retrieve', request);
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    const compared = result.exact.groups[0].members[0].annotation;
    assert.equal(compared.confirmed_conflict, false);
    assert.equal(compared.matches[0].geometry_equal, true);
    assert.equal(compared.matches[0].segmentation_iou, null);
    assert.equal(compared.masking[0].total_pixels, 200);
    assert.equal(compared.masking[0].visible_pixels, 100);
    assert.equal(compared.ignore_regions.length, 1);
    copy.shapes[0].label = 'scratch';
    await fs.writeFile(copyPath, JSON.stringify(copy));
    assert.equal((await post(`/datasets/${dataset.dataset_id}/rescan`, {})).status, 200);
    const changed = await (await post('/images/retrieve', request)).json();
    const differences = changed.exact.groups[0].members[0].annotation;
    assert.equal(differences.confirmed_conflict, true);
    assert.deepEqual(differences.differences.map(item => item.type), ['CATEGORY']);
    assert.equal((await bridge.execute('sample_get', {sample_id: request.query.sample_id})).sample.quality_status, source.sample.quality_status);
    await saveEvidence('ignore-comparison', {consistent_visible_regions: result, visible_category_difference: changed});
  } finally {
    await new Promise(resolve => server.close(resolve));
    bridge.destroy();
    await fs.rm(root, {recursive: true, force: true});
  }
});
