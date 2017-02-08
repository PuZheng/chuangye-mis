import $$ from 'slot';
import { h } from 'virtual-dom';
import field from '../field';
import page from 'page';
import acronym from '../utils/acronym';
import { $$toast } from '../toast';
import departmentStore from '../store/department-store';
import co from 'co';
import { ValidationError } from '../validate-obj';
import $$dropdown from '../widget/dropdown.js';
import R from 'ramda';
import plantStore from '../store/plant-store.js';

const $$errors = $$({}, 'errors');
const $$obj = $$({}, 'obj');
const $$loading = $$(false, 'loading');
const $$plants = $$([], 'plants');
let copy = {};

const dirty = function dirty(obj) {
  console.log(obj, copy);
  return !R.equals(obj, copy);
};

const vf = function ([obj, errors, loading, plantDropdown]) {
  return h('.object-app', [
    h('.header' + (dirty(obj)? '.dirty': ''),
      obj.id? '编辑车间(' + obj.name + ')':'创建车间'),
    h('form.form' + (loading? '.loading': ''), [
      field({
        key: 'name',
        label: '车间名称',
        input: h('input', {
          placeholder: '输入车间名称',
          value: obj.name,
          oninput() {
            $$obj.patch({
              name: this.value,
              acronym: acronym(this.value),
            });
          }
        }),
        errors,
        required: true
      }),
      field({
        key: 'acronym',
        label: '车间缩写',
        input: h('input', {
          value: obj.acronym,
          oninput() {
            $$obj.patch({ acronym: this.value });
          },
          placeholder: '输入车间缩写'
        }),
        errors,
      }),
      field({
        label: '厂房',
        key: 'plant_id',
        required: true,
        errors,
        input: plantDropdown,
      }),
      h('hr'),
      h('button.primary', {
        onclick() {
          if (!dirty(obj)) {
            $$toast.val({ type: 'info', message: '没有任何变化' });
            return false;
          }
          co(function *() {
            try {
              yield departmentStore.validate(obj);
            } catch (e) {
              if (e instanceof ValidationError) {
                $$errors.val(e.errors);
                return;
              }
              throw e;
            }
            try {
              $$loading.toggle();
              let { id } = yield departmentStore.save(obj);
              copy = R.clone(obj);
              $$toast.val({
                type: 'success',
                message: '提交成功'
              });
              $$errors.val({});
              !obj.id && page('/department/' + id);
            } catch(error) {
              console.error(error);
              if (error.response && error.response.status == 400) {
                $$errors.val(error.response.data);
              }
            } finally {
              $$loading.toggle();
            }
          });
          return false;
        }
      }, '提交'),
      h('button', {
        onclick() {
          page('/department-list');
          return false;
        }
      }, '返回')
    ]),
  ]);
};

const $$plantDropdown = $$dropdown({
  defaultText: '选择厂房',
  $$options: $$plants.map(function (plants) {
    return plants.map(function (it) {
      return {
        value: it.id,
        text: it.name
      };
    });
  }),
  $$value: $$obj.map(R.prop('plant_id')),
  onchange(plant_id) {
    $$obj.patch({ plant_id });
  }
});

export default {
  page: {
    get $$view() {
      return $$.connect([$$obj, $$errors, $$loading, $$plantDropdown], vf);
    }
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init({ params: { id } }) {
    $$errors.val({});
    $$loading.on();
    Promise.all([
      plantStore.list,
      id? departmentStore.get(id): {}
    ])
    .then(function ([plants, obj]) {
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$plants, plants],
        [$$obj, obj]
      ]);
    });
  }
};
