import $$ from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import voucherTypeStore from 'store/voucher-type-store';
import voucherSubjectStore from 'store/voucher-subject-store';
import moment from 'moment';
import voucherStore from 'store/voucher-store';
import casing from 'casing';
import co from 'co';
import { $$toast } from '../toast';
import { field } from '../field';
import page from 'page';
import { $$dropdown } from '../widget/dropdown';
import R from 'ramda';
import { $$searchDropdown } from '../widget/search-dropdown';
import entityStore from '../store/entity-store';

var $$obj = $$({}, 'obj');
var $$voucherTypes = $$([], 'voucher-types');
var $$loading = $$(false, 'loading');
var $$voucherSubjects = $$([], 'voucher-subjects');
var $$errors = $$({}, 'errors');
var $$entities = $$([], 'entities');
var $$currentVoucherSubject = $$(null, 'current-voucher-subject');


const vf = function([obj, form]) {
  return h('.object-app', [
    h('.header', obj.id ? `编辑凭证-${obj.number}` : '创建新凭证'),
    form,
  ]);
};

const formVf = function formVf([
  loading, obj, errors,
  voucherTypeDropdown, voucherSubjectDropdown,
  payerDropdown, recipientDropdown
]) {
  let classNames = ['form', 'relative'];
  loading && classNames.push('loading');
  classNames = classNames.map(c => '.' + c).join('');
  return h('form' + classNames, {
    onsubmit() {
      co(function*() {
        try {
          yield voucherStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        try {
          $$loading.val(true);
          let {
            id
          } =
          yield voucherStore.save(obj);
          $$toast.val({
            type: 'success',
            message: '凭证创建成功',
          });
          !obj.id && page('/voucher/' + id);
        } catch (e) {
          console.error(e);
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    field({
      key: 'voucherTypeId',
      label: '凭证类型',
      input: voucherTypeDropdown,
      errors,
      required: true,
    }),
    field({
      key: 'voucherSubjectId',
      label: '项目',
      input: voucherSubjectDropdown,
      errors,
      required: true,
    }),
    field({
      key: 'amount',
      label: '金额(元)',
      input: h('input', {
        onchange() {
          $$obj.patch({
            amount: this.value
          });
        },
        value: obj.amount,
      }),
      errors,
      require: true,
    }),
    field({
      key: 'date',
      label: '日期',
      input: h('input', {
        type: 'date',
        value: obj.date,
        onchange() {
          $$obj.patch({
            date: this.value,
          });
        }
      }),
      errors,
      required: true
    }),
    field({
      key: 'number',
      label: '凭证号',
      input: h('input', {
        placeholder: '请输入凭证号',
        value: obj.number,
        onchange() {
          $$obj.patch({
            number: this.value
          });
        }
      }),
      errors,
      required: true
    }),
    h('.field.inline', [
      h('input', {
        type: 'checkbox',
        checked: obj.isPublic,
        onchange() {
          $$obj.patch({
            isPublic: this.checked
          });
        }
      }),
      h('label', {
        onclick() {
          $$obj.patch({
            isPublic: !$$obj.val().isPublic
          });
        }
      }, '是否进入总账'),
    ]),
    field({
      key: 'payerId',
      label: '(实际)支付方',
      input: payerDropdown,
      errors,
      required: true
    }),
    field({
      key: 'recipientId',
      label: '(实际)收入方',
      input: recipientDropdown,
      errors,
      required: true
    }),
    h('.clearfix'),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        e.preventDefault();
        page('/voucher-list');
        return false;
      }
    }, '返回'),
  ]);
};

var $$voucherTypeDropdown = $$dropdown({
  defaultText: '请选择凭证类型',
  onchange(voucherTypeId) {
    $$obj.patch({
      voucherTypeId
    });
  },
  $$options: $$voucherTypes.trans(R.map(it => ({
    value: it.id,
    text: it.name
  }))),
  $$value: $$obj.trans(R.prop('voucherTypeId')),
});

var $$voucherSubjectDropdown = $$searchDropdown({
  defaultText: '请选择凭证科目',
  $$value: $$obj.trans(R.prop('voucherSubjectId')),
  $$options: $$voucherSubjects.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym,
  }))),
  onchange(voucherSubjectId) {
    $$obj.patch({
      voucherSubjectId
    });
    $$currentVoucherSubject.val(
      R.find(R.propEq('id', voucherSubjectId))($$voucherSubjects.val())
    );
  },
});

var $$payerDropdown = $$searchDropdown({
  defaultText: '请选择支付方',
  onchange(payerId) {
    $$obj.patch({
      payerId,
    });
  },
  $$options: $$.connect(
    [$$currentVoucherSubject, $$entities],
    function([currentVoucherSubject, entities]) {
      let payerType = R.prop('payerType')(currentVoucherSubject || {});
      if (payerType) {
        return entities.filter(R.propEq('type', payerType)).map(it => ({
          value: it.id,
          text: it.name,
          acronym: it.acronym,
        }));
      }
      return [];
    }
  ),
  $$value: $$obj.trans(R.prop('payerId'))
});

var $$recipientDropdown = $$searchDropdown({
  defaultText: '请选择支付方',
  onchange(recipientId) {
    $$obj.patch({ recipientId });
  },
  $$options: $$.connect(
    [$$currentVoucherSubject, $$entities],
    function([currentVoucherSubject, entities]) {
      let recipientType = R.prop('recipientType')(currentVoucherSubject || {});
      if (recipientType) {
        return entities.filter(R.propEq('type', recipientType)).map(it => ({
          value: it.id,
          text: it.name,
          acronym: it.acronym,
        }));
      }
      return [];
    }
  ),
  $$value: $$obj.trans(R.prop('recipientId'))
});

var $$form = $$.connect([
  $$loading, $$obj, $$errors,
  $$voucherTypeDropdown, $$voucherSubjectDropdown,
  $$payerDropdown, $$recipientDropdown
], formVf, 'voucher-form');

const $$view = $$.connect(
  [$$obj, $$form],
  vf,
  'voucher-object-app');

export
default {
  page: {
    $$view,
  },
  init(ctx) {
    let {
      id
    } = ctx.params;
    $$loading.val(true);
    let promises = [
      voucherTypeStore.list,
      voucherSubjectStore.list,
      entityStore.list,
      id ? voucherStore.get(id) : Object.assign({
        date: moment().format('YYYY-MM-DD')
      }, casing.camelize(ctx.query)),
    ];
    Promise.all(promises)
      .then(function([voucherTypes, voucherSubjects, entities, obj]) {
        $$.update(
          [$$voucherTypes, voucherTypes],
          // why not R.propEq, since it use '===' instead of '=='
          [$$currentVoucherSubject,
            R.find(it => it.id == obj.voucherSubjectId)(voucherSubjects)],
          [$$loading, false],
          [$$voucherSubjects, voucherSubjects],
          [$$obj, obj],
          [$$entities, entities]
        );
        console.log(obj.voucherSubjectId);
        console.log(voucherSubjects);
        console.log($$currentVoucherSubject.val());
      });
  }
};
