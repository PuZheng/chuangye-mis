import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';

var rules = {
  username: notEmpty(),
  password: notEmpty()
};

var validate = function (obj) {
  return validateObj(obj, rules);
};

var login = function ({ username, password }) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve();
    }, 1000);
  });
};

export default {
  validate,
  login,
};
