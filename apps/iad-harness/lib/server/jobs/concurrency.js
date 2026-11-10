export async function runConcurrent(items, concurrency, signal, execute) {
    if (!Number.isSafeInteger(concurrency) || concurrency < 1)
        throw new RangeError('并发数量需要为正整数');
    let cursor = 0;
    const outcomes = await Promise.allSettled(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (!signal.aborted && cursor < items.length)
            await execute(items[cursor++]);
    }));
    const failure = outcomes.find(outcome => outcome.status === 'rejected');
    if (failure?.status === 'rejected')
        throw failure.reason;
}
