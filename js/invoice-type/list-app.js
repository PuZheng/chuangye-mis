import $$ from 'slot';
import virtualDom from 'virtual-dom';
import page from 'page';
import $$searchBox from 'widget/search-box';
import $$queryObj from '../query-obj';
import invoidTypeStore from 'store/invoice-type-store';
import $$dropdown from 'widget/dropdown';
import R from 'ramda';
import constStore from 'store/const-store';

var h = virtualDom.h;

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$entityTypes = $$({}, 'entity-types');

var $$nameSearchBox = $$searchBox({
  defaultText: '输入名称搜索',
  $$searchText: $$queryObj.trans(qo => qo.kw || ''),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return invoidTypeStore.getHints(kw);
  }
});

var tableVf = function ([list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', '编号'),
        h('th', '名称'),
        h('th', '销售方类型'),
        h('th', '购买方类型'),
        h('th', '是否增值税'),
        h('th', '仓储类型'),
        h('th', '仓储方向'),
        h('th', '相关凭证科目')
      ])
    ]),
    h('tbody', list.map(function (obj) {
      return h('tr', [
        h('td', h('a', {
          href: '/invoice-type/' + obj.id,
        }, '' + obj.id)),
        h('td', obj.name),
        h('td', obj.vendorType || '--'),
        h('td', obj.purchaserType || '--'),
        h('td',
          obj.isVat? h('i.fa.fa-check.color-success'): h('i.fa.fa-remove')),
        h('td', obj.storeOrderType || '--'),
        h('td', obj.storeOrderDirections || '--'),
        h('td', (obj.relatedVoucherSubject || {}).name || '--'),
      ]);
    }))
  ]);
};

var $$table = $$.connect([$$list], tableVf);

let vf = function ([loading, nameSearchBox, table, filters]) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '发票类型列表'),
      h('button.new-btn', {
        onclick() {
          page('/invoice-type');
        }
      }, [
        h('i.fa.fa-plus'),
      ]),
      h('.search', nameSearchBox)
    ]),
    filters,
    table,
  ]);
};

var filtersVf = function (
  [vendorTypeDropdown, purchaserTypeDropdown, isVatFilter]
) {
  return h('.filters', [
    vendorTypeDropdown,
    purchaserTypeDropdown,
    isVatFilter,
  ]);
};

var $$vendorTypeDropdown = $$dropdown({
  defaultText: '选择销售方类型',
  $$options: $$entityTypes.trans(R.values),
  $$value: $$queryObj.trans(qo => qo.vendor_type),
  onchange(value) {
    $$queryObj.patch({ vendor_type: value });
  }
});

var $$purchaserTypeDropdown = $$dropdown({
  defaultText: '选择购买方类型',
  $$options: $$entityTypes.trans(R.values),
  $$value: $$queryObj.trans(qo => qo.purchaser_type),
  onchange(value) {
    $$queryObj.patch({ purchaser_type: value });
  }
});

var $$isVatFilter = $$.connect([$$queryObj], function ([qo]) {
  return h('.checkbox', [
    h('input', {
      type: 'checkbox',
      checked: qo.only_vat == '1',
      onchange() {
        $$queryObj.patch({
          only_vat: this.checked? '1': ''
        });
      }
    }),
    h('label', {
      onclick() {
        $$queryObj.val({
          only_vat: qo.only_vat == '1'? '': '1'
        });
      }
    }, '只看增值税类型'),
  ]);
});


var $$filters = $$.connect(
  [$$vendorTypeDropdown, $$purchaserTypeDropdown, $$isVatFilter],
  filtersVf
);

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$nameSearchBox, $$table, $$filters], vf);
    }
  },
  init(ctx) {
    $$loading.toggle();
    Promise.all([
      invoidTypeStore.fetchList(ctx.query),
      constStore.get()
    ])
    .then(function ([list, { entityTypes }]) {
      $$.update(
        [$$loading, false],
        [$$list, list],
        [$$entityTypes, entityTypes]
      );
    });
  }
};
