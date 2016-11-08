import config from './config.js';

let { backend } = config;
if (backend.endsWith('/')) {
  backend = backend.slice(0, backend.length - 1);
}

export var backendURL = function (path) {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return backend + '/' + path;
};

export default backendURL;
