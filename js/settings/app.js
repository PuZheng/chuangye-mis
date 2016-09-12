import $$ from 'slot';
import throttleSlot from 'throttle-slot';
import virtualDom from 'virtual-dom';
import SmartGrid from 'smart-grid';
import R from 'ramda';
import settingsStore from '../store/settings-store';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';

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
  for (var [groupName, group] of R.toPairs(
    R.groupBy(function (s) {
      return s.group;
    })(settings)
  )) {
    let sheetDef = {
      label: groupName, 
    };
    let headerCellDef = {
        readOnly: true,
        style: {
          background: 'teal',
          color: 'yellow',
          fontWeight: 'bold',
        }
    };
    var header = [
      Object.assign({
        val: '字段',
      }, headerCellDef),
      Object.assign({
        val: '数值',
      }, headerCellDef),
      Object.assign({
        val: '说明',
      }, headerCellDef),
    ];
    sheetDef.grids = [header].concat(group.map(function (setting) {
      return [{
        readOnly: true,
        val: setting.name,
      }, {
        label: groupName + '-' + setting.name,
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
  for (var setting of settings) {
    let [{sheetIdx, tag, def}] = sg.getCellDefs(cell => cell.label == setting.group + '-' + setting.name);
    sg.createCellSlot(sheetIdx, tag).change(function (cellDef, setting) {
      return function (v) {
        settingsStore.update(setting.group, setting.name, v)
        .catch(function (error) {
          overlay.$$content.val({
            type: 'error',
            title: '很不幸, 出错了!',
            message: axiosError2Dom(error),
          });
        });
      };
    }(def, setting));
  };
});

export default {
  page: {
    $$view,
    onUpdated() {
      sg.onUpdated();
    },
  },
  $$loading,
  $$settings,
};
