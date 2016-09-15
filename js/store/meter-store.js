import request from '../request';
import R from 'ramda';
import validateObj from 'validate-obj';
import { notEmpty } from 'checkers';

var validate = function (obj) {
  return validateObj(obj, {
    name: notEmpty(),
    status: notEmpty(),
    times: notEmpty(),
    parentMeterId: !obj.isTotal && notEmpty(),
    departmentId: !obj.isTotal && notEmpty(),
    type: notEmpty(),
  });
};

export default {
  getHints(text) {
    return request.get('/meter/hints/' + text)
    .then(function (res) {
      return res.data.data;
    });
  },
  fetchList(qo) {
    return request.get('/meter/list?' + R.toPairs(qo).map(p => p.join('=')).join('&'))
    .then(function (res) {
      return res.data;
    });
  },
  save(obj) {
    if (!obj.id) {
      return request.post('/meter/object', obj)
      .then(function (res) {
        return res.data.id;
      });
    } else {
      return request.put('/meter/object/' + obj.id, obj)
      .then(function () {
        return obj.id;
      });
    }
  },
  get(id) {
    return request.get('/meter/object/' + id)
    .then(function (res) {
      return res.data;
    });
  },
  validate,
};
