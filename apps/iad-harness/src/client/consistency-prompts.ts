import type {IdentityPrompts} from '../shared/domain.generated.js';

export const identityPromptFields:ReadonlyArray<{name:keyof IdentityPrompts;label:string}>=[
  {name:'gate_system',label:'身份验证系统提示词'},
  {name:'gate_user',label:'身份验证用户提示词'},
  {name:'gate_examples',label:'身份验证判断示例'},
];
