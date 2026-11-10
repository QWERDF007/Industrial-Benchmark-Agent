import assert from 'node:assert/strict';

export async function verifyReportMetadata(driver) {
  const rows=await driver.executeScript(`return [...document.querySelectorAll('#audit-report .iad-report-data>div')].map(row=>{
    const box=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
    return {row:box(row),label:box(row.querySelector('dt')),value:box(row.querySelector('dd'))};
  })`);
  assert.equal(rows.length,4);
  assert.ok(rows.every(item=>item.label.right<=item.value.left&&item.value.right<=item.row.right+1),'报告标签和值不能重叠或超出本行');
  assert.ok(rows.slice(1).every((item,index)=>rows[index].row.bottom<=item.row.top),'报告元信息各行不能重叠');
  return rows;
}
