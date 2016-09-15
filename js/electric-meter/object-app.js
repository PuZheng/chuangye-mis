import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import { $$dropdown } from '../widget/dropdown';
import { $$searchDropdown } from '../widget/search-dropdown';
import R from 'ramda';
import electricMeterStore from '../store/electric-meter-store';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast.js';
import page from 'page';
import departmentStore from '../store/department-store';

var h = virtualDom.h;

var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$statusList = $$([], 'status-list');
var $$loading = $$(false, 'loading');
var $$electricMeters = $$([], 'electric-meters');
var $$departments = $$([], 'departments');

var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};

var vf = function ([obj, form, loading]) {
  return h('.object-app' + (loading? '.loading': ''), [
    h('.header' + (dirty(obj)? '.dirty': ''), obj.id? `编辑电表-${obj.name}`: 
      '创建电表'),
    form,
  ]);
};

var formVf = function ([obj, errors, statusDropdown, 
                       parentElectricMeterDropdown, departmentDropdown]) {
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      electricMeterStore
      .validate(obj)
      .then(function (obj) {
        if (obj.id && !dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '没有任何修改',
          });
          return;
        }
        $$loading.val(true);
        electricMeterStore.save(obj)
        .then(function (id) {
          copy = R.clone(obj);
          $$.update(
            [$$loading, false],
            [$$toast, {
              type: 'success',
              message: obj.id? '更新成功' :'创建成功',
            }]
          );
          !obj.id && page('/electric-meter/' + id);
        }, function (e) {
          $$loading.val(false);
          if (e.response.status == 403) {
            $$errors.val(e.response.data.fields || {});
            return;
          }
          overlay.$$content.val({
            type: 'error',
            title: '很不幸, 出错了!',
            message: axiosError2Dom(e),
          });
        });
      }, function (e) {
        $$errors.val(e);
      });
      return false;
    }
  }, [
    field('name', '名称', h('input', {
      value: obj.name || '',
      oninput() {
        $$obj.patch({
          name: this.value,
        });
      }
    }), errors, true),
    h('.field.inline', [
      h('input', {
        type: 'checkbox',
        checked: obj.isTotal,
        onchange() {
          $$obj.patch({ isTotal: this.checked });
        }
      }),
      h('label', '是否总线'),
    ]),
    field('status', '状态', statusDropdown, errors, true),
    field('times', '倍数', h('input', {
      type: 'number',
      placeholder: '请输入倍数',
      value: obj.times,
      onchange() {
        $$obj.patch({ times: this.value });
      }
    }), errors, true),
    R.ifElse(
      R.compose(R.not, R.propEq('isTotal', true)),
      () => field('parentElectricMeterId', '线路', parentElectricMeterDropdown, errors, true),
      () => ''
    )(obj),
    R.ifElse(
      R.compose(R.not, R.propEq('isTotal', true)),
      () => field('departmentId', '部门', departmentDropdown, errors, true),
      () => ''
    )(obj),
    h('hr'),
    h('button.primary', '提交'),
  ]);
};

var $$statusDropdown = $$dropdown({
  defaultText: '请选择状态',
  onchange(value) {
    $$obj.patch({ status: value });
  },
  $$options: $$statusList.trans(function (list) {
    return list.map(function (it) {
      return {
        value: it,
        text: it
      };
    });
  }),
  $$value: $$obj.trans(o => o.status),
});

var $$parentElectricMeterDropdown = $$dropdown({
  defaultText: '请选择线路',
  onchange: function (value) {
    $$obj.patch({
      parentElectricMeterId: value,
    });
  },
  $$options: $$electricMeters.trans(function (list) {
    return list.filter(function (it) {
      return it.isTotal;
    })
    .map(function (it) {
      return {
        value: it.id,
        text: it.name,
      };
    });
  }),
  $$value: $$obj.trans(o => o.parentElectricMeterId),
});

var $$departmentDropdown = $$searchDropdown({
  defaultText: '请选择部门',
  onchange(value) {
    $$obj.patch({
      departmentId: value
    });
  },
  $$value: $$obj.trans(o => o.departmentId),
  $$options: $$departments.trans(function (list) {
    return list.map(function (it) {
      return {
        value: it.id,
        text: it.name,
        acronym: it.acronym,
      };
    });
  }),
});

var $$form = $$.connect(
  [$$obj, $$errors, $$statusDropdown, $$parentElectricMeterDropdown,
    $$departmentDropdown], 
  formVf
);


export default {
  page: {
    $$view: $$.connect([$$obj, $$form, $$loading], vf),
  },
  $$obj,
  $$statusList,
  $$loading,
  $$departments,
  $$electricMeters,
  init(id) {
    $$loading.toggle();
    Promise.all([
      electricMeterStore.statusList,
      electricMeterStore.fetchList(),
      departmentStore.list,
      id? electricMeterStore.get(id): {}
    ])
    .then(function ([statusList, { data: electricMeters }, departments, obj]) {
      copy = R.clone(obj);
      $$.update(
        [$$loading, false],
        [$$statusList, statusList],
        [$$electricMeters, electricMeters],
        [$$departments, departments],
        [$$obj, obj]
      );
    });
  }
};
