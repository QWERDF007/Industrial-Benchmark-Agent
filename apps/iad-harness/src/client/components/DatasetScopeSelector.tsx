import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Dataset, DatasetGroup } from "../../shared/contracts.js";
import { ChevronIcon } from "../AuditIcon.js";

export interface DatasetScopeSelectorProps {
  groups: DatasetGroup[];
  selectedGroupId: string;
  onGroupChange: (groupId: string) => void;
  childDatasets: Dataset[];
  selectedChildIds: string[] | Set<string>;
  onChildToggle: (childId: string) => void;
  disabled?: boolean;
  className?: string;
  groupId?: string;
  childId?: string;
  childLabelId?: string;
  childMenuId?: string;
  groupLabel?: string;
  childLabel?: string;
  emptyChildText?: string;
  children?: React.ReactNode;
}

/**
 * Reusable two-tier dataset hierarchy selector.
 * Provides parent dataset group selection and child dataset multi-select dropdown.
 * Shared across ImagesPage, ExplorationPage, and future workbench surfaces.
 */
export function DatasetScopeSelector({
  groups,
  selectedGroupId,
  onGroupChange,
  childDatasets,
  selectedChildIds,
  onChildToggle,
  disabled = false,
  className = "dataset-panel",
  groupId = "parent",
  childId = "child",
  childLabelId,
  childMenuId = "child-menu",
  groupLabel = "数据集",
  childLabel = "子数据集",
  emptyChildText = "暂无子数据集",
  children,
}: DatasetScopeSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isChecked = (id: string): boolean => {
    if (selectedChildIds instanceof Set) {
      return selectedChildIds.has(id);
    }
    return selectedChildIds.includes(id);
  };

  const selectedCount = selectedChildIds instanceof Set ? selectedChildIds.size : selectedChildIds.length;

  const buttonLabelText = useMemo(() => {
    if (selectedCount === 0) return `请选择${childLabel}`;
    return `已选 ${selectedCount} 个${childLabel}`;
  }, [selectedCount, childLabel]);

  const fieldPrefix = childId.replace(/-trigger$/, "").replace(/-toggle$/, "");
  const labelId = childLabelId || `${fieldPrefix}-label`;
  const optionsId = childMenuId || `${fieldPrefix}-options`;
  const childFieldId = `${fieldPrefix}-field`;
  const childMultiId = `${fieldPrefix}-multi`;

  return (
    <div className={`iba-scope-selector ${className}`} aria-label={`选择${groupLabel}`}>
      <div className="parent-controls dc-parent-controls">
        <div className="field parent dc-parent">
          <label htmlFor={groupId}>{groupLabel}</label>
          <select
            id={groupId}
            className="exp-select dc-select"
            value={selectedGroupId}
            disabled={disabled}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="child-controls dc-child-controls" ref={containerRef}>
        <div className="field child dc-children" id={childFieldId}>
          <label htmlFor={childId}>{childLabel}</label>
          <div className="dataset-multi dc-multi" id={childMultiId}>
            <button
              id={childId}
              type="button"
              className="dataset-multi-trigger exp-child-button dc-multi-trigger"
              aria-label={`选择${childLabel}`}
              aria-haspopup="true"
              aria-expanded={open}
              disabled={disabled}
              onClick={() => setOpen((prev) => !prev)}
            >
              <span id={labelId}>{buttonLabelText}</span>
              <span className="dataset-multi-chevron" aria-hidden="true">
                <ChevronIcon size={16} />
              </span>
            </button>
            <div id={childMenuId} className="dataset-multi-menu dc-options" hidden={!open}>
              <div id={optionsId} role="group" aria-label={`选择要查看的${childLabel}`}>
                {childDatasets.length ? (
                  childDatasets.map((d) => (
                    <label key={d.dataset_id} className="child-multi-option dc-option">
                      <input
                        type="checkbox"
                        className="dc-child-option"
                        value={d.dataset_id}
                        checked={isChecked(d.dataset_id)}
                        disabled={disabled}
                        onChange={() => onChildToggle(d.dataset_id)}
                      />
                      <span>{d.name}</span>
                    </label>
                  ))
                ) : (
                  <div className="exp-child-empty" style={{ padding: "10px", color: "#6e7f96", fontSize: "12px" }}>
                    {emptyChildText}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
