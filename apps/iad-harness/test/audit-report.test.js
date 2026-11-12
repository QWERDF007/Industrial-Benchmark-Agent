import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AuditReportContent} from '../lib/client/components/AuditReportContent.js';

const report = {
  total_samples:12,audited_samples:10,suspect_samples:2,distribution:{normal:8,suspect:2,incomplete:2},
  model_name:'实际模型',finished_at:'2026-11-11T08:46:56Z',dataset_names:{dataset:'转角检查作业'},
  conclusion:'可用于本范围的视觉探索，不能直接认证为正式测试集。',coverage_analysis:'覆盖转角与环状邻接。',
  consistency_analysis:'根据原始标注关系分析，本轮仍有遗漏待复核。',knowledge_analysis:'',knowledge_titles:{},
  independence_analysis:'没有物理件登记，独立性未评价。',review_priorities:['先复核重复出现的遗漏。'],limitations:['没有像素标注。'],
  dataset_profile:{dataset_format:'labelme',total_images:12,geometry:{box_count:18,annotated_images:8,
    relative_area:{q25:0.001,median:0.002,q75:0.003},relative_width:{q25:0.02,median:0.04,q75:0.06},
    relative_height:{q25:0.01,median:0.03,q75:0.05},aspect_ratio:{q25:0.5,median:1,q75:2},
    center_x:{q25:0.2,median:0.5,q75:0.8},center_y:{q25:0.1,median:0.4,q75:0.7}},
    metadata:{},strict_duplicate_groups:null,near_candidate_pairs:0,benchmark:null},
  statistics:{total_images:12,completed_images:10,normal_images:8,suspect_images:2,incomplete_images:2,
    issue_occurrences:3,issue_types:{missing_annotation:{image_count:2,occurrences:3}},
    observation_images:4,observation_occurrences:6,suspect_rate_among_completed:0.2},
  coverage_topics:[{title:'转角方向变化',analysis:'转角方向随位置变化，不能将单一方向推广到全范围。',evidence_refs:[],representatives:[]}],
  consistency_analyses:[{issue_type:'missing_annotation',analysis:'遗漏集中在转角邻接处，需要比较连续纹理与独立异常。',evidence_refs:[],representatives:[]}],
  discoveries:[{group_id:'turn-pattern',title:'邻接纹理的方向变化形成判断边界',status:'supported',
    description:'连续纹理和独立亮点需要结合邻接关系判断。',annotation_relation:'原框覆盖独立亮点。',
    key_difference:'邻接关系比单纯亮度更有区分力。',scope:'仅覆盖本轮可见转角。',affected_image_count:4}],
  capabilities:[{tag:'structural_relation',coverage_status:'observed',reason:'有实际结构邻接材料。',readiness_status:'not_evaluated',readiness_track:null,missing_conditions:['尚未评价正式轨道。']}],
  usability:[{purpose:'exploration',status:'usable',reason:'可用于梳理可见结构关系。'}],evidence_groups:{},
};
const render=value=>renderToStaticMarkup(React.createElement(AuditReportContent,{report:value,imageUrl:()=>'/original.png'}));

test('audit report uses job-specific topics, separate real categories and unnumbered report chapters',()=>{
  const html=render(report);
  assert.match(html,/<h1[^>]*>模型审计报告<\/h1>/);
  assert.match(html,/转角检查作业/);
  assert.match(html,/实际模型/);
  const headings=[...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(match=>match[1]);
  assert.deepEqual(headings,['总体结论与统计','标注质量与疑点','覆盖画像','数据一致性分析','数据用途与可评测能力','关键发现与规律','审计依据与适用边界']);
  assert.match(html,/<h3[^>]*>转角方向变化<\/h3>/);
  const coverage=html.split(/<h2[^>]*>覆盖画像<\/h2>/)[1].split(/<h2[^>]*>数据一致性分析<\/h2>/)[0];
  assert.match(coverage,/覆盖转角与环状邻接/);
  assert.doesNotMatch(coverage,/原始标注分布|原始框|框面积|框宽|框高|框长宽比|框中心|四分位|中位数/);
  for(const label of ['类别不一致','多标','少标','位置差异','拆分','合并'])assert.match(html,new RegExp(`<h3[^>]*>${label}<\\/h3>`));
  assert.match(html,/遗漏集中在转角邻接处/);
  assert.match(html,/连续纹理和独立亮点需要结合邻接关系判断/);
  assert.match(html,/data-chart="outcomes"/);
  assert.match(html,/data-chart="issues"/);
  assert.match(html,/2 张图像，3 项/);
  assert.doesNotMatch(html,/跨图一致性复核范围|微小目标|低对比现象|已有轨道就绪|报告编号/);
  assert.doesNotMatch(html,/<h[23][^>]*>\s*(?:[一二三四五六七八九]+、|\d+[.、])/);
  assert.doesNotMatch(html,/<h3[^>]*>[^<]*[（(]\d+[）)]/);
  assert.match(html,/普通观察/);
  assert.match(html,/模型疑点/);
  assert.match(html,/没有物理件登记，独立性未评价/);
  assert.match(html,/可用于梳理可见结构关系/);
});

test('folder reports use the classification category and actual zero results without fixed coverage themes',()=>{
  const html=render({...report,total_samples:4,audited_samples:4,suspect_samples:0,
    dataset_names:{folder:'端面目录检查'},dataset_profile:{...report.dataset_profile,dataset_format:'folder_classification',total_images:4},
    statistics:{...report.statistics,total_images:4,completed_images:4,normal_images:4,suspect_images:0,incomplete_images:0,
      issue_occurrences:0,issue_types:{},observation_images:0,observation_occurrences:0,suspect_rate_among_completed:0},
    coverage_topics:[{title:'窗口与外露接触部',analysis:'覆盖窗口的可见位置，不代表完整物理件。',evidence_refs:[],representatives:[]}],
    consistency_analyses:[{issue_type:'image_label_mismatch',analysis:'未保留图像类别疑点，独立真值仍未评价。',evidence_refs:[],representatives:[]}],discoveries:[],capabilities:[]});
  assert.match(html,/<h3[^>]*>类别不一致<\/h3>/);
  assert.doesNotMatch(html,/<h3[^>]*>(多标|少标|位置差异|拆分|合并)<\/h3>/);
  assert.match(html,/<h3[^>]*>窗口与外露接触部<\/h3>/);
  assert.match(html,/未保留图像类别疑点，独立真值仍未评价/);
  assert.doesNotMatch(html,/转角方向变化|图像级标签疑点/);
  assert.match(html,/0 张图像，0 项/);
  assert.match(html,/本作业尚无正式保存的关键发现/);
  assert.match(html,/审计正常 4 张/);
});
