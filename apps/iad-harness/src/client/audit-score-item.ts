import type {QualityScoreItem} from '../shared/domain.generated.js';
import {auditIssueDescriptions} from '../shared/audit.generated.js';
import {chartNumber} from './components/charts/options.js';

const populations={
  defects:{label:'全部已归类缺陷实例',unit:'个'},category:{label:'该类别已归类缺陷实例',unit:'个'},
  abnormal:{label:'异常图像',unit:'张'},normal:{label:'良品图像',unit:'张'},
  hard:{label:'困难良品图像',unit:'张'},images:{label:'审计图像',unit:'张'},
} as const;
type RuleReading={description:string;population:keyof typeof populations;scene:'category'|'combination'|'scene'};
const rules:Readonly<Record<string,RuleReading>>={
  A1:{description:'检查不同缺陷类别的样本覆盖，展示覆盖不足类别的数量、占比和扣分。',population:'defects',scene:'category'},
  A2:{description:'统一检查同一缺陷类别内部的形态与外观变化，按覆盖最不足的实际场景只计算一次扣分。',population:'category',scene:'category'},
  B1:{description:'检查同一缺陷类别中微小缺陷的样本覆盖。',population:'category',scene:'category'},
  B2:{description:'检查同一缺陷类别中其他尺寸层次的样本分布。',population:'category',scene:'category'},
  B3:{description:'检查同一缺陷类别中边缘、角落等位置的样本覆盖。',population:'category',scene:'category'},
  B4:{description:'检查同一缺陷类别在关键结构区域的样本覆盖。',population:'category',scene:'category'},
  C1:{description:'检查同一缺陷类别中低对比度场景的样本覆盖。',population:'category',scene:'category'},
  C2:{description:'检查同一缺陷类别中其他对比度层次的样本分布。',population:'category',scene:'category'},
  C3:{description:'检查一张异常图像内同时出现多个同类缺陷的样本覆盖，按图像计数。',population:'abnormal',scene:'category'},
  C4:{description:'检查一张异常图像内同时出现不同缺陷类别的组合覆盖，按图像计数。',population:'abnormal',scene:'combination'},
  D1:{description:'检查已与实际缺陷对照、确认难以区分的良品样本覆盖。',population:'normal',scene:'scene'},
  D2:{description:'检查困难良品内部不同困难类型的样本覆盖。',population:'hard',scene:'scene'},
  D3:{description:'检查良品中容易与缺陷混淆的样本覆盖。',population:'normal',scene:'scene'},
  D4:{description:'检查良品中特殊正常纹理的样本覆盖。',population:'normal',scene:'scene'},
  E:{description:'统计严格重复组中保留一张之后的额外图像，避免把整组都计为冗余。',population:'images',scene:'scene'},
  V:{description:'统计本场已确认的低信息增量相似组中的额外图像，严格重复内容不重复计数。',population:'images',scene:'scene'},
};
const sizes={tiny:'微小缺陷',small:'小尺寸缺陷',medium:'中等尺寸缺陷',large:'大尺寸缺陷'};
const contrasts={low:'低对比度',medium:'中等对比度',high:'高对比度'};
const sceneLabels:Readonly<Record<string,Readonly<Record<string,string>>>>={B1:sizes,B2:sizes,
  B3:{center:'中心区域',edge:'边缘区域',corner:'角落区域'},C1:contrasts,C2:contrasts};

export function auditScoreItemDetails(item:QualityScoreItem,items:readonly QualityScoreItem[]) {
  const rule:RuleReading=item.dimension==='consistency'
    ?{description:auditIssueDescriptions[item.code as keyof typeof auditIssueDescriptions],population:'images',scene:'scene'}:rules[item.code];
  const population=populations[rule.population];
  const separator=item.scenario.lastIndexOf('：'),value=item.scenario.slice(separator+1);
  const translated=sceneLabels[item.code]?.[value];
  const scene=translated?item.scenario.slice(0,separator+1)+translated:item.scenario;
  const scenarioTitle=!scene?null:rule.scene==='category'?'类别 '+scene:
    rule.scene==='combination'?'类别组合 '+scene:scene;
  const statistics=`${population.label}共 ${chartNumber(item.denominator)} ${population.unit}，${scene?'该场景有':'本项涉及'} ${chartNumber(item.count)} ${population.unit}，占比 ${item.ratio===null?'不适用':chartNumber(item.ratio,'percent')}。`;
  const counted=items.find(other=>other.code===item.suppressed_by);
  const outcome=item.deduction===null?'扣分证据不足，本项尚不能给出分数。':item.suppressed_by
    ?`同一原因已计入「${counted!.label}」，本项不重复扣分。`:item.maximum===0?'本项只记录观察到的现象，不参与扣分。'
    :item.count===0?'本次未记录到对应场景，本项不扣分。':'';
  return {description:rule.description,scenarioTitle,analysis:statistics+outcome};
}
