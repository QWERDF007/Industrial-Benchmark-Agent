import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AuditReportContent} from '../lib/client/components/AuditReportContent.js';
import {AuditScoreSummary} from '../lib/client/components/AuditReportScore.js';
import {queryClient} from '../lib/client/query-client.js';
after(()=>queryClient.clear());

const report = {
  total_samples:12,audited_samples:10,suspect_samples:2,distribution:{normal:8,suspect:2,incomplete:2},
  model_name:'实际模型',finished_at:'2026-11-11T08:46:56Z',dataset_names:{dataset:'转角检查作业'},
  conclusion:'可用于本范围的视觉探索，不能直接认证为正式测试集。',coverage_analysis:'覆盖转角与环状邻接。',
  consistency_analysis:'根据原始标注关系分析，本轮仍有遗漏待复核。',knowledge_analysis:'',knowledge_titles:{},
  independence_analysis:'没有物理件登记，独立性未评价。',review_priorities:['先复核重复出现的遗漏。'],limitations:['没有像素标注。'],
  dataset_profile:{dataset_format:'labelme',total_images:12,geometry:{annotation_count:18,annotated_images:8,
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

test('score summary shows a composite donut and each frozen weighted contribution',()=>{
  const score={total:89.19744333660238,weights:{consistency:.8,diversity:.15,redundancy:.05},limitations:[],dimensions:{
    consistency:{label:'数据一致性',score:100},diversity:{label:'数据多样性',score:30.232955577349173},
    redundancy:{label:'数据冗余度',score:93.25}}};
  const renderSummary=value=>renderToStaticMarkup(React.createElement(AuditScoreSummary,{score:value}));
  const html=renderSummary(score);
  assert.match(html,/data-chart="quality-score-summary" data-chart-type="donut"/);
  assert.match(html,/综合得分[^<]*89\.2/);
  for(const formula of ['数据一致性：100.0 × 0.8 = 80.0 分','数据多样性：30.2 × 0.15 = 4.5 分','数据冗余度：93.3 × 0.05 = 4.7 分'])
    assert.ok(html.includes(formula),formula);
  assert.match(html,/未得分[^"<]*10\.8/,'圆环补齐未得分部分，并保留图例和悬浮提示');
  assert.doesNotMatch(html,/<p>|<ul>|<dl>/,'计算明细放在图表悬浮提示中，不附带文字列表');
  const changed=renderSummary({...score,total:69.39318223093967,weights:{consistency:.2,diversity:.4,redundancy:.4}});
  assert.ok(changed.includes('数据一致性：100.0 × 0.2 = 20.0 分'));
  const incomplete=renderSummary({...score,total:null,dimensions:{...score.dimensions,diversity:{label:'数据多样性',score:null}},limitations:['缺少场景观察']});
  assert.match(incomplete,/证据不足/);assert.match(incomplete,/缺少场景观察/);
  assert.doesNotMatch(incomplete,/未得分|数据多样性：0\.0 ×/);
});

test('audit distribution presents program aggregates as charts while retaining necessary explanation tables',()=>{
  const summary={minimum:.005,q25:.00875,median:.015,q75:.025,maximum:.04,lower_whisker:.005,upper_whisker:.04,count:4,outliers:[]};
  const heatmap={x_edges:[0,100,400],y_edges:[0,100,300],cells:[[1,1,6]]};
  const view={dataset_id:null,category:null,image_count:6,annotation_count:4,geometry_types:{polygon:3,bbox:1},invalid_annotation_count:0,unannotated_images:4,
    classes:[{category:'edge',image_count:2,annotation_count:3},{category:'hole',image_count:1,annotation_count:1}],
    instance_counts:{0:4,1:1,3:1},datasets:{scope:6},quality:{PASS:6},metadata:{station:{'':6},camera:{camA:6}},
    heatmaps:{image_dimensions:heatmap,box_dimensions:heatmap,relative_box_dimensions:heatmap,
      box_centers:{x_edges:[0,.5,1],y_edges:[0,.5,1],cells:[[1,1,4]]}},
    histograms:{relative_area:{edges:[0,.02,.05],counts:[2,2],density:[[0,0],[.02,20],[.05,0]]},
      image_aspect_ratio:{edges:[1,2,3],counts:[2,4],density:[[1,0],[2,.5],[3,0]]},
      box_aspect_ratio:{edges:[0,1,2],counts:[2,2],density:[[0,0],[1,.8],[2,0]]}},
    summaries:{relative_area:summary},area_by_category:[{category:'edge',statistics:summary}]};
  const html=render({...report,total_samples:6,dataset_names:{scope:'验收子集'},data_distribution:{dataset_format:'labelme',datasets:['scope'],categories:['edge','hole'],slices:[view,{...view,dataset_id:'scope'}],
    category_area_samples:{scope:{edge:[.01,.04,.02],hole:[.005]}}}});
  assert.match(html,/<h2[^>]*>二、数据分布<\/h2>/);
  assert.match(html,/data-report-section="distribution"/);
  assert.match(html,/类别/);
  const distribution=html.split('data-report-section="distribution"')[1].split('data-report-section="consistency"')[0];
  assert.doesNotMatch(distribution,/<table/,'数据分布不应为图表重复绘制数据表');
  assert.match(distribution,/edge[^"<]*图像（张）：2[^"<]*标注实例（个）：3/);
  assert.match(html,/edge/);
  assert.match(html,/data-chart-type="heatmap"/);
  assert.match(html,/data-chart-type="boxplot"/);
  assert.doesNotMatch(distribution,/data-chart-type="histogram"|概率密度/);
  assert.match(html,/子数据集/);
  const figures=[...distribution.matchAll(/<figure\b[\s\S]*?<\/figure>/g)].map(match=>match[0]);
  assert.doesNotMatch(distribution,/子数据集分布|data-chart="source-datasets"|未登记：|iad-distribution-summary/);
  assert.match(distribution,/相机分布/);
  assert.equal(figures.length,12);
  assert.match(distribution,/<div class="iad-chart-pair"><figure[^>]*data-chart="image-counts"[\s\S]*?<\/figure><figure[^>]*data-chart="annotation-counts"[\s\S]*?<\/figure><\/div>/);
  assert.match(figures[0],/data-chart="image-counts"[^>]*data-chart-type="donut"/);
  assert.match(figures[0],/图像总数 6 张[^<]*有标注，数量（张）：2[^<]*无标注，数量（张）：4/);
  assert.match(figures[1],/data-chart="annotation-counts"[^>]*data-chart-type="bar"/);
  assert.match(figures[1],/验收子集，标注实例（个）：4/);
  assert.doesNotMatch(figures[1],/选择子数据集/);
  assert.match(figures[2],/data-chart="class-distribution"/);
  const areas=figures.find(figure=>figure.includes('data-chart="category-area"'));
  assert.match(areas,/edge[^"<]*中位数：2%[^"<]*样本数：3/);
  assert.match(areas,/hole[^"<]*样本数：1/);
  assert.doesNotMatch(areas,/验收子集[^"<]*下箱须/);
  for(const figure of [figures[0],...figures.slice(2)])assert.match(figure,/aria-label="选择子数据集"/);
  for(const id of ['image-aspect-ratio','box-aspect-ratio','relative-area'])
    assert.match(figures.find(figure=>figure.includes(`data-chart="${id}"`)),/data-chart-type="distribution"/,'长宽比和框面积统一使用占比分布曲线');
  assert.match(figures.find(figure=>figure.includes('data-chart="relative-area"')),/数量（个）：2，占比：50%/);
  assert.doesNotMatch(distribution,/<select|数据分布类别|归一化比例|频数/,'移除类别、单位和密度视图切换');
  assert.match(figures.find(figure=>figure.includes('data-chart="box-dimensions"')),/外接矩形宽（像素）/);
  const centers=figures.find(figure=>figure.includes('data-chart="box-centers"'));
  assert.match(centers,/水平位置 0\.5–1，垂直位置 0\.5–1，数量：4/);
  assert.doesNotMatch(centers,/%/,'框中心位置使用0–1坐标');
});

test('audit report answers the six questions and explains selected knowledge while keeping historical analyses readable',()=>{
  const html=render(report);
  assert.match(html,/<h1[^>]*>模型审计报告<\/h1>/);
  assert.match(html,/转角检查作业/);
  assert.match(html,/实际模型/);
  const headings=[...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/g)].map(match=>match[1]);
  assert.deepEqual(headings,['一、总体结论','二、数据分布','三、数据是否自洽','四、标注质量与复核重点','五、覆盖了哪些视觉场景','六、样本独立性与代表性','七、能够检验模型哪些能力','八、当前适合哪些用途、还缺什么','九、引用知识及审计结果']);
  assert.match(html,/<h3[^>]*>5\.1 转角方向变化<\/h3>/);
  const coverage=html.split(/<h2[^>]*>五、覆盖了哪些视觉场景<\/h2>/)[1].split(/<h2[^>]*>六、样本独立性与代表性<\/h2>/)[0];
  assert.match(coverage,/覆盖转角与环状邻接/);
  assert.doesNotMatch(coverage,/原始标注分布|原始框|框面积|框宽|框高|框长宽比|框中心|四分位|中位数/);
  const quality=html.split('<h2>四、标注质量与复核重点</h2>')[1].split('<h2>五、覆盖了哪些视觉场景</h2>')[0];
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
  assert.match(html,/无候选，数量（张）：6；无有效候选，数量（张）：2；无标注一致，数量（张）：0；标注一致，数量（张）：4/);
  assert.match(html,/标注冲突，数量（张）：0/);
  assert.equal((html.match(/data-consistency-definitions=/g)||[]).length,2,'结果状态和具体冲突类别分别使用解释表格');
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
  assert.match(html,/<h3[^>]*>5\.1 窗口与外露接触部<\/h3>/);
  assert.doesNotMatch(html,/未保留图像类别疑点，独立真值仍未评价/);
  assert.doesNotMatch(html,/转角方向变化|图像级标签疑点/);
  assert.match(html,/没有发现需要保留的标注疑点/);
  assert.match(html,/审计正常，数量（张）：4/);
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
    discoveries:[{...report.discoveries[0],description:'86×16 vs 83×20',annotation_relation:'4.55×5.28'}],
    coverage_topics:[{title:'不同方向的边缘',analysis:'观察到横向与弯曲形态。',related_case_ids:['edge']}],
    capability_topics:[{title:'边缘连续定位',summary:'方向和可见度共同影响边缘观察。',missing_conditions:['需要经确认的参考标注。'],
      points:[{title:'方向变化',observation_and_comparison:'顶部平直，侧边弯曲。',evaluation_value:'可检验不同方向的连续定位。',case_ids:['edge','faint']},
        {title:'局部变淡',observation_and_comparison:'转弯处更接近背景。',evaluation_value:'可检验弱信号检出。',case_ids:['faint']}]}],
    evidence_groups:{'case:edge':[image],'case:faint':[image],'turn-pattern':[image],'coverage:0':[image],'capability:structural_relation':[image]}});
  assert.doesNotMatch(html,/data-audit-case=/,'报告没有游离在章节小点之外的案例区');
  assert.equal((html.match(/class="iad-audit-gallery"/g)||[]).length,3,'各分析在对应位置展示原图');
  const coverage=html.split('<h3>5.1 不同方向的边缘</h3>')[1].split('</article>')[0];
  assert.match(coverage,/class="iad-audit-gallery"/);
  assert.match(coverage,/alt="source.png"/);
  assert.doesNotMatch(html,/href="#audit-|图像对照见|查看图像对照与本次判断/);
  assert.equal((html.match(/data-consistency-definitions=/g)||[]).length,2);
  assert.match(html,/<h3>7\.1 边缘连续定位<\/h3>/);
  assert.match(html,/<h4>7\.1\.1 方向变化<\/h4>/);
  assert.match(html,/<h5>7\.1\.1\.1 图像证据<\/h5>/);
  assert.match(html,/可检验不同方向的连续定位/);
  assert.match(html,/需要经确认的参考标注/);
  assert.doesNotMatch(html,/86×16|83×20|4.55×5.28|internal\/source.png|连续纹理和独立亮点/);
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
  const chapter=html.split('<h2>九、引用知识及审计结果</h2>')[1];
  assert.ok(chapter);
  for(const text of ['沿外缘比较连续性','比较直线与转弯处的连续性','外缘清楚时适用','直线与平顺转弯可分开核对','帮助定位需要复看的边缘变化'])assert.ok(chapter.includes(text));
  assert.match(chapter,/class="iad-audit-gallery"/);
  assert.doesNotMatch(chapter,/<table/);
  assert.match(chapter,/<h4>9\.1\.3 图像特征对比<\/h4><p>/);
  assert.match(chapter,/一致 2 张/);assert.match(chapter,/偏离 1 张/);assert.match(chapter,/不适用 2 张/);
  assert.doesNotMatch(html,/所选知识的实际作用/);
});

test('consistency keeps conflict analysis and charts without status subsections or repeated counts',()=>{
  const html=render({...report,suspect_samples:0,consistency_scopes:[
    {source_status:'NO_CANDIDATES',analysis:'没有找到内容对应的对照图。'},
    {source_status:'NO_ELIGIBLE_CANDIDATES',analysis:'相近图像的可见结构不同。'},
    {source_status:'MODEL_REVIEWED:EQUIVALENT',analysis:'对应区域的分组与覆盖相符。'}],
    statistics:{...report.statistics,suspect_images:0,issue_occurrences:0,issue_types:{},
      upstream_issue_types:{position_difference:{image_count:2,occurrences:3}}},
    consistency_analyses:[{issue_type:'position_difference',title:'边缘转向对应位置变化',description:'两处边缘朝向不同。',
      analysis:'转向处的标注随实际轮廓变化。',audit_result:'本次未保留位置疑点。',representatives:[],evidence_refs:[]}]});
  const chapter=html.split('<h2>三、数据是否自洽</h2>')[1].split('<h2>四、标注质量与复核重点</h2>')[0];
  assert.doesNotMatch(chapter,/data-consistency-scope=|<h3[^>]*>3\.\d+ (?:无候选|无有效候选|无标注一致|标注一致|标注冲突)<\/h3>/);
  assert.doesNotMatch(chapter,/没有找到内容对应的对照图|相近图像的可见结构不同|对应区域的分组与覆盖相符/);
  for(const text of ['边缘转向对应位置变化','本次未保留位置疑点'])assert.ok(chapter.includes(text));
  assert.match(chapter,/<h3>3\.3 边缘转向对应位置变化<\/h3>/);
  assert.match(chapter,/data-chart="model-conflicts"/);
  assert.doesNotMatch(chapter,/上游记录问题|模型复核后保留|程序发现差异|2 张图像，3 项/);
  assert.equal((chapter.match(/data-consistency-definitions=/g)||[]).length,2);
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
  const chapter=html.split('<h2>四、标注质量与复核重点</h2>')[1].split('<h2>五、覆盖了哪些视觉场景</h2>')[0];
  assert.match(chapter,/<h3>4\.1 转角旁的亮点没有被圈住<\/h3><p>亮点与旁边的长纹理分开。<\/p>/);
  assert.match(chapter,/<h4>4\.1\.1 图像证据<\/h4>/);
  assert.match(chapter,/<h4>4\.1\.2 图像对比分析<\/h4><p>已有框圈住纹理，旁边的亮点留在框外。<\/p>/);
  assert.match(chapter,/<h4>4\.1\.3 复核重点<\/h4><p>复看亮点是否需要单独标注。<\/p>/);
  assert.doesNotMatch(chapter,/href="#audit-|跨图标注相同|同内容图中的空标注对照/);
});

test('consistency compares program and reviewed categories with plain definitions and matching image units',()=>{
  const html=render({...report,statistics:{...report.statistics,program_issue_types:{missing_content:4},upstream_issue_types:{},
    issue_types:{split:{image_count:9,occurrences:9}}}});
  const chapter=html.split('<h2>三、数据是否自洽</h2>')[1].split('<h2>四、标注质量与复核重点</h2>')[0];
  assert.match(chapter,/<h3>3\.1 检查结果与冲突类型说明<\/h3>/);
  assert.match(chapter,/主图是当前被检查的图/);
  for(const label of ['无候选','无有效候选','标注一致','标注冲突','待核实','类别不一致','少标实例','多标实例','少标内容','多标内容','拆分','合并'])
    assert.match(chapter,new RegExp('<th scope="row">'+label+'</th><td>'));
  assert.equal((chapter.match(/data-consistency-definitions=/g)||[]).length,2);
  assert.match(chapter,/<th scope="col">类别<\/th><th scope="col">含义<\/th>/);
  const scopeTable=chapter.match(/<table[^>]*data-consistency-definitions="scope"[\s\S]*?<\/table>/)?.[0];
  const conflictTable=chapter.match(/<table[^>]*data-consistency-definitions="conflict"[\s\S]*?<\/table>/)?.[0];
  assert.ok(scopeTable);assert.ok(conflictTable);
  assert.match(scopeTable,/<caption>一致性检查结果说明<\/caption>/);
  assert.match(conflictTable,/<caption>标注冲突类型说明<\/caption>/);
  assert.doesNotMatch(scopeTable,/<th scope="row">类别不一致<\/th>|<th scope="row">多标<\/th>/);
  assert.doesNotMatch(conflictTable,/<th scope="row">无候选<\/th>|<th scope="row">标注一致<\/th>/);
  assert.doesNotMatch(chapter,/<dl|<h4>3\.1\./,'两张分类说明表替代逐项定义小节');
  assert.match(chapter,/同一目标在两张图中的类别记录不同/);
  assert.match(chapter,/主图多出一个完整实例标注/);
  assert.match(chapter,/候选图有完整的缺陷实例标注/);
  const program=chapter.match(/<figure[^>]*data-chart="program-conflicts"[\s\S]*?<\/figure>/)?.[0];
  const model=chapter.match(/<figure[^>]*data-chart="model-conflicts"[\s\S]*?<\/figure>/)?.[0];
  assert.ok(program);assert.ok(model);
  assert.match(program,/程序判定的标注差异统计/);assert.match(model,/标注冲突统计/);
  assert.match(program,/类别不一致，数量（张）：0；少标实例，数量（张）：0；多标实例，数量（张）：0；少标内容，数量（张）：4；多标内容，数量（张）：0；拆分，数量（张）：0；合并，数量（张）：0/);
  assert.match(model,/类别不一致，数量（张）：0；少标实例，数量（张）：0；多标实例，数量（张）：0；少标内容，数量（张）：0；多标内容，数量（张）：0；拆分，数量（张）：0；合并，数量（张）：0/);
  assert.ok(chapter.indexOf('data-chart="program-conflicts"')<chapter.indexOf('data-chart="consistency"'));
  assert.doesNotMatch(chapter,/拆分 9 张/,'一致性冲突不使用本次图像审计疑点数量');
  const classification=render({...report,dataset_profile:{...report.dataset_profile,dataset_format:'folder_classification'},
    statistics:{...report.statistics,program_issue_types:{image_label_mismatch:2},upstream_issue_types:{image_label_mismatch:{image_count:2,occurrences:4}}}})
    .split('<h2>三、数据是否自洽</h2>')[1].split('<h2>四、标注质量与复核重点</h2>')[0];
  assert.equal((classification.match(/类别不一致，数量（张）：2/g)||[]).length,2);
  assert.doesNotMatch(classification,/<th scope="row">多标<\/th>|类别不一致，数量（张）：4/);
});

test('scored reports put composite and dimension scores in conclusion and chart details in chapter two',()=>{
  const score={status:'complete',total:89.6345,weights:{consistency:.8,diversity:.15,redundancy:.05},
    completed_images:10,total_images:10,observed_images:10,limitations:[],dataset_scores:[],dimensions:{
      consistency:{label:'数据一致性',score:93.3,deduction:6.7},diversity:{label:'数据多样性',score:68.88,deduction:31.12},
      redundancy:{label:'数据冗余度',score:93.25,deduction:6.75}},items:[
        {code:'category_mismatch',dimension:'consistency',direction:'标注一致性',label:'类别不一致',maximum:100,
          count:1,denominator:10,ratio:.1,deduction:10,scenario:'',sample_ids:[]},
        {code:'A2',dimension:'diversity',direction:'缺陷类别与形态',label:'类内视觉变化覆盖不足',maximum:10,
          count:3,denominator:203,ratio:3/203,deduction:7.578947368,scenario:'弯曲划痕',sample_ids:[]},
        {code:'D1',dimension:'diversity',direction:'困难良品',label:'困难良品稀缺',maximum:10,
          count:3,denominator:203,ratio:3/203,deduction:5,scenario:'正常边带',sample_ids:[]},
        {code:'D2',dimension:'diversity',direction:'困难良品',label:'困难良品内部类型稀缺',maximum:5,
          count:3,denominator:203,ratio:3/203,deduction:0,scenario:'正常边带',suppressed_by:'D1',sample_ids:[]},
      ]};
  const html=render({...report,quality_score:score});
  const conclusion=html.split('data-report-section="conclusion"')[1].split('data-report-section="score"')[0];
  assert.match(conclusion,/综合得分[^<]*89\.6/);
  for(const label of ['数据一致性','数据多样性','数据冗余度'])assert.match(conclusion,new RegExp(label));
  assert.match(conclusion,/93\.3/);
  assert.match(html,/<h2[^>]*>二、得分明细<\/h2>/);
  assert.match(html,/<h2[^>]*>三、数据分布<\/h2>/);
  assert.match(html,/<h2[^>]*>十、引用知识及审计结果<\/h2>/);
  const details=html.split('data-report-section="score"')[1].split('data-report-section="distribution"')[0];
  const figures=[...details.matchAll(/<figure\b[\s\S]*?<\/figure>/g)].map(match=>match[0]);
  assert.match(figures[0],/data-chart="quality-score-summary" data-chart-type="donut"/);
  assert.equal(figures.length,4);
  for(const figure of figures)assert.match(figure,/<figcaption>[\s\S]*class="iad-chart-controls"[\s\S]*class="iad-multiselect"[\s\S]*aria-label="选择子数据集"/);
  assert.doesNotMatch(details,/<option[^>]*>整体<\/option>|<select/);
  assert.match(details,/data-chart-type="bar"/);
  assert.match(figures[2],/类内视觉变化覆盖不足，扣分：7\.6\/10\.0，数量：3\/203，百分比：1\.478%/);
  assert.doesNotMatch(figures.slice(1).join(''),/该类别已归类缺陷实例共|同一原因已计入/);
  assert.match(details,/该类别已归类缺陷实例共 203 个，该场景有 3 个/);
  assert.match(details,/弯曲划痕/);
  assert.match(details,/统一检查同一缺陷类别内部的形态与外观变化/);
  assert.match(details,/只计算一次扣分/);
  assert.doesNotMatch(details,/特殊形态样本稀缺|同类缺陷形态稀缺|同类缺陷外观变体稀缺/);
  assert.match(details,/同一原因已计入「困难良品稀缺」/);
  assert.doesNotMatch(details,/<table|>category_mismatch</);
  assert.match(details,/类别不一致，扣分：10\.0\/100，数量：1\/10，百分比：10%/);
});


test('score details nest rule scene analysis and numbered image evidence with readable category names',()=>{
  const image={sample_id:'rare',role:'representative',reason:'19',image:{evidence_id:'rare',original_size:[900,634]},
    source:{dataset_format:'labelme',sample:{relative_path:'rare.png',width:900,height:634,quality_status:'UNCERTAIN'},annotations:[]}};
  const score={total:89.19744333660238,weights:{consistency:.8,diversity:.15,redundancy:.05},completed_images:100,
    total_images:100,observed_images:100,limitations:[],dataset_scores:[],dimensions:{
      consistency:{label:'数据一致性',score:100},diversity:{label:'数据多样性',score:30.232955577349173},redundancy:{label:'数据冗余度',score:93.25}},items:[
      {code:'missing_annotation',dimension:'consistency',direction:'标注一致性',label:'少标',maximum:100,count:0,denominator:100,ratio:0,deduction:0,scenario:'',sample_ids:[]},
      {code:'A1',dimension:'diversity',direction:'缺陷类别与形态',label:'缺陷类别覆盖不足',maximum:20,count:1,denominator:92,ratio:1/92,deduction:20,scenario:'19',sample_ids:['rare']},
    ]};
  const html=render({...report,quality_score:score,evidence_groups:{'score:A1':[image]}});
  const details=html.split('data-report-section="score"')[1].split('data-report-section="distribution"')[0];
  assert.match(details,/<h3>2\.2 缺陷类别与形态<\/h3>/);
  assert.match(details,/<h4>2\.2\.1 缺陷类别覆盖不足<\/h4><p>/);
  assert.match(details,/<h5>2\.2\.1\.1 类别 19<\/h5><p>/);
  assert.match(details,/全部已归类缺陷实例共 92 个/);
  assert.match(details,/该场景有 1 个，占比 1\.087%/);
  assert.doesNotMatch(details,/该场景样本覆盖不足|本项扣|这反映当前样本的覆盖情况|不表示原始标注错误/);
  assert.match(details,/扣分：20\.0\/20\.0/);
  assert.match(details,/<h6>2\.2\.1\.1\.1 图像证据<\/h6>/);
  assert.match(details,/<h6>2\.2\.1\.1\.1 图像证据<\/h6><div class="iad-thumbnail-grid"/);
  assert.doesNotMatch(details,/下方原图展示参与|样本覆盖程度由上述统计确定/);
  assert.ok(details.indexOf('该场景有 1 个，占比 1.087%')<details.indexOf('<h6>2.2.1.1.1 图像证据</h6>'));
  assert.doesNotMatch(details,/A1 19|aria-label="19"/);
  const noEvidence=render({...report,quality_score:{...score,items:[score.items[0],{...score.items[1],deduction:null}]}});
  assert.match(noEvidence,/证据不足/);assert.doesNotMatch(noEvidence,/<h6[^>]*>[^<]*图像证据/);
});


test('score analysis respects image units normal evidence and translated scene names',()=>{
  const score={total:95,weights:{consistency:.8,diversity:.15,redundancy:.05},completed_images:100,
    total_images:100,observed_images:100,limitations:[],dataset_scores:[],dimensions:{
      diversity:{label:'数据多样性',score:80,deduction:20},consistency:{label:'数据一致性',score:100,deduction:0},
      redundancy:{label:'数据冗余度',score:100,deduction:0}},items:[
      {code:'B1',dimension:'diversity',direction:'尺寸与位置',label:'微小缺陷样本稀缺',maximum:8,count:2,denominator:23,ratio:2/23,deduction:4.4,scenario:'13：tiny',sample_ids:[]},
      {code:'C3',dimension:'diversity',direction:'缺陷组合',label:'同类多缺陷样本稀缺',maximum:4,count:1,denominator:50,ratio:.02,deduction:4,scenario:'14',sample_ids:[]},
      {code:'C1',dimension:'diversity',direction:'对比度',label:'低对比度样本稀缺',maximum:8,count:1,denominator:36,ratio:1/36,deduction:7.6,scenario:'15：low',sample_ids:[]},
      {code:'D2',dimension:'diversity',direction:'良品',label:'困难类型样本稀缺',maximum:5,count:1,denominator:42,ratio:1/42,deduction:4.9,scenario:'正常边带起伏',sample_ids:['normal']},
      {code:'split',dimension:'consistency',direction:'标注一致性',label:'拆分',maximum:0,count:8,denominator:100,ratio:.08,deduction:0,scenario:'',sample_ids:[]},
    ]};
  const image={sample_id:'normal',role:'representative',reason:'正常边带起伏',image:{evidence_id:'normal',original_size:[900,634]},
    source:{dataset_format:'labelme',sample:{relative_path:'normal.png',width:900,height:634,quality_status:'UNCERTAIN'},annotations:[]}};
  const html=render({...report,quality_score:score,evidence_groups:{'score:D2':[image]}});
  const details=html.split('data-report-section="score"')[1].split('data-report-section="distribution"')[0];
  assert.match(details,/类别 13：微小缺陷/);assert.match(details,/类别 15：低对比度/);
  assert.match(details,/异常图像共 50 张，该场景有 1 张，占比 2%/);
  assert.match(details,/困难良品图像共 42 张，该场景有 1 张/);
  assert.match(details,/图像证据<\/h6><div class="iad-thumbnail-grid"/);
  assert.doesNotMatch(details,/下方原图展示参与|核对正常纹理与困难场景/);
  assert.doesNotMatch(details,/data-score-rule="split"|<h4>[^<]*拆分/);
  assert.match(details,/拆分，扣分：0\.0\/100，数量：8\/100，百分比：8%/);
  assert.doesNotMatch(details,/>[^<]*(?:tiny|15：low)[^<]*</);
});


test('adequate diversity coverage stays in score charts without scarcity details or image evidence',()=>{
  const score={total:99.25,weights:{consistency:.8,diversity:.15,redundancy:.05},completed_images:100,
    total_images:100,observed_images:100,limitations:[],dataset_scores:[],dimensions:{
      diversity:{label:'数据多样性',score:95,deduction:5},consistency:{label:'数据一致性',score:100,deduction:0},
      redundancy:{label:'数据冗余度',score:100,deduction:0}},items:[
      {code:'D1',dimension:'diversity',direction:'困难良品',label:'困难良品稀缺',maximum:10,
        count:33,denominator:50,ratio:.66,deduction:0,scenario:'困难良品',sample_ids:[]},
      {code:'D2',dimension:'diversity',direction:'困难良品',label:'困难良品内部类型稀缺',maximum:5,
        count:1,denominator:33,ratio:1/33,deduction:5,scenario:'正常边带',sample_ids:[]},
      {code:'D3',dimension:'diversity',direction:'困难良品',label:'易混淆良品稀缺',maximum:6,
        count:1,denominator:50,ratio:.02,deduction:0,scenario:'正常边带',suppressed_by:'D2',sample_ids:[]},
      {code:'D4',dimension:'diversity',direction:'困难良品',label:'特殊正常纹理稀缺',maximum:4,
        count:0,denominator:50,ratio:0,deduction:null,scenario:'',sample_ids:[]},
    ]};
  const html=render({...report,quality_score:score});
  assert.doesNotMatch(html,/data-score-rule="D1"|<p>良品图像共 50 张，该场景有 33 张/);
  assert.match(html,/困难良品稀缺，扣分：0\.0\/10\.0，数量：33\/50，百分比：66%/);
  assert.match(html,/<h4>2\.1\.1 困难良品内部类型稀缺<\/h4>/);
  assert.match(html,/data-score-rule="D3"/);
  assert.match(html,/本项不重复扣分/);
  assert.match(html,/data-score-rule="D4"/);
  assert.match(html,/扣分证据不足/);
  const adequate=render({...report,quality_score:{...score,items:[score.items[0]]}});
  assert.doesNotMatch(adequate,/data-score-rule=/);
  assert.match(adequate,/本组未发现需要扣分的覆盖问题/);
});

test('consistency-only reports keep four chapters and paginate actual pairs in two rows',()=>{
  const image={sample_id:'main',caption:'原图',reason:'',role:'representative',image:{evidence_id:'main',original_size:[40,40]},
    source:{dataset_format:'labelme',sample:{relative_path:'main.png'},annotations:[]}};
  const quality_score={status:'complete',total:100,weights:{consistency:1},completed_images:12,total_images:12,observed_images:0,limitations:[],dataset_scores:[],dimensions:{consistency:{label:'数据一致性',score:100,deduction:0}},items:[{code:'missing_annotation',dimension:'consistency',direction:'标注一致性',label:'少标实例',maximum:100,count:1,denominator:12,ratio:1/12,deduction:0,scenario:'',sample_ids:['main']}]};
  for(const count of [2,6,10]){
    const pairs=Array.from({length:count},(_,index)=>({pair_id:String(index),main:image,
      candidate:{...image,sample_id:'candidate-'+index,role:'counter',image:{...image.image,evidence_id:'candidate-'+index}}}));
    const html=render({...report,quality_score,statistics:{...report.statistics,upstream_issue_types:report.statistics.issue_types},audit_scope:'consistency',evidence_pairs:{'consistency:missing_annotation':pairs,'score:missing_annotation':pairs}});
    assert.deepEqual([...html.matchAll(/data-report-section="([^"]+)"/g)].map(match=>match[1]),['conclusion','score','distribution','consistency']);
    assert.ok(!html.includes('覆盖了哪些视觉场景'));
    const details=html.split('data-report-section="score"')[1].split('data-report-section="distribution"')[0];
    assert.doesNotMatch(details,/图像证据|<img|data-audit-evidence-pairs|data-score-rule=|<h[4-6]>/);
    assert.doesNotMatch(details,/下图展示各评分项|本组未发现需要扣分/);
    assert.equal([...html.matchAll(/aria-label="第\d+对图像证据"/g)].length,Math.min(count,4));
    assert.equal([...html.matchAll(/aria-label="放大第\d+对主图"/g)].length,Math.min(count,4));
    assert.equal([...html.matchAll(/aria-label="放大第\d+对对比图"/g)].length,Math.min(count,4));
    assert.doesNotMatch(html, /iad-thumbnail-caption|>主图<|>对比图</);
    assert.ok(html.includes('四、数据是否自洽'));
    const consistency=html.split('data-report-section="consistency"')[1];
    assert.match(consistency,/<h3>4\.2 标注一致性<\/h3>/);
    const numbers=[...consistency.matchAll(/<h[3-6]>([0-9.]+) /g)].map(match=>match[1]);
    assert.equal(new Set(numbers).size,numbers.length,'问题分析与图证使用统一章节编号');
    assert.ok(consistency.indexOf('遗漏集中在转角邻接处')<consistency.indexOf('data-audit-evidence-pairs'),'分析先于图像证据');
    assert.match(html, /data-audit-evidence-pairs[^>]*>[\s\S]*?class="iad-thumbnail-grid"><section class="iad-audit-evidence-pair"/);
    assert.doesNotMatch(html, /class="dc-compare"/);
    if(count>4)assert.ok(html.includes(`共 ${count*2} 张`));
    else assert.doesNotMatch(html,/aria-label="图像证据分页"/);
  }
});


test('consistency scope retains the audit outcome donut beside the score',()=>{
  const html=render({...report,audit_scope:'consistency',total_samples:2176,audited_samples:2176,
    suspect_samples:170,distribution:{normal:2006,suspect:170},
    statistics:{...report.statistics,total_images:2176,completed_images:2176,normal_images:2006,suspect_images:170,incomplete_images:0}});
  const conclusion=html.split('data-report-section="conclusion"')[1].split('data-report-section=')[0];
  assert.match(conclusion,/<figcaption>本轮审计结果<\/figcaption>/);
  assert.match(conclusion,/审计正常，数量（张）：2,006/);
  assert.match(conclusion,/发现疑点，数量（张）：170/);
  assert.doesNotMatch(conclusion,/未比较|未完成/);
  assert.doesNotMatch(conclusion,/数据一致性结果|无有效候选/);
});

test('distribution score keeps overall tooltips and shows category analysis in numbered subsections',()=>{
  const dimensions={consistency:{label:'数据一致性',score:96.4},diversity:{label:'数据多样性',score:60}};
  const score={version:'1.8',dataset_id:null,total:92.76,total_images:100,completed_images:100,observed_images:0,
    weights:{consistency:.9,diversity:.1},limitations:[],dataset_scores:[],dimensions,items:[
      {code:'instance_count_mismatch',dimension:'consistency',direction:'标注一致性',label:'少标/多标实例',
        maximum:100,count:2,denominator:100,ratio:.02,deduction:3.6,pair_count:1,compared_pairs:50,sample_ids:[]},
      {code:'class_balance',dimension:'diversity',direction:'分布多样性',label:'类别长尾',maximum:40,
        count:0,denominator:0,ratio:null,deduction:40,scenario:'少数类只有3个实例。',analysis:'类别长尾明显，少数类样本不足。',sample_ids:[],
        distribution_evidence:[{metric:'category',bucket:'hole',image_count:3,annotation_count:3}]},
      {code:'instance_geometry',dimension:'diversity',direction:'分布多样性',label:'实例尺寸、比例与面积失衡',maximum:20,deduction:0,
        analysis:'实例尺寸变化正常，没有覆盖不足。',distribution_evidence:[]},
      {code:'capture_source',dimension:'diversity',direction:'分布多样性',label:'采集来源失衡',maximum:5,deduction:0,
        analysis:'本数据集没有登记采集来源。',distribution_evidence:[]},
      {code:'image_geometry',dimension:'diversity',direction:'分布多样性',label:'图像尺寸与比例失衡',maximum:15,deduction:9,
        distribution_evidence:[{metric:'image_dimensions',x_range:[120,135],y_range:[100,120],image_count:7}]}]};
  const heatmap={x_edges:[0,1],y_edges:[0,1],cells:[]};
  const slice={dataset_id:null,category:null,image_count:100,annotation_count:91,invalid_annotation_count:0,
    geometry_types:{polygon:91},unannotated_images:9,classes:[{category:'edge',image_count:88,annotation_count:88},
      {category:'hole',image_count:3,annotation_count:3}],instance_counts:{0:9,1:91},datasets:{scope:100},quality:{},metadata:{},
    heatmaps:{image_dimensions:heatmap,box_dimensions:heatmap,relative_box_dimensions:heatmap,box_centers:heatmap},
    histograms:{},summaries:{},area_by_category:[]};
  const html=render({...report,audit_scope:'consistency',quality_score:score,
    data_distribution:{dataset_format:'labelme',datasets:['scope'],categories:['edge','hole'],slices:[slice,{...slice,dataset_id:'scope'}],category_area_samples:{}},
    distribution_analysis:'图像规格接近，主要问题是类别长尾。'});
  const details=html.split('data-report-section="score"')[1].split('data-report-section="distribution"')[0];
  assert.match(details,/综合得分系数：数据一致性 0\.9，数据多样性 0\.1/);
  assert.match(details,/数量：2\/100，计分图对：1\/50/);
  const plot=details.match(/aria-label="分布多样性扣分[^"]*"/)[0];
  assert.match(plot,/类别长尾，扣分：40\.0\/40\.0/);
  assert.doesNotMatch(plot,/hole|图像宽|图像 3 张|标注实例|长尾明显/);
  const analysis=details.match(/<article[^>]*data-score-rule="class_balance"[^>]*>[\s\S]*?<\/article>/)?.[0];
  assert.ok(analysis,'图表下方直接显示类别分析与统计明细');
  assert.match(analysis,/<h4>2\.2\.1 类别长尾<\/h4>/);
  assert.match(analysis,/<p>类别长尾明显，少数类样本不足。<\/p>/);
  assert.match(analysis,/<li>hole：图像 3 张，标注实例 3 个<\/li>/);
  assert.ok(details.indexOf(analysis)>details.indexOf('</figure>',details.indexOf('score-分布多样性')));
  assert.match(details,/<h4>2\.2\.2 图像尺寸与比例失衡<\/h4>/);
  assert.doesNotMatch(details,/<details|<summary/);
  assert.doesNotMatch(details,/data-score-rule="instance_geometry"|data-score-rule="capture_source"|实例尺寸变化正常|没有登记采集来源/);
  assert.match(plot,/实例尺寸、比例与面积失衡，扣分：0\.0\/20\.0/);
  assert.match(details,/图像宽 120–135 像素，图像高 100–120 像素：图像 7 张/);
  assert.doesNotMatch(details,/图像 100 张|标注实例 91 个|类别：2 类|edge：/);
  const historical=render({...report,audit_scope:'consistency',quality_score:{...score,version:'1.7',items:[{
    ...score.items[1],distribution_evidence:undefined}]}});
  assert.match(historical,/类别长尾，扣分：40\.0\/40\.0/);
  assert.doesNotMatch(historical,/hole：图像|标注实例 91 个/);
  assert.doesNotMatch(details,/少数类只有3个实例|<img|data-audit-evidence-pairs|共 0/);
  assert.match(html,/<p>图像规格接近，主要问题是类别长尾。<\/p>/);
});
