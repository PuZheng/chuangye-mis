import $$ from './xx';
import page from 'page';
import R from 'ramda';

var $$queryObj = $$({}, 'query-obj');
$$queryObj.change(function (queryObj) {
  page(location.pathname + '?' + 
       R.toPairs(queryObj).map(p => p.join('=')).join('&'));
});

export default $$queryObj;
