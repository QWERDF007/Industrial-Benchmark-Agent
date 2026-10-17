// Node 20 LTS compatibility polyfills for Set methods and Promise.withResolvers
if (!Set.prototype.union) {
  Set.prototype.union = function(other) {
    const result = new Set(this);
    for (const elem of other) result.add(elem);
    return result;
  };
}
if (!Set.prototype.intersection) {
  Set.prototype.intersection = function(other) {
    const result = new Set();
    for (const elem of other) {
      if (this.has(elem)) result.add(elem);
    }
    return result;
  };
}
if (!Set.prototype.difference) {
  Set.prototype.difference = function(other) {
    const result = new Set(this);
    for (const elem of other) result.delete(elem);
    return result;
  };
}
if (!Promise.withResolvers) {
  Promise.withResolvers = function() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
if (!Object.groupBy) {
  Object.groupBy = function(items, callbackFn) {
    const obj = Object.create(null);
    let i = 0;
    for (const item of items) {
      const key = callbackFn(item, i++);
      if (key in obj) {
        obj[key].push(item);
      } else {
        obj[key] = [item];
      }
    }
    return obj;
  };
}
