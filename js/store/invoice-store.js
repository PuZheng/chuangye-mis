import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import config from '../config.js';
import request from '../request';

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
  return request.get('/invoice/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&'))
  .then(R.prop('data'));
};

var getHints = function (text) {
  return request.get('/invoice/hints/' + text)
  .then(R.path(['data', 'data']));
};

export default {
  get: function (id) {
    return request.get('/invoice/object/' + id)
    .then(R.prop('data'));
  },
  save: function (data) {
    return request.post('/invoice/object', data)
    .then(R.path(['data', 'id']));
  },
  fetchList,
  validate,
  getHints,
};
