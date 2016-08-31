import x from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import { field } from '../field.js';
import accountStore from '../store/account-store.js';
import classNames from '../class-names.js';
import page from 'page';
import promiseFinally from 'promise-finally';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';

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
            let p = accountStore.validate({
              username, 
              password
            }).then(function () {
              $$loading.val('loading');
            }).catch(function (errors) {
              $$errors.val(errors);
            }).then(function () {
              return accountStore.login({
                username,
                password
              });
            }).then(function () {
              page('/');
            }).catch(function (error) {
              if (error.response && error.response.status === 403) {
                $$errors.val({
                  username: error.response.data.message,
                });
                return;
              } 
              overlay.$$content.val({
                type: 'error',
                title: '很不幸, 出错了!',
                message: axiosError2Dom(error),
              });
            });
            promiseFinally(p, function () {
              $$loading.val('');
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
