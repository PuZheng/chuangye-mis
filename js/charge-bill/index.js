import $$ from 'slot';
import meterStore from 'store/meter-store';
import SmartGrid from 'smart-grid';
import virtualDom from 'virtual-dom';

var h = virtualDom.h;

var vf = function ([]) {
  return h('div');
};

var sg;
var $$view = $$.connect([], vf);

export default {
  page: {
    $$view,
    onUpdated() {
      sg.onUpdated();
    },
  },
  init() {
    Promise.all([
      meterStore.fetchList(), 
    ])
    .then(function ([{ data: meters }]) {
      let def = { sheets: [] };
      let headerCellDef = {
        readOnly: true,
        style: {
          background: 'teal',
          color: 'yellow',
          fontWeight: 'bold',
        }
      };
      for (let [type, group] of R.toPairs(
        R.groupBy(function (it) {
          return it.type
        })(meters)
      )) {
        let headers = [
          Object.assign({
            val: '编号',
            headerCellDef,
          }),
          Object.assign({
            val: '车间',
            headerCellDef,
          }),
          Object.assign({

          })
        ]
        def.sheets.push({
          label: type,
          grids: [
          ]
        }); 
      }
      sg = new SmartGrid(def);
      $$view
      .connect([sg.$$view], function ([sg]) {
        return h('.charge-bills', sg);
      })
      .refresh();
      sg.setupLayout();
      sg.registerShortcus();
    });
  }
};
