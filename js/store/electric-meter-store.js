import request from '../request';
import R from 'ramda';

export default {
  getHints(text) {
    return request.get('/electric-meter/hints/' + text)
    .then(function (res) {
      return res.data.data;
    });
  },
  fetchList(qo) {
    return request.get('/electric-meter/list?' + R.toPairs(qo).map(p => p.join('=')).join('&'))
    .then(function (res) {
      return res.data;
    });
  }
};
