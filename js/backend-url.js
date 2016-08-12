import { backend } from './config.json';

var myBackend = backend;
if (myBackend.endsWith('/')) {
  myBackend = myBackend.slice(0, backend.length - 1);
}

export var backendURL = function (path) {
  if (path.startsWith('/')) {
    path = path.slice(1);
  }
  return backend + '/' + path;
};
