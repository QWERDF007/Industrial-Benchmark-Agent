import React from "react";
export type ModalPresentation = "modal" | "inline" | "closed";
export interface ModalProps {
    id?: string;
    title: string;
    onClose(): void;
    children: React.ReactNode;
    className?: string;
    size?: 'detail' | 'form' | 'compact';
    frame?: 'dialog' | 'fullscreen';
    restoreFocus?(): HTMLElement | null;
    initialFocus?: React.RefObject<HTMLElement>;
    header?: boolean;
    presentation?: ModalPresentation;
    onKeyDown?: React.KeyboardEventHandler<HTMLDialogElement>;
}
export declare function Modal({ id, title, onClose, children, className, size, frame, restoreFocus, initialFocus, header, presentation, onKeyDown }: ModalProps): React.JSX.Element;
//# sourceMappingURL=Modal.d.ts.map