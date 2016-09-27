import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import config from '../config';

export default {
  fetchList(qo) {
    qo.page = qo.page || 1;
    qo.page_size = qo.page_size || config.getPageSize('store-order');
    return request.get('/store-order/list?' + object2qs(qo))
    .then(R.prop('data'));
  }
};
