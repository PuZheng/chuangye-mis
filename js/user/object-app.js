import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import field from '../field';
import $$dropdown from 'widget/dropdown';
import R from 'ramda';
import constStore from 'store/const-store';
import userStore from 'store/user-store';
import { $$toast } from '../toast';
import page from 'page';
import co from 'co';
import { ValidationError } from '../validate-obj';

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
    h(classNames('header', dirty(obj) && 'dirty'),
      R.ifElse(R.prop('id'), R.always(`编辑用户-${obj.username}`),
               R.always('创建用户'))(obj)),
    form,
  ]);
};


var formVf = function ([errors, obj, roleDropdown]) {
  return h('form.form', {
    onsubmit() {
      co(function *() {
        try {
          yield userStore.validate(obj);
        } catch (e) {
          if (e instanceof ValidationError) {
            $$errors.val(e.errors);
            return;
          }
          throw e;
        }
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '数据没有变动',
          });
          return;
        }
        try {
          $$loading.val(true);
          let { id=obj.id } = yield userStore.save(obj);
          copy = R.clone(obj);
          $$errors.val({});
          $$.toast.val({
            type: 'success',
            message: obj.id? '更新成功' :'创建成功',
          });
          !obj.id && page('/user/' + id);
        } catch (e) {
          console.error(e);
          let userDefined = (e.response || {}) == 400;
          if (userDefined) {
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
      key: 'username',
      label: '用户名',
      input: h('input', {
        value: obj.username,
        onchange() {
          $$obj.patch({ username: this.value });
        }
      }),
      errors,
      required: true
    }),
    // 不能直接编辑密码字段，要放到单独的功能
    R.ifElse(
      R.prop('id'),
      () => '',
      () => field({
        key: 'password',
        label: '密码',
        input: h('input', {
          type: 'password',
          value: obj.password,
          onchange() {
            $$obj.patch({ password: this.value });
          }
        }),
        errors,
        required: true
      })
    )(obj),
    R.ifElse(
      R.prop('id'),
      () => '',
      () => field({
        key: 'passwordAg',
        label: '再次输入密码',
        input: h('input', {
          type: 'password',
          value: obj.passwordAg,
          onchange() {
            $$obj.patch({ passwordAg: this.value });
          }
        }),
        errors,
        required: true
      })
    )(obj),
    field({
      key: 'role',
      label: '角色',
      input: roleDropdown,
      errors,
      required: true
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick() {
        page('/user-list');
        return false;
      }
    }, '返回'),
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
    get $$view() {
      return $$.connect([$$loading, $$form, $$obj], vf);
    }
  },
  init(ctx) {
    let { id } = ctx.params;
    $$loading.val(true);
    Promise.all([
      id? userStore.get(id): {},
      constStore.get()
    ])
    .then(function ([obj, { ROLES }]) {
      obj.passwordAg = obj.password;
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$obj, obj],
        [$$roles, ROLES]
      ]);
    });
  },
  get dirty() {
    return dirty($$obj.val());
  }
};

