import { searchDropdown } from '../dropdown.js';
import $$ from '../xx.js';
import { $$voucher, $$voucherSubjects, $$loading, $$selectedVoucherSubject, $$payers, $$recipients } from './data-slots.js';
import { match, optionContent } from '../dropdown-utils.js';
import R from 'ramda';
import entityStore from '../store/entity-store.js';

var $$activated = $$(false, 'activated');
var $$searchText = $$('', 'search-text');

var valueFunc = function (activated, searchText, voucherSubjects, voucher) {
  return searchDropdown({
    defaultText: '请选择凭证项目',
    searchText,
    options: voucherSubjects.map( vs => (
      {
        value: vs.id,
        text: vs.name,
        acronym: vs.acronym,
      }
    ) ),
    value: voucher.voucherSubjectId,
    activated,
    onactivate(b) {
      $$activated.val(b);
    },
    onchange(value, option) {
      onVoucherSubjectChange(value);
    },
    onsearch(searchText) {
      $$searchText.val(searchText);
    },
    match,
    optionContent(option) {
      return optionContent(option, searchText);
    }
  });
};

export var $$voucherSubjectDropdown = $$.connect(
  [$$activated, $$searchText, $$voucherSubjects, $$voucher], valueFunc
);

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
