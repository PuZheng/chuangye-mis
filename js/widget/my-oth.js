import $$queryObj from '../query-obj';
import $$oth from './oth';
import R from 'ramda';

var $$myOth = function ({
  label,
  column,
}) {
  return $$oth({
    label,
    $$order: $$queryObj.trans(function (qo) {
      let [ col, order ] = (qo.sort_by || '').split('.');
      return R.ifElse(
        R.equals(column),
        R.always(order || 'asc'),
        R.always('')
      )(col);
    }),
    onchange(order) {
      $$queryObj.patch({ sort_by: column + '.' + order });
    },
  });
};
export default $$myOth;
