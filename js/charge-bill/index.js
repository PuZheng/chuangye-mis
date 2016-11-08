import $$ from 'slot';
import meterStore from 'store/meter-store';
import sg from 'smart-grid';
import virtualDom from 'virtual-dom';
import accountTermStore from 'store/account-term-store';
import tenantStore from 'store/tenant-store';
import classNames from '../class-names';
import R from 'ramda';
import Scrollable from 'scrollable';
import chargeBillStore from 'store/charge-bill-store';
import paymentRecordStore from 'store/payment-record-store';
import co from 'co';
import { $$toast } from '../toast';
import page from 'page';

var h = virtualDom.h;

var smartGrid;
var $$loading = $$(false, 'loading');
var $$view = $$.connect(
  [$$loading],
  function (loading) {
    return h('#charge-bills' + classNames(loading && 'loading'));
  }
);

var $$dirty = $$(false, 'dirty');

var onCellChange = function () {
  $$dirty.val(true);
};

var makeSumVNode = function (cell, val) {
  let vNode = cell.makeVNode(val);
  if (!val) {
    vNode.properties.attributes.class += ' unfullfilled';
  }
  return vNode;
};

var getActiveAccountTermId = function (accountTermName, accountTerms) {
  let ret;
  if (accountTermName == 'latest') {
    ret = accountTerms[0].id;
  } else {
    ret = R.find(R.propEq('name', accountTermName))(accountTerms).id;
    if (!ret) {
      ret = accountTerms[0].id;
    }
  }
  return ret;
};

var makeDef = function (meters, tenants) {
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
            __onchange: onCellChange,
          };
        }),
        {
          val: '=' + meterType.meterReadings.map(function (mr) {
            return '${' + meter.id + '-' + mr.name + '}*' + '${setting-' + mr.priceSetting.name + '}';
          }).join('+'),
          __makeVNode: makeSumVNode,
          readOnly: true,
          label: 'sum-of-' + meter.department.id,
        },
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
  return def;
};

export default {
  page: {
    $$view,
    onUpdated() {
      smartGrid && smartGrid.onUpdated();
    },
  },
  init(ctx) {
    co(function *() {
      $$loading.val(true);
      let { accountTermName } = ctx.params;
      let accountTerms = yield accountTermStore.list;
      let activeAccountTermId = getActiveAccountTermId(accountTermName,
                                                       accountTerms);
      let [obj] = (yield chargeBillStore.fetchList({
        accountTermId: activeAccountTermId,
      }));
      if (!obj) {
        let meters = yield meterStore.list;
        let tenants = yield tenantStore.list;
        let def = makeDef(meters, tenants);
        obj = {
          def,
          accountTermId: activeAccountTermId,
        };
      } else {
        let { def } = obj;
        for (let sheet of def.sheets) {
          for (let row of sheet.grids) {
            for (let cellDef of row) {
              if (!cellDef) continue;
              if (!cellDef.readOnly) {
                cellDef.__onchange = onCellChange;
              }
              if ((cellDef.label || '').startsWith('sum-of')) {
                cellDef.__makeVNode = makeSumVNode;
              }
            }
          }
        }
      }
      $$loading.val(false);
      let sidebar = new Scrollable({
        tag: 'aside',
        $$content: $$(
          h('.borderless.vertical.fluid.menu',
            accountTerms.map(function (at) {
              return h('a' + classNames('item', at.id == activeAccountTermId && 'active'), {
                href: '/charge-bill/' + at.name,
                onclick(e) {
                  e.preventDefault();
                  page('/charge-bill/' + at.name);
                  return false;
                }
              }, at.name);
            })), 'content'),
      });
      smartGrid = new sg.SmartGrid(obj.def);
      $$view.connect(
        [sidebar.$$view, smartGrid.$$view, $$dirty, $$loading],
        function ([sidebar, smartGridVNode, dirty, loading]) {
          return h('#charge-bills' + classNames(loading && 'loading'), [
            sidebar,
            h('.content', [
              R.ifElse(
                R.identity,
                () => h('button', {
                  onclick() {
                    return co(function *() {
                      try {
                        $$loading.val(true);
                        let sheets = [];
                        for (let sheet of obj.def.sheets) {
                          sheets.push({
                            label: sheet.label,
                            grids: sheet.grids.map(function (row) {
                              return row.map(function (it) {
                                return smartGrid.getRawCellDef(it);
                              });
                            })
                          });
                        }
                        yield chargeBillStore.save({
                          id: obj.id,
                          accountTermId: obj.accountTermId,
                          def: { sheets, }
                        });
                        $$toast.val({
                          type: 'success',
                          message: '保存成功',
                        });
                      } catch (e) {
                        console.error(e);
                      } finally {
                        $$loading.val(false);
                      }
                    });
                  }
                }, '保存'),
                () => h('button', {
                  onclick() {
                    let paymentRecords = [];
                    for (let { sheetIdx, tag, def: cellDef } of smartGrid.searchCells(function (cellDef) {
                      return cellDef.label && cellDef.label.startsWith('sum-of');
                    })) {
                      let amount = smartGrid.getCellValue(sheetIdx, tag);
                      if (!amount) {
                        $$toast.val({
                          type: 'warning',
                          message: '请输入完整的费用信息',
                        });
                        return false;
                      }
                      paymentRecords.push({
                        departmentId: cellDef.label.replace('sum-of-', ''),
                        amount,
                        reason: obj.def.sheets[sheetIdx].label + '费用',
                        accountTermId: activeAccountTermId,
                      });
                    }

                    co(function *() {
                      try {
                        $$loading.val(true);
                        yield paymentRecordStore.save(paymentRecords);
                        $$toast.val({
                          type: 'success',
                          message: '预支付记录已创建',
                        });
                      } catch (e) {
                        console.error(e);
                      } finally {
                        $$loading.val(false);
                      }
                    });

                    return false;
                  }
                }, '生成支付记录')
              )(dirty),
              smartGridVNode,
            ]),
          ]);
        }
      ).refresh();
    });
  }
};
