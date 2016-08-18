import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import accountStore from './account-store';

var rules = {
  voucherTypeId: notEmpty('凭证类型'),
  voucherSubjectId: notEmpty('项目'),
  date: notEmpty(),
  number: notEmpty(),
  payerId: notEmpty(),
  recipientId: notEmpty(),
};

export var validate = R.partialRight(validateObj, [rules]);

export default {
  validate,
  save: function (data) {
    return axios.post(backendURL('/voucher/object'), data, {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.id;
    });
  },
  get: function (id) {
    return axios.get(backendURL('/voucher/object/' + id), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data;
    });
  }
};
