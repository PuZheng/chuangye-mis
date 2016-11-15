import { $$searchDropdown } from '../widget/search-dropdown';
import $$ from 'slot';
import { $$voucher, $$voucherSubjects, $$loading, $$selectedVoucherSubject, $$payers, $$recipients } from './data-slots.js';
import R from 'ramda';
import entityStore from '../store/entity-store.js';


export var $$voucherSubjectDropdown = $$searchDropdown({
  defaultText: '请选择凭证科目',
  $$value: $$.connect([$$voucher], function ([o]) {
    return o.voucherSubjectId;
  }),
  $$options: $$.connect([$$voucherSubjects], function ([l]) {
    return l.map(vs => (
      {
        value: vs.id,
        text: vs.name,
        acronym: vs.acronym,
      }
    ));
  }),
  onchange(value) {
    onVoucherSubjectChange(value);
  },
});

export var onVoucherSubjectChange = function (value) {
  value = parseInt(value);
  var voucherSubject = R.find(R.propEq('id', value))($$voucherSubjects.val());
  $$.update(
    [$$loading, true],
    [$$selectedVoucherSubject, voucherSubject],
    [$$voucher, Object.assign($$voucher.val(), {
      isPublic: voucherSubject.isPublic,
      voucherSubjectId: voucherSubject.id,
      voucherSubject,
    })]
  );
  $$loading.val(true);
  Promise.all([
    entityStore.fetchList({
      type: voucherSubject.payerType,
    }),
    entityStore.fetchList({
      type: voucherSubject.recipientType,
    }),
  ]).then(function ([payers, recipients]) {
    $$.update(
      [$$loading, false],
      [$$payers, payers],
      [$$recipients, recipients]
    );
  });
};
