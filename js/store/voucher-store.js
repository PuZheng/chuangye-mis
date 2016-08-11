import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';

var rules = {
  voucherTypeId: notEmpty('凭证类型'),
  voucherSubjectId: notEmpty('项目'),
  number: notEmpty(),
  payerId: notEmpty(),
  recipientId: notEmpty(),
};

export var validate = R.partialRight(validateObj, [rules]);

var voucher = {
  id: 1,
  number: 1,
  voucherTypeId: 1,
  date: '2016-07-09',
  voucherSubjectId: 1,
  isPublic: true,
  payerId: 4,
  recipientId: 1,
  comment: 'blahblahblahblah',
};
export default {
  validate,
  save: function (data) {
    console.log(data);
    voucher = data;
    voucher.id = 1;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(voucher.id);
      }, 500);
    });
  },
  get: function (id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(voucher);
      }, 500);
    });
  }
};
