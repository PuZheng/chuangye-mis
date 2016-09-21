import request from '../request';
import R from 'ramda';
import validateObj from '../validate-obj';
import { notEmpty } from '../checkers';

export default {
  get(id) {
    return request.get('/user/object/' + id)
    .then(R.prop('data'));
  },
  validate: R.partialRight(validateObj, [{
    username: notEmpty(),
    password: notEmpty(),
    role: notEmpty(),
    passwordAg: function (passwordAg) {
      if (this.password != passwordAg) {
        throw new Error('密码不匹配');
      }
    },
  }]),
  get list() {
    return request.get('/user/list')
    .then(R.path(['data', 'data']));
  },
  save(obj) {
    return function (obj) {
      if (obj.id) {
        return request.put('/user/object/' + obj.id, obj);
      } else {
        return request.post('/user/object', obj);
      }
    }(obj)
    .then(R.prop('data'));
  }
};
