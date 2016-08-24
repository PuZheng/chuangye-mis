import R from 'ramda';
import { backendURL } from '../backend-url.js';
import accountStore from './account-store';
import config from '../config';

export default {
  getHints(text) {
    return axios.get(backendURL('/tenant/hints/' + text), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (res) {
      return res.data.data;
    });
  },
  fetchList(queryObj) {
    queryObj.page = queryObj.page || 1;
    queryObj.page_size = queryObj.page_size || config.getPageSize('tenant');
    return axios.get(backendURL('/tenant/list?' + R.toPairs(queryObj).map(p => p.join('=')).join('&')), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (res) {
      return res.data;
    });
  }
};
