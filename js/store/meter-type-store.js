import request from '../request';
import R from 'ramda';
import validateObj from '../validate-obj';
import { notEmpty } from '../checkers';

var validate = R.partialRight(validateObj, [{
  name: notEmpty(),
  meterReadingTypes: notEmpty(),
}]);

export default {
  validate,
  get list() {
    return request.get('/meter-type/list').then(R.path(['data', 'data']));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      obj => request.put('/meter-type/object/' + obj.id, obj),
      obj => request.post('/meter-type/object', obj)
    )(obj)
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/meter-type/object/' + id).then(R.prop('data'));
  },
  del(id) {
    return request.delete('/meter-type/object/' + id).then(R.prop('data'));
  }
};
