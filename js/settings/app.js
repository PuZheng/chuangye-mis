import $$ from '../slot/';
import virtualDom from 'virtual-dom';
import SmartGrid from '../smart-grid/';
import R from 'ramda';
import once from 'once';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$settings = $$([], 'settings');

var vf = function () {
  return h('#settings-app', [
    'settings'
  ]);
};

var $$view = $$.connect([], vf);
var sg;

$$settings.change(function (settings) {
  var def = {
    grids: [],
  };
  for (var [groupName, group] of R.toPairs(
    R.groupBy(function (s) {
      return s.group;
    })(settings)
  )) {
    var header = R.zip(R.repeat({
        readOnly: true,
        style: {
          background: 'teal',
          color: 'yellow',
          fontWeight: 'bold',
        }
    }, 3), ['名称', '数据', '说明']).map(function ([cellDef, value]) {
      cellDef.value = value;
      return cellDef;
    });
    def.grids.push([
      groupName,
      [header].concat(group.map(function (setting) {
        return [{
          readOnly: true,
          value: setting.name,
        }, {
          label: setting.name,
          value: setting.value,
        }, {
          readOnly: true,
          value: setting.comment || '',
        }]; 
      }))
    ]);
  }
  sg = new SmartGrid(def);
  $$view
  .connect([sg.$$view], function (sg) {
    return h('#settings-app', sg);
  })
  .refresh();
});

var setupLayout = once(function () {
  sg.setupLayout();
});

export default {
  page: {
    $$view,
    onUpdated() {
      if (sg) {
        setupLayout();
      }
    }
  },
  $$loading,
  $$settings,
};
