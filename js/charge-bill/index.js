import $$ from 'slot';
import meterStore from 'store/meter-store';
import sg from 'smart-grid';
import virtualDom from 'virtual-dom';
import accountTermStore from 'store/account-term-store';
import classNames from '../class-names';
import R from 'ramda';
import Scrollable from 'scrollable';

var h = virtualDom.h;


var smartGrid;
var $$loading = $$(false, 'loading');
var $$view = $$.connect([], () => h('.charge-bills'));

export default {
  page: {
    $$view,
    onUpdated() {
      smartGrid.onUpdated();
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
              return h('a' + classNames('item', at.active && 'active'), {
                href: 'charge-bill/' + at.name,
              }, at.name);
            })), 'content'),
      });

      let headerCellDef = {
        readOnly: true,
        style: {
          background: 'teal',
          color: 'yellow',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
        }
      };
      let def = { sheets: [] };
      for (let [, group] of R.toPairs(
        R.groupBy(R.path(['meterType', 'id']))(meters)
      )) {
        let meterType = group[0].meterType;
        let headers = [
          {
            val: '车间',
          }, {
            val: '表设备',
          }, ...meterType.meterReadings.map(function (it) {
            return {
              val: it.name
            };
          }), {
            val: '总费用(元)'
          }
        ].map(it => Object.assign(it, headerCellDef));
        let dataRows = group.filter(it => it.parentMeterId)
        .map(function (meter) {
          return [
            {
              // A(idx + 1)
              val: meter.department.name,
              readOnly: true
            }, {
              // B(idx + 1)
              val: meter.name,
              readOnly: true
            }, ...meterType.meterReadings.map(function (mr) {
              return {
                label: meter.id + '-' + mr.name
              };
            }),
            '=' + meterType.meterReadings.map(function (mr) {
              return '${' + meter.id + '-' + mr.name + '}*' + '${setting-' + mr.priceSetting.name + '}';
            }).join('+'),
          ];
        });
        def.sheets.push({
          label: meterType.name,
          grids: [
            R.flatten(meterType.meterReadings.map(function (it) {
              return [Object.assign({
                val: it.priceSetting.name + '(元)',
              }, headerCellDef), {
                readOnly: true,
                val: it.priceSetting.value,
                label: 'setting-' + it.priceSetting.name,
                style: {
                  border: '1px solid red',
                }
              }];
            })),
            headers,
            ...dataRows,
          ]
        });
      }
      smartGrid = new sg.SmartGrid(def);
      $$view.connect([sidebar.$$view, smartGrid.$$view], function ([sidebar, smartGrid]) {
        return h('#charge-bills', [
          sidebar,
          h('.content', smartGrid),
        ]);
      }).refresh();
      sidebar.setupLayout();
      smartGrid.setupLayout();
      smartGrid.registerShortcus();

    });
  }
};
