import request from '../request';
import R from 'ramda';

export default {
  get list() {
    return request.get('/entity/list')
    .then(R.path(['data', 'data']));
  },
  fetchList: function (opts={}) {
    var url = '/entity/list';
    if (opts.type) {
      url += '?type=' + opts.type;
    }
    return request.get(url).then(R.path(['data', 'data']));
  }
};
