import React,{useCallback,useEffect,useMemo,useState} from 'react';
import type {AnchorCandidatePage,EvidenceBundle,GalleryMember} from '../../shared/domain.generated.js';
import {modelConclusionLabels} from '../../shared/consistency.parameters.generated.js';
import {datasetImageAnnotations} from '../dataset-image-annotations.js';
import {ConsistencyView,type ConsistencyComparisonItem} from '../consistency-view.js';
import {useGroupAnalysis} from '../useGroupAnalysis.js';
import {useResource} from '../useResource.js';
import {message} from '../api.js';
import {Modal} from './Modal.js';
import {Button} from './Button.js';
import {IconButton} from './IconButton.js';
import {ThumbnailCard} from './ThumbnailCard.js';
import {AnnotatedImageStage} from './AnnotatedImageStage.js';
import type {ImageNavigation,ImageSource} from './ImageViewer.js';
import {ImageGalleryViewer} from './ImageGalleryViewer.js';
import {ConsistencyGroupReviewForm} from './ConsistencyGroupReviewForm.js';
import {ConsistencyModelAnalysis} from './ConsistencyModelAnalysis.js';
import {TabBar} from './layout/TabBar.js';

const candidateTabs=[{id:'compared',label:'实际对比'},{id:'exact',label:'完全一致'},{id:'similar',label:'相似'}] as const;
type CandidateTab=typeof candidateTabs[number]['id'];

interface ConsistencyConflictDialogProps {
  conflict:ConsistencyComparisonItem;
  items:ConsistencyComparisonItem[];
  onSelect(id:string):void;
  onMove?(offset:-1|1):void;
  navigation?:ImageNavigation;
  onClose():void;
  onReviewed():void;
}

export function ConsistencyConflictDialog(props:ConsistencyConflictDialogProps) {
  const [showAnnotations,setShowAnnotations]=useState(true);
  const [zoomIndex,setZoomIndex]=useState<number|null>(null);
  return <ConsistencyConflictContent key={props.conflict.id} {...props}
    showAnnotations={showAnnotations} onShowAnnotationsChange={setShowAnnotations} zoomIndex={zoomIndex} onZoomChange={setZoomIndex}/>;
}

function ConsistencyConflictContent({conflict:currentConflict,items:visibleConflicts,
  showAnnotations,onShowAnnotationsChange,zoomIndex,onZoomChange,navigation,onSelect,onMove,onClose,onReviewed}:ConsistencyConflictDialogProps & {
    showAnnotations:boolean;onShowAnnotationsChange(value:boolean):void;zoomIndex:number|null;onZoomChange(index:number|null):void;
  }) {
  const currentConflictId=currentConflict.id;
  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [candidateTab,setCandidateTab]=useState<CandidateTab>('compared');
  const [conflictMembers, setConflictMembers] = useState<GalleryMember[]>([]);
  const [membersError,setMembersError]=useState('');
  const [membersLoading,setMembersLoading]=useState(false);
  const groupReference=currentConflict.reference;
  const jobId='job_id' in groupReference?groupReference.job_id:undefined;
  const groupAnalysis=useGroupAnalysis(currentConflict.candidateCount?groupReference:null);
  useEffect(()=>{
    const controller=new AbortController();setConflictMembers([]);setMembersError('');setCandidateIndex(0);setCandidateTab('compared');
    setMembersLoading(Boolean(currentConflict.candidateCount));
    if(currentConflict.candidateCount)ConsistencyView.members(groupReference,controller.signal)
      .then(items=>{if(!controller.signal.aborted)setConflictMembers(items);})
      .catch(error=>{if(!controller.signal.aborted)setMembersError(message(error));})
      .finally(()=>{if(!controller.signal.aborted)setMembersLoading(false);});
    return()=>controller.abort();
  },[groupReference,currentConflict.candidateCount]);
  const modelResult=groupAnalysis.analysis?.status==='COMPLETED' ? groupAnalysis.analysis.result : null;
  const candidates=useResource<AnchorCandidatePage>(jobId ?
    `/consistency/checks/${encodeURIComponent(jobId)}/anchors/${encodeURIComponent(currentConflictId)}/candidates`:null);
  const candidateImages=useMemo(()=>candidateTab==='compared'?conflictMembers.map(member=>member.image):
    (candidates.data?.items.filter(item=>item.kind===candidateTab).map(item=>item.image)||[]),
    [candidateTab,conflictMembers,candidates.data]);
  const selectedImage=candidateImages[candidateIndex]||null;
  const imagesLoading=candidateTab==='compared'?membersLoading:candidates.loading;
  const imagesError=candidateTab==='compared'?membersError:candidates.error;
  const modelConclusion=ConsistencyView.modelConclusion(modelResult?.overall.text || currentConflict.model.modelType,modelResult?.overall.verdict);
  const displayModelConclusion=modelConclusion ? modelConclusionLabels[modelConclusion] : currentConflict.model.identityConclusion||'';
  const displayGroupConclusion=currentConflict.type;
  const dialogTitle=currentConflict.model.identityConclusion&&!modelConclusion?`模型：${displayModelConclusion}`:
    displayModelConclusion?`模型：${displayModelConclusion} - 程序：${displayGroupConclusion}`:`程序：${displayGroupConclusion}`;

  const currentCandidate=useMemo(()=>{
    const image=selectedImage;
    return {sampleId:image?.sample.sample_id || '',filename:image?.sample.relative_path.split('/').pop() || '',
      thumbUrl:image?ConsistencyView.media(image,true):'',fullUrl:image?ConsistencyView.media(image):'',
      width:image?.sample.width,height:image?.sample.height};
  },[selectedImage]);
  const evidenceId=selectedImage?.evidence_id || currentConflict.image?.evidence_id;
  const compared=useResource<EvidenceBundle>(evidenceId ? `/consistency/evidence/${encodeURIComponent(evidenceId)}`:null);
  const anchorSide=selectedImage?(selectedImage.side==='left'?'right':'left'):currentConflict.image?.side;
  const anchorSource=anchorSide?compared.data?.sources[anchorSide]:null;
  const candidateSource=selectedImage?compared.data?.sources[selectedImage.side]:null;
  const anchorAnnotations=anchorSource?datasetImageAnnotations(anchorSource.annotations.dataset_format??undefined,anchorSource.sample,anchorSource.annotations.annotations):{};
  const candidateAnnotations=candidateSource?datasetImageAnnotations(candidateSource.annotations.dataset_format??undefined,candidateSource.sample,candidateSource.annotations.annotations):{};
  const images:ImageSource[]=[{src:currentConflict.fullUrl||currentConflict.url,title:currentConflict.filename,
    sampleId:currentConflict.sampleId,width:currentConflict.sourceWidth,height:currentConflict.sourceHeight,...anchorAnnotations},
    ...candidateImages.map((image,index)=>({src:ConsistencyView.media(image),title:image.sample.relative_path.split('/').pop()!,
      sampleId:image.sample.sample_id,width:image.sample.width,height:image.sample.height,...(index===candidateIndex?candidateAnnotations:{})}))];
  function changeZoom(index:number|null) {
    onZoomChange(index);
    if(index!==null&&index>0)setCandidateIndex(index-1);
  }
  const handlePrevConflict = useCallback(() => {
    if(onMove){onMove(-1);return;}
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx > 0) {
      const prev = list[idx - 1];
      onSelect(prev.id);
      setCandidateIndex(0);
    }
  }, [visibleConflicts, currentConflictId,onSelect,onMove]);

  const handleNextConflict = useCallback(() => {
    if(onMove){onMove(1);return;}
    const list = visibleConflicts;
    const idx = list.findIndex(c => c.id === currentConflictId);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      onSelect(next.id);
      setCandidateIndex(0);
    }
  }, [visibleConflicts, currentConflictId,onSelect,onMove]);

  return <>
        <Modal title={dialogTitle} id="dc-compare-mask" className="dc-dialog dc-conflict-dialog" header={false} onClose={onClose}>
            <header className="dc-dialog-head">
              <h2 id="dc-dialog-title">{dialogTitle}</h2>
              <div className="dc-dialog-head-actions">
                <Button type="button" onClick={handlePrevConflict}>
                  上一组
                </Button>
                <Button type="button" onClick={handleNextConflict}>
                  下一组
                </Button>
                <Button type="button" aria-pressed={showAnnotations} onClick={()=>onShowAnnotationsChange(!showAnnotations)}>
                  {showAnnotations?'隐藏标注':'显示标注'}
                </Button>
                <IconButton icon="close" type="button" title="关闭" label="关闭" onClick={onClose} />
              </div>
            </header>
            <ConsistencyGroupReviewForm key={`${jobId}:${currentConflictId}`} jobId={jobId}
              anchorId={currentConflictId} onClose={onClose} onReviewed={onReviewed}>
              <TabBar label="候选图片分类" items={candidateTabs.map(tab=>({...tab,
                buttonProps:{id:`dc-candidate-tab-${tab.id}`,'aria-controls':'dc-candidate-panel'}}))}
                value={candidateTab} onChange={tab=>{if(tab!==candidateTab){setCandidateTab(tab);setCandidateIndex(0);}}}/>
              <div id="dc-candidate-panel" role="tabpanel" aria-labelledby={`dc-candidate-tab-${candidateTab}`}>
              <div className="dc-compare">
                <div className="dc-compare-cell">
                  <div
                    className="dc-compare-photo"
                    role="button"
                    tabIndex={0}
                    data-dc="zoom-anchor"
                    aria-label="查看主图大图"
                    title={currentConflict.filename}
                    onClick={()=>onZoomChange(0)}
                    onKeyDown={event=>{
                      if(event.key==='Enter'||event.key===' '){event.preventDefault();onZoomChange(0);}
                    }}
                  >
                    <AnnotatedImageStage
                      sampleId={currentConflict.sampleId}
                      src={currentConflict.fullUrl || currentConflict.url}
                      alt="主图"
                      width={currentConflict.sourceWidth}
                      height={currentConflict.sourceHeight}
                      showAnnotations={showAnnotations}
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
                    tabIndex={selectedImage?0:-1}
                    data-dc="zoom-candidate"
                    aria-disabled={!selectedImage}
                    aria-label="查看候选图大图"
                    title={currentCandidate.filename}
                    onClick={()=>selectedImage&&onZoomChange(candidateIndex+1)}
                    onKeyDown={event=>{
                      if(selectedImage&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onZoomChange(candidateIndex+1);}
                    }}
                  >
                    {selectedImage && <AnnotatedImageStage
                      sampleId={currentCandidate.sampleId}
                      src={currentCandidate.fullUrl || currentCandidate.thumbUrl}
                      alt="候选图"
                      width={currentCandidate.width}
                      height={currentCandidate.height}
                      showAnnotations={showAnnotations}
                      {...candidateAnnotations}
                    />}
                    {!selectedImage&&<span role="status" className="iad-result-empty">{imagesLoading?'正在读取…':imagesError?'读取失败':
                      `暂无${candidateTabs.find(tab=>tab.id===candidateTab)!.label}图`}</span>}
                  </div>
                  <div className="dc-photo-filename" title={currentCandidate.filename}>
                    {currentCandidate.filename}
                  </div>
                </div>
              </div>

              <section className="dc-images-panel" aria-label="候选图片">
                <div className="iad-thumbnail-grid" aria-label="切换对比图片">
                  {candidateImages.map((image,index)=>{
                    const filename=image.sample.relative_path.split('/').pop()!;
                    return <ThumbnailCard key={image.sample.sample_id} src={ConsistencyView.media(image,true)}
                      variant="comparison" label={filename} data-dc="candidate" data-id={index}
                      aria-pressed={index===candidateIndex} onClick={()=>setCandidateIndex(index)}/>;
                  })}
                </div>
                {imagesError && <p role="alert" className="iad-error">{imagesError}</p>}
                {compared.error && <p role="alert" className="iad-error">{compared.error}</p>}
              </section>
              </div>

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
    <ImageGalleryViewer images={images} current={zoomIndex} onChange={changeZoom}
      navigation={images.length===1?navigation:undefined}/>
  </>;
}
