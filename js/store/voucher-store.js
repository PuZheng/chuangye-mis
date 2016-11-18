import R from 'ramda';
import { validateObj } from '../validate-obj';
import { notEmpty } from '../checkers';
import config from '../config';
import request from '../request';
import object2qs from '../utils/object2qs';

export var validate = R.partialRight(validateObj, [{
  voucherTypeId: notEmpty('凭证类型'),
  voucherSubjectId: notEmpty('项目'),
  date: notEmpty(),
  number: notEmpty(),
  payerId: notEmpty(),
  recipientId: notEmpty(),
}]);

export default {
  validate,
  save: function (obj) {
    console.log(obj);
    return R.ifElse(
      R.prop('id'),
      () => request.put('/voucher/object/' + obj.id, obj),
      () => request.post('/voucher/object', obj)
    )(obj)
    .then(R.prop('data'));
  },
  get: function (id) {
    return request.get('/voucher/object/' + id)
    .then(R.prop('data'));
  },
  fetchList: function (queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('voucher');
    return request.get('/voucher/list?' + object2qs(queryObj))
    .then(R.prop('data'));
  },
  getHints(text) {
    return request.get('/voucher/hints/' + text)
    .then(R.path(['data', 'data']));
  }
};
