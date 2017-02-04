import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import validateObj from '../validate-obj.js';

let rules = {

};

let validate = function (obj) {
  return validateObj(obj, rules);
};

export default {
  validate,
  getHints(kw) {
    return request.get('/<%= 对象名称 %>/hints/' + kw)
    .then(R.path([ 'data', 'data' ]));
  },
  fetchList(qo={}) {
    return request.get('/<%= 对象名称 %>/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  get list() {
    return this.fetchList();
  },
  get(id) {
    return request.get('/<%= 对象名称 %>/object/' + id)
    .then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      function (obj) {
        return request.put('/<%= 对象名称 %>/object/' + obj.id, obj);
      },
      function (obj) {
        return request.post('/<%= 对象名称 %>/object/', obj);
      }
    )(obj).then(R.prop('data'));
  }
};
