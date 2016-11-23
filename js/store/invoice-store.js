import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import config from '../config';
import request from '../request';
import object2qs from '../utils/object2qs';

var rules = {
  invoiceType: notEmpty('发票类型'),
  number: notEmpty('发票号码'),
  accountTermId: notEmpty('会计帐期'),
  vendorId: function (v, obj) {
    if (R.path(['invoiceType', 'vendorType'])(obj))  {
      return notEmpty('销售方')(v);
    }
  },
  purchaserId: function (v, obj) {
    if (R.path(['invoiceType', 'purchaserType'])(obj))  {
      return notEmpty('购买方')(v);
    }
  },
  amount: notEmpty(),
  taxRate: function (v, obj) {
    if (R.and(
      R.path(['invoiceType', 'storeOrderType']),
    R.path(['invoiceType', 'storeOrderDirection'])
    )(obj)) {
      return notEmpty('')(v);
    }
  }
};
var validate = R.partialRight(validateObj, [rules]);
var fetchList = function (queryObj) {
  queryObj.page = queryObj.page || 1;
  queryObj.page_size = queryObj.page_size || config.getPageSize('invoice');
  return request.get('/invoice/list?' + object2qs(queryObj))
  .then(R.prop('data'));
};

var getHints = function (text) {
  return request.get('/invoice/hints/' + text)
  .then(R.path(['data', 'data']));
};

export default {
  get(id) {
    return request.get('/invoice/object/' + id)
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      () => request.put('/invoice/object/' + obj.id, obj),
      () => request.post('/invoice/object', obj)
    )(obj)
    .then(R.prop('data'));
  },
  authenticate(id) {
    return request.put('/invoice/object/' + id, { authenticated: true });
  },
  del(id) {
    return request.delete('/invoice/object/' + id);
  },
  fetchList,
  validate,
  getHints,
};
