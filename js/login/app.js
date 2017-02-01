import $$ from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { field } from '../field.js';
import authStore from '../store/auth-store.js';
import classNames from '../class-names.js';
import page from 'page';
import co from 'co';
import { ValidationError } from '../validate-obj';

var $$username = $$('', 'username');
var $$password = $$('', 'password');
var $$errors = $$({}, 'errors');
var $$loading = $$('', 'loading');

$$username.change(function () {
  $$errors.val({});
});
$$password.change(function () {
  $$errors.val({});
});


export default {
  page: {
    get $$view() {
      return $$.connect(
        [$$username, $$password, $$errors, $$loading],
        function ([username, password, errors, loading]) {
          return h('#login-app', [
            h(classNames(
              'block', 'p2', 'border', 'box', 'rounded', 'border-gray',
              'mx-auto', loading
            ), [
              h('h3.header.c1', '欢迎登陆创业电镀管理系统'),
              h('form.form', {
                onsubmit() {
                  co(function *() {
                    try {
                      yield authStore.validate({
                        username,
                        password
                      });
                    } catch (e) {
                      if (e instanceof ValidationError) {
                        $$errors.val(e.errors);
                        return;
                      }
                      throw e;
                    }
                    try {
                      $$loading.val('loading');
                      yield authStore.login({
                        username, password
                      });
                      page('/');
                    } catch (e) {
                      console.error(e);
                      if (e.response && e.response.status == 403) {
                        $$errors.val({
                          username: e.response.data.message,
                        });
                      }
                    } finally {
                      $$loading.val('');
                    }
                  });
                  return false;
                }
              }, [
                field({
                  key: 'username',
                  input: h('input', {
                    placeholder: '请输入用户名',
                    onchange() {
                      $$username.val(this.value);
                    }
                  }),
                  errors,
                }),
                field({
                  key: 'password',
                  input: h('input', {
                    placeholder: '请输入密码',
                    type: 'password',
                    onchange() {
                      $$password.val(this.value);
                    }
                  }),
                  errors,
                }),
                h('button.btn.btn-outline.bc1.block.mx-auto.mt3', '登陆')
              ]),
            ]),
          ]);
        }
      );
    }
  }
};
