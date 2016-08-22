import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import accountStore from './account-store';
import config from '../config.js';

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
  },
  fetchList: function (queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('voucher');
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({
          data: R.repeat({
          id: 1,
          number: '123',
          date: '2016-07-30',
          voucherTypeId: 1,
          voucherType: {
            id: 1,
            name: '现金',
          },
          voucherSubjectId: 1,
          voucherSubject: {
            id: 1,
            name: '项目1',
          },
          isPublic: true,
          payerId: 1,
          payer: {
            id: 1,
            name: '客户1',
          },
          recipientId: 1,
          recipient: {
            id: 1,
            name: '租户1',
          },
          notes: '123',
          creatorId: 1,
          creator: {
            id: 1,
            name: '张三',
          },
          }, 16),
          totalCnt: 100,
        });
      }, 300);
    });
    // return axios.get(backendURL('/voucher/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&')), {
    //   headers: {
    //     Authorization: 'Bearer ' + accountStore.user.token,
    //   },
    // }).then(function (res) {
    //   return res.data;
    // });
  },
  getHints(text) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve([ text + 'abc', text + 'eft' ]);
      }, 300);
    });
  }
};
