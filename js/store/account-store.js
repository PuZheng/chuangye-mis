import request from '../request';
import R from 'ramda';
import validateObj from '../validate-obj';
import { notEmpty } from '../checkers';

var validate = R.partialRight(validateObj, [
  {
    thisMonthIncome: notEmpty(),
    thisMonthExpense: notEmpty(),
    thisYearIncome: notEmpty(),
    thisYearExpense: notEmpty(),
    taxOffsetBalance: notEmpty()
  }
]);

export default {
  validate,
  getByTenantId(tenantId) {
    return request.get('/account/object?tenant_id=' + tenantId)
    .then(R.prop('data'))
    .catch(function (e) {
      if (R.path(['response', 'status'])(e) == 404) {
        return void 0;
      }
      throw e;
    });
  },
  save(obj) {
    return request.post('/account/object', obj).then(R.prop('data'));
  }
};
