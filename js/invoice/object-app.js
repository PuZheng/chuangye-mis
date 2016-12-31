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
import $$searchDropdown from 'widget/search-dropdown';
import entityStore from 'store/entity-store';
import page from 'page';
import $$storeOrderEditor from './store-order-editor';
import storeSubjectStore from 'store/store-subject-store';
import co from 'co';
import { $$toast } from '../toast';
import object2qs from '../utils/object2qs';
import overlay from '../overlay';
import constStore from 'store/const-store';

var h = virtualDom.h;

var $$loading = $$(false, 'loading');
var $$invoiceTypes = $$([], 'invoice-types');
var $$accountTerms = $$([], 'account-terms');
var $$obj = $$({
  storeOrders: [],
  actions: []
}, 'obj');
var $$errors = $$({}, 'errors');
var $$entities = $$([], 'entities');
var $$storeSubjects = $$([], 'store-subjects');
var $$storeOrders = $$([], 'store-orders');
var copy = {};
var $$invoiceStates = $$({}, 'invoice-status');
var $$invoiceActions = $$({}, 'invoice-actions');


$$storeOrders.change(function (storeOrders) {
  // 是否关联仓库单据
  let obj = $$obj.val();
  let relateStoreOrders = R.path(['invoiceType', 'storeSubjectType'])(obj);
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

var vf = function ([loading, obj, form, invoiceStates]) {
  let title = R.ifElse(
    R.prop('id'),
    () => [
      R.cond([
        [R.propEq('status', invoiceStates.ABORTED),
          R.always(h('span.ca', '(已作废)'))],
        [R.propEq('status', invoiceStates.AUTHENTICATED),
          R.always(h('span.ca', '(已认证)'))],
        [R.T, R.always('')]
      ])(obj),
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
  purchaserDropdown, storeOrderEditor, invoiceActions
]) {
  let relateStoreOrders = R.path(['invoiceType', 'storeSubjectType'])(obj);
  let editable = ~obj.actions.indexOf(invoiceActions.EDIT);
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
      !obj.id || editable?
      field({
        key: 'invoiceType',
        label: '发票类型',
        input: typeDropdown,
        errors,
        required: true
      }):
      field({
        label: '发票类型',
        input: h(
          '.text',
          (R.find(R.propEq('id', obj.invoiceTypeId))($$invoiceTypes.val())
            || {}).name
        ),
      }),
      !obj.id || editable?
      field({
        key: 'date',
        label: '发票日期',
        input: h('input', {
          type: 'date',
          value: obj.date || moment().format('YYYY-MM-DD'),
          oninput() {
            $$obj.patch({ date: this.value });
          }
        }),
        errors,
      }):
      field({
        label: '发票日期',
        input: h('.text', obj.date),
      }),
      !obj.id || editable?
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
      }):
      field({
        label: '发票号码',
        input: h('.text', obj.number),
      }),
      !obj.id || editable?
      field({
        key: 'accountTermId',
        label: '会计帐期',
        input: accountTermDropdown,
        errors,
        required: true
      }):
      field({
        label: '会计账期',
        input: h('.text', R.path(['accountTerm', 'name'])(obj))
      }),
      R.ifElse(
        R.path(['invoiceType', 'vendorType']),
        function () {
          return !obj.id || editable?
          field({
            key: 'vendorId',
            label: '实际销售方',
            input: vendorDropdown,
            errors,
            required: true
          }):
          field({
            label: '实际销售方',
            input: h('.text', obj.vendor.name),
          });
        },
        R.always('')
      )(obj),
      R.ifElse(
        R.path(['invoiceType', 'purchaserType']),
        function () {
          return !obj.id || editable?
          field({
            key: 'purchaserId',
            label: '实际购买方',
            input: purchaserDropdown,
            errors,
            required: true
          }):
          field({
            label: '实际购买方',
            input: h('.text', obj.purchaser.name),
          });
        },
        R.always('')
      )(obj),
      h('.field.inline', [
        h('input', {
          type: 'checkbox',
          checked: obj.isVat,
          disabled: obj.id && !editable,
          onchange() {
            $$obj.patch({ isVat: this.checked });
          }
        }),
        h('label', {
          onclick() {
            if (!obj.id || editable) {
              $$obj.patch({ isVat: !obj.isVat });
            }
          }
        }, '是否是增值税'),
      ]),
      h('.field.inline', [
        h('label', '备注'),
        h('textarea', {
          disabled: obj.id && !editable,
          rows: 4,
          onchange() {
            $$obj.patch({ notes: this.value });
          }
        }, obj.notes || ''),
      ]),
    ]),
    h('.col.col-6', [
      !obj.id || editable?
      field({
        key: 'taxRate',
        label: '税率(百分比)',
        input: h('input', {
          value: obj.taxRate || '',
          oninput() {
            $$obj.patch({ taxRate: this.value });
          }
        }),
        errors,
        required: relateStoreOrders,
      }):
      field({
        label: '税率(百分比)',
        input: h('.text', '' + (obj.taxRate || '')),
      }),
      !obj.id || editable?
      relateStoreOrders? h('.field', [
        h('label', '相关仓储单据'),
        storeOrderEditor,
      ]): void 0:
      relateStoreOrders? field({
        label: '相关仓储单据',
        input: h('.text', h('ul', obj.storeOrders.map(function (it) {
          /* eslint-disable max-len */
          return h(
            'li',
            `${it.storeSubject.name}-${it.quantity}${it.storeSubject.unit}x${it.unitPrice}元, 共${it.quantity*it.unitPrice}元`
          );
          /* eslint-enable max-len */
        }))),
      }): void 0,
      field({
        key: 'amount',
        label: '金额',
        input: h('input', {
          value: obj.amount,
          oninput() {
            $$obj.patch({ amount: this.value });
          },
          disabled: !editable || relateStoreOrders,
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
    !obj.id || editable?
      h('button.primary', '提交'): void 0,
    h('a.btn.btn-outline', {
      href: '/invoice-list',
    }, '返回'),
    ~obj.actions.indexOf(invoiceActions.AUTHENTICATE)? h('button.primary', {
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
                  $$obj.patch(yield invoiceStore.authenticate(obj.id));
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
    }, '认证'): void 0,
    ~obj.actions.indexOf(invoiceActions.DELETE)?
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
    }, '删除'): void 0,
    ~obj.actions.indexOf(invoiceActions.ABORT)?
    h('a.btn.btn-outline.ca', {
      onclick() {
        overlay.show({
          type: 'warning',
          title: '您确认要作废该发票?(该操作不可逆)',
          message: h('button.btn.btn-outline', {
            onclick() {
              overlay.dismiss();
              co(function *() {
                $$loading.on();
                try {
                  $$obj.patch(yield invoiceStore.abort(obj.id));
                  $$toast.val({
                    type: 'success',
                    message: '操作成功',
                  });
                } catch (e) {
                  console.error(e);
                } finally {
                  $$loading.off();
                }
              });
              return false;
            }
          }, '确认')
        });
        return false;
      }
    }, '作废'): void 0,
    R.ifElse(
      R.and(R.prop('isVat'), R.prop('id')),
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
    text: it.name + (it.closed? '(已关闭)': ''),
  }))),
  $$value: $$obj.trans(R.prop('accountTermId')),
  onchange(accountTermId) {
    $$obj.patch({ accountTermId });
  },
});

var $$vendorDropdown = $$searchDropdown({
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

var $$purchaserDropdown = $$searchDropdown({
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
  $$value: $$obj.trans(R.prop('purchaserId'), 'purchaser-id'),
  tag: 'purcharser-dropdown',
});


var $$form = $$.connect(
  [$$errors, $$obj, $$typeDropdown, $$accountTermDropdown, $$vendorDropdown,
    $$purchaserDropdown, $$storeOrderEditor($$storeSubjects, $$storeOrders),
    $$invoiceActions
  ],
  formVf
);

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$obj, $$form, $$invoiceStates], vf);
    }
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
        actions: []
      },
      storeSubjectStore.list,
      constStore.get()
    ];
    $$loading.toggle();
    Promise.all(promises)
    .then(function (
      [
        entities, invoiceTypes, accountTerms, obj, storeSubjects,
        { INVOICE_ACTIONS, INVOICE_STATES }
      ]
    ) {
      copy = R.clone(obj);
      $$storeSubjects.connect([$$obj], function (allStoreSubjects) {
        return function ([obj]) {
          return allStoreSubjects
          .filter(R.propEq('type',
                           R.path(['invoiceType', 'storeSubjectType'])(obj)));
        };
      }(storeSubjects));
      $$.update(
        [$$entities, entities],
        [$$invoiceTypes, invoiceTypes],
        [$$accountTerms, accountTerms],
        [$$loading, false],
        [$$obj, obj],
        [$$storeOrders, obj.storeOrders],
        [$$invoiceActions, INVOICE_ACTIONS],
        [$$invoiceStates, INVOICE_STATES]
      );
    });
  }
};
