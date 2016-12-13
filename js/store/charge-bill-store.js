import R from 'ramda';
import request from '../request';
import object2qs from '../utils/object2qs';
import casing from 'casing';

export default {
  save(obj={}) {
    return R.ifElse(
      R.prop('id'),
      function () {
        return request.put('/charge-bill/object/' + obj.id, obj);
      },
      function () {
        return request.post('/charge-bill/object', obj);
      }
    )(obj)
    .then(R.prop('data'));
  },
  fetchList(qo) {
    return request.get('/charge-bill/list?' + object2qs(casing.snakeize(qo)))
    .then(R.path(['data', 'data']));
  },
  close(id) {
    return request.post('/charge-bill/object/' + id + '/close')
    .then(R.prop('data'));
  }
};
