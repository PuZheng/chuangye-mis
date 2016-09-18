import request from '../request';
import R from 'ramda';
import { notEmpty } from '../checkers';
import validateObj from '../validate-obj';

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
    return request.get('/invoice-type/list?' + R.toPairs(qo).map(it => it.join('=')).join('&'))
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
      obj => !!obj.id,
      R.always(request.put('/invoice-type/object/' + obj.id, obj)),
      R.always(request.post('/invoice-type/object', obj))
    )(obj)
    .then(function (resp) {
      return resp.data;
    });
  }
};
