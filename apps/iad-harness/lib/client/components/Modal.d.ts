import React from "react";
export type ModalPresentation = "modal" | "inline" | "closed";
export interface ModalProps {
    title: string;
    onClose(): void;
    children: React.ReactNode;
    className?: string;
    restoreFocus?(): HTMLElement | null;
    initialFocus?: React.RefObject<HTMLElement>;
    header?: boolean;
    presentation?: ModalPresentation;
    onKeyDown?: React.KeyboardEventHandler<HTMLDialogElement>;
}
export declare function Modal({ title, onClose, children, className, restoreFocus, initialFocus, header, presentation, onKeyDown }: ModalProps): React.JSX.Element;
//# sourceMappingURL=Modal.d.ts.map