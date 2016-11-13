import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import $$searchDropdown from '../widget/search-dropdown';
import tenantStore from '../store/tenant-store.js';
import { $$toast } from '../toast.js';
import page from 'page';
import R from 'ramda';
import departmentStore from '../store/department-store';
import co from 'co';
import acronym from '../utils/acronym';

var h = virtualDom.h;
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$departments = $$([], 'departments');
var $$loading = $$(false, 'loading');
var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};

var $$departmentDropdown = $$searchDropdown({
  defaultText: '请选择车间',
  $$options: $$departments.trans(function (l) {
    return l.map(function (d) {
      return {
        value: d.id,
        text: d.name,
        acronym: d.acronym,
      };
    });
  }),
  $$value: $$obj.trans(t => t.departmentId),
  onchange(v) {
    $$obj.patch({
      departmentId: v,
    });
  }
});

var formVf = function ([errors, departmentDropdown, obj]) {
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        try {
          yield tenantStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '没有任何变化',
          });
          return;
        }
        try {
          $$loading.toggle();
          let { id=obj.id } = yield tenantStore.save(obj);
          copy = R.clone(obj);
          $$toast.val({
            type: 'success',
            message: obj.id? '更新成功': '承包人创建成功',
          });
          obj.id && page('/tenant/' + id);
        } catch (e) {
          console.error(e);
          if (e.response && e.response.status == 400)  {
            $$errors.val(e.response.data.fields || {});
            return;
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
      label: '姓名',
      input: h('input', {
        value: (obj.entity || {}).name,
        oninput() {
          $$obj.patch({
            entity: Object.assign(obj.entity || {}, {
              name: this.value,
              acronym: acronym(this.value)
            }),
          });
        }
      }),
      errors,
      required: true
    }),
    field({
      key: 'acronym',
      label: '缩写',
      input: h('input', {
        value: (obj.entity || {}).acronym,
        oninput() {
          $$obj.patch({
            entity: Object.assign(obj.entity || {}, {
              acronym: this.value,
            })
          });
        }
      }),
      errors,
      required: true,
    }),
    field({
      key: 'contact',
      label: '联系方式',
      input: h('input', {
        value: obj.contact,
        oninput() {
          $$obj.patch({
            contact: this.value,
          });
        }
      }),
      errors,
    }),
    field({
      key: 'departmentId',
      label: '车间',
      input: departmentDropdown,
      errors,
      required: true
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        page('/tenant-list');
        e.preventDefault();
        return false;
      }
    }, '返回'),
  ]);
};

var $$form = $$.connect([$$errors, $$departmentDropdown, $$obj], formVf);


var vf = function ([obj, form, loading]) {
  return h('.object-app' + (loading? '.loading': ''), [
    h('.header' + (dirty(obj)? '.dirty': ''), obj.id? `编辑承包人-${obj.entity.name}`: '创建承包人'),
    form,
  ]);
};


export default {
  page: {
    $$view: $$.connect([$$obj, $$form, $$loading], vf),
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init(ctx) {
    let { id } = ctx.params;
    $$loading.toggle();
    Promise.all([
      departmentStore.list,
      id? tenantStore.get(id): {}
    ])
    .then(function ([departments, obj]) {
      copy = R.clone(obj);
      $$.update(
        [$$loading, false],
        [$$departments, departments],
        [$$obj, obj]
      );
    });
  }
};
