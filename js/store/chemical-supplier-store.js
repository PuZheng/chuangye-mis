import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import validateObj from '../validate-obj.js';
import { notEmpty } from '../checkers';

let rules = {
  entity: {
    name: notEmpty(),
    acronym: notEmpty(),
  },
  contact: notEmpty()
};

let validate = function (obj) {
  return validateObj(obj, rules);
};

export default {
  validate,
  getHints(kw) {
    return request.get('/chemical-supplier/hints/' + kw)
    .then(R.path([ 'data', 'data' ]));
  },
  fetchList(qo) {
    return request.get('/chemical-supplier/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/chemical-supplier/object/' + id)
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      function (obj) {
        return request.put('/chemical-supplier/object/' + obj.id, obj);
      },
      function (obj) {
        return request.post('/chemical-supplier/object', obj);
      }
    )(obj).then(R.prop('data'));
  }
};
