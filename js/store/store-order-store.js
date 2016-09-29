import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import config from '../config';
import { notEmpty } from '../checkers';
import validateObj from '../validate-obj';
import constStore from 'store/const-store';

var validate = function (obj) {
  return constStore.get()
  .then(function ({ storeOrderTypes, storeOrderDirections }) {
    let relateInvoice = (obj.type === storeOrderTypes.PRODUCT && 
                         obj.direction === storeOrderDirections.OUTBOUND) ||
                         (obj.type === storeOrderTypes.MATERIAL && 
                          obj.direction === storeOrderDirections.INBOUND);
    return validateObj(obj, {
      storeSubjectId: notEmpty(),
      direction: notEmpty(),
      type: notEmpty(),
      quantity: notEmpty(),
      unitPrice: relateInvoice && notEmpty(),
      taxRate: relateInvoice && notEmpty(),
    });
  });
};

export default {
  validate,
  fetchList(qo) {
    qo.page = qo.page || 1;
    qo.page_size = qo.page_size || config.getPageSize('store-order');
    return request.get('/store-order/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      obj => request.put('/store-order/object/' + obj.id, obj),
      obj => request.post('/store-order/object', obj)
    )(obj)
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/store-order/object/' + id).then(R.prop('data'));
  }
};
