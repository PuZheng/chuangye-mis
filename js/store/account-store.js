import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';

var rules = {
  username: notEmpty(),
  password: notEmpty()
};

var validate = function (obj) {
  return validateObj(obj, rules);
};

var login = function ({ username, password }) {
    return axios.post(backendURL('/auth/login'), {
      username, password
    })
    .catch(function (error) {
      if (!error.response || error.response.status == 500) {
        overlay.$$content.val({
          type: 'error',
          title: '很不幸, 出错了!',
          message: axiosError2Dom(error),
        });
      }
      throw error;
    })
    .then(function (response) {
      sessionStorage.setItem('user', JSON.stringify(response.data));
    });
};

var logout = function () {
  return Promise.resolve(sessionStorage.removeItem('user'));
};

export default {
  validate,
  login,
  get user() {
    return JSON.parse(sessionStorage.getItem('user'));
  },
  logout,
};
