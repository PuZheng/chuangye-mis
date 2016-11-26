import $$ from 'slot';
import virtualDom from 'virtual-dom';
import $$searchBox from 'widget/search-box';
import R from 'ramda';
import $$queryObj from '../query-obj';
import partnerStore from 'store/partner-store';
import entityStore from 'store/entity-store';
import $$paginator from '../widget/paginator';
import $$tableHints from '../widget/table-hints';
import config from '../config';
import $$myOth from 'widget/my-oth';

var { h } = virtualDom;
var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');
var $$totalCnt = $$(0, 'total-cnt');

var vf = function (
  [nameSearchBox, table, queryObj, loading, tableHints, paginator]
) {
  return h('.list-app' + (loading? '.loading': ''), [
    h('.header', [
      h('.title', '往来户列表-' + queryObj.type),
      h('a.new-btn', {
        href: '/partner?type=' + queryObj.type,
      }, h('i.fa.fa-plus', {
        title: '创建往来户'
      })),
      h('.search', nameSearchBox)
    ]),
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

var $$nameSearchBox = $$searchBox({
  defaultText: '请输入往来户名称',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return entityStore.getHints(kw, $$queryObj.val());
  }
});

var $$idOth = $$myOth({ label: '编号', column: 'id' });
var $$enabledOth = $$myOth({ label: '是否激活', column: 'enabled' });

var tableVf = function tableVf([idOth, enabledOth, list]) {
  return h('table.table.striped.compact', [
    h('thead', [
      h('tr', [
        idOth,
        h('th', '名称'),
        h('th', '地址'),
        h('th', '税号'),
        h('th', '开户行'),
        h('th', '银行账号'),
        h('th', '联系方式'),
        enabledOth,
      ]),
    ]),
    h('tbody', list.map(function (it) {
      return h('tr', [
        h('td', h('a', {
          href: '/partner/' + it.id,
        }, it.id)),
        h('td', h('a', {
          href: '/partner/' + it.id,
        }, it.entity.name)),
        h('td', it.address),
        h('td', it.taxNumber),
        h('td', it.bank),
        h('td', it.account),
        h('td', it.contact),
        h('td', it.enabled? h('i.fa.fa-check.color-success'):
          h('i.fa.fa-remove'))
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$idOth, $$enabledOth, $$list], tableVf);

export default {
  page: {
    $$view: $$.connect(
      [
        $$nameSearchBox, $$table, $$queryObj, $$loading,
        $$tableHints({
          $$totalCnt,
          $$queryObj,
          pageSize: config.getPageSize('meter'),
        }),
        $$paginator({
          $$totalCnt,
          $$queryObj,
          pageSize: config.getPageSize('meter'),
        })
      ],
      vf
    ),
  },
  init(ctx) {
    $$loading.on();
    partnerStore.fetchList(ctx.query)
    .then(function ({ data, totalCnt, }) {
      $$.update(
        [$$loading, false],
        [$$list, data],
        [$$totalCnt, totalCnt]
      );
    });
  }
};
