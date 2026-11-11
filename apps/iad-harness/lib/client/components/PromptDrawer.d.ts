import React from 'react';
export declare function PromptDrawer({ title, text, systemText, additionalSections, systemLabel, userLabel, onClose }: {
    title: string;
    text: string;
    systemText?: string | null;
    additionalSections?: ReadonlyArray<{
        title: string;
        text: string;
    }>;
    systemLabel?: string;
    userLabel?: string;
    onClose(): void;
}): React.JSX.Element;
//# sourceMappingURL=PromptDrawer.d.ts.map