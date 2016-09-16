import request from '../request';

export default {
  get list() {
    return request.get('/account-term/list')
    .then(function (response) {
      return response.data.data;
    });
  },
  save(at) {
    return request.post('/account-term/object', { name: at })
    .then(function (resp) {
      return resp.data.id;
    });
  },
};
