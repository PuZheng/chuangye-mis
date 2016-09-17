import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/invoice-type/list')
    .then(function (response) {
      return response.data.data;
    });
  },
  fetchList(qo) {
    return request.get('/invoice-type/list?' + R.toPairs(qo).map(it => it.join('=')).join('&'))
    .then(function (response) {
      return response.data.data;
    });
  },
  getHints(kw) {
    return request.get('/invoice-type/hints/' + kw)
    .then(function (resp) {
      return resp.data.data;
    });
  }
};
