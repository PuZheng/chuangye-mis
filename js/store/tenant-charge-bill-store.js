import request from '../request';
import R from 'ramda';

export default {
  get(tenantId, accountTermId) {
    return request.get(
      /* eslint-disable max-len */
      `tenant-charge-bill/object?tenant_id=${tenantId}&account_term_id=${accountTermId}`
      /* eslint-enable max-len */
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
