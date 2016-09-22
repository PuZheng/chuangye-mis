import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import userStore from 'store/user-store';
import page from 'page';
import R from 'ramda';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast.js';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$list = $$([], 'list');

var vf = function ([loading, listVNode]) {
  return h(classNames('list-app', 'user-list', loading && 'loading'), [
    h('.header', [
      h('.title', '账户列表'),
      h('button.new-btn', {
        onclick() {
          page('/user');
        }
      }, [
        h('i.fa.fa-plus'),
      ]),
    ]),
    listVNode,
  ]);
};

var $$listVNode = $$.connect([$$list], function ([list]) {
  return h('.segment', list.map(function (obj, idx) {
    return [
      h('.item', {
        onclick() {
          page('/user/' + obj.id);
        }
      }, [
        R.ifElse(R.prop('enabled'), R.always(''), R.always(h('.label', '未激活')))(obj),
        h('.username', obj.username),
        h('.role', obj.role),
        h(classNames('toggle', 'ml4', 'align-middle', obj.enabled && 'checked'), {
          onclick() {
            obj.enabled = !obj.enabled;
            $$list.val(list);
            userStore.save(obj)
            .then(function () {
              $$toast.val({
                type: 'success',
                message: '更新成功',
              });
            }, function (e) {
              overlay.$$content.val({
                type: 'error',
                title: '很不幸, 出错了!',
                message: axiosError2Dom(e),
              });
            });
          }
        }, [h('input', {
          type: 'checkbox',
        })]),
      ]),
      R.ifElse(
        R.equals(list.length - 1),
        R.always(''),
        R.always(h('.divider'))
      )(idx),
    ];
  }));
});

export default {
  page: {
    $$view: $$.connect([$$loading, $$listVNode], vf)
  },
  init() {
    $$loading.val(true);
    userStore.list
    .then(function (list) {
      $$.update(
        [$$loading, false],
        [$$list, list]
      );
    }, function (e) {
      if ((e.response || {}).status == '403') {
        page('/unauthorized');
      }
    });
  }
};
