import $$ from 'slot';
import throttleSlot from 'throttle-slot';
import virtualDom from 'virtual-dom';
import { SmartGrid } from 'smart-grid';
import R from 'ramda';
import settingsStore from '../store/settings-store';

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

$$settings.change(function (settings) {
  var def = {
    sheets: [],
  };
  let groups = R.toPairs(
    R.groupBy(function (s) {
      return s.group;
    })(settings)
  );
  for (let [groupName, settings] of groups) {
    let sheetDef = {
      label: groupName,
    };
    var header = [
      {
        val: '字段',
      }, {
        val: '数值',
      }, {
        val: '说明',
      }
    ].map(it => Object.assign(it, {
      readOnly: true,
      style: {
        background: 'teal',
        color: 'yellow',
        fontWeight: 'bold',
      }
    }));
    sheetDef.grids = [header].concat(settings.map(function (setting) {
      return [{
        readOnly: true,
        val: setting.name,
      }, {
        label: setting.name,
        val: setting.value,
      }, {
        readOnly: true,
        val: setting.comment || '',
      }];
    }));
    def.sheets.push(sheetDef);
  }
  sg = new SmartGrid(def);
  $$view
  .connect([sg.$$view], function ([sg]) {
    return h('#settings-app', sg);
  })
  .refresh();
  sg.setupLayout();
  sg.registerShortcus();
  for (let sheetIdx = 0; sheetIdx < groups.length; ++sheetIdx) {
    let [, settings] = groups[sheetIdx];
    for (let setting of settings) {
      let tag = sg.getTagByLabel(sheetIdx, setting.name);
      sg.createCellSlot(sheetIdx, tag).change(function (setting) {
        return function (value) {
          settingsStore.update(setting.group, setting.name, value);
        };
      }(setting));
    }
  }
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
