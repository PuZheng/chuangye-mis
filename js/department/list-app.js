import $$ from 'slot';
import { h } from 'virtual-dom';
import classNames from '../class-names';
import $$tableHints from 'widget/table-hints';
import $$paginator from 'widget/paginator';
import departmentStore from 'store/department-store';
import $$queryObj from '../query-obj';
import $$searchBox from 'widget/search-box';
import R from 'ramda';
import $$dropdown from '../widget/dropdown.js';
import plantStore from '../store/plant-store.js';

const $$loading = $$(false, 'loading');
const $$list = $$([], 'list');
const $$totalCnt = $$(0, 'total-cnt');
const $$plants = $$([], 'plants');

const vf = function ([loading, searchBox, filters, table, tableHints,
                   paginator]) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', [
      h('.title', '车间列表'),
      h('a.new-btn', {
        href: '/department'
      }, h('i.fa.fa-plus', {
        title: '创建车间'
      })),
      h('.search', searchBox)
    ]),
    filters,
    table,
    tableHints,
    h('.paginator-container', paginator),
  ]);
};

const $$mySearchBox = $$searchBox({
  defaultText: '输入名称或者缩写',
  $$searchText: $$queryObj.trans(R.propOr('', 'kw')),
  onsearch(kw) {
    $$queryObj.patch({ kw, page: 1 });
  },
  getHints(kw) {
    return departmentStore.getHints(kw);
  }
});

const $$plantDropdown = $$dropdown({
  defaultText: '选择厂房',
  $$options: $$plants.map(function (plants) {
    return plants.map(function ({ id, name }) {
      return { value: id, text: name };
    });
  }),
  $$value: $$queryObj.map(R.prop('plant_id')),
  onchange(plant_id) {
    $$queryObj.patch({ plant_id, page: 1 });
  }
});

const $$filters = $$.connect([$$plantDropdown], function (filters) {
  return h('.filters', filters);
});

const $$table = $$.connect([$$list], function ([list]) {
  return h('table.compact.striped', [
    h('thead', h('tr', [
      h('th', '名称'),
      h('th', '厂房'),
      h('th', '承包人'),
    ])),
    h('tbody', list.map(function ({ id, name, plant, tenant }) {
      return h('tr', [
        h('td', h('a', {
          href: '/department/' + id,
        }, name)),
        h('td', h('a', {
          href: '/plant/' + plant.id,
        }, plant.name)),
        h('td', R.ifElse(
          R.identity,
          ({ id, entity: { name } }) => h('a', {
            href: '/tenant/' + id,
          }, name),
          R.always('--')
        )(tenant))
      ]);
    })),
  ]);
});

export default {
  page: {
    get $$view() {
      let $$page = $$queryObj.map(R.prop('page'));
      let $$pageSize = $$queryObj.map(R.prop('page_size'));
      let $$myTableHints = $$tableHints({ $$totalCnt, $$page, $$pageSize });
      let $$myPaginator = $$paginator({
        $$totalCnt, $$page, $$pageSize, onNavigate(page) {
          $$queryObj.patch({ page });
        }
      });
      return $$.connect([$$loading, $$mySearchBox, $$filters, $$table,
                        $$myTableHints, $$myPaginator], vf);
    }
  },
  init({ query }) {
    $$loading.on();
    Promise.all([
      departmentStore.fetchList(query),
      plantStore.list,
    ])
    .then(function ([{ totalCnt, data }, plants]) {
      $$.update([
        [$$loading, false],
        [$$totalCnt, totalCnt],
        [$$list, data],
        [$$plants, plants]
      ]);
    });
  }
};
