import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';

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
  }).then(function (response) {
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
