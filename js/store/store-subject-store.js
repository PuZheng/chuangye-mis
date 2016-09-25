import request from '../request';
import R from 'ramda';

export default {
  get list() {
    let url = '/store-subject/list';
    return request.get(url)
    .then(R.path(['data', 'data']));
  }
};
