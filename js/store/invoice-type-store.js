import backendURL from '../backend-url';
import accountStore from './account-store';

export default {
  get list() {
    return axios.get(backendURL('/invoice-type/list'), {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      return response.data.data;
    }).catch(function (e) {
      console.error(e);
    });
  }
};
