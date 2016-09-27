import R from 'ramda';
import config from '../config';
import validateObj from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import request from '../request';
import object2qs from '../utils/object2qs';

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
  get list() {
    return request.get('/tenant/list')
    .then(R.path(['data', 'data']));
  },
  fetchList(qo={}) {
    qo.page = qo.page || 1;
    qo.page_size = qo.page_size || config.getPageSize('tenant');
    return request.get('/tenant/list?' + object2qs(qo))
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
