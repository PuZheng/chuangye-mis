import R from 'ramda';
import request from '../request';

export default {
  save(obj) {
    return request.post('/meter-reading/object', obj)
    .then(R.prop('data'));
  }
};
