export const workbenchJsonOutput = {
    schema: { type: "json" },
    render(_args, value) {
        return [{ type: "text", text: JSON.stringify(value, (key, item) => key === "mining_steps" || key === "verification_steps" || key === "joint_steps" || key === "model_calls" ? undefined : item) }];
    },
};
