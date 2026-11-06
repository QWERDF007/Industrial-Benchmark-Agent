import React from 'react';
import {ConfirmationDialog} from './ConfirmationDialog.js';

export interface KnowledgeConfirmationState {
  title:string;message:string;danger?:boolean;confirmLabel?:string;onConfirm():void|Promise<void>;
}
export function KnowledgeConfirmation({state,onClose}: {state:KnowledgeConfirmationState|null;onClose():void}) {
  return state&&<ConfirmationDialog title={state.title} danger={state.danger} confirmLabel={state.confirmLabel} onClose={onClose} onConfirm={state.onConfirm}>
    <p id="confirm-message">{state.message}</p>
  </ConfirmationDialog>;
}
