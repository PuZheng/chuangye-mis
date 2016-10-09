import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/meter-type/list').then(R.path(['data', 'data']));
  }
};
