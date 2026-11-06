import type {ModuleSettingsSnapshot} from './domain.generated.js';
export type BusinessModule=ModuleSettingsSnapshot['module'];
export const businessModules={exploration:'方向探索',knowledge:'知识挖掘',consistency:'数据一致性',audit:'模型审计'} satisfies Record<BusinessModule,string>;
