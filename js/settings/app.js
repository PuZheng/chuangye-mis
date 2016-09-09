import $$ from 'slot';
import throttleSlot from 'throttle-slot';
import virtualDom from 'virtual-dom';
import SmartGrid from 'smart-grid';
import R from 'ramda';

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
        label: setting.name,
        val: setting.value,
      }, {
        readOnly: true,
        val: setting.comment || '',
      }]; 
    }));
    def.sheets.push(sheetDef);
  }
  var def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['1', '=A1+1']
        ]
      },
      {
        label: 'B',
        grids: [
          ['=SHEET1:A1+3']
        ]
      }
    ]
  };
  sg = new SmartGrid(def);
  $$view
  .connect([sg.$$view], function ([sg]) {
    return h('#settings-app', sg);
  })
  .refresh();
  sg.setupLayout();
  sg.registerShortcus();
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
