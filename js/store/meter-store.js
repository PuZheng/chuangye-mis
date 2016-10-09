import request from '../request';
import R from 'ramda';
import validateObj from 'validate-obj';
import { notEmpty } from 'checkers';
import object2qs from '../utils/object2qs';

var validate = function (obj) {
  return validateObj(obj, {
    name: notEmpty(),
    status: notEmpty(),
    times: notEmpty(),
    parentMeterId: !obj.isTotal && notEmpty(),
    departmentId: !obj.isTotal && notEmpty(),
    meterTypeId: notEmpty(),
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
    return request.get('/meter/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  save(obj) {
    if (!obj.id) {
      return request.post('/meter/object', obj)
      .then(R.path(['data', 'id']));
    } else {
      return request.put('/meter/object/' + obj.id, obj)
      .then(R.prop('id'));
    }
  },
  get(id) {
    return request.get('/meter/object/' + id)
    .then(R.prop('data'));
  },
  validate,
};
