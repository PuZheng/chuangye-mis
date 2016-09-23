import x from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { field } from '../field.js';
import accountStore from '../store/account-store.js';
import classNames from '../class-names.js';
import page from 'page';
import co from 'co';

var $$username = x('', 'username');
var $$password = x('', 'password');
var $$errors = x({}, 'errors');
var $$loading = x('', 'loading');

$$username.change(function () {
  $$errors.val({});
});
$$password.change(function () {
  $$errors.val({});
});

var $$page = x.connect(
  [$$username, $$password, $$errors, $$loading], 
  function ([username, password, errors, loading]) {
    return h('#login-app', [
      h(classNames('block', 'p2', 'border', 'box', 'rounded', 'border-gray', 'mx-auto', loading), [
        h('h3.header.c1', '欢迎登陆创业电镀管理系统'),
        h('form.form', {
          onsubmit() {
            co(function *() {
              try {
                yield accountStore.validate({
                  username, 
                  password
                });
              } catch (e) {
                $$errors.val(e);
                return;
              }
              try {
                $$loading.val('loading');
                yield accountStore.login({
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
          field('username', '', h('input', {
            placeholder: '请输入用户名',
            onchange() {
              $$username.val(this.value);
            }
          }), errors),
          field('password', '', h('input', {
            placeholder: '请输入密码',
            type: 'password',
            onchange() {
              $$password.val(this.value);
            }
          }), errors),
          h('button.btn.btn-outline.bc1.block.mx-auto.mt3', '登陆')
        ]),
      ]),
    ]);
  }
);

export default {
  page: {
    $$view: $$page,
  }
};
