function handler(event) {
  var request = event.request;
  if (request.headers.host.value !== canonicalHost) return canonicalRedirect(request);
  if (request.uri !== '/' && request.uri.indexOf('.') === -1) request.uri = '/index.html';
  return request;
}
