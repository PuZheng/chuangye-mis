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
    .then(R.path(['data', 'data']));
  },
  fetchList(qo) {
    qo = R.toPairs(qo).map(R.join('=')).join('&');
    return request.get('/voucher-subject/list?' + qo)
    .then(R.path(['data', 'data']));
  },
  getHints(kw) {
    return request.get('/voucher-subject/hints/' + kw)
    .then(R.path(['data', 'data']));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      (obj) => request.put('/voucher-subject/object/' + obj.id, obj),
      (obj) => request.post('/voucher-subject/object', obj)
    )(obj)
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/voucher-subject/object/' + id)
    .then(R.prop('data'));
  }
};

