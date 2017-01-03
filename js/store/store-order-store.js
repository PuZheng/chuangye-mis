import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import config from '../config';
import { notEmpty } from '../checkers';
import validateObj from '../validate-obj';
import constStore from 'store/const-store';
import accountTermStore from 'store/account-term-store';
import moment from 'moment';

var validate = function (obj) {
  return Promise.all([
    constStore.get(),
    accountTermStore.list,
  ])
  .then(function (
    [
      { STORE_SUBJECT_TYPES: { MATERIAL, PRODUCT },
        STORE_ORDER_DIRECTIONS: { INBOUND, OUTBOUND } }, accountTerms
    ]
  ) {
    return validateObj(obj, {
      number: notEmpty(),
      storeSubjectId: notEmpty(),
      direction: notEmpty(),
      quantity: notEmpty(),
      date: function (v) {
        notEmpty()(v);
        let accountTerm = R.find(
          R.propEq('name', moment(v).format('YYYY-MM'))
        )(accountTerms);
        if (!accountTerm) {
          throw new Error('账期尚未创建，请通知管理员创建账期');
        }
        if (accountTerm.closed) {
          throw new Error('账期已经关闭');
        }
      },
      unitPrice: R.path(['storeSubject', 'type'])(obj) == MATERIAL &&
        obj.direction == OUTBOUND && notEmpty(),
      supplierId: R.path(['storeSubject', 'type'])(obj) == MATERIAL &&
        obj.direction == INBOUND && notEmpty(),
      customerId: R.path(['storeSubject', 'type'])(obj) == PRODUCT &&
        obj.direction == OUTBOUND && notEmpty(),
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
  },
  getHints(text) {
    return request.get('/store-order/hints/' + text)
    .then(R.path(['data', 'data']));
  }
};
