import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import { backendURL } from '../backend-url.js';
import config from '../config.js';
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
var fetchList = function (queryObj) {
  queryObj.page = queryObj.page || 1;
  queryObj.page_size = queryObj.page_size || config.getPageSize('invoice');
  return axios.get(backendURL('/invoice/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&')), {
    headers: {
      Authorization: 'Bearer ' + accountStore.user.token,
    },
  }).then(function (res) {
    return res.data;
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
