import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import accountStore from './account-store';

var rules = {
  invoiceType: notEmpty('发票类型'),
  number: notEmpty('发票号码'),
  accountTermId: notEmpty('会计帐期'),
  vendorId: function (v) {
    if (this.invoiceType.vendorType)  {
      notEmpty('销售方')(v);
    }
  },
  purchaserId: function (v) {
    if (this.invoiceType.purchaserType)  {
      notEmpty('购买方')(v);
    }
  },
};
var validate = R.partialRight(validateObj, [rules]);
var fetchList = function () {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve([
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
        { id: 9 },
      ]);
    }, 1000);
  });
};

export default {
  get: function (id) {
    return axios.get(backendURL('/invoice/object/' + id), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data;
    });
  },
  save: function (data) {
    return axios.post(backendURL('/invoice/object'), data, {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.id;
    });
  },
  fetchList,
  validate,
};
