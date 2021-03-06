import request from '../request';
import R from 'ramda';
import { notEmpty } from '../checkers';
import validateObj from '../validate-obj';
import object2qs from '../utils/object2qs';

var validate = R.partialRight(validateObj, [{
  name: notEmpty(),
}]);

export default {
  validate,
  get list() {
    return request.get('/invoice-type/list')
    .then(function (response) {
      return response.data.data;
    });
  },
  get(id) {
    return request.get('/invoice-type/object/' + id)
    .then(function (resp) {
      return resp.data;
    });
  },
  fetchList(qo) {
    return request.get('/invoice-type/list?' + object2qs(qo))
    .then(function (response) {
      return response.data.data;
    });
  },
  getHints(kw) {
    return request.get('/invoice-type/hints/' + kw)
    .then(function (resp) {
      return resp.data.data;
    });
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      () => request.put('/invoice-type/object/' + obj.id, obj),
      () => request.post('/invoice-type/object', obj)
    )(obj)
    .then(function (resp) {
      return resp.data;
    });
  }
};
