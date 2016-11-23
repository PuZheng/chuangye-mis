import $$ from 'slot';
import moment from 'moment';
import invoiceTypeStore from 'store/invoice-type-store';
import accountTermStore from 'store/account-term-store';
import invoiceStore from 'store/invoice-store';
import classNames from '../class-names';
import R from 'ramda';
import virtualDom from 'virtual-dom';
import { field } from '../field.js';
import $$dropdown from 'widget/dropdown';
import entityStore from 'store/entity-store';
import page from 'page';
import $$storeOrderEditor from './store-order-editor';
import storeSubjectStore from 'store/store-subject-store';
import co from 'co';
import { $$toast } from '../toast';
import object2qs from '../utils/object2qs';
import overlay from '../overlay';

var h = virtualDom.h;

var $$loading = $$(false, 'loading');
var $$invoiceTypes = $$([], 'invoice-types');
var $$accountTerms = $$([], 'account-terms');
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$entities = $$([], 'entities');
var $$storeSubjects = $$([], 'store-subjects');
var $$storeOrders = $$([], 'store-orders');
var copy = {};

$$storeOrders.change(function (storeOrders) {
  // 是否关联仓库单据
  let obj = $$obj.val();
  let relateStoreOrders = obj.invoiceType && obj.invoiceType.storeOrderType
  && obj.invoiceType.storeOrderDirection;
  let args = { storeOrders };
  if (relateStoreOrders) {
    args.amount = R.sum(storeOrders.map(function ({ unitPrice, quantity }) {
      return unitPrice * quantity;
    }));
  }
  $$obj.patch(args);
});

var dirty = function (obj) {
  return !R.equals(obj, copy);
};

var vf = function ([loading, obj, form]) {
  let title = R.ifElse(
    R.prop('id'),
    () => [
      obj.authenticated? h('span.color-accent', '(已认证)'): void 0,
      `编辑发票-${obj.number}`,
    ],
    () => '创建新发票'
  )(obj);
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'), title),
    form
  ]);
};

var formVf = function ([
  errors, obj, typeDropdown, accountTermDropdown, vendorDropdown,
  purchaserDropdown, storeOrderEditor
]) {
  let relateStoreOrders = R.and(
    R.path(['invoiceType', 'storeOrderType']),
    R.path(['invoiceType', 'storeOrderDirection']))(obj);
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '请做出修改后再提交',
          });
          return;
        }
        try {
          yield invoiceStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        try {
          $$loading.toggle();
          let { id } = yield invoiceStore.save(obj);
          copy = R.clone(obj);
          $$toast.val({
            type: 'success',
            message: '提交成功',
          });
          !obj.id && page('/invoice/' + id);
        } catch (e) {
          console.error(e);
        } finally {
          $$loading.toggle();
        }
      });
      return false;
    }
  }, [
    h('.col.col-6', [
      obj.authenticated?
      field({
        label: '发票类型',
        input: h(
          '.text',
          (R.find(R.propEq('id', obj.invoiceTypeId))($$invoiceTypes.val())
            || {}).name
        ),
      }):
      field({
        key: 'invoiceType',
        label: '发票类型',
        input: typeDropdown,
        errors,
        required: true
      }),
      obj.authenticated?
      field({
        label: '发票日期',
        input: h('.text', obj.date),
      }):
      field({
        key: 'date',
        label: '发票日期',
        input: h('input', {
          type: 'date',
          value: obj.date? obj.date: moment().format('YYYY-MM-DD'),
          oninput() {
            $$obj.patch({ date: this.value });
          }
        }),
        errors,
      }),
      obj.authenticated?
      field({
        label: '发票号码',
        input: h('.text', obj.number),
      }):
      field({
        key: 'number',
        label: '发票号码',
        input: h('input', {
          type: 'text',
          placeholder: '请输入发票号码',
          value: obj.number || '',
          oninput() {
            $$obj.patch({ number: this.value, });
          }
        }),
        errors,
        required: true
      }),
      obj.authenticated?
      field({
        label: '会计账期',
        input: h('.text', obj.accountTerm.name)
      }):
      field({
        key: 'accountTermId',
        label: '会计帐期',
        input: accountTermDropdown,
        errors,
        required: true
      }),
      R.ifElse(
        R.path(['invoiceType', 'vendorType']),
        function () {
          return obj.authenticated?
          field({
            label: '销售方',
            input: h('.text', obj.vendor.name),
          }):
          field({
            key: 'vendorId',
            label: '销售方',
            input: vendorDropdown,
            errors,
            required: true
          });
        },
        R.always('')
      )(obj),
      R.ifElse(
        R.path(['invoiceType', 'purchaserType']),
        function () {
          return obj.authenticated?
          field({
            label: '购买方',
            input: h('.text', obj.purchaser.name),
          }):
          field({
            key: 'purchaserId',
            label: '购买方',
            input: purchaserDropdown,
            errors,
            required: true
          });
        },
        R.always('')
      )(obj),
      h('.field.inline', [
        h('input', {
          type: 'checkbox',
          checked: obj.isVat,
          disabled: obj.authenticated,
          oninput() {
            $$obj.patch({ isVat: this.checked });
          }
        }),
        h('label', {
          onclick() {
            if (!obj.authenticated) {
              $$obj.patch({ isVat: !obj.isVat });
            }
          }
        }, '是否是增值税'),
      ]),
      h('.field.inline', [
        h('label', '备注'),
        h('textarea', {
          disabled: obj.authenticated,
          rows: 4,
          onchange() {
            $$obj.patch({ notes: this.value });
          }
        }, obj.notes || ''),
      ]),
    ]),
    h('.col.col-6', [
      obj.authenticated?
      field({
        label: '税率(百分比)',
        input: h('.text', '' + obj.taxRate),
      }):
      field({
        key: 'taxRate',
        label: '税率(百分比)',
        input: h('input', {
          value: obj.taxRate,
          oninput() {
            $$obj.patch({ taxRate: this.value });
          }
        }),
        errors,
        required: relateStoreOrders,
      }),
      obj.authenticated?
      relateStoreOrders? field({
        label: '相关仓储单据',
        input: h('.text', h('list', obj.storeOrders.map(function (it) {
          /* eslint-disable max-len */
          return `${it.storeSubject.name}-${it.quantity}${it.storeSubject.unit}x${it.unitPrice}元, 共${it.quantity*it.unitPrice}元`;
          /* eslint-enable max-len */
        }))),
      }): void 0:
      h(classNames('field', !relateStoreOrders && '.hidden'), [
        h('label', '相关仓储单据'),
        storeOrderEditor,
      ]),
      field({
        key: 'amount',
        label: '金额',
        input: h('input', {
          value: obj.amount,
          oninput() {
            $$obj.patch({ amount: this.value });
          },
          disabled: relateStoreOrders,
        }),
        errors,
        required: true,
      }),
      field({
        label: '税额(元)',
        input: h('.text', R.ifElse(
          (taxRate, amount) => taxRate && amount,
            (taxRate, amount) => taxRate * amount / 100 + '',
            R.always('--')
        )(obj.taxRate, obj.amount)),
      })
    ]),
    h('.clearfix'),
    h('hr'),
    obj.authenticated? void 0: h('button.primary', '提交'),
    h('a.btn.btn-outline', {
      href: '/invoice-list',
    }, '返回'),
    obj.id && obj.authenticated? void 0: h('button.primary', {
      onclick(e) {
        e.preventDefault();
        overlay.show({
          type: 'warning',
          title: '您确认要认证该发票(该操作不可逆)?',
          message: h('button.btn.btn-outline', {
            onclick() {
              overlay.dismiss();
              $$loading.val(true);
              co(function *() {
                try {
                  yield invoiceStore.authenticate(obj.id);
                  $$obj.patch({ authenticated: true });
                  copy = R.clone(obj);
                  $$toast.val({
                    type: 'success',
                    message: '认证通过!'
                  });
                } catch (e) {
                  console.error(e);
                } finally {
                  $$loading.val(false);
                }
              });
              return false;
            }
          }, '确认')
        });
        return false;
      }
    }, '认证'),
    obj.id && !obj.authenticated?
    h('a.btn.btn-outline.ca', {
      onclick() {
        overlay.show({
          type: 'warning',
          title: '你确认要删除该条发票?',
          message: h('button.btn.btn-outline', {
            onclick() {
              co(function *() {
                overlay.dismiss();
                $$loading.on();
                try {
                  yield invoiceStore.del(obj.id);
                  $$toast.val({
                    type: 'success',
                    message: '删除成功',
                  });
                  page('/invoice-list');
                } catch (e) {
                  console.error(e);
                } finally {
                  $$loading.off();
                }
              });
              return false;
            }
          }, '确认'),
        });
        return false;
      }
    }, '删除'):
    void 0,
    R.ifElse(
      R.prop('isVat'),
      () => h('a.btn.btn-outline', {
        href: '/voucher?' + object2qs({
          amount: obj.amount,
          voucher_subject_id: obj.invoiceType.relatedVoucherSubjectId,
          payer_id: obj.purchaserId,
          recipient_id: obj.vendorId,
          is_public: 1,
        }),
      }, '创建凭证'),
      () => ''
    )(obj)
  ]);
};

var $$typeDropdown = $$dropdown({
  defaultText: '请选择发票类型',
  onchange(invoiceTypeId) {
    $$obj.patch({
      invoiceTypeId,
      invoiceType: R.find(R.propEq('id', invoiceTypeId))($$invoiceTypes.val()),
      amount: '',
    });
    $$storeOrders.val([]);
  },
  $$options: $$invoiceTypes.trans(R.map(function (it) {
    return {
      value: it.id,
      text: it.name,
    };
  })),
  $$value: $$obj.trans(R.prop('invoiceTypeId')),
});

var $$accountTermDropdown = $$dropdown({
  defaultText: '请选择会计账期',
  $$options: $$accountTerms.trans(R.map(it => ({
    value: it.id,
    text: it.name,
  }))),
  $$value: $$obj.trans(R.prop('accountTermId')),
  onchange(accountTermId) {
    $$obj.patch({ accountTermId });
  },
});

var $$vendorDropdown = $$dropdown({
  defaultText: '请选择销售方',
  $$value: $$obj.trans(R.prop('vendorId')),
  $$options: $$.connect([$$entities, $$obj], function ([entities, obj]) {
    let vendorType = R.path(['invoiceType', 'vendorType'])(obj);
    if (vendorType) {
      return entities.filter(R.propEq('type', vendorType)).map(it => ({
        value: it.id,
        text: it.name,
        acronym: it.acronym,
      }));
    }
    return [];
  }),
  onchange(vendorId) {
    $$obj.patch({ vendorId });
  },
});

var $$purchaserDropdown = $$dropdown({
  defaultText: '请选择购买方',
  onchange(purchaserId) {
    $$obj.patch({ purchaserId });
  },
  $$options: $$.connect([$$entities, $$obj], function ([entities, obj]) {
    let purchaserType = R.path(['invoiceType', 'purchaserType'])(obj);
    if (purchaserType) {
      return entities.filter(R.propEq('type', purchaserType)).map(it => ({
        value: it.id,
        text: it.name,
        acronym: it.acronym,
      }));
    }
    return [];
  }),
  $$value: $$obj.trans(R.prop('purchaserId')),
});


var $$form = $$.connect(
  [$$errors, $$obj, $$typeDropdown, $$accountTermDropdown, $$vendorDropdown,
    $$purchaserDropdown, $$storeOrderEditor($$storeSubjects, $$storeOrders)],
  formVf
);

export default {
  page: {
    $$view: $$.connect([$$loading, $$obj, $$form], vf),
  },
  init(ctx) {
    let { id } = ctx.params;
    let promises = [
      entityStore.list,
      invoiceTypeStore.list,
      accountTermStore.list,
      id? invoiceStore.get(id): {
        date: moment().format('YYYY-MM-DD'),
        storeOrders: [],
      },
      storeSubjectStore.list,
    ];
    $$loading.toggle();
    Promise.all(promises)
    .then(function (
      [entities, invoiceTypes, accountTerms, obj, storeSubjects]
    ) {
      copy = R.clone(obj);
      $$.update(
        [$$entities, entities],
        [$$invoiceTypes, invoiceTypes],
        [$$accountTerms, accountTerms],
        [$$loading, false],
        [$$obj, obj],
        [$$storeSubjects, storeSubjects],
        [$$storeOrders, obj.storeOrders]
      );
    });
  }
};
