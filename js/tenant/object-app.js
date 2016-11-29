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

var formVf = function ([errors, departmentDropdown, obj, account]) {
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
          Object.assign(obj, yield tenantStore.save(obj));
          copy = R.clone(obj);
          // 新创建了承包人，需要关联账户
          if (obj.entityId && !account.entityId) {
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
  [$$errors, $$departmentDropdown, $$obj, $$account], formVf
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
        value: account.thisMonthIncome || '',
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
        value: account.thisMonthExpense || '',
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

var tabsVf = function ([activeTabIdx, accountForm, form]) {
  return h('.tabs', [
    h('.tabular.menu', [
      h(classNames('item', activeTabIdx === 0 && 'active'), {
        onclick() {
          $$activeTabIdx.val(0);
        }
      }, '账户信息'),
      h(classNames('item', activeTabIdx === 1 && 'active'), {
        onclick() {
          $$activeTabIdx.val(1);
        }
      }, '基本信息'),
      h('.content', [accountForm, form][activeTabIdx])
    ]),
  ]);
};

var $$tabs = $$.connect([$$activeTabIdx, $$accountForm, $$form], tabsVf);


var vf = function ([obj, tabs, form, loading]) {
  return h('.object-app' + (loading? '.loading': ''), [
    h(
      '.header' + (dirty(obj)? '.dirty': ''),
      obj.id? `承包人-${obj.entity.name}`: '创建承包人'
    ),
    obj.id? tabs: form,
  ]);
};


export default {
  page: {
    $$view: $$.connect([$$obj, $$tabs, $$form, $$loading], vf),
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init(ctx) {
    let { id } = ctx.params;
    return co(function *() {
      $$loading.on();
      let departments = yield departmentStore.list;
      let obj = id? (yield tenantStore.get(id)): {};
      let accountTerms = yield accountTermStore.list;
      copy = R.clone(obj);
      let account = {};
      if (obj.entityId) {
        account = yield accountStore.getByEntityId(obj.entityId);
        console.log(account);
        // 没有关联账户
        if (!account) {
          account = { entityId: obj.entityId };
        }
      }
      $$.update(
        [$$loading, false],
        [$$departments, departments],
        [$$obj, obj],
        [$$account, account],
        [$$accountTerms, accountTerms]
      );
    });
  }
};
