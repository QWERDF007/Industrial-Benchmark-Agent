import React from "react";
export declare function Modal({ title, onClose, children, className, restoreFocus, initialFocus, header }: {
    title: string;
    onClose(): void;
    children: React.ReactNode;
    className?: string;
    restoreFocus?(): HTMLElement | null;
    initialFocus?: React.RefObject<HTMLElement>;
    header?: boolean;
}): React.JSX.Element;
//# sourceMappingURL=Modal.d.ts.map