import $$ from 'slot';
import accountTermStore from 'store/account-term-store';
import R from 'ramda';
import { $$toast } from '../toast';
import moment from 'moment';
import virtualDom from 'virtual-dom';
import overlay from '../overlay';
import Scrollable from '../scrollable';
import $$tabs from 'widget/tabs';
import operatingReportStore from 'store/operating-report-store';
import { SmartGrid } from 'smart-grid';

var h = virtualDom.h;

var $$list = $$([], 'list');
var $$uninitialized = $$([], 'uninitialized');
var $$id = $$(-1, 'id');
var $$activeIdx = $$(0, 'active-idx');

const NUMBER_IN_ADVANCE = 3; // 可以预先创建的月份

var calcUninitialized = function (initialized) {
  let earliestAt = initialized && R.last(initialized);
  if (!earliestAt) {
    return [moment().format('YYYY-MM')];
  }
  let m = moment(earliestAt.name, 'YYYY-MM');
  initialized = initialized.map(function (at) {
    return at.name;
  });
  let earliestYear = m.year();
  let earliestMonth = m.month();
  let thisDayNextMonth = moment().add(NUMBER_IN_ADVANCE, 'month');
  let year = thisDayNextMonth.year();
  let month = thisDayNextMonth.month();
  return Array.from({
    [Symbol.iterator]() { return this; },
    next() {
      if (year > earliestYear ||
          (year === earliestYear && month > earliestMonth)) {
        let value = moment({
          year,
          month,
        }).format('YYYY-MM');
        if (--month == -1) {
          month = 11;
          --year;
        }
        if (~initialized.indexOf(value)) {
          return this.next();
        }
        return {
          value,
        };
      }
      return { done: true };
    }
  });
};

var create = function (at) {
  return function () {
    $$content.val(h('.loading'));
    accountTermStore.save(at)
    .then(function (id) {
      init({ params: { id, active_idx: 0 } });
      $$toast.val({
        type: 'success',
        message: '账期创建成功!',
      });
    }, function (e) {
      console.error(e);
    });
  };
};

var $$content = $$(h('.loading'), 'content');

var scrollableContentVf = ([uninitializedList, list, id]) => {
  let uninitializedListEl = uninitializedList.map(
    at => [
      h('.item.uninitialized', [
        h('.title.color-gray', at + '(未创建)'),
        h('.ops', [
          h('button.ca', {
            onclick: create(at)
          }, '创建'),
        ])
      ]),
    ]
  );
  let listEl = list.map(
    (at) => ([
      h('.item.initialized' + (at.id == id? '.active': ''), [
        h('a', {
          href: '/account-term/' + at.id
        }, (at.closed? '(已关闭)': '') + at.name),
        at.closed?
        void 0:
        h('.ops', [
          h('button.ca', {
            onclick() {
              if (list.filter(function (it) {
                if (it.closed) {
                  return false;
                }
                let m = moment(it.name, 'YYYY-MM');
                return m < moment(at.name, 'YYYY-MM');
              }).length) {
                $$toast.val({
                  type: 'warning',
                  message: '请先关闭更早的账期',
                });
                return false;
              }
              overlay.show({
                type: 'warning',
                title: '您确认要关闭账期(' + at.name + ')?',
                message: [
                  h('ul.p4', [
                    h('li', '该账期内所有的发票将自动通过认证并锁定'),
                    h('li', '该账期内所有的凭证将锁定'),
                  ]),
                  h('button.btn.btn-outline', {
                    onclick() {
                      overlay.dismiss();
                      $$content.val(h('.loading'));
                      accountTermStore.close(at.id)
                      .then(function () {
                        $$toast.val({
                          type: 'success',
                          message: '账期已经关闭'
                        });
                        init({ params: { id: at.id, active_idx: 0 } });
                      })
                      .catch(function (e) {
                        console.error(e);
                        if (R.path(['response', 'status'])(e) == 400) {
                          $$toast.val({
                            type: 'error',
                            duration: 3000,
                            message: '出错了!' +
                              R.path(['response', 'data', 'reason'])(e),
                          });
                        }
                      });

                    }
                  }, '确认')
                ]
              });
            }
          }, '关闭'),
        ])
      ]),
    ])
  );
  return h('.segment', [
    uninitializedListEl,
    listEl,
  ]);
};

var init = function (ctx) {
  let { id, active_idx=0 } = ctx.params;
  $$content.val(h('.loading'));
  accountTermStore.list
  .then(function (list) {
    $$.update([
      [$$list, list],
      [$$uninitialized, calcUninitialized(list)],
      [$$id, id],
    ]);
  });
  switch (active_idx) {
  case 0: {
    operatingReportStore.getByAccountTermId(id)
    .then(function (operatingReport) {
      if (!operatingReport) {
        $$content.val(h('h3', '运营报告尚未生成!'));
      } else {
        let $$smartGrid = new SmartGrid(operatingReport.def, {
          translateLabel: true
        }).$$view;
        $$smartGrid.override($$content).refresh(null, true);
      }
    });
    break;
  }
  default:
    break;
  }
};

export default {
  page: {
    get $$view() {
      let myScrollable = new Scrollable({
        tag: 'aside',
        $$content: $$.connect([$$uninitialized, $$list, $$id],
                              scrollableContentVf)
      });
      let $$myTabs = $$tabs({
        $$tabNames: $$(['车间经营报表']),
        $$activeIdx,
        onchange(idx) {
          $$activeIdx.val(idx);
        },
        $$content,
      });
      return $$.connect(
        [myScrollable.$$view, $$myTabs], function ([scrollable, tabs]) {
          return h('#account-term-app', [
            scrollable,
            tabs
          ]);
        }
      );
    }
  },
  init,
};
