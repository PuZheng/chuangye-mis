import $$ from 'slot';
import { $$voucher, $$voucherTypes, $$loading, $$voucherSubjects } from './data-slots.js';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { $$form } from './form.js';
import voucherTypeStore from 'store/voucher-type-store';
import voucherSubjectStore from 'store/voucher-subject-store';
import moment from 'moment';
import voucherStore from 'store/voucher-store';

const valueFunc = function ([voucher, form]) {
  return h('.object-app', [
      h('.header', voucher.id? `编辑凭证-${voucher.number}`: '创建新凭证'),
      form,
  ]);
};

const $$view = $$.connect(
  [$$voucher, $$form], 
  valueFunc, 
  'voucher-object-app');

export default {
  page: {
    $$view,
  },
  init(id) {
    $$loading.val(true);
    let promises = [
      voucherTypeStore.list,
      voucherSubjectStore.list,
      id? voucherStore.get(id): {
        date: moment().format('YYYY-MM-DD')
      }
    ];
    Promise.all(promises).then(function ([voucherTypes, voucherSubjects, voucher]) {
      $$.update(
        [$$voucherTypes, voucherTypes],
        [$$loading, false],
        [$$voucherSubjects, voucherSubjects],
        [$$voucher, voucher]
      );
    });
  }
};
