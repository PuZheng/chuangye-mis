import request from './request';

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
    return request.post('/auth/could', {
      tests,
    })
    .then(function (response) {
      cb(...response.data.data);
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
