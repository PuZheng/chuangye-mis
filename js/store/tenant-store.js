import R from 'ramda';
import config from '../config';
import validateObj from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import request from '../request';

var rules = {
  'entity': function (entity) {
    notEmpty(entity.name);
    notEmpty(entity.acronym);
  },
  'departmentId': notEmpty(),
};

var validate = function (obj) {
  return validateObj(obj, rules);
};

export default {
  validate,
  getHints(text) {
    return request.get('/tenant/hints/' + text)
    .then(R.path(['data', 'data']));
  },
  fetchList(queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('tenant');
    return request.get('/tenant/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&'))
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/tenant/object/' + id)
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      (obj) => request.put('/tenant/object/' + obj.id, obj),
      (obj) => request.post('/tenant/object', obj)
    )(obj)
    .then(R.prop('data'));
  }
};
