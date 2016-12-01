import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import page from 'page';
import acronym from '../utils/acronym';
import { $$toast } from '../toast';
import departmentStore from '../store/department-store';
import co from 'co';

var h = virtualDom.h;

var $$errors = $$({}, 'errors');
var $$obj = $$({}, 'obj');
var $$loading = $$(false, 'loading');

let vf = function ([obj, errors, loading]) {
  return h('.object-app', [
    h('.header', '创建车间'),
    h('form.form' + (loading? '.loading': ''), [
      field({
        key: 'name',
        label: '车间名称',
        input: h('input', {
          placeholder: '输入车间名称',
          value: obj.name,
          oninput() {
            $$obj.val({
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
          placeholder: '输入车间缩写'
        }),
        errors,
      }),
      h('hr'),
      h('button.primary', {
        onclick() {
          co(function *() {
            try {
              yield departmentStore.validate(obj);
            } catch (e) {
              $$errors.val(e);
              return;
            }
            try {
              $$loading.toggle();
              yield departmentStore.save(obj);
              $$toast.val({
                type: 'success',
                message: '车间创建成功'
              });
              page('/department-list');
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

export default {
  page: {
    get $$view() {
      return $$.connect([$$obj, $$errors, $$loading], vf);
    }
  },
  init() {
    $$errors.val({});
  }
};
