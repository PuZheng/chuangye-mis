import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import accountStore from './account-store';

var rules = {
  name: notEmpty()
};

var validate = R.partialRight(validateObj, [rules]);

export default {
  validate,
  get list() {
    return axios.get(backendURL('/department/list'), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    })
    .then(function (res) {
      return res.data.data; 
    });
  },
  save(obj) {
    return axios.post(backendURL('/department/object'), obj, {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (res) {
      return res.data.id;
    });
  }
};
