import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import $$searchDropdown from '../widget/search-dropdown';
import tenantStore from '../store/tenant-store.js';
import { $$toast } from '../toast.js';
import page from 'page';
import R from 'ramda';
import departmentStore from '../store/department-store';
import co from 'co';
import acronym from '../utils/acronym';
import classNames from '../class-names';
import accountStore from 'store/account-store';
import accountTermStore from 'store/account-term-store';
import Scrollable from '../scrollable';
import {SmartGrid} from 'smart-grid';
import accountBookStore from 'store/account-book-store';
import departmentChargeBillStore from 'store/department-charge-bill-store';
import { ValidationError } from '../validate-obj';
import overlay from '../overlay';

var h = virtualDom.h;
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$departments = $$([], 'departments');
var $$loading = $$(false, 'loading');
var copy = {};
var $$activeTabIdx = $$(0, 'active-tab-idx');
var $$accountTerms = $$([], 'account-terms');
var $$account = $$({}, 'account');

var dirty = function (obj) {
  return !R.equals(copy, obj);
};

var $$departmentDropdown = $$searchDropdown({
  defaultText: '请选择车间',
  $$options: $$departments.trans(function (l) {
    return l.map(function (d) {
      return {
        value: d.id,
        text: d.name,
        acronym: d.acronym,
      };
    });
  }),
  $$value: $$obj.trans(t => t.departmentId),
  onchange(v) {
    $$obj.patch({
      departmentId: v,
    });
  }
});

var newFormVf = function ([errors, departmentDropdown, obj]) {
  return h('form.form.clearfix', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        try {
          if (obj.id) {
            yield tenantStore.validateUpdate(obj);
          } else {
            yield tenantStore.vaalidateCreation(obj);
          }
        } catch (e) {
          if (e instanceof ValidationError) {
            $$errors.val(e.errors);
            return;
          }
          throw e;
        }
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '没有任何变化',
          });
          return;
        }
        try {
          $$loading.toggle();
          Object.assign(obj, yield tenantStore.save(obj));
          copy = R.clone(obj);
          $$toast.val({
            type: 'success',
            message: obj.id? '更新成功': '承包人创建成功',
          });
          page('/tenant/' + obj.id);
        } catch (e) {
          console.error(e);
          if (e.response && e.response.status == 400)  {
            let { reason, fields } = e.response.data;
            if (reason) {
              $$toast.val({
                type: 'error',
                message: reason
              });
            }
            fields && $$errors.val(fields || {});
            return;
          }
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    h('.col.col-5', [
      field({
        key: ['entity', 'name'],
        label: '姓名',
        input: h('input', {
          value: obj.entity.name,
          oninput() {
            $$obj.patch({
              entity: Object.assign(obj.entity || {}, {
                name: this.value,
                acronym: acronym(this.value)
              }),
            });
          }
        }),
        errors,
        required: true
      }),
      field({
        key: ['entity', 'acronym'],
        label: '缩写',
        input: h('input', {
          value: obj.entity.acronym,
          oninput() {
            $$obj.patch({
              entity: Object.assign(obj.entity || {}, {
                acronym: this.value,
              })
            });
          }
        }),
        errors,
        required: true,
      }),
      field({
        key: 'contact',
        label: '联系方式',
        input: h('input', {
          value: obj.contact,
          oninput() {
            $$obj.patch({
              contact: this.value,
            });
          }
        }),
        errors,
      }),
      field({
        key: 'departmentId',
        label: '车间',
        input: departmentDropdown,
        errors,
      }),
    ]),
    h('.col.col-7', [
      field({
        label: '当月累计收入',
        key: ['account', 'thisMonthIncome'],
        errors,
        required: true,
        input: h('input', {
          type: 'number',
          value: obj.account.thisMonthIncome,
          disabled: obj.id,
          oninput() {
            $$obj.patch(
              Object.assign(obj.account, { thisMonthIncome: this.value })
            );
          },
        })
      }),
      field({
        label: '当月累计支出',
        key: ['account', 'thisMonthExpense'],
        errors,
        required: true,
        input: h('input', {
          type: 'number',
          value: obj.account.thisMonthExpense,
          disabled: obj.id,
          oninput() {
            $$obj.patch(
              Object.assign(obj.account, { thisMonthExpense: this.value })
            );
          },
        })
      }),
      field({
        label: '当年累计收入',
        key: ['account', 'income'],
        errors,
        required: true,
        disabled: obj.id,
        input: [
          h('input', {
            value: obj.account.income,
            type: 'number',
            disabled: obj.id,
            oninput() {
              $$obj.patch(
                Object.assign(obj.account, { income: this.value })
              );
            },
          }),
          h('label', '注意!不包含当月收入(即累计至上月)')
        ]
      }),
      field({
        label: '当年累计支出',
        key: ['account', 'expense'],
        errors,
        required: true,
        input: [
          h('input', {
            disabled: obj.id,
            value: obj.account.expense,
            type: 'number',
            oninput() {
              $$obj.patch(
                Object.assign(obj.account, { expense: this.value })
              );
            },
          }),
          h('label', '注意!不包含当月支出(即累计至上月)')
        ]
      }),
      field({
        label: '内部抵税结转额',
        key: ['account', 'taxOffsetBalance'],
        errors,
        required: true,
        input: [
          h('input', {
            disabled: obj.id,
            value: obj.account.taxOffsetBalance,
            type: 'number',
            oninput() {
              $$obj.patch(
                Object.assign(obj.account, { taxOffsetBalance: this.value })
              );
            },
          }),
        ]
      }),
    ]),
    h('.col.col-12', [
      h('hr'),
      h('button.primary', '提交'),
      R.ifElse(
        obj => obj.id && R.pathSatisfies(function (it) {
          return Number(it) < 0;
        }, ['account', 'taxOffsetBalance'])(obj),
        obj => h('button', {
          onclick(e) {
            overlay.show({
              type: 'warning',
              title: '你确认要对承包人强制补足内部抵税?',
              message: h('button.btn.btn-outline', {
                onclick() {
                  overlay.dismiss();
                  co(function *() {
                    $$loading.on();
                    try {
                      yield tenantStore.补足抵税(obj.id);
                      $$toast.val({
                        type: 'success',
                        message: '操作成功',
                      });
                      page('/tenant/' + obj.id);
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
            e.preventDefault();
            return false;
          }
        }, '强制补足内部抵税'),
        R.always(void 0)
      )(obj),
      h('button', {
        onclick(e) {
          page('/tenant-list');
          e.preventDefault();
          return false;
        }
      }, '返回'),
    ])
  ]);
};

var $$newForm = $$.connect(
  [$$errors, $$departmentDropdown, $$obj], newFormVf
);

var tabsVf = function ([activeTabIdx, content]) {
  return h('.tabs', [
    h('._.tabular.menu', [
      ...['基本信息', '各期收支明细', '各期账单'].map(function (tabName, idx) {
        return h(classNames('item', activeTabIdx == idx && 'active'), {
          onclick() {
            page(location.pathname + '?active_tab_idx=' + idx);
          }
        }, tabName);
      }),
    ]),
    h('.content', content)
  ]);
};

var $$activeAccountTermId = $$(0, 'active-account-term-id');

var $$tabs = $$.connect(
  [$$activeTabIdx, $$('')], tabsVf
);


var vf = function ([obj, tabs, form, loading]) {
  return h('#tenant-app.object-app' + (loading? '.loading': ''), [
    h(
      '.header' + (dirty(obj)? '.dirty': ''),
      obj.id? `承包人-${obj.entity.name}`: '创建承包人'
    ),
    obj.id? tabs: form,
  ]);
};

var smartGrid;

// 创建承包人
let newVf = function ([obj, form, loading]) {
  return h('#tenant-app.object-app' + (loading? '.loading': ''), [
    h(
      classNames('header', dirty(obj) && 'dirty'),
      obj.id? `承包人-${obj.entity.name}`: '创建承包人'
    ),
    form
  ]);
};

let _$$view = $$(h(''), 'view');

let init = function (ctx) {
  let { id } = ctx.params;
  let { active_tab_idx: activeTabIdx=0 } = ctx.query;
  let { active_account_term_id: activeAccountTermId } = ctx.query;
  $$activeTabIdx.val(activeTabIdx);
  return co(function *() {
    $$loading.on();
    let obj = id? (yield tenantStore.get(id)): { account: {}, entity: {} };
    let departments = (yield departmentStore.list).filter(function (it) {
      // 候选人只能选择没有关联承包人的车间，以及关联本承包人的车间
      return !it.tenant || it.id == obj.departmentId;
    });
    let accountTerms = yield accountTermStore.list;
    if (activeAccountTermId == void 0) {
      activeAccountTermId = (accountTerms.filter(R.prop('closed'))[0]
        || accountTerms[0]).id;
    }
    copy = R.clone(obj);
    let account = {};
    if (obj.id) {
      account = yield accountStore.getByTenantId(obj.id);
      // 没有关联账户
      if (!account) {
        account = { tenantId: obj.id };
      }
      switch (Number(activeTabIdx)) {
        case 0: {
          $$tabs.connect([$$activeTabIdx, $$newForm], tabsVf);
          break;
        }
        case 1: {
          let accountBook = yield accountBookStore.get(obj.id,
                                                       activeAccountTermId);
          let myScrollable = new Scrollable({
            tag: 'aside',
            $$content: $$.connect(
              [$$accountTerms, $$activeAccountTermId],
              function ([accountTerms, activeAccountTermId]) {
                return h(
                  '._.borderless.vertical.fluid.menu',
                  accountTerms.map(function (at) {
                    return h(
                      'a' + classNames(
                        'item', at.id == activeAccountTermId && 'active'
                      ), {
                        onclick() {
                          page(location.pathname +
                               '?active_tab_idx=2&active_account_term_id=' +
                               at.id);
                        }
                      }, at.name
                    );
                  })
                );
              }),
          });
          let $$accountBooks = $$.connect([
            myScrollable.$$view,
            ...R.ifElse(
              R.identity,
              ({ def }) => [(new SmartGrid(def)).$$view],
                () => []
            )(accountBook)
          ], function ([scrollable, grid]) {
            return [scrollable, grid];
          });
          $$tabs.connect([$$activeTabIdx, $$accountBooks], tabsVf)
          .refresh(null, true);
          break;
        }
        case 2: {
          let myScrollable = new Scrollable({
            tag: 'aside',
            $$content: $$.connect(
              [$$accountTerms, $$activeAccountTermId],
              function ([accountTerms, activeAccountTermId]) {
                return h(
                  '._.borderless.vertical.fluid.menu',
                  accountTerms.map(function (at) {
                    return h(
                      'a' + classNames(
                        'item', at.id == activeAccountTermId && 'active'
                      ), {
                        onclick() {
                          page(location.pathname +
                               '?active_tab_idx=3&active_account_term_id=' +
                               at.id);
                        }
                      }, at.name
                    );
                  })
                );
              }),
          });
          let chargeBill = yield departmentChargeBillStore.get(
            obj.departmentId, activeAccountTermId
          );
          let $$chargeBills = $$.connect([
            myScrollable.$$view,
            ...R.ifElse(
              R.identity,
              ({ def }) => [(new SmartGrid(def, { translateLabel: true }))
                .$$view],
                () => []
            )(chargeBill)
          ], function ([scrollable, grid]) {
            return [scrollable, grid];
          });
          $$tabs.connect([$$activeTabIdx, $$chargeBills], tabsVf)
          .refresh(null, true);
          break;
        }
        default:
      }
      _$$view.connect([$$obj, $$tabs, $$loading], vf);
    } else {
      _$$view.connect([$$obj, $$newForm, $$loading], newVf);
    }
    $$.update([
      [$$loading, false],
      [$$departments, departments],
      [$$obj, obj],
      [$$account, account],
      [$$accountTerms, accountTerms],
      [$$activeAccountTermId, activeAccountTermId]
    ]);
  })
  .catch(function (e) {
    console.log(e);
  });
};

export default {
  page: {
    get $$view() {
      return _$$view;
    },
    onUpdated() {
      smartGrid && smartGrid.onUpdated();
    },
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init,
};
