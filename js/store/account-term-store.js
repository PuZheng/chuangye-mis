import backendURL from '../backend-url';
import accountStore from './account-store';

export default {
  get list() {
    return axios.get(backendURL('/account-term/list'), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.data;
    });
  }
};
