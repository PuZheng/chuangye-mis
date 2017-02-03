import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';

export default {
  getHints(kw) {
    return request.get('/chemical-supplier/hints/' + kw)
    .then(R.path([ 'data', 'data' ]));
  },
  fetchList(qo) {
    return request.get('/chemical-supplier/list?' + object2qs(qo))
    .then(R.prop('data'));
  }
};
