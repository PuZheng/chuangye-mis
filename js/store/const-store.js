import request from '../request';
import R from 'ramda';

let _const = {};
export default {
  get get() {
    if (!R.isEmpty(_const)) {
      return Promise.resolve(_const);
    }
    return request.get('/const')
    .then(function (res) {
      _const = res.data;
      return _const;
    });
  }
};
