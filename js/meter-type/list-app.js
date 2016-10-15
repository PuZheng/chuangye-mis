import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import meterTypeStore from 'store/meter-type-store';
import page from 'page';

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
        h('.ops', h('button', h('i.fa.fa-gear')))
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
