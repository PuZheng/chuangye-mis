import request from '../request';
import R from 'ramda';
import { notEmpty } from '../checkers';
import validateObj from '../validate-obj';

export default {
  validate: R.partialRight(validateObj, [{
    name: notEmpty(),
    acronym: notEmpty(),
  }]),
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
  save(obj) {
    return request.post('/voucher-subject/object', obj)
    .then(function (resp) {
      return resp.data;
    });
  }
};

