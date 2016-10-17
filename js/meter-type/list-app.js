import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import meterTypeStore from 'store/meter-type-store';
import page from 'page';
import overlay from '../overlay';
import co from 'co';
import {$$toast} from '../toast';

var h = virtualDom.h;

var $$loading = $$(false, 'loading');
var $$list = $$([], 'meter-types');

var vf = function ([loading, list]) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', [
      h('.title', '设备类型列表'), 
      h('button.new-btn', {
        onclick(e) {
          e.preventDefault();
          page('/meter-type');
          return false;
        }
      }, h('i.fa.fa-plus')),
    ]),
    h('.segment', list.map(function (it) {
      return h('.item', {
        onclick(e) {
          e.preventDefault();
          page('/meter-type/' + it.id);
          return false;
        }
      }, [
        h('.title', it.name),
        h('.ops', [
          h('button', { title: '编辑' }, h('i.fa.fa-pencil')),
          h('button', { 
            title: '删除',
            onclick(e) {
              e.stopPropagation();
              overlay.$$content.val({
                type: 'warning',
                title: '您确认要删除该表设备类型?',
                message: h('button.btn.btn-outline.color-accent', {
                  onclick() {
                    overlay.$$content.val(null);
                    co(function *() {
                      try {
                        $$loading.val(true);
                        yield meterTypeStore.del(it.id);
                        $$list.val(list.filter(it_ => it_.id != it.id));
                        $$toast.val({
                          type: 'success',
                          message: '删除成功',
                        });
                      } catch (e) {
                        console.error(e);
                        if ((e.response || {}).status == 400) {
                          overlay.$$content.val({
                            type: 'error',
                            title: '出错了',
                            message: e.response.data.reason,
                          });
                        }
                      } finally {
                        $$loading.val(false);
                      }
                    });
                  }
                }, '确认'),
              });
              return false;
            }
          }, h('i.fa.fa-remove.color-accent')),
        ])
      ]);
    }))
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$loading, $$list], vf),
  },
  init() {
    $$loading.toggle();
    meterTypeStore.list
    .then(function (list) {
      $$.update(
        [$$loading, false],
        [$$list, list]
      );
    });
  }
};
