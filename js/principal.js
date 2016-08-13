export var could = function could(policy, ...args) {
  let tests = [[policy, args]];
  let couldIter = function couldIter(policy, ...args) {
    tests.push([policy, args]);
    return {
      could: couldIter,
      then,
    };
  };
  let then = function then(cb) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(tests.map ( t => true ));
      }, 500);
    }).then(function (args) {
      cb(...args);
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
