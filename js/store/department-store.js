import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';
import request from '../request';
import object2qs from '../utils/object2qs.js';

var rules = {
  name: notEmpty(),
  plant_id: notEmpty(),
};

var validate = R.partialRight(validateObj, [rules]);

export default {
  validate,
  getHints(kw) {
    return request.get('/department/hints/' + kw)
    .then(R.path(['data', 'data']));
  },
  get(id) {
    return request.get('/department/object/' + id).then(R.prop('data'));
  },
  fetchList(qo={}) {
    return request.get('/department/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  get list() {
    return this.fetchList();
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      obj => request.put('/department/object/' + obj.id, obj),
      obj => request.post('/department/object', obj)
    )(obj)
    .then(R.prop('data'));
  }
};
