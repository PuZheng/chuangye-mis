import $$ from '../xx';
import virtualDom from 'virtual-dom';
import { $$loading, $$voucherTypes, $$voucherSubjects } from './data-slots';
import classNames from '../class-names';
import oth from '../oth';
import getColOrder from '../get-col-order';
import $$queryObj from '../query-obj';
import page from 'page';
import config from '../config.js';
import $$tableHints from '../widget/table-hints';
import $$paginator from '../widget/paginator';
import $$searchBox from '../widget/search-box';
import $$dropdown from '../widget/dropdown';
import $$searchDropdown from '../widget/search-dropdown';
import voucherStore from '../store/voucher-store';

var h = virtualDom.h;

var $$vouchers = $$([], 'vouchers');

var $$numberFilter = $$searchBox({
  defaultText: '请输入凭证号',
  $$searchText: $$queryObj.trans(qo => qo.number__like || ''),
  onsearch(text) {
    $$queryObj.patch({
      number__like: text,
    });
  },
  getHints(text) {
    return voucherStore.getHints(text);
  },
  minLen: 2
});

var $$dateFilter = $$dropdown({
  defaultText: '请选择日期范围',
  onchange(v) {
    $$queryObj.patch({
      date_span: v,
    });
  },
  $$options: $$([
    { value: '', text: '不限日期' },
    { value: 'in_7_days', text: '7日内' },
    { value: 'in_30_days', text: '30日内' },
    { value: 'in_90_days', text: '90日内' },
  ], 'options'),
  $$value: $$queryObj.trans(qo => qo.date_span, 
                            'date_span'),
});

var $$typeFilter = $$dropdown({
  defaultText: '请选择凭证类型',
  onchange(v) {
    $$queryObj.patch({
      voucher_type_id: v,
    });
  },
  $$options: $$voucherTypes.trans(function (list) {
    return list.map(function (vt) {
      return {
        value: vt.id,
        text: vt.name,
      };
    });
  }),
  $$value: $$queryObj.trans(qo => qo.voucher_type_id, 
                           'voucher-type'),
});

var $$subjectFilter = $$searchDropdown({
  defaultText: '请选择项目',
  $$value: $$queryObj.trans(qo => qo.voucher_subject_id,
                           'voucher-subject'),
  $$options: $$voucherSubjects.trans(
    list => list.map(vs => ({
      value: vs.id,
      text: vs.name,
      acronym: vs.acronym,
    })),
  'voucher-subjects'),
  onchange(v) {
    $$queryObj.patch({
      voucher_subject_id: v,
    });
  }
});

var $$entities = $$([], 'entities');

var $$payerFilter = $$searchDropdown({
  defaultText: '请选择支付方',
  $$value: $$queryObj.trans(qo => qo.payer_id, 
                           'payer'),
  $$options: $$entities.trans(
    list => list.map(e => ({
      value: e.id,
      text: e.name,
      acronym: e.acronym,
    })), 'entities'
  ),
  onchange(v) {
    $$queryObj.patch({
      payer_id: v,
    });
  }
});

var $$recipientFilter = $$searchDropdown({
  defaultText: '请选择支付方',
  $$value: $$queryObj.trans(qo => qo.recipient_id, 
                           'recipient'),
  $$options: $$entities.trans(
    list => list.map(e => ({
      value: e.id,
      text: e.name,
      acronym: e.acronym,
    })), 'entities'
  ),
  onchange(v) {
    $$queryObj.patch({
      recipient_id: v,
    });
  }
});

var filtersVf = function (
  numberFilter, dateFilter, typeFilter, subjectFilter,
  payerFilter, recipientFilter
) {
  return h('.filters', [
    numberFilter,
    dateFilter,
    typeFilter,
    subjectFilter,
    payerFilter,
    recipientFilter
  ]); 
};

var $$filters = $$.connect([
  $$numberFilter, $$dateFilter, $$typeFilter, 
  $$subjectFilter, $$payerFilter, $$recipientFilter], 
filtersVf);

var $$idOth = function () {
  let vf = function (queryObj) {
    return oth({
      label: '编号', 
      order: getColOrder('id', queryObj), 
      onchange(order) {
        $$queryObj.patch({
          sort_by: 'id.' + order,
        });
      }
    });
  };
  return $$.connect([$$queryObj], vf);
}();

var $$dateOth = function () {
  let vf = function (queryObj) {
    return oth({
      label: '日期',
      order: getColOrder('date', queryObj),
      onchange(order) {
        $$queryObj.patch({
          sort_by: 'date.' + order,
        });
      }
    });
  };
  return $$.connect([$$queryObj], vf);
}();

var tableVf = function (vouchers, idOth, dateOth) {
  return h('table.table.striped.compact', [
    h('thead', [
      h('tr', [
        idOth, 
        h('th', '凭证号'),
        dateOth,
        h('th', '类型'),
        h('th', '项目'),
        h('th', '支付方'),
        h('th', '收入方'),
        h('th', '经办人'),
      ]),
    ]),
    h('tbody', vouchers.map(function (v) {
      return h('tr', [
        h('td', [
          h('a', {
            href: '/voucher/' + v.id,
            onclick() {
              page('/voucher/' + v.id);
            }
          }, v.id),
        ]),
        h('td', v.number),
        h('td', v.date),
        h('td', v.voucherType.name),
        h('td', v.voucherSubject.name),
        h('td', v.payer.name),
        h('td', v.recipient.name),
        h('td', v.creator.name)
      ]);
    })),
  ]);
};

var $$table = $$.connect([$$vouchers, $$idOth, $$dateOth], tableVf);

var $$totalCnt = $$(0, 'totalCnt');


var viewVf = function (loading, table, paginator, tableHints, 
                      filters) {
  return h(classNames('.list-app', loading && 'loading'), [
    h('.header', '资金类凭证列表'),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$loading, $$table, $$paginator({
      $$totalCnt,
      $$queryObj,
      pageSize: config.getPageSize('voucher'),
    }),
    $$tableHints({
      $$totalCnt,
      $$queryObj,
      pageSize: config.getPageSize('voucher'),
    }), $$filters], viewVf)
  },
  $$vouchers,
  $$loading,
  $$totalCnt,
  $$voucherTypes,
  $$voucherSubjects,
  $$entities,
};
