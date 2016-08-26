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
    .then(function (res) {
      return res.data.data;
    });
  },
  fetchList(queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('tenant');
    return request.get('/tenant/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&'))
    .then(function (res) {
      return res.data;
    });
  },
  get(id) {
    return request.get('/tenant/object/' + id)
    .then(function (res) {
      return res.data;
    });
  },
  save(obj, id) {
    return (function () {
      if (id) {
        return request.put('/tenant/object/' + id, obj);
      } else {
        return request.post('/tenant/object', obj);
      }
    })()
    .then(function (res) {
      return res.data;
    });
  }
};
