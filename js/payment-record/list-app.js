import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$tableHints from 'widget/table-hints';
import $$queryObj from '../query-obj';
import config from '../config';
import $$paginator from 'widget/paginator';
import moment from 'moment';
import R from 'ramda';
import paymentRecordStore from 'store/payment-record-store';
import constStore from 'store/const-store';
import $$actionButton from 'widget/action-button';
import overlay from '../overlay';
import $$searchDropdown from 'widget/search-dropdown';
import $$dropdown from 'widget/dropdown';
import accountTermStore from 'store/account-term-store';
import departmentStore from 'store/department-store';

var { h } = virtualDom;

var $$totalCnt = $$(0, 'total-cnt');
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');
var $$accountTerms = $$([], 'account-terms');
var $$departments = $$([], 'departments');
var $$PAYMENT_RECORD_TYPES = $$({}, 'PAYMENT_RECORD_TYPES');
var $$PAYMENT_RECORD_STATES = $$({}, 'PAYMENT_RECORD_STATES');

var vf = function vf([loading, filters, table, tableHints, paginator]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '扣费记录列表'),
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator)
  ]);
};

var filtersVf = function filtersVf(
  [accountTermFilter, departmentDropdown, typeDropdown, statusDropdown]
) {
  return h('.filters', [
    accountTermFilter,
    departmentDropdown,
    typeDropdown,
    statusDropdown,
  ]);
};

var tableVf = function tableVf([list, ...actionButtons]) {
  return h('table.compact.striped', [
    h('thead', h('tr', [

      h('th', 'id'),
      h('th', '车间'),
      h('th', '金额(元)'),
      h('th', '税金(元)'),
      h('th', '账期'),
      h('th', '创建于'),
      h('th', '状态'),
      h('th', '支付凭证'),
      h('th', '类型'),
      h('th', '操作'),
    ])),
    h('tbody', R.zip(list, actionButtons).map(function ([it, actionButton]) {
      return h('tr', [
        h('td', h('a', {
          href: '/payment-record/object/' + it.id,
        }, it.id)),
        h('td', it.department.name),
        h('td', String(it.amount)),
        h('td', String(it.tax)),
        h('td', it.accountTerm.name),
        h('td', moment(it.created).format('YY-MM-DD')),
        h('td', it.status),
        h('td', R.ifElse(
          R.prop('voucherId'),
          paymentRecord => h('a', {
            href: '/voucher/object' + paymentRecord.voucherId,
          }, paymentRecord.voucher.number),
          R.always('--')
        )(it)),
        h('td', it.type),
        h('td', actionButton),
      ]);
    })),
  ]);
};

var $$accountTermFilter = $$searchDropdown({
  defaultText: '请选择账期',
  $$value: $$queryObj.map(R.propOr('', 'account_term_id')),
  $$options: $$accountTerms.map(R.map(function (it) {
    return {
      value: it.id,
      text: it.name
    };
  })),
  onchange(account_term_id) {
    $$queryObj.patch({ account_term_id });
  }
});

var $$departmentDropdown = $$searchDropdown({
  defaultText: '请选择车间',
  $$value: $$queryObj.map(R.propOr('', 'department_id')),
  $$options: $$departments.map(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym,
  }))),
  onchange(department_id) {
    $$queryObj.patch({ department_id });
  }
});

var $$typeDropdown = $$dropdown({
  defaultText: '请选择类型',
  $$value: $$queryObj.map(R.propOr('', 'type')),
  $$options: $$PAYMENT_RECORD_TYPES.map(R.values),
  onchange(type) {
    $$queryObj.patch({ type });
  }
});

var $$statusDropdown = $$dropdown({
  defaultText: '请选择状态',
  $$value: $$queryObj.map(R.propOr('', 'status')),
  $$options: $$PAYMENT_RECORD_STATES.map(R.values),
  onchange(status) {
    $$queryObj.patch({ status });
  }
});

var $$filters = $$.connect(
  [$$accountTermFilter, $$departmentDropdown, $$typeDropdown, $$statusDropdown],
  filtersVf
);
var $$table = $$('', 'table');

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$filters, $$table, $$tableHints({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('paymentRecord')
      }), $$paginator({
        $$totalCnt,
        $$queryObj,
        pageSize: config.getPageSize('paymentRecord')
      })], vf);
    },
  },
  init(ctx) {
    $$loading.on();
    Promise.all([
      paymentRecordStore.fetchList(ctx.query),
      constStore.get(),
      accountTermStore.list,
      departmentStore.list,
    ])
    .then(function (
      [{ totalCnt, data, },
        { PAYMENT_RECORD_ACTIONS, PAYMENT_RECORD_TYPES, PAYMENT_RECORD_STATES },
        accountTerms, departments]
    ) {
      let $$actionsButtons = data.map(function (it) {
        return $$actionButton({
          defaultActionIdx: R.indexOf(PAYMENT_RECORD_ACTIONS.PASS)(it.actions),
          items: it.actions,
          ontrigger(action) {
            switch (action) {
            case PAYMENT_RECORD_ACTIONS.PASS: {
              overlay.show({
                type: 'warning',
                title: '您确认要通过该预扣费记录?',
                message: [
                  h('h3', '预扣费记录通过后, 将自动从承包人账户扣款'),
                  h('button.ca.btn.btn-outline', {
                    onclick() {
                      paymentRecordStore.pass(it.id)
                      .then(function () {
                      });
                    }
                  }, '确认')
                ]
              });
              break;
            }
            case PAYMENT_RECORD_ACTIONS.REJECT: {
              overlay.show({
                type: 'warning',
                title: '您确认要驳回该预扣费记录?',
                message: [
                  h('h3', '预扣费记录被驳回后, 不能对承包人进行相应扣款'),
                  h('button.ca.btn.btn-outline', {
                    onclick() {
                      paymentRecordStore.reject(it.id)
                      .then(function () {
                      });
                    }
                  }, '确认')
                ]
              });
              break;
            }
            default:
              break;
            }
          }
        });
      });
      $$table.connect([$$list, ...$$actionsButtons], tableVf);
      $$.update(
        [$$loading, false],
        [$$totalCnt, totalCnt],
        [$$list, data],
        [$$accountTerms, accountTerms],
        [$$departments, departments],
        [$$PAYMENT_RECORD_TYPES, PAYMENT_RECORD_TYPES],
        [$$PAYMENT_RECORD_STATES, PAYMENT_RECORD_STATES]
      );
    });
  }
};
