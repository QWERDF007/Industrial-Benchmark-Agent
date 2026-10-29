export function observationMatrix(scope, observe) {
  return Object.fromEntries(scope.sources.map(source => [source.source_key,
    Object.fromEntries(scope.checks.map(check => [check.check_key, observe(source, check)]))]));
}
