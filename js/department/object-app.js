import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import page from 'page';
import pinyin from 'pinyin';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast';
import departmentStore from '../store/department-store';

var h = virtualDom.h;

var $$errors = $$({}, 'errors');
var $$department = $$({}, 'department');
var $$loading = $$(false, 'loading');

let vf = function ([department, errors, loading]) {
  return h('.object-app', [
    h('.header', '创建车间'),
    h('form.form' + (loading? '.loading': ''), [
      field('name', '车间名称', h('input', {
        placeholder: '输入车间名称',
        value: department.name,
        oninput() {
          let acronym = pinyin(this.value, {
            style: pinyin.STYLE_NORMAL,
          }).map(function (it) {
            return it[0][0];
          }).join('');
          $$department.val({
            name: this.value,
            acronym,
          });
        }
      }), errors, true),
      field('acronym', '车间缩写', h('input', {
        value: department.acronym,
        placeholder: '输入车间缩写'
      }), errors),
      h('hr'),
      h('button.primary', {
        onclick() {
          departmentStore.validate(department)
          .then(function (department) {
            $$loading.toggle();
            return departmentStore.save(department)
            .then(function () {
              $$loading.toggle();
              $$toast.val({
                type: 'success',
                message: '车间创建成功'
              });
              page('/department-list');
            })
            .catch(function (error) {
              if (error.response && error.response.status == 400) {
                $$errors.val(error.response.data);
                return;
              }
              overlay.$$content.val({
                type: 'error',
                title: '很不幸, 出错了!',
                message: axiosError2Dom(error),
              });
            });
          }, function (errors) {
            $$errors.val(errors);
          }).then(function () {
            $$loading.val(false);
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
    $$view: $$.connect([$$department, $$errors, $$loading], vf),
  }
};
