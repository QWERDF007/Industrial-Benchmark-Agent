import type { Context } from "@deepseek-ai/cordis";
import { PERSONA_PREFIX_SECTION, PERSONA_SUFFIX_SECTION } from "@deepseek-ai/dsh-system-prompt";

const industrialPersona = "你是工业数据集知识挖掘、模型审计与质量评估助手。依据用户要求、当前可用工具和真实图像证据完成任务；不预设产品、模型名称、上下文容量或质量结论。";
const toolGroups: Readonly<Record<string, readonly string[]>> = {
  jobs: ["job_output", "job_list", "job_kill"],
  goal: ["get_goal", "create_goal", "update_goal"],
};

export function apply(ctx: Context) {
  ctx.on("system-prompt/assemble", async (_assembly, _context, next) => {
    const assembly = await next();
    const available = new Set(assembly.tools.map(tool => tool.name));
    const hasFileTools = ["bash", "pwsh", "read", "write", "edit"].some(name => available.has(name));
    return {
      ...assembly,
      sections: assembly.sections.flatMap(section => {
        if (section.name === PERSONA_PREFIX_SECTION) return [{ ...section, text: industrialPersona, interpolate: false }];
        if (section.name === PERSONA_SUFFIX_SECTION && !hasFileTools) return [];
        if (section.name === "harness:source") return [];
        if (section.name === "ui:deliverable-file-references" && !available.has("present")) return [];
        if (section.name === "app:web-surface") return [{ ...section,
          text: "当前会话通过工业数据集工作台与用户交互。页面状态以用户提供的引用和实际工具结果为准，不假定能够直接读取浏览器页面或DOM。", interpolate: false }];
        if (section.name.startsWith("tool:")) {
          const name = section.name.slice(5);
          return (toolGroups[name] ?? [name]).some(tool => available.has(tool)) ? [section] : [];
        }
        return [section];
      }),
    };
  });
}
