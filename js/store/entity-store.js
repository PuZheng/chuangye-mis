import request from '../request';
import R from 'ramda';
import object2qs from '../utils/object2qs';

export default {
  get list() {
    return request.get('/entity/list')
    .then(R.path(['data', 'data']));
  },
  getHints(kw, qo) {
    return request.get('/entity/hints/' + kw + '?' + object2qs(qo))
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
