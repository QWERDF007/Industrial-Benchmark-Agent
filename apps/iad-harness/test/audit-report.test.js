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
    observation_images:4,observation_occurrences:6,suspect_rate_among_completed:0.2,
    consistency_cross:{NO_CANDIDATES:{normal:6},NO_ELIGIBLE_CANDIDATES:{normal:2},'MODEL_REVIEWED:EQUIVALENT':{normal:2,suspect:2}}},
  coverage_topics:[{title:'转角方向变化',analysis:'转角方向随位置变化，不能将单一方向推广到全范围。',evidence_refs:[],representatives:[]}],
  consistency_analyses:[{issue_type:'missing_annotation',analysis:'遗漏集中在转角邻接处，需要比较连续纹理与独立异常。',evidence_refs:[],representatives:[]}],
  discoveries:[{group_id:'turn-pattern',title:'邻接纹理的方向变化形成判断边界',status:'supported',
    description:'连续纹理和独立亮点需要结合邻接关系判断。',annotation_relation:'原框覆盖独立亮点。',
    key_difference:'邻接关系比单纯亮度更有区分力。',scope:'仅覆盖本轮可见转角。',affected_image_count:4}],
  capabilities:[{tag:'structural_relation',coverage_status:'observed',reason:'有实际结构邻接材料。',readiness_status:'not_evaluated',readiness_track:null,missing_conditions:['尚未评价正式轨道。']}],
  usability:[{purpose:'exploration',status:'usable',reason:'可用于梳理可见结构关系。'}],evidence_groups:{},
};
const render=value=>renderToStaticMarkup(React.createElement(AuditReportContent,{report:value,imageUrl:()=>'/original.png'}));

test('audit report answers the six questions and explains selected knowledge while keeping historical analyses readable',()=>{
  const html=render(report);
  assert.match(html,/<h1[^>]*>模型审计报告<\/h1>/);
  assert.match(html,/转角检查作业/);
  assert.match(html,/实际模型/);
  const headings=[...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(match=>match[1]);
  assert.deepEqual(headings,['一、总体结论','二、数据是否自洽','三、标注质量与复核重点','四、覆盖了哪些视觉场景','五、样本独立性与代表性','六、能够检验模型哪些能力','七、当前适合哪些用途、还缺什么','八、引用知识及审计结果']);
  assert.match(html,/<h3[^>]*>4\.1 转角方向变化<\/h3>/);
  const coverage=html.split(/<h2[^>]*>四、覆盖了哪些视觉场景<\/h2>/)[1].split(/<h2[^>]*>五、样本独立性与代表性<\/h2>/)[0];
  assert.match(coverage,/覆盖转角与环状邻接/);
  assert.doesNotMatch(coverage,/原始标注分布|原始框|框面积|框宽|框高|框长宽比|框中心|四分位|中位数/);
  const quality=html.split('<h2>三、标注质量与复核重点</h2>')[1].split('<h2>四、覆盖了哪些视觉场景</h2>')[0];
  assert.doesNotMatch(quality,/遗漏集中在转角邻接处/,'跨图一致性说明不作为单图质量分析');
  assert.match(html,/连续纹理和独立亮点需要结合邻接关系判断/);
  assert.match(html,/data-chart="outcomes"/);
  assert.match(html,/data-chart="issues"/);
  assert.match(html,/有 2 张图像需要复核，共 3 处/);
  assert.doesNotMatch(html,/跨图一致性复核范围|微小目标|低对比现象|已有轨道就绪|报告编号/);
  assert.doesNotMatch(html,/<h3[^>]*>[^<]*[（(]\d+[）)]/);
  assert.match(html,/没有物理件登记，独立性未评价/);
  assert.match(html,/可用于梳理可见结构关系/);
  assert.match(html,/已有的一致性检查对 4 张图像做过跨图比较/);
  assert.match(html,/无候选 6 张；无有效候选 2 张；标注一致 4 张/);
  assert.match(html,/标注冲突 0 张/);
  assert.equal((html.match(/<table/g)||[]).length,2,'结果状态和具体冲突类别分别使用解释表格');
});

test('folder reports use the classification category and actual zero results without fixed coverage themes',()=>{
  const html=render({...report,total_samples:4,audited_samples:4,suspect_samples:0,
    dataset_names:{folder:'端面目录检查'},dataset_profile:{...report.dataset_profile,dataset_format:'folder_classification',total_images:4},
    statistics:{...report.statistics,total_images:4,completed_images:4,normal_images:4,suspect_images:0,incomplete_images:0,
      issue_occurrences:0,issue_types:{},observation_images:0,observation_occurrences:0,suspect_rate_among_completed:0},
    coverage_topics:[{title:'窗口与外露接触部',analysis:'覆盖窗口的可见位置，不代表完整物理件。',evidence_refs:[],representatives:[]}],
    consistency_analyses:[{issue_type:'image_label_mismatch',analysis:'未保留图像类别疑点，独立真值仍未评价。',evidence_refs:[],representatives:[]}],discoveries:[],capabilities:[]});
  assert.doesNotMatch(html,/data-chart="issues"/);
  assert.doesNotMatch(html,/<h3[^>]*>(多标|少标|位置差异|拆分|合并)<\/h3>/);
  assert.match(html,/<h3[^>]*>4\.1 窗口与外露接触部<\/h3>/);
  assert.doesNotMatch(html,/未保留图像类别疑点，独立真值仍未评价/);
  assert.doesNotMatch(html,/转角方向变化|图像级标签疑点/);
  assert.match(html,/没有发现需要保留的标注疑点/);
  assert.match(html,/审计正常 4 张/);
});

test('each analysis shows related originals directly while case explanations share one source',()=>{
  const image={sample_id:'original',role:'representative',reason:'顶部横向边缘。',
    image:{evidence_id:'whole',original_size:[80,60]},source:{dataset_format:'folder_classification',
      sample:{relative_path:'internal/source.png',width:80,height:60,quality_status:'UNCERTAIN'},annotations:[]}};
  const edge={case_id:'edge',title:'横向与弯曲边缘',home_section:'consistency',observation:'顶部横向延伸，侧边呈弯曲形态。',
    comparison:'两张原图中的方向和转折不同。',significance:'可见形态解释了标注覆盖的差异。',evidence_refs:[{sample_id:'original',result_revision:1,kind:'image'}]};
  const faint={case_id:'faint',title:'边缘的可见度变化',home_section:'capability',observation:'同一边缘在转弯处变淡。',
    comparison:'直线段较清楚，转弯处与背景更接近。',significance:'可研究转弯处是否容易漏检。',evidence_refs:[{sample_id:'original',result_revision:1,kind:'image'}]};
  const html=render({...report,report_cases:[edge,faint],
    discoveries:[{...report.discoveries[0],description:'86×16 vs 83×20',annotation_relation:'3.55×4.28'}],
    coverage_topics:[{title:'不同方向的边缘',analysis:'观察到横向与弯曲形态。',related_case_ids:['edge']}],
    capability_topics:[{title:'边缘连续定位',summary:'方向和可见度共同影响边缘观察。',missing_conditions:['需要经确认的参考标注。'],
      points:[{title:'方向变化',observation_and_comparison:'顶部平直，侧边弯曲。',evaluation_value:'可检验不同方向的连续定位。',case_ids:['edge','faint']},
        {title:'局部变淡',observation_and_comparison:'转弯处更接近背景。',evaluation_value:'可检验弱信号检出。',case_ids:['faint']}]}],
    evidence_groups:{'case:edge':[image],'case:faint':[image],'turn-pattern':[image],'coverage:0':[image],'capability:structural_relation':[image]}});
  assert.doesNotMatch(html,/data-audit-case=/,'报告没有游离在章节小点之外的案例区');
  assert.equal((html.match(/class="iad-audit-gallery"/g)||[]).length,3,'各分析在对应位置展示原图');
  const coverage=html.split('<h3>4.1 不同方向的边缘</h3>')[1].split('</article>')[0];
  assert.match(coverage,/class="iad-audit-gallery"/);
  assert.match(coverage,/alt="source.png"/);
  assert.doesNotMatch(html,/href="#audit-|图像对照见|查看图像对照与本次判断/);
  assert.equal((html.match(/<table/g)||[]).length,2);
  assert.match(html,/<h3>6\.1 边缘连续定位<\/h3>/);
  assert.match(html,/<h4>6\.1\.1 方向变化<\/h4>/);
  assert.match(html,/<h5>6\.1\.1\.1 图像证据<\/h5>/);
  assert.match(html,/可检验不同方向的连续定位/);
  assert.match(html,/需要经确认的参考标注/);
  assert.doesNotMatch(html,/86×16|83×20|3.55×4.28|internal\/source.png|连续纹理和独立亮点/);
  assert.doesNotMatch(html,/<th scope="col">能力<\/th>/,'能力专题替代固定标签表作为主体');
});

test('zero-suspect categories stay in structured data even when every category cites checked images',()=>{
  const html=render({...report,suspect_samples:0,statistics:{...report.statistics,suspect_images:0,issue_occurrences:0,issue_types:{}},
    consistency_analyses:['category_mismatch','extra_annotation','missing_annotation','position_difference','split','merge'].map(issue_type=>({
      issue_type,analysis:'各类检查的重复说明。',evidence_refs:[{sample_id:'checked',result_revision:1,kind:'image'}],related_case_ids:['edge']})),
    report_cases:[{case_id:'edge',title:'连续边缘的观察',home_section:'quality',observation:'边缘被连续覆盖。',comparison:'相邻部分延伸方向一致。',significance:'观察到的接续关系清楚。',evidence_refs:[{sample_id:'checked',result_revision:1,kind:'image'}]}]});
  assert.doesNotMatch(html,/各类检查的重复说明/);
  assert.doesNotMatch(html,/data-chart="issues"/);
  assert.doesNotMatch(html,/连续边缘的观察/,'结构化案例不会直接拼接为正文');
});

test('upstream comparison coverage is independent from unfinished audit coverage',()=>{
  const html=render({...report,audited_samples:0,suspect_samples:0,statistics:{...report.statistics,
    completed_images:0,normal_images:0,suspect_images:0,incomplete_images:12,issue_occurrences:0,issue_types:{},
    consistency_cross:{'MODEL_REVIEWED:EQUIVALENT':{incomplete:12}}}});
  assert.match(html,/已检查 0 张图像/);
  assert.match(html,/已有的一致性检查对 12 张图像做过跨图比较/);
  assert.doesNotMatch(html,/其中 12 张/);
});

test('knowledge has its own chapter with a description original-image gallery and structured application',()=>{
  const image={sample_id:'original',role:'representative',reason:'平顺转弯与相邻外缘。',
    image:{evidence_id:'whole',original_size:[80,60]},source:{dataset_format:'folder_classification',
      sample:{relative_path:'internal/source.png',width:80,height:60,quality_status:'UNCERTAIN'},annotations:[]}};
  const html=render({...report,knowledge_titles:{K1:'沿外缘比较连续性'},knowledge_entries:[{
    entry:{check:{check_id:'K1',title:'沿外缘比较连续性',status:'provisional'},review:{status:'pending'}},
    analysis:{check_id:'K1',description:'比较直线与转弯处的连续性。',applicability:'外缘清楚时适用。',
      analysis:'直线与平顺转弯可分开核对。',audit_impact:'帮助定位需要复看的边缘变化。'}}],
    statistics:{...report.statistics,knowledge_assessments:{K1:{consistent:2,deviates:1,unobservable:1,not_applicable:2}}},
    evidence_groups:{'knowledge:K1':[image]}});
  const chapter=html.split('<h2>八、引用知识及审计结果</h2>')[1];
  assert.ok(chapter);
  for(const text of ['沿外缘比较连续性','比较直线与转弯处的连续性','外缘清楚时适用','直线与平顺转弯可分开核对','帮助定位需要复看的边缘变化'])assert.ok(chapter.includes(text));
  assert.match(chapter,/class="iad-audit-gallery"/);
  assert.doesNotMatch(chapter,/<table/);
  assert.match(chapter,/<h4>8\.1\.3 图像观察与对照<\/h4><p>/);
  assert.match(chapter,/一致 2 张/);assert.match(chapter,/偏离 1 张/);assert.match(chapter,/不适用 2 张/);
  assert.doesNotMatch(html,/所选知识的实际作用/);
});

test('consistency shows source scopes and upstream conflicts even when the audit retains no issue',()=>{
  const html=render({...report,suspect_samples:0,consistency_scopes:[
    {source_status:'NO_CANDIDATES',analysis:'没有找到内容对应的对照图。'},
    {source_status:'NO_ELIGIBLE_CANDIDATES',analysis:'相近图像的可见结构不同。'},
    {source_status:'MODEL_REVIEWED:EQUIVALENT',analysis:'对应区域的分组与覆盖相符。'}],
    statistics:{...report.statistics,suspect_images:0,issue_occurrences:0,issue_types:{},
      upstream_issue_types:{position_difference:{image_count:2,occurrences:3}}},
    consistency_analyses:[{issue_type:'position_difference',title:'边缘转向对应位置变化',description:'两处边缘朝向不同。',
      analysis:'转向处的标注随实际轮廓变化。',audit_result:'本次未保留位置疑点。',representatives:[],evidence_refs:[]}]});
  const chapter=html.split('<h2>二、数据是否自洽</h2>')[1].split('<h2>三、标注质量与复核重点</h2>')[0];
  for(const [index,label] of ['无候选','无有效候选','标注一致'].entries())assert.match(chapter,new RegExp('<h3[^>]*>2\\.'+(index+3)+' '+label+'</h3>'));
  for(const text of ['没有找到内容对应的对照图','相近图像的可见结构不同','对应区域的分组与覆盖相符','边缘转向对应位置变化','本次未保留位置疑点'])assert.ok(chapter.includes(text));
  assert.match(chapter,/data-chart="model-conflicts"/);assert.match(chapter,/2 张图像，3 项/);
  assert.equal((chapter.match(/<table/g)||[]).length,2);
});

test('quality issues use a concrete title, description, nearby images and numbered analysis',()=>{
  const image={sample_id:'original',role:'representative',reason:'查看转角旁的亮点。',
    image:{evidence_id:'whole',original_size:[80,60]},source:{dataset_format:'folder_classification',
      sample:{relative_path:'source.png',width:80,height:60},annotations:[]}};
  const html=render({...report,report_cases:[{case_id:'corner-missing',title:'转角旁的亮点没有被圈住',
    observation:'亮点与旁边的长纹理分开。',comparison:'已有框圈住纹理，旁边的亮点留在框外。',
    significance:'复看亮点是否需要单独标注。',evidence_refs:[{sample_id:'original',result_revision:1,kind:'finding',index:0}]}],
    consistency_analyses:[{issue_type:'missing_annotation',title:'同内容图中的空标注对照',analysis:'跨图标注相同。'}],
    evidence_groups:{'case:corner-missing':[image]}});
  const chapter=html.split('<h2>三、标注质量与复核重点</h2>')[1].split('<h2>四、覆盖了哪些视觉场景</h2>')[0];
  assert.match(chapter,/<h3>3\.1 转角旁的亮点没有被圈住<\/h3><p>亮点与旁边的长纹理分开。<\/p>/);
  assert.match(chapter,/<h4>3\.1\.1 图像证据<\/h4>/);
  assert.match(chapter,/<h4>3\.1\.2 跨图对照<\/h4><p>已有框圈住纹理，旁边的亮点留在框外。<\/p>/);
  assert.match(chapter,/<h4>3\.1\.3 复核重点<\/h4><p>复看亮点是否需要单独标注。<\/p>/);
  assert.doesNotMatch(chapter,/<table|href="#audit-|跨图标注相同|同内容图中的空标注对照/);
});

test('consistency compares program and reviewed categories with plain definitions and matching image units',()=>{
  const html=render({...report,statistics:{...report.statistics,program_issue_types:{position_difference:4},upstream_issue_types:{},
    issue_types:{split:{image_count:9,occurrences:9}}}});
  const chapter=html.split('<h2>二、数据是否自洽</h2>')[1].split('<h2>三、标注质量与复核重点</h2>')[0];
  assert.match(chapter,/<h3>2\.1 各类结果是什么意思<\/h3>/);
  assert.match(chapter,/主图是当前被检查的图/);
  for(const label of ['无候选','无有效候选','标注一致','标注冲突','待核实','类别不一致','多标','少标','位置差异','拆分','合并'])
    assert.match(chapter,new RegExp('<th scope="row">'+label+'</th><td>'));
  assert.equal((chapter.match(/<table/g)||[]).length,2);
  assert.match(chapter,/<th scope="col">类别<\/th><th scope="col">含义<\/th>/);
  const scopeTable=chapter.match(/<table[^>]*data-consistency-definitions="scope"[\s\S]*?<\/table>/)?.[0];
  const conflictTable=chapter.match(/<table[^>]*data-consistency-definitions="conflict"[\s\S]*?<\/table>/)?.[0];
  assert.ok(scopeTable);assert.ok(conflictTable);
  assert.match(scopeTable,/<caption>对照图与比较结果<\/caption>/);
  assert.match(conflictTable,/<caption>标注冲突类别<\/caption>/);
  assert.doesNotMatch(scopeTable,/<th scope="row">类别不一致<\/th>|<th scope="row">多标<\/th>/);
  assert.doesNotMatch(conflictTable,/<th scope="row">无候选<\/th>|<th scope="row">标注一致<\/th>/);
  assert.doesNotMatch(chapter,/<dl|<h4>2\.1\./,'两张分类说明表替代逐项定义小节');
  assert.match(chapter,/同一目标在两张图中的类别记录不同/);
  assert.match(chapter,/主图有标注，对照图中同一处可见内容没有相应标注/);
  assert.match(chapter,/对照图有标注，主图中同一处可见内容没有相应标注/);
  const program=chapter.match(/<figure[^>]*data-chart="program-conflicts"[\s\S]*?<\/figure>/)?.[0];
  const model=chapter.match(/<figure[^>]*data-chart="model-conflicts"[\s\S]*?<\/figure>/)?.[0];
  assert.ok(program);assert.ok(model);
  assert.match(program,/程序统计/);assert.match(model,/模型复核统计/);
  assert.match(program,/类别不一致 0 张；多标 0 张；少标 0 张；位置差异 4 张；拆分 0 张；合并 0 张/);
  assert.match(model,/类别不一致 0 张；多标 0 张；少标 0 张；位置差异 0 张；拆分 0 张；合并 0 张/);
  assert.ok(chapter.indexOf('data-chart="program-conflicts"')<chapter.indexOf('2.3 无候选'));
  assert.doesNotMatch(chapter,/拆分 9 张/,'一致性冲突不使用本次图像审计疑点数量');
  const classification=render({...report,dataset_profile:{...report.dataset_profile,dataset_format:'folder_classification'},
    statistics:{...report.statistics,program_issue_types:{image_label_mismatch:2},upstream_issue_types:{image_label_mismatch:{image_count:2,occurrences:4}}}})
    .split('<h2>二、数据是否自洽</h2>')[1].split('<h2>三、标注质量与复核重点</h2>')[0];
  assert.equal((classification.match(/类别不一致 2 张/g)||[]).length,2);
  assert.doesNotMatch(classification,/<th scope="row">多标<\/th>|类别不一致 4 张/);
});
