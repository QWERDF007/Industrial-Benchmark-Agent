import React from 'react';
import type {EvidenceBundle} from '../../shared/contracts.js';
import {frozenConsistencyMember} from '../consistency-images.js';
import {useWorkspace} from '../workspace.js';
import {ConsistencyComparison} from './ConsistencyComparison.js';

export function FrozenConsistencyComparison({bundle}:{bundle:EvidenceBundle}) {
  const {state,workspace}=useWorkspace();
  const member=frozenConsistencyMember(bundle);
  return <div className="iad-consistency-layout iad-frozen-comparison">
    <ConsistencyComparison member={member} query={null} temporary={null} frozen={bundle}
      differenceId={state.consistency.differenceId} onDifference={differenceId=>workspace.updateConsistency({differenceId},true)} />
  </div>;
}
