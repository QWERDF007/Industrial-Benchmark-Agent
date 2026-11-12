import { useEffect, useState } from 'react';
export function useJobClock(running) {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        if (!running)
            return;
        setNow(Date.now());
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [running]);
    return now;
}
