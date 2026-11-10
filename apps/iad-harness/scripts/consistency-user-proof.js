import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {By, until} from 'selenium-webdriver';
import {conflictCategoryLabels} from '../lib/shared/consistency.parameters.generated.js';

export async function verifyConsistencyUserResult(driver, {base, runId, output, prefix, downloadDirectory}) {
  const read = async route => {
    const response = await fetch(base + '/api/iad/' + route);
    assert.equal(response.status, 200);
    return response.json();
  };
  const root = 'consistency/checks/' + encodeURIComponent(runId);
  const [snapshot, anchors, gallery, images] = await Promise.all([
    read(root + '/config'), read(root + '/anchors?page_size=1000'), read(root + '/gallery?page_size=200'),
    read(root + '/images?page_size=1000'),
  ]);
  assert.equal(snapshot.review_pipeline, 'identity-v4');
  assert.equal(snapshot.concurrency, 2);
  assert.equal(anchors.total, 100);
  assert.equal(anchors.items.length, 100);
  assert.equal(new Set(anchors.items.map(item => item.anchor_id)).size, 100);
  assert.equal(images.total,100);
  assert.deepEqual(images.items.map(item=>item.summary.anchor_id),anchors.items.map(item=>item.anchor_id));
  const imagesTab=await driver.wait(until.elementLocated(By.css('[data-dc="raw-tab"][data-id="images"]')),20000);
  const tabScroll=await driver.executeScript('const panel=arguments[0].closest(".iad-workbench");panel.scrollTop+=arguments[0].getBoundingClientRect().top-panel.getBoundingClientRect().top;return panel.scrollTop',imagesTab);
  await imagesTab.click();
  await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="job-image"]'))).length===18,20000);
  assert.ok(Math.abs(await driver.executeScript('return document.querySelector(".iad-workbench").scrollTop')-tabScroll)<2);
  const imageCards=await driver.findElements(By.css('[data-dc="job-image"]'));
  for(const card of imageCards){
    const model=await card.findElement(By.css('.iad-thumbnail-values span:last-child')).getText();
    assert.ok(model==='' || Object.values(conflictCategoryLabels).includes(model));
  }
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',imageCards.at(-1));
  await driver.wait(()=>driver.executeScript('return [...document.querySelectorAll("[data-dc=job-image] img")].every(image=>image.complete&&image.naturalWidth>0)'),20000);
  await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',imageCards[0]);
  await fs.writeFile(path.join(output,prefix+'-all-images.png'),await driver.takeScreenshot(),'base64');
  const openedImages=[];
  for(const index of [...new Set([0,images.items.slice(0,18).findIndex(item=>item.summary.original_conclusion),
    images.items.slice(0,18).findIndex(item=>item.summary.reason==='NO_ELIGIBLE_CANDIDATES')])].filter(index=>index>=0)){
    const item=images.items[index],card=imageCards[index];
    const program=conflictCategoryLabels[item.summary.program_conclusion] || item.summary.program_conclusion;
    assert.equal(await card.findElement(By.css('.iad-thumbnail-values span:first-child')).getText(),program);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',card);await card.click();
    const dialog=await driver.wait(until.elementLocated(By.css('#dc-compare-mask')),20000);
    assert.equal(await dialog.findElement(By.css('.dc-fact-panel .dc-verdict-value')).getText(),program);
    assert.equal((await driver.findElements(By.css('[aria-label="大图查看区域"]'))).length,0);
    const eligible=item.summary.outcome.candidate_stats.eligible;
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="candidate"]'))).length===eligible,20000);
    if(!eligible)assert.equal(await dialog.findElement(By.css('[data-dc="zoom-candidate"]')).getAttribute('aria-disabled'),'true');
    const detail=await read(root+'/anchors/'+encodeURIComponent(item.summary.anchor_id));
    await driver.wait(async()=>(await dialog.findElements(By.css('[aria-label="图像身份与内容验证"] [role="status"]'))).length===0,20000);
    await driver.wait(async()=>(await driver.findElements(By.css('[data-dc="identity-analysis"]'))).length===detail.gates.length,20000);
    const analysis=await dialog.findElement(By.css('.dc-model-panel')).getText();
    assert.equal((await dialog.findElements(By.css('.dc-model-panel h4'))).length,0);
    for(const gate of detail.gates)assert.ok(analysis.includes(gate.reason));
    if(item.summary.reason==='NO_CANDIDATES'){
      assert.equal(item.summary.model_conclusion,null);
      assert.ok(analysis.includes('未检索到候选，未进行图像身份与内容验证。'));
    }
    if(['NO_CANDIDATES','NO_ELIGIBLE_CANDIDATES'].includes(item.summary.reason)){
      assert.equal(await card.findElement(By.css('.iad-thumbnail-values span:last-child')).getText(),'');
      assert.equal(await dialog.findElement(By.css('.dc-conclusion-panel .dc-verdict-value')).getText(),'');
    }
    if(item.summary.reason==='NO_ELIGIBLE_CANDIDATES'){
      assert.equal(item.summary.model_conclusion,null);
      assert.ok(analysis.includes('无有效候选，未进行标注审核。'));
    }
    await fs.writeFile(path.join(output,prefix+`-all-image-${index}-comparison.png`),await driver.takeScreenshot(),'base64');
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})',await dialog.findElement(By.css('.dc-model-panel')));
    await fs.writeFile(path.join(output,prefix+`-all-image-${index}-analysis.png`),await driver.takeScreenshot(),'base64');
    openedImages.push({anchor_id:item.summary.anchor_id,program_conclusion:program,
      model_conclusion:item.summary.model_conclusion,identity_records:detail.gates.length,eligible});
    await dialog.findElement(By.css('.dc-dialog-head [aria-label="关闭"]')).click();
  }
  await driver.findElement(By.css('[data-dc="raw-tab"][data-id="all"]')).click();
  const modelOptions=await driver.wait(until.elementLocated(By.css('#dc-model-filter')),20000);
  assert.deepEqual(await Promise.all((await modelOptions.findElements(By.css('option'))).map(option=>option.getText())),
    ['全部判断','类别不一致','多标','少标','位置差异','拆分','合并']);
  const totals = {};
  for (const anchor of anchors.items) {
    assert.equal(anchor.state, 'COMPLETED');
    assert.equal(anchor.outcome.execution_status, 'completed');
    const stats = anchor.outcome.candidate_stats;
    assert.equal(stats.retrieved, stats.eligible + stats.rejected + stats.unverified);
    assert.equal(stats.assessed, stats.eligible);
    assert.equal(stats.assessed, stats.consistent + stats.discrepancy + stats.undetermined);
    assert.equal(stats.failed + stats.pending, 0);
    for (const [key, value] of Object.entries(stats)) totals[key] = (totals[key] || 0) + value;
  }
  const proof = {concurrency: snapshot.concurrency, anchors: anchors.total, all_images:images.total,
    image_card_comparisons:openedImages,tab_scroll_preserved:true,model_categories_complete:true,candidate_stats: totals, conflicts: gallery.total};
  if (gallery.total) await driver.wait(async () => (await driver.findElements(By.css('[data-dc="open-conflict"]'))).length > 0, 20000);
  const cards = await driver.findElements(By.css('[data-dc="open-conflict"]'));
  if (cards.length) {
    const anchorId = await cards[0].getAttribute('data-id');
    const reference = root + '/anchors/' + encodeURIComponent(anchorId);
    const [detail, members, candidates, review] = await Promise.all([
      read(reference), read(reference + '/members'), read(reference + '/candidates'), read(reference + '/review'),
    ]);
    const eligible = new Set(detail.gates.filter(gate => gate.gate_status === 'eligible').map(gate => gate.candidate_id));
    assert.equal(members.total, eligible.size);
    assert.ok(members.items.every(item => eligible.has(item.image.sample.sample_id)));
    assert.equal(detail.result.schema_version, '4.0');
    assert.equal(candidates.items.length, detail.candidates.candidates.length);
    assert.deepEqual(candidates.items.map(item=>[item.sample_id,item.kind,item.rank]),
      detail.candidates.candidates.map(item=>[item.sample_id,item.kind,item.rank]));
    assert.equal(review.references.length, members.total);
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', cards[0]);
    await cards[0].click();
    await driver.wait(async()=>(await driver.findElements(By.css('section[aria-label="对比图"] [data-dc="candidate"]'))).length===members.total,20000);
    await driver.wait(async()=>(await driver.findElements(By.css('section[aria-label="候选图"] [data-dc="retrieved-candidate"]'))).length===candidates.items.length,20000);
    await driver.wait(until.elementIsEnabled(await driver.findElement(By.css('#dc-note'))),20000);
    const texts=()=>driver.executeScript('return [".dc-fact-panel",".dc-model-panel",".dc-conclusion-panel"].map(selector=>document.querySelector(selector).innerText)');
    await driver.wait(async()=>!(await texts()).some(text=>text.includes('暂无已保存')),20000);
    const groupTexts=await texts();
    for(const [index,member] of members.items.entries()){
      const thumbnail=await driver.findElement(By.css(`[data-dc="candidate"][data-id="${index}"]`));
      assert.equal(await thumbnail.getAttribute('title'),member.image.sample.relative_path.split('/').at(-1));
      await thumbnail.click();assert.deepEqual(await texts(),groupTexts);
    }
    for(const thumbnail of await driver.findElements(By.css('[data-dc="retrieved-candidate"]'))){
      const title=await thumbnail.getAttribute('title');
      assert.ok(candidates.items.some(item=>item.image.sample.relative_path.split('/').at(-1)===title));
    }
    assert.equal((await driver.findElement(By.css('#dc-compare-mask')).getText()).includes('暂无图片'),false);
    await driver.executeScript('document.querySelector(".dc-dialog-body").scrollTop=0');
    await fs.writeFile(path.join(output,prefix+'-group.png'),await driver.takeScreenshot(),'base64');
    const preview=candidates.items[0];
    const annotationCount=preview.annotations.annotations.filter(item=>item.geometry_status!=='INVALID'&&item.bbox).length;
    await driver.findElement(By.css('[data-dc="retrieved-candidate"]')).click();
    await driver.wait(()=>driver.executeScript('const image=document.querySelector("#big-image");return image?.complete&&image.naturalWidth>0'),20000);
    if(annotationCount){
      await driver.wait(async()=>(await driver.findElements(By.css('dialog[aria-label="原图检视器"][open] .iad-annotation-layer rect'))).length===annotationCount,20000);
      assert.equal(await driver.findElement(By.css('#annotation-toggle')).isEnabled(),true);
    }
    await fs.writeFile(path.join(output,prefix+'-candidate-annotations.png'),await driver.takeScreenshot(),'base64');
    await driver.findElement(By.css('#full-close')).click();
    assert.deepEqual(await texts(),groupTexts);
    const zoom = await driver.wait(until.elementLocated(By.css('[data-dc="zoom-candidate"]')), 20000);
    await driver.wait(until.elementIsEnabled(zoom), 20000);
    await zoom.click();
    await driver.wait(() => driver.executeScript('const image=document.querySelector("#big-image");return image?.complete&&image.naturalWidth>0'), 20000);
    const filename = await driver.findElement(By.css('#full-file-name')).getText();
    assert.ok(members.items.some(item => item.image.sample.relative_path.split('/').at(-1) === filename));
    proof.viewed = {anchor_id: anchorId, eligible: members.total, filename,
      retrieved:candidates.items.length,exact:candidates.items.filter(item=>item.kind==='exact').length,
      similar:candidates.items.filter(item=>item.kind==='similar').length,
      group_conclusion_fixed:true,review_disposition:review.disposition,candidate_annotation_count:annotationCount};
    await fs.writeFile(path.join(output, prefix + '-detail.png'), await driver.takeScreenshot(), 'base64');
    await driver.findElement(By.css('#full-close')).click();
    await driver.findElement(By.css('#dc-compare-mask button[aria-label="关闭"]')).click();
  }
  const route = root + '/export.jsonl';
  await driver.executeScript('location.href=arguments[0]', base + '/api/iad/' + route);
  const downloaded = path.join(downloadDirectory, runId + '.jsonl');
  await driver.wait(async () => {
    try {return (await fs.stat(downloaded)).size > 0 && !await fs.access(downloaded + '.part').then(() => true, () => false);}
    catch {return false;}
  }, 20000);
  const bytes = await fs.readFile(downloaded);
  const response = await fetch(base + '/api/iad/' + route);
  assert.equal(response.status, 200);
  assert.deepEqual(bytes, Buffer.from(await response.arrayBuffer()));
  const records = bytes.toString('utf8').trim().split('\n').map(line => JSON.parse(line));
  assert.equal(records.length, 100);
  assert.equal(new Set(records.map(item => item.anchor_id)).size, 100);
  for (const record of records) {
    assert.equal(record.schema_version, '4.0');
    assert.equal(record.execution_status, 'completed');
    assert.equal(record.candidate_gate_ids.length, record.candidate_stats.retrieved);
    assert.equal(record.candidate_assessment_ids.length, record.candidate_stats.assessed);
    assert.deepEqual(record.errors, []);
  }
  const target = path.join(output, prefix + '-results.jsonl');
  await fs.copyFile(downloaded, target);
  proof.export = {path: target, records: records.length, bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex')};
  return proof;
}
