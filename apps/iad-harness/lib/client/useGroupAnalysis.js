import { useEffect, useState } from 'react';
import { message, request } from './api.js';
export function useGroupAnalysis(reference) {
    const [snapshot, setSnapshot] = useState();
    const key = JSON.stringify(reference);
    useEffect(() => {
        const controller = new AbortController();
        let timer;
        setSnapshot(undefined);
        if (!reference)
            return;
        async function read() {
            try {
                const value = await request('/consistency/gallery/analysis', reference, undefined, controller.signal);
                if (controller.signal.aborted)
                    return;
                setSnapshot({ key, analysis: value, error: '' });
                if (value.status === 'RUNNING' || value.status === 'PENDING' || value.status === 'NOT_ANALYZED')
                    timer = setTimeout(read, value.status === 'NOT_ANALYZED' ? 5000 : 1200);
            }
            catch (failure) {
                if (!controller.signal.aborted)
                    setSnapshot({ key, analysis: null, error: message(failure) });
            }
        }
        void read();
        return () => { controller.abort(); clearTimeout(timer); };
    }, [key]);
    return snapshot?.key === key ? snapshot : { analysis: null, error: '' };
}
