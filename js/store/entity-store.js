import request from '../request';
import R from 'ramda';

export default {
  fetchList: function (opts={}) {
    var url = '/entity/list';
    if (opts.type) {
      url += '?type=' + opts.type;
    }
    return request.get(url).then(R.path(['data', 'data']));
  }
};
