import request from '../request';
import R from 'ramda';

export default {
  get(departmentId, accountTermId) {
    return request.get(
      /* eslint-disable max-len */
      `department-charge-bill/object?department_id=${departmentId}&account_term_id=${accountTermId}`
      /* eslint-enable max-len */
    )
    .then(R.prop('data'))
    .then(function (obj) {
      // let sheet = obj.def.sheets[0];
      // sheet.grid = sheet.grid.slice(0, 18);
      return obj;
    })
    .catch(function (e) {
      if (R.path(['response', 'status'])(e) == 404) {
        return void 0;
      }
      throw e;
    });
  }
};
