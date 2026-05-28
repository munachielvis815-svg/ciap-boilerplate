const Module = require('node:module');
const path = require('node:path');

const originalResolveFilename = Module._resolveFilename;
const sharedPrefix = '@shared/';
const sharedBasePath = path.join(__dirname, 'dist', 'shared');

Module._resolveFilename = function patchedResolveFilename(
  request,
  parent,
  isMain,
  options,
) {
  if (typeof request === 'string' && request.startsWith(sharedPrefix)) {
    const relativePath = request.slice(sharedPrefix.length);
    const mappedRequest = path.join(sharedBasePath, relativePath);

    return originalResolveFilename.call(
      this,
      mappedRequest,
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
