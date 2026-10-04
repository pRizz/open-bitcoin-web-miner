// CloudFront supplies URL-escaped query keys and values. Keep them escaped exactly once.
function canonicalRedirect(request) {
  var pairs = [];
  var query = request.querystring || {};
  Object.keys(query).forEach(function (key) {
    var entry = query[key];
    var values = entry.multiValue || [entry];
    values.forEach(function (item) {
      pairs.push(key + '=' + item.value);
    });
  });
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: {
      location: { value: canonicalOrigin + request.uri + (pairs.length ? '?' + pairs.join('&') : '') },
      // Prevent a fresh reverse migration from being trapped behind cached old redirects.
      'cache-control': { value: 'no-store' },
    },
  };
}
