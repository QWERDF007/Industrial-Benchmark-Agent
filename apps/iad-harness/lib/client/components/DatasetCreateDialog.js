import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { message, request } from '../api.js';
import { useFolderPreview } from '../useFolderPreview.js';
import { Button } from './Button.js';
import { DirectoryPickerDialog } from './DirectoryPickerDialog.js';
import { Modal } from './Modal.js';
import { Select } from './Select.js';
export function DatasetCreateDialog({ groups, parentId, onCreated, onClose }) {
    const [kind, setKind] = useState(parentId ? 'child' : 'group');
    const [format, setFormat] = useState('labelme');
    const [groupId, setGroupId] = useState(parentId || groups[0]?.group_id || '');
    const [name, setName] = useState(''), [imagePath, setImagePath] = useState(''), [labelPath, setLabelPath] = useState('');
    const [browse, setBrowse] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const nameInput = useRef(null);
    const { preview, ready, error: previewError } = useFolderPreview(imagePath, undefined, kind === 'child' && format === 'folder_classification');
    async function create(event) {
        event.preventDefault();
        if (busy)
            return;
        setError('');
        if (!name.trim()) {
            setError('请输入数据集名称');
            return;
        }
        if (kind === 'child' && (!groupId || !imagePath || format === 'labelme' && !labelPath)) {
            setError('请填写数据集及目录');
            return;
        }
        setBusy(true);
        try {
            if (kind === 'group')
                onCreated({ kind, group: await request('/datasets/groups', { name: name.trim() }) });
            else {
                const body = format === 'labelme'
                    ? { format, name: name.trim(), group_id: groupId, image_dir: imagePath, annotation_dir: labelPath, unannotated_is_normal: true }
                    : { format, name: name.trim(), group_id: groupId, root_dir: imagePath,
                        rules: preview?.items.map(({ path, role }) => ({ path, role })), preview_fingerprint: preview?.preview_fingerprint };
                onCreated({ kind, dataset: await request('/datasets/import', body), groupId });
            }
        }
        catch (failure) {
            setError(message(failure));
        }
        finally {
            setBusy(false);
        }
    }
    return _jsxs(_Fragment, { children: [_jsx(Modal, { title: "\u6DFB\u52A0\u6570\u636E\u96C6", size: kind === 'group' ? 'compact' : 'form', initialFocus: nameInput, onClose: () => { if (!busy)
                    onClose(); }, children: _jsxs("form", { className: "iad-dialog-form-layout", onSubmit: event => void create(event), children: [_jsxs("div", { className: "iad-dialog-body", children: [_jsxs("fieldset", { className: "iad-review-options", children: [_jsx("legend", { children: "\u6DFB\u52A0\u7C7B\u578B" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-kind", value: "group", disabled: busy || Boolean(parentId), checked: kind === 'group', onChange: () => setKind('group') }), "\u6570\u636E\u96C6"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-kind", value: "child", disabled: busy || !groups.length, checked: kind === 'child', onChange: () => setKind('child') }), "\u5B50\u6570\u636E\u96C6"] })] }), kind === 'child' && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "new-parent", children: "\u6240\u5C5E\u6570\u636E\u96C6" }), _jsx(Select, { id: "new-parent", disabled: busy || Boolean(parentId), value: groupId, onChange: event => setGroupId(event.target.value), children: groups.map(group => _jsx("option", { value: group.group_id, children: group.name }, group.group_id)) })] }), _jsxs("fieldset", { className: "iad-review-options", children: [_jsx("legend", { children: "\u6570\u636E\u683C\u5F0F" }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-format", value: "labelme", disabled: busy, checked: format === 'labelme', onChange: () => setFormat('labelme') }), "Labelme"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", name: "new-format", value: "folder_classification", disabled: busy, checked: format === 'folder_classification', onChange: () => setFormat('folder_classification') }), "\u5F02\u5E38\u68C0\u6D4B\u76EE\u5F55"] })] })] }), _jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "new-name", children: kind === 'child' ? '子数据集名称' : '数据集名称' }), _jsx("input", { id: "new-name", ref: nameInput, maxLength: 120, autoComplete: "off", disabled: busy, required: true, value: name, onChange: event => setName(event.target.value) })] }), kind === 'child' && _jsxs(_Fragment, { children: [_jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "new-path", children: format === 'labelme' ? '图像目录' : '根目录' }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { id: "new-path", disabled: busy, required: true, value: imagePath, onChange: event => setImagePath(event.target.value) }), _jsx(Button, { disabled: busy, onClick: () => setBrowse('image'), children: "\u6D4F\u89C8" })] })] }), format === 'labelme' && _jsxs("div", { className: "iad-field", children: [_jsx("label", { htmlFor: "new-label-path", children: "\u6807\u6CE8\u76EE\u5F55" }), _jsxs("div", { className: "iad-row", children: [_jsx("input", { id: "new-label-path", disabled: busy, required: true, value: labelPath, onChange: event => setLabelPath(event.target.value) }), _jsx(Button, { disabled: busy, onClick: () => setBrowse('label'), children: "\u6D4F\u89C8" })] })] })] }), (error || previewError) && _jsx("p", { role: "alert", className: "iad-error", children: error || previewError })] }), _jsxs("footer", { className: "iad-dialog-footer", children: [_jsx(Button, { disabled: busy, onClick: onClose, children: "\u53D6\u6D88" }), _jsx(Button, { type: "submit", variant: "primary", disabled: busy || kind === 'child' && format === 'folder_classification' && !ready, children: busy ? '正在添加…' : '添加' })] })] }) }), browse && _jsx(DirectoryPickerDialog, { label: browse === 'label' ? '标注目录' : format === 'labelme' ? '图像目录' : '根目录', initialPath: browse === 'image' ? imagePath : labelPath, onClose: () => setBrowse(null), onPick: path => { if (browse === 'image')
                    setImagePath(path);
                else
                    setLabelPath(path); } })] });
}
