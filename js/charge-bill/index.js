import $$ from 'slot';
import meterStore from 'store/meter-store';
import SmartGrid from 'smart-grid';
import virtualDom from 'virtual-dom';
import accountTermStore from 'store/account-term-store';
import classNames from '../class-names';
import R from 'ramda';
import Scrollable from 'scrollable';

var h = virtualDom.h;


var sg;
var $$loading = $$(false, 'loading');
var $$view = $$.connect([], () => h('.charge-bills'));

export default {
  page: {
    $$view,
    onUpdated() {
      // sg.onUpdated();
    },
  },
  init(ctx) {
    let { accountTermName } = ctx.params;
    $$loading.val(true);
    Promise.all([
      accountTermStore.list,
      meterStore.list
    ])
    .then(function ([accountTerms, meters]) {
      if (accountTermName == 'latest') {
        accountTerms[0].active = true;
      } else {
        let accountTerm = R.find(R.propEq('name', accountTermName))(accountTerms);
        if (accountTerm) {
          accountTerm.active = true;
        } else {
          accountTerms[0].active = true;
        }
      }
      let sidebar = new Scrollable({
        tag: 'aside',
        $$content: $$(
          h('.borderless.vertical.fluid.menu', 
            accountTerms.map(function (at) {
              return h('a' + classNames('item', at.active && 'active'), 
                       {
                         href: 'charge-bill/' + at.name,
                       }, at.name);
            })), 'content'),
      });

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
        R.groupBy(R.path(['meterType', 'id']))(meters)
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
            val: '表设备',
            headerCellDef,
          })
        ];
        def.sheets.push({
          label: type,
          grids: [
            headers
          ]
        }); 
      }
      sg = new SmartGrid(def);
      $$view.connect([sidebar.$$view, sg.$$view], function ([sidebar, sg]) {
        return h('.charge-bills', [
          sidebar,
          h('.content', sg),
        ]);
      }).refresh();
      sidebar.setupLayout();
      sg.setupLayout();
      sg.registerShortcus();

    });
  }
};
