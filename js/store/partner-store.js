import request from '../request';
import object2qs from '../utils/object2qs';
import R from 'ramda';
import config from '../config';

var validate = function (obj) {
  return new Promise(function (resolve, reject) {
    let errors = {};
    if (!obj.entity.name) {
      errors['entity.name'] = '名称不能为空';
    }
    if (!obj.entity.acronym) {
      errors['entity.acronym'] = '缩写不能为空';
    }
    if (!obj.entity.type) {
      errors['entity.type'] = '类型不能为空';
    }
    if (R.isEmpty(errors)) {
      resolve(obj);
    } else {
      reject(errors);
    }
  });
};

export default {
  validate,
  fetchList(qo) {
    qo.page = qo.page || 1;
    qo.page_size = qo.page_size || config.getPageSize('invoice');
    return request.get('/partner/list?' + object2qs(qo))
    .then(R.prop('data'));
  },
  get(id) {
    return request.get('/partner/object/' + id).then(R.prop('data'));
  },
  save(obj) {
    return R.ifElse(
      R.prop('id'),
      obj => request.put('/partner/object/' + obj.id, obj),
      obj => request.post('/partner/object', obj)
    )(obj)
    .then(R.prop('data'));
  }
};
