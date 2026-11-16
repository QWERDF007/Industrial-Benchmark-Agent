const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
/** Freeze the provider's wire spelling once for the Python visual transport. */
export function reasoningParameters(api, effort, declared, compat) {
    const mapping = object(declared.reasoningEfforts);
    const wire = Object.hasOwn(mapping, effort) ? mapping[effort] : effort === 'off' ? undefined : effort;
    const enabled = effort !== 'off', supported = compat.supportsReasoningEffort !== false;
    const parameter = typeof wire === 'string' ? { reasoning_effort: wire } : {};
    if (api === 'openai-responses')
        return typeof wire === 'string' ? { reasoning: { effort: wire } } : {};
    switch (compat.thinkingFormat ?? 'openai') {
        case 'openai': return supported ? parameter : {};
        case 'deepseek': return { thinking: { type: enabled ? 'enabled' : 'disabled' }, ...(supported ? parameter : {}) };
        case 'zai': return { thinking: enabled ? { type: 'enabled', clear_thinking: false } : { type: 'disabled' }, ...(enabled && supported ? parameter : {}) };
        case 'qwen': return { enable_thinking: enabled, ...(enabled && supported ? parameter : {}) };
        case 'qwen-chat-template': return { chat_template_kwargs: { enable_thinking: enabled, preserve_thinking: true } };
        case 'openrouter': return { reasoning: { effort: typeof wire === 'string' ? wire : enabled ? effort : 'none' } };
        case 'together': return { reasoning: { enabled }, ...(enabled && supported ? parameter : {}) };
        case 'string-thinking': return { thinking: typeof wire === 'string' ? wire : enabled ? effort : 'none' };
        case 'ant-ling': return typeof wire === 'string' ? { reasoning: { effort: wire } } : {};
        case 'chat-template':
        case 'baseten': {
            const baseten = compat.thinkingFormat === 'baseten';
            const template = object(compat[baseten ? 'chatTemplateArgs' : 'chatTemplateKwargs']);
            const values = {};
            for (const [name, value] of Object.entries(template)) {
                const variable = object(value);
                if (!variable.$var) {
                    values[name] = value;
                    continue;
                }
                if (!enabled && variable.omitWhenOff)
                    continue;
                if (variable.$var === 'thinking.budget')
                    throw new Error('视觉模型推理模板的 token 预算需通过提供商静态参数声明');
                const resolved = variable.$var === 'thinking.enabled' ? enabled : wire;
                if (resolved !== undefined && resolved !== null)
                    values[name] = resolved;
            }
            return { ...(Object.keys(values).length ? { [baseten ? 'chat_template_args' : 'chat_template_kwargs']: values } : {}),
                ...(baseten && supported ? parameter : {}) };
        }
        default: throw new Error('提供商声明了不支持的推理参数协议');
    }
}
