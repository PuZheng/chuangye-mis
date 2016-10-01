import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import { $$dropdown } from '../widget/dropdown';
import { $$searchDropdown } from '../widget/search-dropdown';
import R from 'ramda';
import meterStore from '../store/meter-store';
import constStore from '../store/const-store';
import { $$toast } from '../toast.js';
import page from 'page';
import departmentStore from '../store/department-store';
import co from 'co';

var h = virtualDom.h;

var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$statusList = $$([], 'status-list');
var $$loading = $$(false, 'loading');
var allMeters = [];
var $$departments = $$([], 'departments');
var $$typeList = $$([], 'meter-types');
var $$parentMeters = $$([], 'parent-meters');

var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};


var vf = function ([obj, form, loading]) {
  return h('.object-app' + (loading? '.loading': ''), [
    h('.header' + (dirty(obj)? '.dirty': ''), obj.id? `编辑表设备-${obj.name}`: 
      '创建表设备'),
    form,
  ]);
};

var formVf = function ([obj, errors, statusDropdown, 
                       parentMeterDropdown, departmentDropdown, typeDropdown]) {
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        try {
          yield meterStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        } 
        if (obj.id && !dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '没有任何修改',
          });
          return;
        }
        try {
          $$loading.val(true);
          let id = yield meterStore.save(obj);
          copy = R.clone(obj);
          $$.update(
            [$$loading, false],
            [$$toast, {
              type: 'success',
              message: obj.id? '更新成功': '创建成功',
            }]
          );
          !obj.id && page('/meter/' + id);
        } catch (e) {
          if ((e.response || {}).status == 400) {
            $$errors.val(e.response.data.fields || {});
          }
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    field({
      key: 'name', 
      label: '名称', 
      input: h('input', {
        value: obj.name || '',
        oninput() {
          $$obj.patch({
            name: this.value,
          });
        }
      }), 
      errors,
      required: true
    }),
    field({
      key: 'type', 
      label: '类型', 
      input: typeDropdown, 
      errors,
      required: true
    }),
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
    field({
      key: 'status', 
      label: '状态', 
      input: statusDropdown, 
      errors,
      required: true
    }),
    field({
      key: 'times', 
      label: '倍数', 
      input: h('input', {
        type: 'number',
        placeholder: '请输入倍数',
        value: obj.times,
        onchange() {
          $$obj.patch({ times: this.value });
        }
      }), 
      errors,
      required: true
    }),
    R.ifElse(
      R.compose(R.not, R.propEq('isTotal', true)),
      () => field({
        key: 'parentMeterId', 
        label: '线路', 
        input: parentMeterDropdown, 
        errors,
        required: true
      }),
      R.always('')
    )(obj),
    R.ifElse(
      R.compose(R.not, R.propEq('isTotal', true)),
      () => field({
        key: 'departmentId', 
        label: '部门', 
        input: departmentDropdown, 
        errors,
        required: true
      }),
      R.always('')
    )(obj),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        page('/meter-list');
        e.preventDefault();
        return false;
      }
    }, '返回'),
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

var $$parentMeterDropdown = $$dropdown({
  defaultText: '请选择线路',
  onchange(value) {
    $$obj.patch({
      parentMeterId: value,
    });
  },
  $$options: $$parentMeters.trans(function (list) {
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
  $$value: $$obj.trans(o => o.parentMeterId),
});

var $$typeDropdown = $$dropdown({
  defaultText: '请选择类型',
  onchange(value) {
    $$obj.patch({
      type: value
    });
    $$parentMeters.val(allMeters.filter(m => m.isTotal && m.type == value));
  },
  $$options: $$typeList.trans(function (list) {
    return list.map(it => ({
      value: it,
      text: it,
    }));
  }),
  $$value: $$obj.trans(o => o.type),
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
  [$$obj, $$errors, $$statusDropdown, $$parentMeterDropdown,
    $$departmentDropdown, $$typeDropdown], 
  formVf
);


export default {
  page: {
    $$view: $$.connect([$$obj, $$form, $$loading], vf),
  },
  init(id) {
    $$loading.toggle();
    Promise.all([
      constStore.get(),
      meterStore.fetchList(),
      departmentStore.list,
      id? meterStore.get(id): {}
    ])
    .then(function ([{ meterTypes, meterStatus }, { data: meters }, departments, obj]) {
      copy = R.clone(obj);
      allMeters = meters;
      $$.update(
        [$$loading, false],
        [$$statusList, R.values(meterStatus)],
        [$$typeList, R.values(meterTypes)],
        [$$departments, departments],
        [$$obj, obj]
      );
      obj.id && $$parentMeters.val(allMeters.filter(m => m.isTotal && m.type == obj.type));
    });
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  }
};
