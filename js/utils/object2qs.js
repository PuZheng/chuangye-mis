import R from 'ramda';

var object2qs = function (qo) {
  return R.toPairs(qo).filter(it => it[1] != void 0).map(function (pair) {
    return pair.join('=');
  }).join('&');
};

export default object2qs;
