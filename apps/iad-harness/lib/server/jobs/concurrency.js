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
export async function runDependencies(tasks, concurrency, signal, execute) {
    const limits = typeof concurrency === 'number' ? { default: concurrency } : concurrency;
    if (!Object.keys(limits).length || Object.values(limits).some(limit => !Number.isSafeInteger(limit) || limit < 1))
        throw new RangeError('并发数量需要为正整数');
    const pools = new Map(Object.entries(limits).map(([name, limit]) => [name,
        { limit, active: 0, cursor: 0, ready: [], urgent: [] }]));
    const byId = new Map(tasks.map(task => [task.id, task]));
    if (byId.size !== tasks.length)
        throw new Error('执行任务标识重复');
    const remaining = new Map(), dependents = new Map();
    for (const task of tasks) {
        const pool = pools.get(task.resource || 'default');
        if (!pool)
            throw new Error('执行任务缺少资源配额');
        const dependencies = new Set(task.dependencies);
        remaining.set(task.id, dependencies.size);
        if (!dependencies.size)
            (task.priority ? pool.urgent : pool.ready).push(task);
        for (const dependency of dependencies) {
            if (!byId.has(dependency))
                throw new Error('执行任务缺少依赖');
            const ids = dependents.get(dependency) || [];
            ids.push(task.id);
            dependents.set(dependency, ids);
        }
    }
    let active = 0, completed = 0, failure;
    await new Promise((resolve, reject) => {
        function schedule() {
            for (const pool of pools.values()) {
                while (!signal.aborted && !failure && pool.active < pool.limit && (pool.urgent.length || pool.cursor < pool.ready.length)) {
                    const task = pool.urgent.shift() || pool.ready[pool.cursor++];
                    pool.active++;
                    active++;
                    void execute(task.value).then(() => {
                        completed++;
                        for (const id of dependents.get(task.id) || []) {
                            const count = remaining.get(id) - 1;
                            remaining.set(id, count);
                            if (!count) {
                                const next = byId.get(id), target = pools.get(next.resource || 'default');
                                (next.priority ? target.urgent : target.ready).push(next);
                            }
                        }
                    }, error => { failure = error; }).finally(() => { pool.active--; active--; schedule(); });
                }
            }
            if (!active) {
                if (failure)
                    reject(failure);
                else if (signal.aborted || completed === tasks.length)
                    resolve();
                else
                    reject(new Error('执行任务依赖存在循环'));
            }
        }
        schedule();
    });
}
