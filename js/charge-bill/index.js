import $$ from 'slot';
import sg from 'smart-grid';
import virtualDom from 'virtual-dom';
import accountTermStore from 'store/account-term-store';
import classNames from '../class-names';
import R from 'ramda';
import Scrollable from 'scrollable';
import chargeBillStore from 'store/charge-bill-store';
import co from 'co';
import { $$toast } from '../toast';
import overlay from '../overlay';

var h = virtualDom.h;

var smartGrid;
var $$loading = $$(false, 'loading');
var $$obj = $$({}, 'loading');

var $$view_ = $$.connect(
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

export default {
  page: {
    get $$view() {
      return $$view_;
    },
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
      // 获取清单，如果获取不到, 就创建一个
      let obj = yield chargeBillStore.getOrCreate({
        accountTermId: activeAccountTermId,
      });
      for (let { grid } of obj.def.sheets) {
        for (let row of grid) {
          for (let cellDef of (row.cells || row)) {
            if (!cellDef) {
              continue;
            }
            if (!cellDef.readonly) {
              cellDef.__onchange = onCellChange;
            }
            let tag = R.path(['data', 'tag'])(cellDef);
            if (tag == 'sum') {
              cellDef.__makeVNode = makeSumVNode;
            }
            if (tag == 'meter-reading') {
              cellDef.__validate = function (val) {
                if (val <= cellDef.data.lastAccountTermValue) {
                  $$toast.val({
                    type: 'error',
                    message: '至少大于上账期数据'
                  });
                  return Promise.reject();
                }
                return Promise.resolve();
              };
            }
          }
        }
      }
      $$loading.val(false);
      let sidebar = new Scrollable({
        tag: 'aside',
        $$content: $$(
          h('.borderless.vertical.fluid._.menu',
            accountTerms.map(function (at) {
              return h(
                'a' + classNames(
                  'item', at.id == activeAccountTermId && 'active'
                ), {
                  href: '/charge-bill/' + at.name,
                }, at.name
              );
            })), 'content'),
      });
      smartGrid = new sg.SmartGrid(obj.def, { translateLabel: true });
      $$obj.val(obj);
      $$view_.connect(
        [sidebar.$$view, smartGrid.$$view, $$dirty, $$loading, $$obj],
        function ([sidebar, smartGridVNode, dirty, loading, obj]) {
          return h('#charge-bills' + classNames(loading && 'loading'), [
            sidebar,
            h('.content', [
              R.cond([
                [({ closed }) => !!closed, R.always('')],
                [
                  function (obj, dirty) { return !!dirty; },
                  function () {
                    return h('button', {
                      onclick() {
                        return co(function *() {
                          try {
                            $$loading.val(true);
                            let sheets = [];
                            for (let sheet of obj.def.sheets) {
                              sheets.push({
                                label: sheet.label,
                                grid: sheet.grid.map(function (row) {
                                  if (Array.isArray(row)) {
                                    return row.map(smartGrid.getRawCellDef);
                                  }
                                  let cells = row.cells &&
                                    row.cells.map(smartGrid.getRawCellDef);
                                  return {
                                    data: row.data,
                                    cells,
                                  };
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
                              duration: 500,
                            });
                            $$dirty.off();
                          } catch (e) {
                            console.error(e);
                          } finally {
                            $$loading.val(false);
                          }
                        });
                      }
                    }, '保存');
                  }
                ],
                [
                  R.T,
                  function () {
                    return h('button', {
                      onclick() {
                        overlay.show({
                          type: 'info',
                          title: '您确认要生成本账期内各车间账单?',
                          message: [
                            h('h3', '账单生成后'),
                            h('ul.p4', [
                              h('li', '本账期的费用单将不能再次编辑'),
                              h('li', '将自动生成各个车间的本账期预扣记录'),
                              h('li', '各表设备读数将刷新'),
                            ]),
                            h('button.ca.btn.btn-outline', {
                              onclick() {
                                overlay.dismiss();
                                let cells = smartGrid.searchCells(
                                  function (cellDef) {
                                    return cellDef.label &&
                                      cellDef.label.startsWith('sum-of');
                                  }
                                );
                                for (let { sheetIdx, tag } of cells) {
                                  let amount = smartGrid.getCellValue(
                                    tag, sheetIdx
                                  );
                                  if (!amount) {
                                    $$toast.val({
                                      type: 'error',
                                      message: '请输入完整的费用信息',
                                    });
                                    return false;
                                  }
                                }

                                co(function *() {
                                  $$loading.on();
                                  try {
                                    yield chargeBillStore.close(obj.id);
                                    $$toast.val({
                                      type: 'success',
                                      message: '各车间账单生成!',
                                    });
                                    $$obj.patch({ closed: true });
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    $$loading.val(false);
                                  }
                                });
                                return false;
                              }
                            }, '确认'),
                          ]
                        });
                        return false;
                      }
                    }, '生成账单');
                  }
                ]
              ])(obj, dirty),
              smartGridVNode,
            ]),
          ]);
        }
      ).refresh();
    });
  }
};
