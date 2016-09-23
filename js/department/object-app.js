import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import page from 'page';
import pinyin from 'pinyin';
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
      field('name', '车间名称', h('input', {
        placeholder: '输入车间名称',
        value: obj.name,
        oninput() {
          let acronym = pinyin(this.value, {
            style: pinyin.STYLE_NORMAL,
          }).map(function (it) {
            return it[0][0];
          }).join('');
          $$obj.val({
            name: this.value,
            acronym,
          });
        }
      }), errors, true),
      field('acronym', '车间缩写', h('input', {
        value: obj.acronym,
        placeholder: '输入车间缩写'
      }), errors),
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
    $$view: $$.connect([$$obj, $$errors, $$loading], vf),
  },
  init() {
    $$errors.val({});
  }
};
