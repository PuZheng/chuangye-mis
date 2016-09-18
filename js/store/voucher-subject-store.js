import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/voucher-subject/list')
    .then(function (response) {
      return response.data.data; 
    });
  },
  fetchList(qo) {
    qo = R.toPairs(qo).map(R.join('=')).join('&');
    return request.get('/voucher-subject/list?' + qo)
    .then(function (response) {
      return response.data.data; 
    });
  },
  getHints(kw) {
    return request.get('/voucher-subject/hints/' + kw)
    .then(function (resp) {
      return resp.data.data;
    });
  },
};
