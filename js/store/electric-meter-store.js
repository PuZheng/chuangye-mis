import request from '../request';
import R from 'ramda';
import validateObj from 'validate-obj';
import { notEmpty } from 'checkers';

var validate = function (obj) {
  return validateObj(obj, {
    name: notEmpty(),
    status: notEmpty(),
    times: notEmpty(),
    parentElectricMeterId: !obj.isTotal && notEmpty(),
    departmentId: !obj.isTotal && notEmpty() ,
  });
};

export default {
  getHints(text) {
    return request.get('/electric-meter/hints/' + text)
    .then(function (res) {
      return res.data.data;
    });
  },
  fetchList(qo) {
    return request.get('/electric-meter/list?' + R.toPairs(qo).map(p => p.join('=')).join('&'))
    .then(function (res) {
      return res.data;
    });
  },
  get statusList() {
    return request.get('/electric-meter/status-list')
    .then(function (res) {
      return res.data.data;
    });
  },
  save(obj) {
    if (!obj.id) {
      return request.post('/electric-meter/object/', obj);
    }
  },
  validate,
};
