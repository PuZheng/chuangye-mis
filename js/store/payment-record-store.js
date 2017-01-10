import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import constStore from './const-store';

export default {
  fetchList(qo) {
    return request.get('/payment-record/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  reject(id) {
    return constStore.get()
    .then(function ({ PAYMENT_RECORD_ACTIONS: { REJECT } }) {
      return request.post(`/payment-record/object/${id}/${REJECT}`)
      .then(R.prop('data'));
    });
  },
  pass(id) {
    return constStore.get()
    .then(function ({ PAYMENT_RECORD_ACTIONS: { PASS } }) {
      return request.post(`/payment-record/object/${id}/${PASS}`)
      .then(R.prop('data'));
    });
  }
};
