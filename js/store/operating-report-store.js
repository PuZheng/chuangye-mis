import request from '../request';
import R from 'ramda';

export default {
  getByAccountTermId(accountTermId) {
    return request.get('/operating-report/object?account_term_id=' +
                       accountTermId)
    .then(R.prop('data'))
    .catch(function (e) {
      if (R.path(['response', 'status'])(e) == 404) {
        return void 0;
      }
      throw e;
    });
  }
};
