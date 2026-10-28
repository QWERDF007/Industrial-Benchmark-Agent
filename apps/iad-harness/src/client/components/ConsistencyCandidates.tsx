import React from 'react';
import type {Dataset,RetrievalMember,RetrievalPage} from '../../shared/contracts.js';
import {imageRelations} from '../../shared/consistency-presentation.js';
import {mediaUrl,reviewLabels} from '../api.js';

export function ConsistencyCandidates({groups,selected,datasets,onSelect,onCompare}:{
  groups:RetrievalPage['exact']['groups'];selected:RetrievalMember|undefined;datasets:Dataset[];
  onSelect(groupId:string,memberId:string):void;onCompare(trigger:HTMLButtonElement):void;
}) {
  const dataset=datasets.find(item=>item.dataset_id===selected?.dataset_id);
  const selectedGroup=groups.find(item=>item.members.includes(selected!));
  const score=selectedGroup?.origins.find(origin=>origin.branch==='visual')?.score;
  return <div className="iad-consistency-search-layout">
    <section className="iad-consistency-list" aria-label="候选图像网格"><header className="iad-consistency-panel-header"><strong>检索结果</strong><span>按实际召回顺序</span></header>
      <div className="iad-consistency-candidate-grid">{groups.flatMap(group=>group.members.map(member=>{
        const source=datasets.find(item=>item.dataset_id===member.dataset_id),name=member.sample_id.slice(member.sample_id.indexOf(':')+1);
        const value=group.origins.find(origin=>origin.branch==='visual')?.score;
        return <button key={group.content_group_id+member.sample_id} data-relation={member.relation} aria-pressed={member===selected} onClick={()=>onSelect(group.content_group_id,member.sample_id)}>
          {source && <img loading="lazy" src={mediaUrl({task_id:source.task_id,sample_id:member.sample_id},'thumbnail')} alt={name} />}
          <strong title={name}>{name}</strong><span>{imageRelations[member.relation]}{typeof value==='number' ? ` · 视觉分数 ${value.toFixed(4)}` : ''}</span>
          <small>原标签：{reviewLabels[member.quality_status as keyof typeof reviewLabels] || member.quality_status}</small>
        </button>;
      }))}</div>
    </section>
    {selected && <aside className="iad-consistency-detail" aria-label="候选图像详情"><header className="iad-consistency-panel-header"><strong>图像详情</strong><span>{imageRelations[selected.relation]}</span></header>
      <div className="iad-consistency-detail-body">{dataset && <img className="iad-consistency-detail-photo" src={mediaUrl({task_id:dataset.task_id,sample_id:selected.sample_id})} alt={selected.sample_id.slice(selected.sample_id.indexOf(':')+1)} />}
        <dl><dt>文件名</dt><dd title={selected.sample_id}>{selected.sample_id.slice(selected.sample_id.indexOf(':')+1)}</dd>
          <dt>原始标签</dt><dd>{reviewLabels[selected.quality_status as keyof typeof reviewLabels] || selected.quality_status}</dd>
          <dt>所属数据集</dt><dd>{dataset?.name || selected.dataset_id}</dd>
          <dt>视觉分数</dt><dd>{typeof score==='number' ? score.toFixed(4) : '未使用视觉分支'}</dd>
          <dt>标注差异</dt><dd>{selected.annotation ? `${selected.annotation.differences.length} 项` : '尚未比较'}</dd></dl>
        <footer className="iad-consistency-detail-actions"><button onClick={event=>onCompare(event.currentTarget)}>查看原图对比</button></footer>
      </div>
    </aside>}
  </div>;
}
