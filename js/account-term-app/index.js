import $$ from 'slot';
import accountTermStore from 'store/account-term-store';
import R from 'ramda';
import { $$toast } from '../toast';
import moment from 'moment';
import virtualDom from 'virtual-dom';
import overlay from '../overlay';

var h = virtualDom.h;

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$uninitialized = $$([], 'uninitialized');

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
    accountTermStore.save(at)
    .then(function () {
      init();
      $$toast.val({
        type: 'success',
        message: '账期创建成功!',
      });
    }, function (e) {
      console.error(e);
    });
  };
};

var vf = ([uninitializedList, list]) => {
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
      h('.item.initialized', [
        (at.closed? '(已关闭)': '') + at.name,
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
                      accountTermStore.close(at.id)
                      .then(function () {
                        $$toast.val({
                          type: 'success',
                          message: '账期已经关闭'
                        });
                        init();
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
  return h('.list-app.account-term-list', [
    h('.header', [
      h('.title', '账期列表'),
    ]),
    h('.segment.large', [
      uninitializedListEl,
      listEl,
    ])
  ]);
};

var init = function () {
  $$loading.val(true);
  accountTermStore.list
  .then(function (list) {
    $$.update([
      [$$loading, false],
      [$$list, list],
      [$$uninitialized, calcUninitialized(list)]
    ]);
  });
};

export default {
  page: {
    get $$view() {
      return $$.connect([$$uninitialized, $$list], vf);
    }
  },
  init,
};
