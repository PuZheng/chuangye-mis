import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';

export default {
  fetchList(qo) {
    return request.get('/payment-record/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
};
