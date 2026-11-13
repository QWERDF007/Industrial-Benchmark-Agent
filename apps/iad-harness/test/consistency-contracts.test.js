import test from 'node:test';
import assert from 'node:assert/strict';
import { defineTool, validateArgs } from '@deepseek-ai/dsh-tools';
import { annotationPolicyParameter } from '../lib/shared/dataset.parameters.generated.js';
import { explorationPresetParameters } from '../lib/shared/exploration.parameters.generated.js';
import {explorationAgentStartParameters, knowledgeAgentStartParameters, analysisScopeParameters, analysisMediaParameters, explorationCommitParameters, knowledgeCommitParameters} from '../lib/shared/analysis-agent.parameters.generated.js';
import { knowledgeDetailParameters } from '../lib/shared/knowledge-detail.parameters.generated.js';
import { knowledgeSourceParameters } from '../lib/shared/knowledge-source.parameters.generated.js';
import {galleryReferenceParameters,consistencyStartParameters, imageRetrieveParameters, imageIndexPrepareParameters,consistencyCompareParameters,consistencyEvidenceParameters,consistencyQueryParameters,consistencyGroupParameters,consistencyGroupMemberParameters} from '../lib/shared/consistency.parameters.generated.js';
import {anchorToolParameters, consistencyAgentStartParameters,consistencyCheckReferenceParameters,consistencyAnchorReferenceParameters,consistencyCheckResultsQueryParameters} from '../lib/shared/consistency-agent.parameters.generated.js';

test('generated parameters register with the installed native SDK', () => {
  for (const parameters of [consistencyAgentStartParameters,consistencyCheckReferenceParameters,consistencyAnchorReferenceParameters,consistencyCheckResultsQueryParameters,galleryReferenceParameters,explorationAgentStartParameters, knowledgeAgentStartParameters, analysisScopeParameters, analysisMediaParameters, explorationCommitParameters, knowledgeCommitParameters,
    explorationPresetParameters, knowledgeDetailParameters,
    knowledgeSourceParameters, consistencyStartParameters, imageRetrieveParameters, imageIndexPrepareParameters,consistencyCompareParameters,consistencyEvidenceParameters,consistencyQueryParameters,consistencyGroupParameters,consistencyGroupMemberParameters,
    ...Object.values(anchorToolParameters).flatMap(tools=>Object.values(tools)),{annotation_policy:annotationPolicyParameter}]) {
    assert.doesNotThrow(() => defineTool({name:'schema_registration', description:'Schema registration',
      parameters, output:{schema:{type:'json'},render:()=>[]}, execute:async () => ({})}));
  }
});

test('native consistency schemas preserve discriminated scopes and managed image references', () => {
  const scopes=consistencyStartParameters.subjects.oneOf;
  assert.equal(consistencyStartParameters.subjects.required,true);
  assert.deepEqual(scopes.map(schema=>schema.properties.kind.enum[0]),['all_registered','datasets','samples','filtered']);
  assert.equal(scopes[1].properties.dataset_ids.required,true);
  assert.equal(scopes[3].properties.filters.properties.page,undefined);
  assert.equal(scopes[3].properties.filters.properties.dataset_id,undefined);
  assert.deepEqual(consistencyStartParameters.corpus_scope.oneOf.map(schema=>schema.properties.kind.enum[0]),['all_registered','datasets']);
  const temporary=imageRetrieveParameters.query.oneOf.find(schema=>schema.properties.kind.enum[0]==='temporary');
  assert.equal(temporary.properties.image_ref.required,true);
  assert.equal(temporary.properties.path,undefined);
});

test('consistency start leaves module defaults to the server',()=>{
  assert.equal('default' in consistencyStartParameters.mode,false);
  assert.equal('default' in consistencyStartParameters.min_similarity,false);
  assert.equal('default' in consistencyStartParameters.top_k,false);
});

test('native decisions exclude derived conclusions and preserve nullable context queries', () => {
  const input = {phase:'audit',request_id:'decision-one',candidate_id:'candidate-one',expected_revision:1,fingerprint: 'a'.repeat(64), observation_ids: ['observation-one'], assessment: {
    candidate_id: 'candidate-one', verdict: 'EQUIVALENT',
    explanation: '两侧未提供标注，无法确认标注规则和覆盖范围', findings: [],
  }};
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.assess, input), []);
  const quoted = structuredClone(input);quoted.assessment.conclusion = 'null';
  assert.notDeepEqual(validateArgs(anchorToolParameters.bbox_defect.assess, quoted), []);
  const literal = structuredClone(input);literal.assessment.conclusion = null;
  assert.notDeepEqual(validateArgs(anchorToolParameters.bbox_defect.assess, literal), []);
  const internal = structuredClone(input);internal.assessment.categories = ['对应关系差异'];
  assert.notDeepEqual(validateArgs(anchorToolParameters.bbox_defect.assess, internal), []);
  const invalid = structuredClone(input);invalid.assessment.candidate_id = null;
  assert.notDeepEqual(validateArgs(anchorToolParameters.bbox_defect.assess, invalid), []);
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.submit, {request_id:'final',fingerprint: input.fingerprint,
    assessment_ids: [1]}), []);
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.context, {candidate_id: null}), []);
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.context, {}), []);
});

test('optional structured tool arguments expose their object type to model templates',()=>{
  const assessment=anchorToolParameters.bbox_defect.assess.assessment;
  assert.equal(assessment.type,'object');
  assert.equal(assessment.required,undefined);
  assert.equal(assessment.oneOf,undefined);
  const input={phase:'audit',request_id:'audit-one',candidate_id:'candidate-one',expected_revision:1,
    fingerprint:'a'.repeat(64),observation_ids:['observation-one'],
    assessment:{candidate_id:'candidate-one',verdict:'EQUIVALENT',explanation:'同一对象标注一致',findings:[]}};
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.assess,input),[]);
  assert.notDeepEqual(validateArgs(anchorToolParameters.bbox_defect.assess,{...input,assessment:JSON.stringify(input.assessment)}),[]);
  const {assessment:unused,...gate}=input;
  assert.deepEqual(validateArgs(anchorToolParameters.bbox_defect.assess,{...gate,phase:'gate'}),[]);
});
