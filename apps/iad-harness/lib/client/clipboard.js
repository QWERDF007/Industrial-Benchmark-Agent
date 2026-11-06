export async function copyText(text) {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return;
    }
    const previous = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    (previous?.closest('dialog') || document.body).append(field);
    try {
        field.select();
        if (!document.execCommand('copy'))
            throw new Error('复制失败');
    }
    finally {
        field.remove();
        if (previous instanceof HTMLElement)
            previous.focus();
    }
}
