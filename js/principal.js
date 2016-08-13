import backendURL from './backend-url';
import accountStore from './store/account-store';
import request from 'superagent';
// import superagentPromisePlugin from 'superagent-promise-plugin';

export var could = function could(policy, ...args) {
  let tests = [[policy, ...args]];
  let couldIter = function couldIter(policy, ...args) {
    tests.push([policy, ...args]);
    return {
      could: couldIter,
      then,
    };
  };
  let then = function then(cb) {
    return axios.post(backendURL('/auth/could'), {
      tests,
    }, {
      headers: {
        Authorization: 'Bearer ' + accountStore.user.token,
      },
    }).then(function (response) {
      cb(...response.data.data);
    }).catch(function (error) {
      console.error(error);
    });
  };
  return {
    could: couldIter,
    then,
  };
};

export default {
  could,
};
