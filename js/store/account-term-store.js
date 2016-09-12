import request from '../request';

export default {
  get list() {
    return request.get('/account-term/list')
    .then(function (response) {
      return response.data.data;
    });
  }
};
