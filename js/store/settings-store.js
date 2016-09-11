import request from '../request';

export default {
  get list() {
    return request.get('/settings/list')
    .then(function (res) {
      return res.data.data; 
    });
  },
  update(group, name, value) {
    return request.put(`/settings/${group}/${name}`, { value });
  },
};
