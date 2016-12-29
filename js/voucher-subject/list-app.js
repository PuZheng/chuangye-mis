import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import page from 'page';
import $$searchBox from 'widget/search-box';
import $$queryObj from '../query-obj';
import R from 'ramda';
import voucherSubjectStore from 'store/voucher-subject-store';
import $$dropdown from 'widget/dropdown';
import constStore from 'store/const-store';

var h = virtualDom.h;
var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$entityTypes = $$({}, 'entity-types');

var $$nameSearchBox = $$searchBox({
  defaultText: '输入名称搜索',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return voucherSubjectStore.getHints(kw);
  }
});

var vf = function ([loading, nameSearchBox, filters, table]) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', [
      h('.title', '凭证科目列表'),
      h('button.new-btn', {
        onclick(e) {
          e.preventDefault();
          page('/voucher-subject');
        }
      }, [
        h('i.fa.fa-plus'),
      ]),
      h('.search', nameSearchBox),
    ]),
    filters,
    table
  ]);
};

var tableVf = function ([list]) {
  return h('table.table.compact.striped', [
    h('thead', [
      h('tr', [
        h('th', '编号'),
        h('th', '名称'),
        h('th', '进入总账'),
        h('th', '支付方类型'),
        h('th', '收入方类型'),
      ])
    ]),
    h('tbody', list.map(function (obj) {
      return h('tr', [
        h('td', h('a', {
          href: '/voucher-subject/' + obj.id,
        }, '' + obj.id)),
        h('td', obj.name),
        h('td', R.ifElse(
          o => o.isPublic,
          R.always(h('i.fa.fa-check.color-success')),
          R.always(h('i.fa.fa-remove'))
        )(obj)),
        h('td', obj.payerType),
        h('td', obj.recipientType),
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$list], tableVf);

var $$payerTypeDropdown = $$dropdown({
  defaultText: '选择支付方类型',
  onchange(value) {
    $$queryObj.patch({ payer_type: value });
  },
  $$value: $$queryObj.trans(R.prop('payer_type')),
  $$options: $$entityTypes.trans(R.values),
});

var $$recipientTypeDropdown = $$dropdown({
  defaultText: '选择收入方类型',
  onchange(value) {
    $$queryObj.patch({ recipient_type: value });
  },
  $$value: $$queryObj.trans(R.prop('recipient_type')),
  $$options: $$entityTypes.trans(R.values),
});

var $$isPublicCheckbox = $$.connect([$$queryObj], function ([qo]) {
  return h('.checkbox', [
    h('input', {
      type: 'checkbox',
      checked: qo.only_public,
      onchange() {
        $$queryObj.patch({ only_public: this.checked? '1': '' });
      }
    }),
    h('label', {
      onclick() {
        $$queryObj.patch({ only_public: qo.only_public? '': '1' });
      }
    }, '只看进入总账'),
  ]);
});

var filtersVf = function (
  [payerTypeDropdown, recipientTypeDropdown, isPublicCheckbox]
) {
  return h('.filters', [
    payerTypeDropdown,
    recipientTypeDropdown,
    isPublicCheckbox,
  ]);
};

var $$filters = $$.connect(
  [$$payerTypeDropdown, $$recipientTypeDropdown, $$isPublicCheckbox],
  filtersVf
);

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$nameSearchBox, $$filters, $$table], vf);
    }
  },
  init(ctx) {
    $$loading.val(true);
    Promise.all([
      voucherSubjectStore.fetchList(ctx.query),
      constStore.get()
    ])
    .then(function ([list, { ENTITY_TYPES }]) {
      $$.update(
        [$$loading, false],
        [$$list, list],
        [$$entityTypes, ENTITY_TYPES]
      );
    });
  }
};
