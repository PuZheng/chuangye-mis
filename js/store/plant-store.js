import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import validateObj from '../validate-obj';
import { notEmpty } from '../checkers.js';

let rules = {
  name: notEmpty(),
  area: notEmpty(),
};

let validate = function (obj) {
  return validateObj(obj, rules);
};

export default {
  validate,
  getHints(kw) {
    return request.get('/plant/hints/' + kw)
    .then(R.path([ 'data', 'data' ]));
  },
  fetchList(qo={}) {
    return request.get('/plant/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  get list() {
    return this.fetchList();
  },
  get(id) {
    return request.get('/plant/object/' + id)
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      function (obj) {
        return request.put('/plant/object/' + obj.id, obj);
      },
      function (obj) {
        return request.post('/plant/object', obj);
      }
    )(obj).then(R.prop('data'));
  }
};
