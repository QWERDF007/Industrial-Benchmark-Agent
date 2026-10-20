import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const RetryContext = createContext(0);
export function MediaLoad({ children, className = "" }) {
    const [attempt, setAttempt] = useState(0);
    const [failures, setFailures] = useState(new Map());
    function capture(event) {
        const target = event.target;
        const source = target.getAttribute?.("data-media-source");
        if (!source)
            return;
        setFailures(previous => {
            const next = new Map(previous);
            if (event.type === "error")
                next.set(source, target.getAttribute("data-media-label") || target.getAttribute("alt") || "图像");
            else
                next.delete(source);
            return next;
        });
    }
    return _jsx(RetryContext.Provider, { value: attempt, children: _jsxs("div", { className: `iad-media-load ${className}`, onErrorCapture: capture, onLoadCapture: capture, children: [children, !!failures.size && _jsxs("div", { className: "iad-media-error", role: "alert", children: [[...new Set(failures.values())].map(label => _jsxs("span", { children: [label, "\u65E0\u6CD5\u52A0\u8F7D\uFF0C\u8BF7\u68C0\u67E5\u8D44\u6E90\u662F\u5426\u5B58\u5728\u6216\u5B8C\u6574\u3002"] }, label)), _jsx("button", { type: "button", "aria-label": "\u91CD\u65B0\u52A0\u8F7D\u56FE\u50CF", onClick: () => setAttempt(previous => previous + 1), children: "\u91CD\u65B0\u52A0\u8F7D" })] })] }) });
}
function useRetryUrl(source) {
    const attempt = useContext(RetryContext);
    if (!attempt)
        return source;
    const url = new URL(source, window.location.href);
    url.searchParams.set("_retry", String(attempt));
    return url.href;
}
export function MediaImage({ src = "", ...props }) {
    return _jsx("img", { ...props, src: useRetryUrl(src), "data-media-source": src });
}
export function MediaMask({ href = "", ...props }) {
    return _jsx("image", { ...props, href: useRetryUrl(href), "data-media-source": href, "data-media-label": "\u6807\u6CE8\u50CF\u7D20" });
}
