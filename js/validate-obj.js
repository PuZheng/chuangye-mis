import R from 'ramda';
export var validateObj = function validateObj(obj, rules) {
  return new Promise(function (resolve, reject) {
    let errors = {};
    for (var [field, checker] of R.toPairs(rules)) {
      try {
        checker.apply(obj, [obj[field]]);
      } catch (e) {
        errors[field] = e.message;
      }
    }
    R.isEmpty(errors)? resolve(obj): reject(errors);
  });
};

export default validateObj;
