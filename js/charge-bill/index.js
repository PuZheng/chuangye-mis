import $$ from 'slot';
import meterStore from 'store/meter-store';
import sg from 'smart-grid';
import virtualDom from 'virtual-dom';
import accountTermStore from 'store/account-term-store';
import tenantStore from 'store/tenant-store';
import classNames from '../class-names';
import R from 'ramda';
import Scrollable from 'scrollable';

var h = virtualDom.h;


var smartGrid;
var $$loading = $$(false, 'loading');
var $$view = $$.connect([], () => h('.charge-bills'));
var $$dirty = $$(false, 'dirty');

var onCellChange = function () {
  $$dirty.val(true);
};

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
      meterStore.list,
      tenantStore.list,
    ])
    .then(function ([accountTerms, meters, tenants]) {
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
            val: '承包人',
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
              val: R.find(R.propEq('id', meter.departmentId))(tenants).entity.name,
            }, {
              // B(idx + 1)
              val: meter.name,
              readOnly: true
            }, ...meterType.meterReadings.map(function (mr) {
              return {
                label: meter.id + '-' + mr.name,
                onchange: onCellChange,
              };
            }),
            {
              val: '=' + meterType.meterReadings.map(function (mr) {
                return '${' + meter.id + '-' + mr.name + '}*' + '${setting-' + mr.priceSetting.name + '}';
              }).join('+'),
              makeVNode(cell, val) {
                let vNode = cell.makeVNode(val);
                if (!val) {
                  vNode.properties.attributes.class += ' unfullfilled';
                }
                return vNode;
              }
            }
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
      $$view.connect(
        [sidebar.$$view, smartGrid.$$view, $$dirty],
        function ([sidebar, smartGrid, dirty]) {
          return h('#charge-bills', [
            sidebar,
            h('.content', [
              h('button', dirty? '保存': '生成支付记录'),
              smartGrid,
            ]),
          ]);
        }
      ).refresh();
      sidebar.setupLayout();
      smartGrid.setupLayout();
      smartGrid.registerShortcus();
    });
  }
};
