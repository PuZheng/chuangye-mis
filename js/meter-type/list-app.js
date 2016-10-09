import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import meterTypeStore from 'store/meter-type-store';

var h = virtualDom.h;

var $$loading = $$(false, 'loading');
var $$list = $$([], 'meter-types');

var vf = function ([loading, list]) {
  return h(classNames('list-app', loading && 'loading'), [
    h('.header', '设备类型列表'),
    h('.segment', list.map(function (it) {
      return h('.item', [
        h('.title', it.name),
        h('.ops', h('button', {
          onclick() {

          }
        }, h('i.fa.fa-gear')))
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
