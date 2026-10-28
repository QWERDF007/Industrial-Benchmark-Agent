import test from 'node:test';
import assert from 'node:assert/strict';
import { defineTool } from '@deepseek-ai/dsh-tools';
import { annotationPolicyParameter } from '../lib/shared/dataset.parameters.generated.js';
import { explorationParameters, explorationPresetParameters, directionAdoptionParameters } from '../lib/shared/exploration.parameters.generated.js';
import { miningParameters } from '../lib/shared/mining.parameters.generated.js';
import { knowledgeScopeParameters } from '../lib/shared/knowledge-scope.parameters.generated.js';
import { knowledgeDetailParameters } from '../lib/shared/knowledge-detail.parameters.generated.js';
import { knowledgeSourceParameters } from '../lib/shared/knowledge-source.parameters.generated.js';
import {consistencyStartParameters, imageRetrieveParameters, imageIndexPrepareParameters,consistencyCompareParameters,consistencyEvidenceParameters,consistencyQueryParameters,consistencyGroupParameters,consistencyGroupMemberParameters} from '../lib/shared/consistency.parameters.generated.js';

test('generated parameters register with the installed native SDK', () => {
  for (const parameters of [knowledgeScopeParameters, miningParameters, explorationParameters,
    explorationPresetParameters, directionAdoptionParameters, knowledgeDetailParameters,
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
