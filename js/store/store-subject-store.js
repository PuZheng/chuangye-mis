import request from '../request';
import R from 'ramda';
import object2qs from '../utils/object2qs.js';

export default {
  get list() {
    return this.fetchList();
  },
  fetchList(qo={}) {
    let q = object2qs(qo);
    return request.get('/store-subject/list' + (q? '?' + q: ''))
    .then(R.path(['data', 'data']));
  },
  getHints(kw) {
    return request.get('/store-subject/hints/' + kw)
    .then(R.path(['data', 'data']));
  }
};
