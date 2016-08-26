import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import request from '../request';

var rules = {
  name: notEmpty()
};

var validate = R.partialRight(validateObj, [rules]);

export default {
  validate,
  get list() {
    return request.get('/department/list')
    .then(function (res) {
      return res.data.data; 
    });
  },
  save(obj) {
    return request.post('/department/object', obj)
    .then(function (res) {
      return res.data.id;
    });
  }
};
