import test from 'node:test';
import assert from 'node:assert/strict';
import {consistencyScoreReading,distributionScoreReading,distributionScoreDetails} from '../lib/client/distribution-score-reading.js';

const report={dataset_names:{},data_distribution:{dataset_format:'labelme'}};

test('distribution tooltip shows only the overall deduction, base and model factor',()=>{
  const item={label:'类别覆盖与均衡',maximum:40,base_deduction:11.6515,impact_coefficient:1.25,deduction:14.5644,
    analysis:'这段分析只能在正文中显示。',distribution_evidence:[{metric:'category',bucket:'2',image_count:42,
      image_denominator:1682,annotation_count:89,annotation_denominator:873,base_deduction:11.6515,deduction:14.5644}]};
  const reading=distributionScoreReading(item);
  for(const value of ['扣分：14.6/40.0','基础扣分：11.7','影响系数：1.25'])
    assert.ok(reading.includes(value),value);
  assert.doesNotMatch(reading,/这段分析|42|89|1,682|873|2：|priority|level/);
});

test('frozen old report tooltip does not fabricate new factors or deductions',()=>{
  const reading=distributionScoreReading({label:'类别长尾',maximum:40,deduction:40,
    distribution_evidence:[{metric:'category',bucket:'rare',image_count:3,annotation_count:4}]});
  assert.doesNotMatch(reading,/rare|图像|标注实例/);
  assert.doesNotMatch(reading,/影响系数|基础扣分|undefined|NaN/);
});


test('distribution analysis retains each category count, percentage and deduction',()=>{
  const details=distributionScoreDetails({distribution_evidence:[{metric:'category',bucket:'划伤',image_count:135,
    image_denominator:2176,annotation_count:197,annotation_denominator:2557,deduction:2.1}]},report);
  assert.deepEqual(details,['划伤：图像 135/2,176 张（6.204%），标注实例 197/2,557 个（7.704%），扣分 2.1']);
});

test('consistency tooltip uses charged images and a separate raw pair count',()=>{
  const text=consistencyScoreReading({label:'少标/多标实例',maximum:100,count:5,charged_count:3,denominator:100,
    ratio:.05,pair_count:8,compared_pairs:999,base_deduction:12,impact_coefficient:1.5,deduction:18});
  for(const part of ['基础扣分：12.0','影响系数：1.5','计分图像：3/100','问题图对：8','百分比：3%'])
    assert.ok(text.includes(part),part);
  assert.doesNotMatch(text,/999|5%/);
});
