import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronIcon } from "../AuditIcon.js";
/**
 * Reusable two-tier dataset hierarchy selector.
 * Provides parent dataset group selection and child dataset multi-select dropdown.
 * Shared across ImagesPage, ExplorationPage, and future workbench surfaces.
 */
export function DatasetScopeSelector({ groups, selectedGroupId, onGroupChange, childDatasets, selectedChildIds, onChildToggle, disabled = false, className = "dataset-panel", groupId = "parent", childId = "child", childLabelId, childMenuId = "child-menu", groupLabel = "数据集", childLabel = "子数据集", emptyChildText = "暂无子数据集", children, }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    // Close on click outside or Escape
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        function handleKeyDown(e) {
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
    const isChecked = (id) => {
        if (selectedChildIds instanceof Set) {
            return selectedChildIds.has(id);
        }
        return selectedChildIds.includes(id);
    };
    const selectedCount = selectedChildIds instanceof Set ? selectedChildIds.size : selectedChildIds.length;
    const buttonLabelText = useMemo(() => {
        if (selectedCount === 0)
            return `请选择${childLabel}`;
        return `已选 ${selectedCount} 个${childLabel}`;
    }, [selectedCount, childLabel]);
    const fieldPrefix = childId.replace(/-trigger$/, "").replace(/-toggle$/, "");
    const labelId = childLabelId || `${fieldPrefix}-label`;
    const optionsId = childMenuId || `${fieldPrefix}-options`;
    const childFieldId = `${fieldPrefix}-field`;
    const childMultiId = `${fieldPrefix}-multi`;
    return (_jsxs("div", { className: `iba-scope-selector ${className}`, "aria-label": `选择${groupLabel}`, children: [_jsx("div", { className: "parent-controls dc-parent-controls", children: _jsxs("div", { className: "field parent dc-parent", children: [_jsx("label", { htmlFor: groupId, children: groupLabel }), _jsx("select", { id: groupId, className: "exp-select dc-select", value: selectedGroupId, disabled: disabled, onChange: (e) => onGroupChange(e.target.value), children: groups.map((g) => (_jsx("option", { value: g.group_id, children: g.name }, g.group_id))) })] }) }), _jsxs("div", { className: "child-controls dc-child-controls", ref: containerRef, children: [_jsxs("div", { className: "field child dc-children", id: childFieldId, children: [_jsx("label", { htmlFor: childId, children: childLabel }), _jsxs("div", { className: "dataset-multi dc-multi", id: childMultiId, children: [_jsxs("button", { id: childId, type: "button", className: "dataset-multi-trigger exp-child-button dc-multi-trigger", "aria-label": `选择${childLabel}`, "aria-haspopup": "true", "aria-expanded": open, disabled: disabled, onClick: () => setOpen((prev) => !prev), children: [_jsx("span", { id: labelId, children: buttonLabelText }), _jsx("span", { className: "dataset-multi-chevron", "aria-hidden": "true", children: _jsx(ChevronIcon, { size: 16 }) })] }), _jsx("div", { id: childMenuId, className: "dataset-multi-menu dc-options", hidden: !open, children: _jsx("div", { id: optionsId, role: "group", "aria-label": `选择要查看的${childLabel}`, children: childDatasets.length ? (childDatasets.map((d) => (_jsxs("label", { className: "child-multi-option dc-option", children: [_jsx("input", { type: "checkbox", className: "dc-child-option", value: d.dataset_id, checked: isChecked(d.dataset_id), disabled: disabled, onChange: () => onChildToggle(d.dataset_id) }), _jsx("span", { children: d.name })] }, d.dataset_id)))) : (_jsx("div", { className: "exp-child-empty", style: { padding: "10px", color: "#6e7f96", fontSize: "12px" }, children: emptyChildText })) }) })] })] }), children] })] }));
}
