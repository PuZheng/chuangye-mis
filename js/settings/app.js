import $$ from 'slot';
import throttleSlot from 'throttle-slot';
import virtualDom from 'virtual-dom';
import { SmartGrid } from 'smart-grid';
import R from 'ramda';
import settingsStore from '../store/settings-store';
import { $$toast } from '../toast';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$settings = $$([], 'settings');

var vf = function () {
  return h('#settings-app', [
    'settings'
  ]);
};

var $$view = throttleSlot(null, 'settings-app').connect([], vf);
var sg;
var header = function header(s) {
  return {
    readonly: true,
    style: {
      background: 'teal',
      color: 'yellow',
      fontWeight: 'bold',
    },
    val: s
  };
};

var nameCell = ({name}) => ({ val: name, readonly: true });
var commentCell = ({comment}) => ({ val: comment || '', readonly: true });
var valueCell = function ({group, name, value}) {
  return {
    val: value || '',
    __onchange() {
      settingsStore.update(group, name, this.def.val || '')
      .then(function () {
        $$toast.val({
          type: 'success',
          message: '更新成功',
          duration: 500,
        });
      });
    }
  };
};

var makeGridDef = function makeGridDef(settings) {
  let groups = R.toPairs(
    R.groupBy(function (s) {
      return s.group;
    })(settings)
  );
  let sheets = groups.map(function ([label, group]) {
    return {
      label,
      grids: [
        [header('字段'), header('数值'), header('说明')],
        ...group.map(it =>
          [nameCell(it), valueCell(it), commentCell(it)]
        )
      ]
    };
  });
  return { sheets };
};

$$settings.change(function (settings) {
  console.log(makeGridDef(settings));
  sg = new SmartGrid(makeGridDef(settings));
  $$view
  .connect([sg.$$view], function ([sg]) {
    return h('#settings-app', sg);
  }).refresh();
});

export default {
  page: {
    $$view,
    onUpdated() {
      sg.onUpdated();
    },
  },
  init() {
    $$loading.toggle();
    settingsStore.list.then(function (settings) {
      $$.update(
        [$$loading, false],
        [$$settings, settings]
      );
    });
  }
};
