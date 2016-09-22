import R from 'ramda';
import { validateObj } from '../validate-obj';
import { notEmpty } from '../checkers';
import config from '../config';
import request from '../request';

var rules = {
  voucherTypeId: notEmpty('凭证类型'),
  voucherSubjectId: notEmpty('项目'),
  date: notEmpty(),
  number: notEmpty(),
  payerId: notEmpty(),
  recipientId: notEmpty(),
};

export var validate = R.partialRight(validateObj, [rules]);

export default {
  validate,
  save: function (data) {
    return request.post('/voucher/object', data)
    .then(R.path(['data', 'id']));
  },
  get: function (id) {
    return request.get('/voucher/object/' + id)
    .then(R.prop('data'));
  },
  fetchList: function (queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('voucher');
    return request.get('/voucher/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&'))
    .then(R.prop('data'));
  },
  getHints(text) {
    return request.get('/voucher/hints/' + text)
    .then(R.path(['data', 'data']));
  }
};
