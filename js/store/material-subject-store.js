import { backendURL } from '../backend-url.js';
import accountStore from './account-store';

export default {
  fetchList: function (opts) {
    let url = '/material-subject/list';
    if (opts.type) {
      url += '?type=' + opts.type;
    }
    return axios.get(backendURL(url), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.data;
    });
  }
};
