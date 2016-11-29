import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/account-term/list')
    .then(R.path(['data', 'data']));
  },
  save(at) {
    return request.post('/account-term/object', { name: at })
    .then(R.path(['data', 'id']));
  },
  get(id) {
    return request.get('/account-term/object/' + id)
    .then(R.prop('data'));
  },
  close(id) {
    return request.post('/account-term/object/' + id + '/close')
    .then(R.prop('data'));
  }
};
