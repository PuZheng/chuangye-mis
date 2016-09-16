import $$ from 'slot';
import accountTermStore from 'store/account-term-store';
import R from 'ramda';
import { $$toast } from 'toast';
import moment from 'moment';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import virtualDom from 'virtual-dom';

var h = virtualDom.h;

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$uninitialized = $$([], 'uninitialized');

var calcUninitialized = function (initialized) {
  let latestAt = initialized && initialized[0];
  if (!latestAt) {
    return [moment().format('YYYY-MM')];
  }
  let m = moment(latestAt.name, 'YYYY-MM');
  let latestYear = m.year();
  let latestMonth = m.month();
  let year = moment().year();
  let month = moment().month();
  return Array.from({
    [Symbol.iterator]() { return this; },
    next() {
      if (year > latestYear || (year === latestYear && month > latestMonth)) {
        let value = moment({
          year,
          month,
        }).format('YYYY-MM');
        if (--month === 0) {
          month = 11;
          --year;
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
    debugger;
    accountTermStore.save(at)
    .then(function () {
      init();
      $$toast.val({
        type: 'success',
        message: '账期创建成功!',
      });
    }, function (e) {
      debugger;
      overlay.$$content.val({
        type: 'error',
        title: '很不幸, 出错了!',
        message: axiosError2Dom(e),
      });
    });
  };
};

var vf = ([uninitializedList, list]) => {
  let uninitializedListEl = uninitializedList.map(
    at => [
      h('.uninitialized', [
        h('.title.color-gray', at + '(未创建)'),
        h('.ops', [
          h('button.ml4.btn.btn-outline.border-color-gray.ca', {
            onclick: create(at)
          }, '创建'),
        ])
      ]),
      h('.divider'),
    ]
  );
  let listEl = list.map(
    (at, idx) => ([
      h('.initialized', at.name),
      R.ifElse(
        R.equals(list.length - 1),
        R.always(''),
        R.always(h('.divider'))
      )(idx),
    ])
  );
  return h('.list-app.account-term-list', [
    h('.header', [
      h('.title', '账期列表'),
    ]),
    h('.segment', [
      uninitializedListEl,
      listEl,
    ])
  ]);
};

var $$view = $$.connect([$$uninitialized, $$list], vf);

var init = function () {
  $$loading.val(true);
  accountTermStore.list
  .then(function (list) {
    $$.update(
      [$$loading, false],
      [$$list, list],
      [$$uninitialized, calcUninitialized(list)]
    );
  });
};

export default {
  page: {
    $$view,
  },
  init,
};
