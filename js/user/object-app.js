import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import field from '../field';
import $$dropdown from 'widget/dropdown';
import R from 'ramda';
import constStore from 'store/const-store';
import userStore from 'store/user-store';
import { $$toast } from '../toast';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import page from 'page';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$roles = $$({}, 'roles');
var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};


var vf = function ([loading, form, obj]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'), '创建用户'),
    form,
  ]);    
};


var formVf = function ([errors, obj, roleDropdown]) {
  return h('form.form', {
    onsubmit() {
      userStore
      .validate(obj)
      .then(function (obj) {
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '数据没有变动',
          });
          return;
        }
        $$loading.val(true);
        userStore.save(obj) 
        .then(function ({ id }) {
          copy = R.clone(obj);
          $$errors.val({});
          $$.update(
            [$$loading, false],
            [$$toast, {
              type: 'success',
              message: obj.id? '更新成功' :'创建成功',
            }]
          );
          !obj.id && page('/user/' + id);
        }, function (e) {
          $$loading.val(false);
          let userDefined = (e.response || {}) == 400;
          if (userDefined) {
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
    field('username', '用户名', h('input', {
      value: obj.username,
      onchange() {
        $$obj.patch({ username: this.value });
      }
    }), errors, true),
    field('password', '密码', h('input', {
      type: 'password',
      value: obj.password,
      onchange() {
        $$obj.patch({ password: this.value });
      }
    }), errors, true),
    field('passwordAg', '再次输入密码', h('input', {
      type: 'password',
      value: obj.passwordAg,
      onchange() {
        $$obj.patch({ passwordAg: this.value });
      }
    }), errors, true),
    field('role', '角色', roleDropdown, errors, true),
    h('hr'),
    h('button.primary', '提交'),
    h('button', '返回'),
  ]);
};

var $$roleDropdown = $$dropdown({
  defaultText: '请选择用户组', 
  onchange(role) {
    $$obj.patch({ role });
  },
  $$value: $$obj.trans(R.prop('role')),
  $$options: $$roles.trans(R.values)
});

var $$form = $$.connect([$$errors, $$obj, $$roleDropdown], formVf);


export default {
  page: {
    $$view: $$.connect([$$loading, $$form, $$obj], vf),
  },
  init(ctx) {
    let { id } = ctx.params;
    $$loading.val(true);
    Promise.all([
      id? userStore.get(id): {},
      constStore.get()
    ])
    .then(function ([obj, { roles }]) {
      obj.passwordAg = obj.password;
      copy = R.clone(obj);
      $$.update(
        [$$loading, false],
        [$$obj, obj],
        [$$roles, roles]
      ); 
    });
  },
  get dirty() {
    return dirty($$obj.val());
  }
};

