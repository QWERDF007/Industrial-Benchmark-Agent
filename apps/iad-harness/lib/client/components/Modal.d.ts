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
}
export declare function Modal({ title, onClose, children, className, restoreFocus, initialFocus, header, presentation }: ModalProps): React.JSX.Element;
//# sourceMappingURL=Modal.d.ts.map