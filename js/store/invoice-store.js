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

export default {
  get: id => new Promise(function (resolve, reject) {
    setTimeout(function () {
      // resolve(invoice);
    }, 500);
  }),
  save: function (data) {
    console.log(JSON.stringify(data, null, 4));
    return axios.post(backendURL('/invoice/object'), data, {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.id;
    });
  },
  validate,
};
