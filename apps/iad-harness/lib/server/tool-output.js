export const workbenchJsonOutput = {
    schema: { type: "json" },
    render(_args, value) {
        return [{ type: "text", text: JSON.stringify(value, (key, item) => ["mining_steps", "verification_steps", "joint_steps", "model_calls", "request", "input_sources", "generation_signature"].includes(key) ? undefined : item) }];
    },
};
