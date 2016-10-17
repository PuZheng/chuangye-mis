import accountStore from './store/account-store';
import { backendURL } from './backend-url.js';
import overlay from './overlay';
import axiosError2Dom from './axios-error-2-dom';

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
        case 'get':
        case 'delete': {
          let [url, options={}] = args;
          return target[name].apply(
            target,
            [
              backendURL(url), 
              setAuthorization(options)
            ]
          ).catch(function (error) {
            if (!error.response || error.response.status == 500) {
              overlay.$$content.val({
                type: 'error',
                title: '很不幸, 出错了!',
                message: axiosError2Dom(error),
              });
            }
            throw error;
          });
        }
        case 'post':
        case 'put': {
          let [url, data={}, options={}] = args;
          return target[name].apply(
            target,
            [
              backendURL(url), 
              data,
              setAuthorization(options)
            ]
          ).catch(function (error) {
            if (!error.response || error.response.status == 500) {
              overlay.$$content.val({
                type: 'error',
                title: '很不幸, 出错了!',
                message: axiosError2Dom(error),
              });
            }
            throw error;

          });
        }
      }
    };
  }
});

export default request;
