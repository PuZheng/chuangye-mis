import x from '../xx.js';
import { voucherSlot, voucherTypesSlot, loadingSlot, voucherSubjectsSlot, recipientsSlot, payersSlot } from './data-slots.js';
import entityStore from '../store/entity-store.js';
import tmpl from './form.ejs';
import moment from 'moment';
import R from 'ramda';
import once from 'once';

const selectedVoucherSubjectSlot = x({}, 'selected-voucher-subject');

const formValueFunc = function (
  loading, voucher, voucherTypes, voucherSubjects,
  recipients, payers, selectedVoucherSubject
) {
  return ejs.render(tmpl, {
    self: this,
    loading,
    voucher,
    voucherTypes,
    voucherSubjects,
    recipients,
    payers,
    selectedVoucherSubject,
    moment,
  });
};

var viewSlot = x.connect([
  loadingSlot, voucherSlot, voucherTypesSlot, voucherSubjectsSlot,
  recipientsSlot, payersSlot, selectedVoucherSubjectSlot
], formValueFunc, 'voucher-form');

const bindEvents = once(function ($node) {
    $node.find('[name=number]').change(function () {
      voucherSlot.patch({
        number: this.value,
      });
    });
    $node.find('button.commit').click(function () {
      
    });
});

export default {
  viewSlot,
  config: function (node) {
    const $node = $(document.getElementById(viewSlot.token));
    bindEvents($node);
    $node.find('[name=voucherType]').dropdown({
      onChange: function (value, text, $choice) {
        voucherSlot.patch({
          voucherTypeId: value,
        });
      },
    });
    $node.find('[name=voucherSubject]').dropdown({
      onChange: function (value, text, $choice) {
        value = parseInt(value);
        var voucherSubject = R.find(R.propEq('id', value))(voucherSubjectsSlot.val());
        x.update(
          [loadingSlot, true],
          [selectedVoucherSubjectSlot, voucherSubject],
          [voucherSlot, Object.assign(voucherSlot.val(), {
            isPublic: voucherSubject.isPublic,
            voucherSubjectId: voucherSubject.id,
            voucherSubject,
          })]
        );
        Promise.all([
          entityStore.fetchList({
            type: voucherSubject.payerType,
          }),
          entityStore.fetchList({
            type: voucherSubject.recipientType, 
          }),
        ]).then(function ([payers, recipients]) {
          x.update(
            [loadingSlot, false],
            [payersSlot, payers],
            [recipientsSlot, recipients]
          );
        });
      },
    });
    $node.find('[name=recipient]').dropdown({
      onChange: function (value, text, $choice) {
        voucherSlot.patch({
          recipientId: parseInt(value) ,
        });
      },
    });
    $node.find('[name=payer]').dropdown({
      onChange: function (value, text, $choice) {
        voucherSlot.patch({
          payerId: parseInt(value),
        });
      },
    });
  }
};
