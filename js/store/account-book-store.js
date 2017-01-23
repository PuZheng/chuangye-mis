import request from '../request';
import R from 'ramda';
import object2qs from '../utils/object2qs';

export default {
  get(tenantId, accountTermId) {
    return request
    .get('/account-book/object?' +
         object2qs({ tenant_id: tenantId, account_term_id: accountTermId })
    )
    .then(R.prop('data'))
    .catch(function (e) {
      if (R.path(['response', 'status'])(e) == 404) {
        return void 0;
      }
      throw e;
    });
  }
};
