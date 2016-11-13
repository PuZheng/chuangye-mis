import request from '../request';
import R from 'ramda';
import object2qs from '../utils/object2qs.js';
import validateObj from '../validate-obj';
import { notEmpty } from '../checkers';

var validate = R.partialRight(validateObj, [{
  name: notEmpty(),
  acronym: notEmpty(),
  unit: notEmpty(),
}]);

export default {
  get list() {
    return this.fetchList();
  },
  get(id) {
    return request.get('/store-subject/object/' + id).then(R.prop('data'));
  },
  fetchList(qo={}) {
    let q = object2qs(qo);
    return request.get('/store-subject/list' + (q? '?' + q: ''))
    .then(R.path(['data', 'data']));
  },
  getHints(kw) {
    return request.get('/store-subject/hints/' + kw)
    .then(R.path(['data', 'data']));
  },
  validate,
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      obj => request.put('/store-subject/object/' + obj.id, obj),
      obj => request.post('/store-subject/object', obj)
    )(obj)
    .then(R.prop('data'));
  }
};
