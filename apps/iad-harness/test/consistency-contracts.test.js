import test from 'node:test';
import assert from 'node:assert/strict';
import { defineTool, validateArgs } from '@deepseek-ai/dsh-tools';
import { annotationPolicyParameter } from '../lib/shared/dataset.parameters.generated.js';
import { explorationPresetParameters } from '../lib/shared/exploration.parameters.generated.js';
import {explorationAgentStartParameters, knowledgeAgentStartParameters, analysisScopeParameters, analysisMediaParameters, explorationCommitParameters, knowledgeCommitParameters} from '../lib/shared/analysis-agent.parameters.generated.js';
import { knowledgeDetailParameters } from '../lib/shared/knowledge-detail.parameters.generated.js';
import { knowledgeSourceParameters } from '../lib/shared/knowledge-source.parameters.generated.js';
import {galleryReferenceParameters,consistencyStartParameters, imageRetrieveParameters, imageIndexPrepareParameters,consistencyCompareParameters,consistencyEvidenceParameters,consistencyQueryParameters,consistencyGroupParameters,consistencyGroupMemberParameters} from '../lib/shared/consistency.parameters.generated.js';
import {anchorContextQueryParameters, anchorAssessmentInputParameters, anchorReviewSubmissionParameters, consistencyAgentStartParameters,consistencyCheckReferenceParameters,consistencyAnchorReferenceParameters,consistencyCheckResultsQueryParameters} from '../lib/shared/consistency-agent.parameters.generated.js';

test('generated parameters register with the installed native SDK', () => {
  for (const parameters of [consistencyAgentStartParameters,consistencyCheckReferenceParameters,consistencyAnchorReferenceParameters,consistencyCheckResultsQueryParameters,galleryReferenceParameters,explorationAgentStartParameters, knowledgeAgentStartParameters, analysisScopeParameters, analysisMediaParameters, explorationCommitParameters, knowledgeCommitParameters,
    explorationPresetParameters, knowledgeDetailParameters,
    knowledgeSourceParameters, consistencyStartParameters, imageRetrieveParameters, imageIndexPrepareParameters,consistencyCompareParameters,consistencyEvidenceParameters,consistencyQueryParameters,consistencyGroupParameters,consistencyGroupMemberParameters,
    {annotation_policy:annotationPolicyParameter}]) {
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
});

test('native decisions exclude derived conclusions and preserve nullable context queries', () => {
  const input = {fingerprint: 'a'.repeat(64), observation_ids: ['observation-one'], assessment: {
    candidate_id: 'candidate-one', verdict: 'EQUIVALENT', categories: [],
    explanation: '两侧未提供标注，无法确认标注规则和覆盖范围', findings: [],
  }};
  assert.deepEqual(validateArgs(anchorAssessmentInputParameters, input), []);
  const quoted = structuredClone(input);quoted.assessment.conclusion = 'null';
  assert.notDeepEqual(validateArgs(anchorAssessmentInputParameters, quoted), []);
  const literal = structuredClone(input);literal.assessment.conclusion = null;
  assert.notDeepEqual(validateArgs(anchorAssessmentInputParameters, literal), []);
  const internal = structuredClone(input);internal.assessment.categories = ['对应关系差异'];
  assert.notDeepEqual(validateArgs(anchorAssessmentInputParameters, internal), []);
  const invalid = structuredClone(input);invalid.assessment.candidate_id = null;
  assert.notDeepEqual(validateArgs(anchorAssessmentInputParameters, invalid), []);
  assert.deepEqual(validateArgs(anchorReviewSubmissionParameters, {fingerprint: input.fingerprint,
    assessment_ids: [1]}), []);
  assert.deepEqual(validateArgs(anchorContextQueryParameters, {candidate_id: null}), []);
  assert.deepEqual(validateArgs(anchorContextQueryParameters, {}), []);
});
