import React, { useEffect, useRef, useState } from "react";
import type {
  ExplorationPromptPreset,
  FrozenExplorationPrompt,
} from "../../shared/domain.generated.js";
import { message, request } from "../api.js";
import { Modal } from "./Modal.js";

export function ExplorationPromptEditor({
  presets,
  value,
  base,
  disabled,
  onChange,
  onCreated,
}: {
  presets: ExplorationPromptPreset[];
  value: FrozenExplorationPrompt;
  base: string;
  disabled: boolean;
  onChange(value: FrozenExplorationPrompt, base: string): void;
  onCreated(value: ExplorationPromptPreset): void;
}) {
  const [replace, setReplace] = useState<ExplorationPromptPreset | null>(null);
  const [saving, setSaving] = useState(false),
    [dialog, setDialog] = useState(false),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const modified = value.text !== base;
  function choose(preset: ExplorationPromptPreset) {
    onChange(
      { preset_id: preset.id, preset_name: preset.name, text: preset.text },
      preset.text,
    );
  }
  function confirm(preset: ExplorationPromptPreset) {
    if (modified) setReplace(preset);
    else choose(preset);
  }
  async function save() {
    setSaving(true);
    setError("");
    try {
      const preset = await request<ExplorationPromptPreset>(
        "/exploration/presets",
        { name, text: value.text },
      );
      if (alive.current) {
        onCreated(preset);
        choose(preset);
        setDialog(false);
      }
    } catch (error) {
      if (alive.current) setError(message(error));
    } finally {
      if (alive.current) setSaving(false);
    }
  }
  return (
    <>
      <div className="iad-prompt-controls">
        <label className="iad-field">
          提示词预设
          <select
            aria-label="提示词预设"
            disabled={disabled}
            value={value.preset_id || ""}
            onChange={(event) => {
              const preset = presets.find(
                (item) => item.id === event.target.value,
              );
              if (preset) confirm(preset);
            }}
          >
            {!presets.some((item) => item.id === value.preset_id) && (
              <option value={value.preset_id || ""}>
                {value.preset_name || "自定义提示词"}
              </option>
            )}
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <span className="iad-muted">
          {modified ? "已修改" : "使用预设内容"}
        </span>
        <button
          disabled={
            disabled ||
            !modified ||
            !presets.some((p) => p.id === value.preset_id)
          }
          onClick={() =>
            confirm(presets.find((p) => p.id === value.preset_id)!)
          }
        >
          重置为预设
        </button>
        <button
          disabled={disabled || !value.text.trim()}
          onClick={() => {
            setName("");
            setError("");
            setDialog(true);
          }}
        >
          另存为新预设
        </button>
      </div>
      <label className="iad-field">
        提示词正文
        <textarea
          aria-label="提示词正文"
          rows={8}
          disabled={disabled}
          value={value.text}
          onChange={(event) =>
            onChange({ ...value, text: event.target.value }, base)
          }
        />
      </label>
      {replace && (
        <Modal
          title="替换当前提示词？"
          onClose={() => setReplace(null)}
          className="iad-confirm-dialog"
        >
          <p>当前正文已修改。替换正文会保留补充目标和两组图像。</p>
          <div className="iad-form-actions">
            <button onClick={() => setReplace(null)}>保留当前编辑</button>
            <button
              className="iad-primary"
              onClick={() => {
                choose(replace);
                setReplace(null);
              }}
            >
              替换为所选预设
            </button>
          </div>
        </Modal>
      )}
      {dialog && (
        <Modal
          title="保存提示词预设"
          onClose={() => {
            if (!saving) setDialog(false);
          }}
          className="iad-confirm-dialog"
        >
          <label className="iad-field">
            预设名称
            <input
              aria-label="预设名称"
              value={name}
              disabled={saving}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <div className="iad-form-actions">
            <button disabled={saving} onClick={() => setDialog(false)}>
              取消
            </button>
            <button
              disabled={saving || !name.trim() || !value.text.trim()}
              className="iad-primary"
              onClick={() => void save()}
            >
              {saving ? "保存中…" : "保存预设"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
