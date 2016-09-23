import $$ from 'slot';
import virtualDom from 'virtual-dom';
import page from 'page';
import overlay from '../overlay';
import departmentStore from 'store/department-store';

var $$departments = $$([], 'departments');
var $$loading = $$(false, 'loading');

var $$searchText = $$('', 'search-text');

var h = virtualDom.h;
var $$searchBox = $$.connect([$$searchText], function (searchText) {
  return h('.search-box.small', [
    h('i.icon.fa.fa-search'),
    h('input.search', {
      tabIndex: 0,
      placeholder: '搜索车间',
      value: searchText,
      oninput() {
        $$searchText.val(this.value);
      }
    }),
  ]);
});

var vf = function ([loading, departments, searchText, searchBox]) {
  return h('#departments-app.list-app' + (loading? '.loading': ''), [
    h('.header', [
      '车间列表(' + departments.length + '个)',
      h('button.new-btn', {
        title: '新建车间',
        onclick() { 
          page('/department');
        }
      }, h('i.fa.fa-plus')),
      h('.search', searchBox),
    ]),
    function () {
      let elms = departments.filter(function (d) {
        return ~d.name.indexOf(searchText) || ~(d.acronym || '').indexOf(searchText);
      }).map(function (d) {
        return h('.department', [
          h('.title', d.name),
          h('button.remove-btn', {
            onclick() {
              overlay.$$content.val({
                className: 'confirm-delete-department',
                type: 'warning',
                title: '您确认删除该车间?',
                message: h('a.confirm-btn', {
                  href: '#',
                  onclick() {
                    overlay.$$content.val({});
                    return false;
                  },
                }, '确认删除')
              });
              return false;
            }
          }, [
            h('i.fa.fa-remove')
          ]),
        ]);
      });
      if (!elms.length) {
        return h('.message', '没有符合条件的车间');
      }
      return elms;
    }()
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$loading, $$departments, $$searchText, $$searchBox], 
                       vf, 'departments-app'),
  },
  init() {
    $$loading.val(true);
    departmentStore.list
    .then(function (departments) {
      $$.update(
        [$$departments, departments],
        [$$loading, false]
      );
    });
  }
};
