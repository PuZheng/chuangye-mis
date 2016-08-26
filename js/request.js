import accountStore from './store/account-store';
import { backendURL } from './backend-url.js';

var setAuthorization = function (options) {
  if (accountStore.user) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.Authorization = 'Bearer ' + accountStore.user.token;
  }
  return options;
};

var request = new Proxy(axios,  {
  get: function (target, name) {
    return function (...args) {
      switch (name) {
        case 'get': {
          let [url, options={}] = args;
          return target.get(
            backendURL(url), 
            setAuthorization(options));
        }
        case 'post':
        case 'put': {
          let [url, data={}, options={}] = args;
          return target[name].apply(target,
            [
              backendURL(url), 
              data,
              setAuthorization(options)
            ]);
        }
      }
    };
  }
});

export default request;
