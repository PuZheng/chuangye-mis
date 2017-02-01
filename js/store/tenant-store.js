import R from 'ramda';
import config from '../config';
import validateObj from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import request from '../request';
import object2qs from '../utils/object2qs';

var rules = {
  entity: {
    name: notEmpty(),
    acronym: notEmpty(),
  },
  account: {
    thisMonthIncome: notEmpty(),
    thisMonthExpense: notEmpty(),
    income: notEmpty(),
    expense: notEmpty(),
  }
};

var validateCreation = function (obj) {
  return validateObj(obj, rules);
};

var validateUpdate = function (obj) {
  return validateObj(obj, {
    entity: {
      name: notEmpty(),
      acronym: notEmpty(),
    },
  });
};

export default {
  validateUpdate,
  validateCreation,
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
  },
  补足抵税(id) {
    return request.post('/tenant/object/' + id + '/补足抵税')
    .then(R.prop('data'));
  }
};
