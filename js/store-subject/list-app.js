import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import page from 'page';
import $$searchBox from '../widget/search-box';
import $$queryObj from '../query-obj';
import R from 'ramda';
import storeSubjectStore from '../store/store-subject-store';

var $$loading = $$(false, 'loading');
var h = virtualDom.h;
var $$list = $$([], 'list');

var vf = function ([loading, searchBox, table]) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', [
      h('.title', '仓储科目列表'),
      h('button.new-btn', {
        onclick() {
          page('/store-subject');
        }
      }, h('i.fa.fa-plus')),
      h('.search', searchBox),
      table,
    ])
  ]);
};

var tableVf = function ([list]) {
  return h('table' + classNames('table', 'striped', 'compact', 'color-gray-dark'), [
    h('thead', h('tr', [
      h('th', '名称'),
      h('th', '单位'),
      h('th', '缩写'),
    ])),
    h('tbody', list.map(function (it) {
      return h('tr', [
        h('td', h('a', {
          href: '/store-subject/' + it.id,
          onclick(e) {
            e.preventDefault();
            page(this.href);
          }
        }, it.name)),
        h('td', it.unit),
        h('td', it.acronym),
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$list], tableVf);

export default {
  page: {
    $$view: $$.connect([
      $$loading, 
      $$searchBox({
        defaultText: '按名称搜索',
        $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
        onsearch(kw) {
          $$queryObj.patch({ kw });
        },
        getHints(kw) {
          return storeSubjectStore.getHints(kw);
        }
      }),
      $$table,
    ], vf)
  },
  init(ctx) {
    $$loading.val(true);
    storeSubjectStore.fetchList(ctx.query)
    .then(function (list) {
      $$.update(
        [$$loading, false],
        [$$list, list]
      );
    });
  }
};
