import React,{useCallback,useEffect,useMemo,useState} from 'react';
import type {AnchorCandidatePage,EvidenceBundle,GalleryMember} from '../../shared/domain.generated.js';
import {conflictCategoryLabels} from '../../shared/consistency.parameters.generated.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {useDatasetCatalog} from '../useDatasetCatalog.js';
import {ConsistencyView,type ConsistencyComparisonItem} from '../consistency-view.js';
import {useGroupAnalysis} from '../useGroupAnalysis.js';
import {useResource} from '../useResource.js';
import {message} from '../api.js';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {AnnotatedImageStage} from './AnnotatedImageStage.js';
import {FullscreenViewer,type FullscreenViewerItem} from './FullscreenViewer.js';
import {ConsistencyGroupReviewForm} from './ConsistencyGroupReviewForm.js';
import {ConsistencyModelAnalysis} from './ConsistencyModelAnalysis.js';

interface ConsistencyConflictDialogProps {
  conflict:ConsistencyComparisonItem;
  items:ConsistencyComparisonItem[];
  onSelect(id:string):void;
  onClose():void;
  onReviewed():void;
}

export function ConsistencyConflictDialog({conflict:currentConflict,items:visibleConflicts,
  onSelect,onClose,onReviewed}:ConsistencyConflictDialogProps) {
  const currentConflictId=currentConflict.id;
  const catalog=useDatasetCatalog();
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [conflictMembers, setConflictMembers] = useState<GalleryMember[]>([]);
  const [membersError,setMembersError]=useState('');
  const [zoomItem, setZoomItem] = useState<FullscreenViewerItem | null>(null);
  const groupReference=currentConflict.reference;
  const jobId='job_id' in groupReference?groupReference.job_id:undefined;
  const groupAnalysis=useGroupAnalysis(currentConflict.candidateCount?groupReference:null);
  useEffect(()=>{
    const controller=new AbortController();setConflictMembers([]);setMembersError('');setCandidateIndex(0);
    if(!currentConflict.candidateCount)return;
    ConsistencyView.members(groupReference,controller.signal)
      .then(items=>{if(!controller.signal.aborted)setConflictMembers(items);})
      .catch(error=>{if(!controller.signal.aborted)setMembersError(message(error));});
    return()=>controller.abort();
  },[groupReference,currentConflict.candidateCount]);
  const selectedMember=conflictMembers[candidateIndex] || null;
  const modelResult=groupAnalysis.analysis?.status==='COMPLETED' ? groupAnalysis.analysis.result : null;
  const candidates=useResource<AnchorCandidatePage>(jobId ?
    `/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(currentConflictId)}/candidates`:null);
  const modelConclusion=ConsistencyView.modelConclusion(modelResult?.overall.text || currentConflict.model.modelType);
  const displayModelConclusion=modelConclusion ? conflictCategoryLabels[modelConclusion] : '';
  const groupConclusion=currentConflict.type;
  const displayGroupConclusion=groupConclusion in conflictCategoryLabels
    ? conflictCategoryLabels[groupConclusion as keyof typeof conflictCategoryLabels] : groupConclusion;

  const currentCandidate=useMemo(()=>{
    const image=selectedMember?.image;
    return {sampleId:image?.sample.sample_id || '',filename:image?.sample.relative_path.split('/').pop() || '',
      thumbUrl:image?ConsistencyView.media(image,true):'',fullUrl:image?ConsistencyView.media(image):'',
      width:image?.sample.width,height:image?.sample.height};
  },[selectedMember]);
  const evidenceId=selectedMember?.comparison?.evidence_id || currentConflict.image?.evidence_id;
  const compared=useResource<EvidenceBundle>(evidenceId ? `/consistency/evidence/${encodeURIComponent(evidenceId)}`:null);
  const anchorSide=selectedMember?.comparison?.anchor_side || currentConflict.image?.side;
  const anchorSource=anchorSide?compared.data?.sources[anchorSide]:null;
  const candidateSource=selectedMember&&anchorSide?compared.data?.sources[anchorSide==='left'?'right':'left']:null;
  const anchorAnnotations=anchorSource?datasetImageAnnotations(catalog.data?.datasets.find(dataset=>dataset.dataset_id===anchorSource.sample.dataset_id)?.format,anchorSource.sample,anchorSource.annotations.annotations):{};
  const candidateAnnotations=candidateSource?datasetImageAnnotations(catalog.data?.datasets.find(dataset=>dataset.dataset_id===candidateSource.sample.dataset_id)?.format,candidateSource.sample,candidateSource.annotations.annotations):{};
  const handlePrevConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx > 0) {
      const prev = list[idx - 1];
      onSelect(prev.id);
      setCandidateIndex(0);
    }
  }, [visibleConflicts, currentConflictId,onSelect]);

  const handleNextConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      onSelect(next.id);
      setCandidateIndex(0);
    }
  }, [visibleConflicts, currentConflictId,onSelect]);

  return <>
        <Modal title="标注冲突对比" id="dc-compare-mask" className="dc-dialog dc-conflict-dialog" header={false} onClose={onClose}>
            <header className="dc-dialog-head">
              <h2 id="dc-dialog-title">标注冲突对比</h2>
              <div className="dc-dialog-head-actions">
                <Button type="button" onClick={handlePrevConflict}>
                  上一组
                </Button>
                <Button type="button" onClick={handleNextConflict}>
                  下一组
                </Button>
                <IconButton icon="close" type="button" title="关闭" label="关闭" onClick={onClose} />
              </div>
            </header>
            <ConsistencyGroupReviewForm key={`${jobId}:${currentConflictId}`} jobId={jobId}
              anchorId={currentConflictId} onClose={onClose} onReviewed={onReviewed}>
              <div className="dc-compare">
                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-anchor"
                    aria-label="查看主图大图"
                    title={currentConflict.filename}
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_anchor',
                        title: currentConflict.filename,
                        imageUrl: currentConflict.fullUrl || currentConflict.url,
                        width: currentConflict.sourceWidth,
                        height: currentConflict.sourceHeight,
                        ...anchorAnnotations,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomItem({
                          id: currentConflict.id + '_anchor',
                          title: currentConflict.filename,
                          imageUrl: currentConflict.fullUrl || currentConflict.url,
                          width: currentConflict.sourceWidth,
                          height: currentConflict.sourceHeight,
                          ...anchorAnnotations,
                        });
                      }
                    }}
                  >
                    <AnnotatedImageStage
                      src={currentConflict.fullUrl || currentConflict.url}
                      alt="主图"
                      width={currentConflict.sourceWidth}
                      height={currentConflict.sourceHeight}
                      {...anchorAnnotations}
                    />
                  </div>
                  <div className="dc-photo-filename" title={currentConflict.filename}>
                    {currentConflict.filename}
                  </div>
                </div>

                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-candidate"
                    aria-disabled={!selectedMember}
                    aria-label="查看候选图大图"
                    title={currentCandidate.filename}
                    onClick={() => selectedMember &&
                      setZoomItem({
                        id: currentConflict.id + '_candidate_' + candidateIndex,
                        title: currentCandidate.filename,
                        imageUrl: currentCandidate.fullUrl,
                        width: currentCandidate.width,
                        height: currentCandidate.height,
                        ...candidateAnnotations,
                      })
                    }
                    onKeyDown={e => {
                      if (selectedMember && (e.key === 'Enter' || e.key === ' ')) {
                        setZoomItem({
                          id: currentConflict.id + '_candidate_' + candidateIndex,
                          title: currentCandidate.filename,
                          imageUrl: currentCandidate.fullUrl,
                          width: currentCandidate.width,
                          height: currentCandidate.height,
                          ...candidateAnnotations,
                        });
                      }
                    }}
                  >
                    {selectedMember && <AnnotatedImageStage
                      src={currentCandidate.fullUrl || currentCandidate.thumbUrl}
                      alt="候选图"
                      width={currentCandidate.width}
                      height={currentCandidate.height}
                      {...candidateAnnotations}
                    />}
                  </div>
                  <div className="dc-photo-filename" title={currentCandidate.filename}>
                    {currentCandidate.filename}
                  </div>
                </div>
              </div>

              <section className="dc-images-panel" aria-label="对比图">
                <h3>对比图</h3>
                <div className="iad-thumbnail-strip" aria-label="切换对比图片">
                  {conflictMembers.map((member,index)=>{
                    const filename=member.image.sample.relative_path.split('/').pop()!;
                    return <ThumbnailCard key={member.image.sample.sample_id} src={ConsistencyView.media(member.image,true)}
                      variant="compact" label={filename} data-dc="candidate" data-id={index}
                      aria-pressed={index===candidateIndex} onClick={()=>setCandidateIndex(index)}/>;
                  })}
                </div>
                {membersError && <p role="alert" className="iad-error">{membersError}</p>}
                {compared.error && <p role="alert" className="iad-error">{compared.error}</p>}
              </section>
              <section className="dc-images-panel" aria-label="候选图">
                <h3>候选图</h3>
                {candidates.loading ? <p role="status">正在读取候选图…</p> : candidates.error ?
                  <p role="alert" className="iad-error">{candidates.error}</p> :
                  ([['exact','完全一致的图'],['similar','相似图']] as const).map(([kind,label])=>{
                    const previews=candidates.data?.items.filter(item=>item.kind===kind) || [];
                    return <div className="dc-candidate-group" data-kind={kind} key={kind}>
                      <h4>{label}</h4>
                      {previews.length ? <div className="iad-thumbnail-strip">
                        {previews.map(candidate=>{
                          const image=candidate.image,filename=image.sample.relative_path.split('/').pop()!;
                          return <ThumbnailCard key={candidate.sample_id} variant="compact" label={filename}
                            src={ConsistencyView.media(image,true)} data-dc="retrieved-candidate" onClick={()=>setZoomItem({
                              id:candidate.sample_id,title:filename,imageUrl:ConsistencyView.media(image),
                              width:image.sample.width,height:image.sample.height,
                              ...datasetImageAnnotations(candidate.annotations.dataset_format??undefined,image.sample,candidate.annotations.annotations),
                            })}/>;
                        })}
                      </div> : null}
                    </div>;
                  })}
              </section>

              {/* Program observations remain separate from the model's conclusion. */}
              <section className="dc-fact-panel" aria-label="判定结论">
                <h3>判定结论</h3>
                <span className="dc-verdict-value">{displayGroupConclusion}</span>
                <p className="dc-verdict-description">主图 1 张，参与对比候选 {currentConflict.candidateCount} 张</p>
              </section>

              <ConsistencyModelAnalysis reference={groupReference} members={conflictMembers} result={modelResult}
                error={groupAnalysis.error || groupAnalysis.analysis?.error || ''}/>

              {/* 模型结论 */}
              <section className="dc-conclusion-panel" aria-label="模型结论">
                <h3>模型结论</h3>
                <span className="dc-verdict-value">{displayModelConclusion}</span>
              </section>

            </ConsistencyGroupReviewForm>
        </Modal>
    <FullscreenViewer open={!!zoomItem} item={zoomItem} onClose={()=>setZoomItem(null)} />
  </>;
}
