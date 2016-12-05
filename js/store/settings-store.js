import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/settings/list')
    .then(R.path(['data', 'data']));
  },
  update(group, name, value) {
    return request.put(`/settings/${group}/${name}`, { value })
    .then(R.prop('data'));
  },
};
