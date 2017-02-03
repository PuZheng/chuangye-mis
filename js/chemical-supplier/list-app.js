import $$ from 'slot';
import { h } from 'virtual-dom';
import $$searchBox from 'widget/search-box';
import $$queryObj from '../query-obj';
import R from 'ramda';
import chemicalSupplierStore from 'store/chemical-supplier-store';

var $$loading = $$(false, 'loading');
var $$totalCnt = $$(0, 'total-cnt');
var $$list = $$([], 'list');

var vf = function ([loading, nameSearchBox]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '化学品供应商列表'),
      h('a.new-btn', {
        href: '/chemical-supplier'
      }, h('i.fa.fa-plus', {
        title: '创建化学品供应商'
      })),
      h('.search', nameSearchBox)
    ])
  ]);
};

var $$nameSearchBox = $$searchBox({
  defaultText: '输入名称或者缩写',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    console.log(kw);
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return chemicalSupplierStore.getHints(kw);
  }
});

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$nameSearchBox], vf);
    },
  },
  init({ query}) {
    $$loading.on();
    chemicalSupplierStore.fetchList(query)
    .then(function ({ data, totalCnt }) {
      $$.update([
        [$$loading, false],
        [$$list, data],
        [$$totalCnt, totalCnt]
      ]);
    });
  }
};
