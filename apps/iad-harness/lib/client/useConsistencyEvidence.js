import { useEffect, useState } from 'react';
import { message, request } from './api.js';
export function useConsistencyEvidence(evidenceId) {
    const [loaded, setLoaded] = useState(null), [error, setError] = useState('');
    const bundle = loaded?.result.evidence_id === evidenceId ? loaded : null;
    useEffect(() => {
        const controller = new AbortController();
        setLoaded(null);
        setError('');
        if (evidenceId)
            request(`/consistency/evidence/${encodeURIComponent(evidenceId)}`, undefined, undefined, controller.signal)
                .then(value => { if (!controller.signal.aborted)
                setLoaded(value); })
                .catch(failure => { if (!controller.signal.aborted)
                setError(message(failure)); });
        return () => controller.abort();
    }, [evidenceId]);
    return { bundle, error };
}
