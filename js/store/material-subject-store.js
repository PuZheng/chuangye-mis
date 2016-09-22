import request from '../request';
import R from 'ramda';

export default {
  fetchList: function (opts) {
    let url = '/material-subject/list';
    if (opts.type) {
      url += '?type=' + opts.type;
    }
    return request.get(url)
    .then(R.path(['data', 'data']));
  }
};
