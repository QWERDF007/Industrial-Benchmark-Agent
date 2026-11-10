import {WorkbenchHeader} from './layout/WorkbenchHeader.js';
import {v4 as uuid} from 'uuid';
import {Modal} from './Modal.js';
import {DatasetScopeSelector} from './DatasetScopeSelector.js';
import {TabBar} from './layout/TabBar.js';
import {Button} from './Button.js';
import {AgentPromptEditors} from './AgentPromptEditors.js';
import {IconButton} from "./IconButton.js";
import {promptDefaults} from '../../shared/prompt-defaults.generated.js';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {Dataset, DatasetGroup, JobSnapshot} from '../../shared/contracts.js';
import type {MiningDirection, PublishedDirectionCatalog, SubmittedMiningPrompt} from '../../shared/domain.generated.js';
import {message, request} from '../api.js';
import {useModuleSettings} from '../useModuleSettings.js';
import {getDatasetGroupId} from '../dataset-hierarchy.js';
import {KnowledgeConfirmation, type KnowledgeConfirmationState} from './KnowledgeConfirmation.js';

interface PresetItem {id:string;directionId:string;name:string;text:string;origin:MiningDirection['origin'];source:MiningDirection['source']}

export function KnowledgeMiningCreate({dataset, datasets, groups, selectedParentId, selectedChildIds, onClose, onStarted}: {
  dataset: Dataset; datasets: Dataset[]; groups: DatasetGroup[]; selectedParentId:string;selectedChildIds:string[];
  onClose():void; onStarted(jobs:JobSnapshot[]):void;
}) {
  const parentGroups = groups.filter(group=>group.group_id !== 'single');
  const configuration = useModuleSettings('knowledge');
  const configuredBatch = configuration.settings && 'batch_size' in configuration.settings ? configuration.settings.batch_size : undefined;
  const [batchSize, setBatchSize] = useState<number|null>(null);
  useEffect(()=>{if(configuredBatch !== undefined)setBatchSize(configuredBatch);},[configuredBatch]);
  const started = useRef<JobSnapshot|null>(null);
  const submission = useRef<string|null>(null);
  const [confirmState, setConfirmState] = useState<KnowledgeConfirmationState | null>(null);
  const [setupDataset, setSetupDataset] = useState<string>(selectedParentId);
  const [setupSubsets, setSetupSubsets] = useState<Set<string>>(new Set(selectedChildIds));
  const [setupGeneral, setSetupGeneral] = useState<Set<string>>(new Set());
  const [setupExplored, setSetupExplored] = useState<Set<string>>(new Set());
  const [setupEdits, setSetupEdits] = useState<Record<string, { name: string; text: string }>>({});
  const [setupTab, setSetupTab] = useState<"preset" | "explore">('preset');
  const [setupPrompt, setSetupPrompt] = useState("");
  const [systemPrompt,setSystemPrompt]=useState<string>(promptDefaults.system.knowledge);
  const [setupPromptDirty, setSetupPromptDirty] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingDir, setEditingDir] = useState<{ kind: "preset" | "explore"; id: string } | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingText, setEditingText] = useState("");
  const [dirEditError, setDirEditError] = useState("");

  const currentSetupParent = useMemo(() => {
    return parentGroups.find(g => g.group_id === setupDataset) || parentGroups[0];
  }, [parentGroups, setupDataset]);

  const currentSetupChildDatasets: Dataset[] = useMemo(() => {
    return datasets.filter(d => getDatasetGroupId(d) === setupDataset);
  }, [datasets, groups, setupDataset]);

  const [presetDirections, setPresetDirections] = useState<PresetItem[]>([]);
  const [exploredDirections, setExploredDirections] = useState<PresetItem[]>([]);
  const [directionsError, setDirectionsError] = useState('');
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [directionsLoading, setDirectionsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    request<{directions:MiningDirection[]}>('/knowledge/presets', undefined, undefined, controller.signal)
      .then(({directions}) => {
        if (controller.signal.aborted) return;
        setPresetDirections(directions.map(d=>({id:'preset:'+d.direction_id,directionId:d.direction_id,name:d.title,text:d.instruction,origin:d.origin,source:d.source})));
        setPresetsLoading(false);
      }).catch(error => {if (!controller.signal.aborted){setPresetsError(message(error));setPresetsLoading(false);}});
    return () => controller.abort();
  }, []);
  const subsetIds = JSON.stringify([...setupSubsets].sort());
  useEffect(() => {
    const controller = new AbortController();
    setDirectionsError('');setDirectionsLoading(true);
    const ids:string[] = JSON.parse(subsetIds);
    request<PublishedDirectionCatalog>(`/analysis/directions?${new URLSearchParams({dataset_ids:JSON.stringify(ids)})}`,undefined,undefined,controller.signal)
      .then(({directions}) => {
        if (controller.signal.aborted) return;
        const explored = directions.map(d=>({id:JSON.stringify(d.source),directionId:d.direction_id,name:d.title,text:d.instruction,origin:d.origin,source:d.source}));
        const available = new Set(explored.map(d=>d.id));
        setExploredDirections(explored);
        setSetupExplored(previous=>new Set([...previous].filter(id=>available.has(id))));
        setDirectionsLoading(false);
      }).catch(error => {if (!controller.signal.aborted){setDirectionsError(message(error));setDirectionsLoading(false);}});
    return () => controller.abort();
  }, [subsetIds]);
  const kbExploredDirs = exploredDirections;

  const getDirInfo = useCallback(<T extends PresetItem>(item: T, dirKind: "preset" | "explore") => {
    const edit = setupEdits[`${dirKind}:${item.id}`];
    return edit ? { ...item, ...edit } : item;
  }, [setupEdits]);

  const allSelectedDirItems = useMemo(() => {
    const presetsList = presetDirections
      .filter(p => setupGeneral.has(p.id))
      .map(p => getDirInfo(p, "preset"));
    const exploredList = kbExploredDirs
      .filter(e => setupExplored.has(e.id))
      .map(e => getDirInfo(e, "explore"));
    return [...presetsList, ...exploredList];
  }, [setupGeneral, setupExplored, kbExploredDirs, presetDirections, getDirInfo]);

  const generatePromptText = useCallback((
    datasetName: string,
    subsetsNames: string[],
    dirs: PresetItem[]
  ) => {
    return [
      promptDefaults.knowledgeInstruction,
      `数据集：${datasetName}`,
      `子数据集：${subsetsNames.join("、")}`,
      "来源范围：所选子数据集的全部登记图像。",
      "用户选择的观察方向：",
      ...dirs.map((x,index) => `D${index+1} | ${x.name}：${x.text}`),
    ].join("\n");
  }, []);

  useEffect(() => {
    if (setupPromptDirty) return;
    const parentName = currentSetupParent?.name || dataset.name;
    const subsetsNames = currentSetupChildDatasets
      .filter((c: Dataset) => setupSubsets.has(c.dataset_id))
      .map((c: Dataset) => c.name);
    setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
  }, [setupPromptDirty, currentSetupParent, currentSetupChildDatasets, setupSubsets, allSelectedDirItems, generatePromptText, dataset.name]);

  const validationProblem = useMemo(() => {
    if (!configuration.settings?.model) return configuration.loading ? '正在读取模型' : '请先配置知识挖掘分析模型';
    if (configuration.saving) return '正在保存每批图像数';
    if (configuration.error) return configuration.error;
    if(directionsLoading || presetsLoading)return '正在读取方向';
    if (!Number.isInteger(batchSize) || batchSize === null || batchSize < 1 || batchSize > 200) return '每批图像数应为1至200的整数';
    if (directionsError || presetsError) return directionsError || presetsError;
    if (!setupSubsets.size) return "请选择子数据集";
    if (!allSelectedDirItems.length) return "请选择挖掘方向";
    if (!systemPrompt.trim()) return '请填写系统提示词';
    if (!setupPrompt.trim()) return '请填写用户提示词';
    return "";
  }, [setupSubsets.size, allSelectedDirItems.length, setupPrompt, systemPrompt, directionsError, presetsError, directionsLoading, presetsLoading, presetDirections.length, configuration.settings, configuration.loading, configuration.saving, configuration.error, batchSize]);

  const handleRestorePrompt = () => {
    if (setupPromptDirty && setupPrompt.trim()) {
      setConfirmState({
        title: "恢复自动生成提示词",
        message: "恢复将覆盖手工修改的提示词。",
        danger: false,
        onConfirm: () => {
          setSetupPromptDirty(false);
          const parentName = currentSetupParent?.name || dataset.name;
          const subsetsNames = currentSetupChildDatasets
            .filter((c: Dataset) => setupSubsets.has(c.dataset_id))
            .map((c: Dataset) => c.name);
          setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
          setConfirmState(null);
        }
      });
      return;
    }
    setSetupPromptDirty(false);
    const parentName = currentSetupParent?.name || dataset.name;
    const subsetsNames = currentSetupChildDatasets
      .filter((c: Dataset) => setupSubsets.has(c.dataset_id))
      .map((c: Dataset) => c.name);
    setSetupPrompt(generatePromptText(parentName, subsetsNames, allSelectedDirItems));
  };

  const closeCreate = () => {
    if(submitting)return;
    if(started.current)onStarted([started.current]);else onClose();
  };
  const saveDirEdit = () => {
    if (!editingDir) return;
    const name = editingName.trim();
    const text = editingText.trim();
    if (!name || !text) {
      setDirEditError("标题和描述不能为空。");
      return;
    }
    setSetupEdits(prev => ({
      ...prev,
      [`${editingDir.kind}:${editingDir.id}`]: { name, text }
    }));
    setEditingDir(null);
  };

  const closeDirDrawer = () => {
    setEditingDir(null);
    setDirEditError("");
  };

  const [submitting, setSubmitting] = useState(false);
  useEffect(()=>{if(!started.current)submission.current=null;},[setupDataset,setupPrompt,systemPrompt,batchSize,JSON.stringify(Array.from(setupSubsets).sort())]);
  const handleSubmitJob = async () => {
    if (validationProblem || submitting) return;
    setSubmitting(true); setFormError('');
    try {
      const miningPrompt: SubmittedMiningPrompt = {
        objective:`${currentSetupParent?.name || dataset.name}知识挖掘`, instruction:setupPrompt, exploration:null,
        directions:allSelectedDirItems.map(item=>({direction_id:item.directionId,title:item.name,instruction:item.text,enabled:true,
          origin:item.origin,source:item.source})),
      };
      if(batchSize !== configuredBatch)await configuration.saveAsync({batch_size:batchSize!});
      submission.current ||= uuid();
      const job=await request<JobSnapshot>('/analysis/start',{submission_id:submission.current,analysis_kind:'knowledge',
        dataset_ids:[...setupSubsets],system_prompt:systemPrompt,mining_prompt:miningPrompt});
      started.current=job;
      onStarted([job]);
    } catch(error){setFormError(message(error));}finally{setSubmitting(false);}
  };

  return <>
            <section
              id="kb-setup-page"
              className="kb-setup-page"
              aria-label="新建知识挖掘配置"
            >
              <WorkbenchHeader pageId="industrial-knowledge" title="新建挖掘">
                <Button
                  type="button"

                  id="kb-setup-back"
                  onClick={closeCreate}
                  disabled={submitting}
                >
                  返回作业与结果
                </Button>
              </WorkbenchHeader>

              <fieldset className="kb-create-fields" disabled={submitting || directionsLoading || presetsLoading || !!started.current}>
              <DatasetScopeSelector className="kb-setup-scope" groups={parentGroups} selectedGroupId={setupDataset}
                onGroupChange={id => {
                  setSetupDataset(id);
                  const first = datasets.find(item => getDatasetGroupId(item) === id)?.dataset_id;
                  setSetupSubsets(new Set(first ? [first] : [])); setSetupExplored(new Set());
                }} childDatasets={currentSetupChildDatasets} selectedChildIds={setupSubsets}
                onChildToggle={id => setSetupSubsets(previous => {
                  const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next;
                })} disabled={submitting || directionsLoading || presetsLoading || !!started.current}
                groupId="kb-setup-dataset" childId="kb-setup-child-trigger" childMenuId="kb-setup-child-menu" />

              {/* Directions Section */}
              <section className="exp-panel kb-setup-directions" aria-labelledby="kb-direction-heading">
                <h2 id="kb-direction-heading">选择挖掘方向</h2>
                <TabBar<'preset' | 'explore'> label="挖掘方向类型" value={setupTab} onChange={setSetupTab} items={[
                  {id: 'preset', label: '通用预设方向', buttonProps: {id: 'kb-tab-preset', 'aria-controls': 'kb-preset-panel', 'data-kb-tab': 'preset'}},
                  {id: 'explore', label: '方向探索', buttonProps: {id: 'kb-tab-explore', 'aria-controls': 'kb-explore-panel', 'data-kb-tab': 'explore'}},
                ]} />

                {/* Preset Directions Table */}
                <div
                  id="kb-preset-panel"
                  role="tabpanel"
                  aria-labelledby="kb-tab-preset"
                  className={setupTab !== "preset" ? "hide" : ""}
                >
                  <div className="kb-direction-table-wrap">
                    <table className="kb-direction-table">
                      <thead>
                        <tr>
                          <th className="kb-dir-check"><span className="sr-only">选择</span></th>
                          <th className="kb-dir-title">方向</th>
                          <th>描述</th>
                          <th className="kb-dir-action">操作</th>
                        </tr>
                      </thead>
                      <tbody id="general-directions">
                        {presetDirections.map(p => {
                          const info = getDirInfo(p, "preset");
                          const checked = setupGeneral.has(p.id);
                          return (
                            <tr key={p.id}>
                              <td className="kb-dir-check">
                                <input
                                  type="checkbox"
                                  data-dir-kind="preset"
                                  data-dir-id={p.id}
                                  aria-label={`选择${info.name}`}
                                  checked={checked}
                                  onChange={e => {
                                    const next = new Set(setupGeneral);
                                    if (e.target.checked) next.add(p.id);
                                    else next.delete(p.id);
                                    setSetupGeneral(next);
                                  }}
                                />
                              </td>
                              <td>{info.name}</td>
                              <td>{info.text}</td>
                              <td className="kb-dir-action">
                                <IconButton icon="edit" type="button" data-edit-kind="preset" data-edit-id={p.id} label={`编辑方向 ${info.name}`} title="编辑方向" onClick={() => {
                                    setEditingDir({ kind: "preset", id: p.id });
                                    setEditingName(info.name);
                                    setEditingText(info.text);
                                    setDirEditError("");
                                  }} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Explored Directions Table */}
                <div
                  id="kb-explore-panel"
                  role="tabpanel"
                  aria-labelledby="kb-tab-explore"
                  className={setupTab !== "explore" ? "hide" : ""}
                >
                  <div className="kb-direction-table-wrap">
                    <table className="kb-direction-table">
                      <thead>
                        <tr>
                          <th className="kb-dir-check"><span className="sr-only">选择</span></th>
                          <th className="kb-dir-title">方向</th>
                          <th>描述</th>
                          <th className="kb-dir-action">操作</th>
                        </tr>
                      </thead>
                      <tbody id="explored-directions">
                        {kbExploredDirs.length ? (
                          kbExploredDirs.map(e => {
                            const info = getDirInfo(e, "explore");
                            const checked = setupExplored.has(e.id);
                            return (
                              <tr key={e.id}>
                                <td className="kb-dir-check">
                                  <input
                                    type="checkbox"
                                    data-dir-kind="explore"
                                    data-dir-id={e.id}
                                    aria-label={`选择${info.name}`}
                                    checked={checked}
                                    onChange={ev => {
                                      const next = new Set(setupExplored);
                                      if (ev.target.checked) next.add(e.id);
                                      else next.delete(e.id);
                                      setSetupExplored(next);
                                    }}
                                  />
                                </td>
                                <td>{info.name}</td>
                                <td>{info.text}</td>
                                <td className="kb-dir-action">
                                  <IconButton icon="edit" type="button" data-edit-kind="explore" data-edit-id={e.id} label={`编辑方向 ${info.name}`} title="编辑方向" onClick={() => {
                                      setEditingDir({ kind: "explore", id: e.id });
                                      setEditingName(info.name);
                                      setEditingText(info.text);
                                      setDirEditError("");
                                    }} />
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="kb-directions-empty">
                              所选子数据集暂无方向探索结果。
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Prompt Editor */}
              <section className="exp-panel kb-setup-prompt" aria-labelledby="kb-prompt-title">
                <div className="kb-prompt-header">
                  <h2 id="kb-prompt-title">提示词</h2>
                  <Button
                    type="button"

                    id="compose-prompt"
                    onClick={handleRestorePrompt}
                  >
                    恢复自动生成
                  </Button>
                </div>
                <AgentPromptEditors id="prompt-text" system={systemPrompt} user={setupPrompt}
                  onSystemChange={setSystemPrompt} onUserChange={text => {
                    setSetupPrompt(text);
                    setSetupPromptDirty(true);
                  }}
                  disabled={submitting}/>
                <div className="kb-prompt-note" id="prompt-note" aria-live="polite">
                  {setupPromptDirty ? "已手动修改，方向调整后保持当前内容。" : ""}
                </div>
              </section>

              </fieldset>
              <section className="exp-panel kb-setup-confirm" aria-labelledby="kb-confirm-title">
                <div className="exp-panel-title">
                  <h2 id="kb-confirm-title">确认并启动</h2>
                </div>
                <div className="exp-brief" id="kb-run-summary" aria-live="polite">
                  <span>子数据集 {setupSubsets.size} 个</span>
                  <span>挖掘方向 {allSelectedDirItems.length} 项</span>
                  <span>范围 全部登记图像</span><label>每批图像数 <input className="f" aria-label="每批挖掘图像数" type="number" min="1" max="200" value={batchSize ?? ''} disabled={submitting || !!started.current || configuration.loading} aria-describedby="kb-run-check" onChange={e=>setBatchSize(Number(e.target.value))} onBlur={()=>{if(batchSize !== null && Number.isInteger(batchSize) && batchSize>=1 && batchSize<=200 && batchSize!==configuredBatch)configuration.save({batch_size:batchSize});}} /></label>
                  <span>模型 {configuration.settings?.model?.model_id || '未配置'}</span>
                </div>
                <div className="exp-summarybar">
                  <span id="kb-run-check" role="status">
                    {validationProblem || "已满足启动条件"}
                  </span>
                  <div className="exp-actions">
                    <Button
                      type="button"
                      variant="primary"
                      id="submit-job"
                      disabled={!!validationProblem || submitting}
                      onClick={handleSubmitJob}
                    >
                      {submitting ? "启动中…" : "开始挖掘"}
                    </Button>
                  </div>
                </div>
                {formError && (
                  <div id="form-alert" className="kb-setup-error" role="alert">
                    {formError}
                  </div>
                )}
              </section>

            </section>
            {editingDir && <Modal title="编辑挖掘方向" className="iad-drawer" id="kb-dir-drawer" onClose={closeDirDrawer}>
              <div className="iad-dialog-body">
                <label className="iad-field" htmlFor="kb-dir-edit-name">标题
                  <input id="kb-dir-edit-name" maxLength={120} value={editingName} onChange={event=>setEditingName(event.target.value)} />
                </label>
                <label className="iad-field" htmlFor="kb-dir-edit-text">描述
                  <textarea id="kb-dir-edit-text" rows={9} value={editingText} onChange={event=>setEditingText(event.target.value)} />
                </label>
                {dirEditError && <p id="kb-dir-edit-error" role="alert">{dirEditError}</p>}
              </div>
              <footer className="iad-dialog-footer">
                <Button id="kb-dir-cancel" onClick={closeDirDrawer}>取消</Button>
                <Button variant="primary" id="kb-dir-save" onClick={saveDirEdit}>保存</Button>
              </footer>
            </Modal>}

<KnowledgeConfirmation state={confirmState} onClose={()=>setConfirmState(null)} />
</>;
}
