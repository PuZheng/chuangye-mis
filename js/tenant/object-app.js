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
import overlay from '../overlay';
import moment from 'moment';
import Scrollable from '../scrollable';
import {SmartGrid} from 'smart-grid';
import accountBookStore from 'store/account-book-store';
import departmentChargeBillStore from 'store/department-charge-bill-store';

var h = virtualDom.h;
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$departments = $$([], 'departments');
var $$loading = $$(false, 'loading');
var copy = {};
var $$activeTabIdx = $$(0, 'active-tab-idx');
var $$accountTerms = $$([], 'account-terms');
var $$accountErrors = $$({}, 'account-errors');
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

var formVf = function ([errors, departmentDropdown, obj]) {
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        try {
          yield tenantStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
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
          let newTenant = !obj.id;
          Object.assign(obj, yield tenantStore.save(obj));
          copy = R.clone(obj);
          // 新创建了承包人，需要关联账户
          if (newTenant) {
            $$account.val({ entityId: obj.entityId });
          }
          $$toast.val({
            type: 'success',
            message: obj.id? '更新成功': '承包人创建成功',
          });
          page('/tenant/' + obj.id);
        } catch (e) {
          console.error(e);
          if (e.response && e.response.status == 400)  {
            $$errors.val(e.response.data.fields || {});
            return;
          }
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    field({
      key: 'name',
      label: '姓名',
      input: h('input', {
        value: (obj.entity || {}).name,
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
      key: 'acronym',
      label: '缩写',
      input: h('input', {
        value: (obj.entity || {}).acronym,
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
      required: true
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        page('/tenant-list');
        e.preventDefault();
        return false;
      }
    }, '返回'),
  ]);
};

var $$form = $$.connect(
  [$$errors, $$departmentDropdown, $$obj], formVf
);

var accountFormVf = function accountFormVf(
  [accountErrors, account, accountTerms]
) {
  return h('form.form', {
    onsubmit() {
      if (accountTerms.map(R.prop('name'))
          .indexOf(moment().format('YYYY-MM')) == -1) {
        $$toast.val({
          type: 'warning',
          message: '请先创建当月账期'
        });
        return false;
      }
      overlay.show({
        type: 'warning',
        title: '请再次确认初始数据，初始化后无法修改!',
        message: h('button.btn.btn-outline', {
          onclick() {
            overlay.dismiss();
            co(function *() {
              try {
                yield accountStore.validate(account);
              } catch (e) {
                $$accountErrors.val(e);
                return;
              }
              try {
                $$loading.on();
                let { id } = yield accountStore.save(account);
                $$toast.val({
                  type: 'success',
                  message: '初始化成功'
                });
                $$account.patch({ id });
              } catch (e) {
                console.error(e);
              } finally {
                $$loading.off();
              }
            });
          }
        }, '确认')
      });
      return false;
    }
  }, [
    h('.inline.field', h('h3', [
      h('span', '当前账期: ' + moment().format('YYYY-MM')),
      ~accountTerms.map(R.prop('name')).indexOf(moment().format('YYYY-MM'))?
      void 0:
      h('a', {
        href: '/account-term-list'
      }, '(去创建)')
    ])),
    field({
      label: '当月累计收入',
      key: 'thisMonthIncome',
      errors: accountErrors,
      required: true,
      input: h('input', {
        oninput() {
          $$account.patch({ thisMonthIncome: this.value });
        },
        value: account.thisMonthIncome || '0',
        disabled: account.id
      })
    }),
    field({
      label: '当月累计支出',
      key: 'thisMonthExpense',
      errors: accountErrors,
      required: true,
      input: h('input', {
        oninput() {
          $$account.patch({ thisMonthExpense: this.value });
        },
        value: account.thisMonthExpense || '0',
        disabled: account.id
      })
    }),
    field({
      label: '当年累计收入',
      key: 'thisYearIncome',
      errors: accountErrors,
      required: true,
      input: [
        h('input', {
          oninput() {
            $$account.patch({ thisYearIncome: this.value });
          },
          value: account.thisYearIncome || '',
          disabled: account.id
        }),
        h('label', '注意!不包含当月收入(即累计至上月)')
      ]
    }),
    field({
      label: '当年累计支出',
      key: 'thisYearExpense',
      errors: accountErrors,
      required: true,
      input: [
        h('input', {
          oninput() {
            $$account.patch({ thisYearExpense: this.value });
          },
          value: account.thisYearExpense || '',
          disabled: account.id
        }),
        h('label', '注意!不包含当月支出(即累计至上月)')
      ]
    }),
    h('hr'),
    account.id? void 0: h('button.primary', '初始化'),
  ]);
};


var $$accountForm = $$.connect([$$accountErrors, $$account, $$accountTerms],
                               accountFormVf);

var tabsVf = function ([activeTabIdx, content]) {
  return h('.tabs', [
    h('.tabular.menu', [
      ...['账户信息', '基本信息', '收支明细', '账单'].map(function (tabName, idx) {
        return h(classNames('item', activeTabIdx == idx && 'active'), {
          onclick() {
            page(location.pathname + '?active_tab_idx=' + idx);
          }
        }, tabName);
      }),
      h('.content', content)
    ]),
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

export default {
  page: {
    get $$view() {
      return $$.connect([$$obj, $$tabs, $$form, $$loading], vf);
    },
    onUpdated() {
      smartGrid && smartGrid.onUpdated();
    },
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init(ctx) {
    let { id } = ctx.params;
    let { active_tab_idx: activeTabIdx=0 } = ctx.query;
    let { active_account_term_id: activeAccountTermId } = ctx.query;
    $$activeTabIdx.val(activeTabIdx);
    return co(function *() {
      $$loading.on();
      let obj = id? (yield tenantStore.get(id)): {};
      let departments = yield departmentStore.list;
      let accountTerms = yield accountTermStore.list;
      if (activeAccountTermId == void 0) {
        activeAccountTermId = (accountTerms.filter(R.prop('closed'))[0]
          || {}).id;
      }
      copy = R.clone(obj);
      let account = {};
      if (obj.entityId) {
        account = yield accountStore.getByEntityId(obj.entityId);
        // 没有关联账户
        if (!account) {
          account = { entityId: obj.entityId };
        }
        switch (Number(activeTabIdx)) {
        case 0: {
          $$tabs.connect([$$activeTabIdx, $$accountForm], tabsVf);
          break;
        }
        case 1: {
          $$tabs.connect([$$activeTabIdx, $$form], tabsVf);
          break;
        }
        case 2: {
          let accountBook = yield accountBookStore.get(obj.entityId,
                                                       activeAccountTermId);
          let myScrollable = new Scrollable({
            tag: 'aside',
            $$content: $$.connect(
              [$$accountTerms, $$activeAccountTermId],
              function ([accountTerms, activeAccountTermId]) {
                return h(
                  '.borderless.vertical.fluid.menu',
                  accountTerms.filter(R.prop('closed')).map(function (at) {
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
          $$tabs.connect([$$activeTabIdx, $$accountBooks], tabsVf);
          break;
        }
        case 3: {
          let myScrollable = new Scrollable({
            tag: 'aside',
            $$content: $$.connect(
              [$$accountTerms, $$activeAccountTermId],
              function ([accountTerms, activeAccountTermId]) {
                return h(
                  '.borderless.vertical.fluid.menu',
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
          let chargeBill = yield departmentChargeBillStore.get(obj.departmentId,
                                                           activeAccountTermId);
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
          $$tabs.connect([$$activeTabIdx, $$chargeBills], tabsVf);
          break;
        }
        default:

        }
      }
      $$.update(
        [$$loading, false],
        [$$departments, departments],
        [$$obj, obj],
        [$$account, account],
        [$$accountTerms, accountTerms],
        [$$activeAccountTermId, activeAccountTermId]
      );
    })
    .catch(function (e) {
      console.log(e);
    });
  }
};
