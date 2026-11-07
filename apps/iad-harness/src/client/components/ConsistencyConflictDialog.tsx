import {v4 as uuid} from 'uuid';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {EvidenceBundle,GalleryMember,GalleryReference,ConsistencyReviewContext,ConsistencyReviewSubmission} from '../../shared/domain.generated.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {useDatasetCatalog} from '../useDatasetCatalog.js';
import {ConsistencyView,type ConflictCardItem} from '../consistency-view.js';
import {useGroupAnalysis} from '../useGroupAnalysis.js';
import {useResource} from '../useResource.js';
import {message,request} from '../api.js';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {AnnotatedImageStage} from './AnnotatedImageStage.js';
import {FullscreenViewer,type FullscreenViewerItem} from './FullscreenViewer.js';

interface ConsistencyConflictDialogProps {
  conflict:ConflictCardItem;
  items:ConflictCardItem[];
  queryId:string;
  onSelect(id:string):void;
  onClose():void;
  onReviewed():void;
}

export function ConsistencyConflictDialog({conflict:currentConflict,items:visibleConflicts,queryId:activeQueryId,
  onSelect,onClose:close,onReviewed}:ConsistencyConflictDialogProps) {
  const currentConflictId=currentConflict.id;
  const catalog=useDatasetCatalog();
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [conflictMembers, setConflictMembers] = useState<GalleryMember[]>([]);
  const [membersError,setMembersError]=useState('');
  const [reviewBusy,setReviewBusy]=useState(false);
  const [reviewLoaded,setReviewLoaded]=useState(false);
  const [reviewError,setReviewError]=useState('');
  const pendingReview=useRef<ConsistencyReviewSubmission|null>(null);
  const [reviewDecision, setReviewDecision] = useState<'pending' | 'confirmed' | 'rejected'>('pending');
  const [reviewNote, setReviewNote] = useState<string>('');
  const [zoomItem, setZoomItem] = useState<FullscreenViewerItem | null>(null);
  const groupReference=useMemo<GalleryReference|null>(()=>activeQueryId ? {
    query_id:activeQueryId,kind:'conflicts',group_id:currentConflict.rawItem.group_id,facts_state:currentConflict.rawItem.facts_state
  }:null,[currentConflict.rawItem.group_id,currentConflict.rawItem.facts_state,activeQueryId]);
  const groupAnalysis=useGroupAnalysis(groupReference);
  const analysisChanged=useRef(false);
  const onClose=()=>{close();if(analysisChanged.current)onReviewed();};
  useEffect(()=>{
    const controller=new AbortController();setConflictMembers([]);setMembersError('');setCandidateIndex(0);
    if(!groupReference)return;
    ConsistencyView.members(groupReference,controller.signal)
      .then(items=>{if(!controller.signal.aborted)setConflictMembers(items);})
      .catch(error=>{if(!controller.signal.aborted)setMembersError(message(error));});
    return()=>controller.abort();
  },[groupReference]);
  const selectedMember=conflictMembers[candidateIndex] || null;
  const modelResult=groupAnalysis.analysis?.status==='COMPLETED' ? groupAnalysis.analysis.result : null;
  const assessment=modelResult?.assessments.find(item=>item.candidate_id===selectedMember?.image.sample.sample_id);
  const pairConclusion=assessment?.conclusion || (conflictMembers.length===1 ? modelResult?.overall.text : null);

  const currentCandidate=useMemo(()=>{
    const image=selectedMember?.image;
    return {sampleId:image?.sample.sample_id || '',filename:image?.sample.relative_path.split('/').pop() || '',
      thumbUrl:image?ConsistencyView.media(image,true):'',fullUrl:image?ConsistencyView.media(image):'',
      width:image?.sample.width,height:image?.sample.height};
  },[selectedMember]);
  const compared=useResource<EvidenceBundle>(selectedMember?.comparison ?
    `/consistency/evidence/${encodeURIComponent(selectedMember.comparison.evidence_id)}`:null);
  const anchorSide=selectedMember?.comparison?.anchor_side;
  const anchorSource=anchorSide?compared.data?.sources[anchorSide]:null;
  const candidateSource=anchorSide?compared.data?.sources[anchorSide==='left'?'right':'left']:null;
  const anchorAnnotations=anchorSource?datasetImageAnnotations(catalog.data?.datasets.find(dataset=>dataset.dataset_id===anchorSource.sample.dataset_id)?.format,anchorSource.sample,anchorSource.annotations.annotations):{};
  const candidateAnnotations=candidateSource?datasetImageAnnotations(catalog.data?.datasets.find(dataset=>dataset.dataset_id===candidateSource.sample.dataset_id)?.format,candidateSource.sample,candidateSource.annotations.annotations):{};
  const readReview=useCallback(async(signal?:AbortSignal)=>{
    if(!selectedMember?.comparison)return;
    const context=await request<ConsistencyReviewContext>('/consistency/review/context',{evidence_id:selectedMember.comparison.evidence_id},undefined,signal);
    if(signal?.aborted)return;
    const latest=context.decisions.at(-1),action=latest?.request.action.kind;
    const decision=action==='CONFIRM_DIFFERENCE'?'confirmed':action==='REJECT_DIFFERENCE'?'rejected':'pending';
    setReviewDecision(decision);setReviewNote(latest?.request.comment || '');
    setReviewLoaded(true);
  },[selectedMember?.comparison?.evidence_id,currentConflictId]);
  useEffect(()=>{
    const controller=new AbortController();setReviewLoaded(false);setReviewError('');setReviewDecision('pending');setReviewNote('');pendingReview.current=null;
    void readReview(controller.signal).catch(error=>{if(!controller.signal.aborted)setReviewError(message(error));});
    return()=>controller.abort();
  },[readReview]);

  const handlePrevConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx > 0) {
      const prev = list[idx - 1];
      onSelect(prev.id);
      setCandidateIndex(0);
      setReviewDecision(prev.review);
      setReviewNote('');
    }
  }, [visibleConflicts, currentConflictId,onSelect]);

  const handleNextConflict = useCallback(() => {
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      onSelect(next.id);
      setCandidateIndex(0);
      setReviewDecision(next.review);
      setReviewNote('');
    }
  }, [visibleConflicts, currentConflictId,onSelect]);

  const handleSaveReview = async () => {
    if(!compared.data || reviewBusy || !reviewLoaded)return;
    if(reviewDecision==='pending' && !reviewNote.trim()){onClose();return;}
    if(!reviewNote.trim()){setReviewError('请填写复核依据');return;}
    const [firstDifference,...otherDifferences]=compared.data.result.annotation.differences;
    if(!firstDifference){setReviewError('当前比较没有可复核的差异');return;}
    setReviewBusy(true);setReviewError('');
    try{
      if(!pendingReview.current)pendingReview.current={client_request_id:uuid(),
        evidence_id:compared.data.result.evidence_id,result_id:compared.data.result.result_id,
        difference_ids:[firstDifference.difference_id,...otherDifferences.map(item=>item.difference_id)],
        reviewer:localStorage.getItem('iad.reviewer') || 'auditor_qc',comment:reviewNote.trim(),
        action:{kind:reviewDecision==='confirmed'?'CONFIRM_DIFFERENCE':reviewDecision==='rejected'?'REJECT_DIFFERENCE':'NEEDS_CONTEXT'}};
      await request('/consistency/review/submit',pendingReview.current);
      await readReview();pendingReview.current=null;analysisChanged.current=true;onClose();
    }catch(error){setReviewError(message(error));}finally{setReviewBusy(false);}
  };

  return <>
        <Modal title="标注冲突对比" id="dc-compare-mask" className="dc-dialog dc-conflict-dialog" header={false} onClose={onClose}>
            <header className="dc-dialog-head">
              <h2 id="dc-dialog-title">标注冲突对比</h2>
              <div className="dc-dialog-head-actions">
                <Button type="button" data-dc="reanalyze" disabled={!groupReference||groupAnalysis.busy} aria-busy={groupAnalysis.busy}
                  onClick={()=>{analysisChanged.current=true;void groupAnalysis.analyze();}}>重新分析</Button>
                <Button type="button" onClick={handlePrevConflict}>
                  上一组
                </Button>
                <Button type="button" onClick={handleNextConflict}>
                  下一组
                </Button>
                <IconButton icon="close" type="button" title="关闭" label="关闭" onClick={onClose} />
              </div>
            </header>
            <div className="dc-dialog-body">
              <div className="dc-compare">
                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-anchor"
                    aria-label="查看主图大图"
                    title="点击查看大图"
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
                    aria-label="查看候选图大图"
                    title="点击查看大图"
                    onClick={() =>
                      setZoomItem({
                        id: currentConflict.id + '_candidate_' + candidateIndex,
                        title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
                        imageUrl: currentCandidate.fullUrl,
                        width: currentCandidate.width,
                        height: currentCandidate.height,
                        ...candidateAnnotations,
                      })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setZoomItem({
                          id: currentConflict.id + '_candidate_' + candidateIndex,
                          title: `${currentCandidate.filename} (候选图 ${candidateIndex + 1})`,
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

              {/* Candidate strip */}
              <div className="iad-thumbnail-strip" aria-label="切换冲突图像">
                {conflictMembers.map((m, i) => {
                    const s = m.image.sample;
                    const thumb = ConsistencyView.media(m.image,true);
                    return (
                      <ThumbnailCard key={s.sample_id || i} src={thumb} variant="compact" label={`候选 ${i+1}`} data-dc="candidate" data-id={i}
                        aria-pressed={i===candidateIndex} onClick={()=>setCandidateIndex(i)} />
                    );
                })}
              </div>
              {membersError && <p role="alert" className="iad-error">{membersError}</p>}
              {compared.error && <p role="alert" className="iad-error">{compared.error}</p>}

              {/* Program observations remain separate from the model's conclusion. */}
              <section className="dc-fact-panel" aria-label="判定结论">
                <h3>判定结论</h3>
                <span className="dc-verdict-value">{compared.data&&anchorSide
                  ? compared.data.annotation_observations[anchorSide].conclusion
                  : compared.error || '正在读取判定结论…'}</span>
                <p className="dc-verdict-description">{compared.data&&anchorSide?compared.data.annotation_observations[anchorSide].summary:compared.error || '正在读取冻结比较记录…'}</p>
              </section>

              {/* 模型分析 */}
              <section className="dc-model-panel" aria-label="模型分析">
                <h3>模型分析</h3>
                <p>{groupAnalysis.busy?'正在比较主图与候选图的标注…':groupAnalysis.error || groupAnalysis.analysis?.error || assessment?.explanation || '暂无已保存的当前图对分析。'}</p>
              </section>

              {/* 模型结论 */}
              <section className="dc-conclusion-panel" aria-label="模型结论">
                <h3>模型结论</h3>
                <span className="dc-verdict-value" role="status">{groupAnalysis.busy?'正在重新分析…':pairConclusion || groupAnalysis.error || groupAnalysis.analysis?.error || '暂无已保存的当前图对结论。'}</span>
                {conflictMembers.length>1&&modelResult&&<p className="dc-verdict-description">图组结论：{modelResult.overall.text}</p>}
              </section>

              {/* Human review panel */}
              <section className="dc-review-panel" aria-label="人工复核">
                <h3>人工复核</h3>
                <div className="dc-decision-controls">
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="pending"
                      checked={reviewDecision === 'pending'}
                      onChange={() => setReviewDecision('pending')}
                    />
                    待确认
                  </label>
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="confirmed"
                      checked={reviewDecision === 'confirmed'}
                      onChange={() => setReviewDecision('confirmed')}
                    />
                    确认冲突
                  </label>
                  <label>
                    <input
                      type="radio"
                      disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                      name="dc-review"
                      value="rejected"
                      checked={reviewDecision === 'rejected'}
                      onChange={() => setReviewDecision('rejected')}
                    />
                    排除冲突
                  </label>
                </div>
                {reviewError && <p role="alert" className="iad-error">{reviewError}</p>}
                <textarea
                  disabled={reviewBusy || !reviewLoaded || !!pendingReview.current}
                  className="dc-note"
                  id="dc-note"
                  placeholder="复核说明（可选）"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                />
              </section>
            </div>
            <footer className="dc-dialog-footer">
              <Button type="button" onClick={() => onClose()}>
                取消
              </Button>
              <Button variant="primary" type="button" disabled={reviewBusy || !reviewLoaded || !compared.data} onClick={handleSaveReview}>
                保存复核
              </Button>
            </footer>
        </Modal>
    <FullscreenViewer open={!!zoomItem} item={zoomItem} onClose={()=>setZoomItem(null)} />
  </>;
}
