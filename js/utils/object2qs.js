import R from 'ramda';

var object2qs = function (qo) {
  return R.toPairs(qo).map(function (pair) {
    return pair.join('=');
  }).join('&');
};

export default object2qs;
