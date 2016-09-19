import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/user/list')
    .then(R.path(['data', 'data']));
  },
  save(obj) {
    return request.put('/user/object/' + obj.id, obj)
    .then(R.prop('data'));
  }
};
