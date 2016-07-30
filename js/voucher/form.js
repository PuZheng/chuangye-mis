import x from '../xx.js';
import { $$voucher, $$voucherTypes, $$loading, $$voucherSubjects, $$recipients, $$payers } from './data-slots.js';
import entityStore from '../store/entity-store.js';
import tmpl from './form.ejs';
import moment from 'moment';
import R from 'ramda';
import once from 'once';
import page from 'page';
import voucherStore from '../store/voucher-store.js';

const $$selectedVoucherSubject = x({}, 'selected-voucher-subject');
const errors = x({}, 'errors');

$$voucher.change(function (voucher) {
  if (voucher.id && voucher.voucherSubjectId) {
    onVoucherSubjectChange(voucher.voucherSubjectId);
  };
});

const onVoucherSubjectChange = function (value, text, $choice) {
  value = parseInt(value);
  var voucherSubject = R.find(R.propEq('id', value))($$voucherSubjects.val());
  x.update(
    [$$loading, true],
    [$$selectedVoucherSubject, voucherSubject],
    [$$voucher, Object.assign($$voucher.val(), {
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
      [$$loading, false],
      [$$payers, payers],
      [$$recipients, recipients]
    );
  });
};

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

var $$view = x.connect([
  $$loading, $$voucher, $$voucherTypes, $$voucherSubjects,
  $$recipients, $$payers, $$selectedVoucherSubject
], formValueFunc, 'voucher-form');

const validate = function (voucher) {
  return Promise.resolve(voucher);
};

const bindEvents = once(function ($node) {
    $node.find('[name=number]').change(function () {
      $$voucher.patch({
        number: this.value,
      });
    });
    $node.find('[name=comment]').change(function () {
      $$voucher.patch({
        comment: this.value,
      });
    });
    $node.find('[name=date]').change(function () {
      $$voucher.patch({
        date: this.value,
      });
    });
    $node.find('button.commit').click(function () {
      $$loading.val(true);
      validate($$voucher.val()).then(function () {
        voucherStore.save($$voucher.val()).then(function (id) {
          $$loading.val(false);
          page('/voucher/' + id);
        });
      }).catch(errors.val);
    });
});

export default {
  $$view,
  config: function (node) {
    const $node = $(document.getElementById($$view.token));
    bindEvents($node);
    $node.find('[name=voucherType]').dropdown({
      onChange: function (value, text, $choice) {
        $$voucher.patch({
          voucherTypeId: value,
        });
      },
    });
    $node.find('[name=voucherSubject]').dropdown({
      onChange: onVoucherSubjectChange,
    });
    $node.find('[name=recipient]').dropdown({
      onChange: function (value, text, $choice) {
        $$voucher.patch({
          recipientId: parseInt(value) ,
        });
      },
    });
    $node.find('[name=payer]').dropdown({
      onChange: function (value, text, $choice) {
        $$voucher.patch({
          payerId: parseInt(value),
        });
      },
    });
  }
};
