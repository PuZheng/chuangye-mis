import R from 'ramda';
/**
 * validate a objedt according to given rules
 *
 * @param obj - object to be validated
 * @param {object} rules - each key of rules is a field name in obj
 * , and the corresponding value is a function (checker) that takes
 * object and the field value as argumenents, it should throw 
 * exception when validation failed. if it is not a function 
 *
 * @return - a promise, if validation fails, it is rejected with
 *  an errors object, whose keys are the failed fields, values are
 *  the reason. if validation succeeds, it is resolved with the obj
 *  to be validated
 * */
export var validateObj = function validateObj(obj, rules) {
  return new Promise(function (resolve, reject) {
    let errors = {};
    for (var [field, checker] of R.toPairs(rules)) {
      if (typeof checker === 'function') {
        try {
          checker.apply(obj, [obj[field]]);
        } catch (e) {
          errors[field] = e.message;
        }
      }
    }
    R.isEmpty(errors)? resolve(obj): reject(errors);
  });
};

export default validateObj;
