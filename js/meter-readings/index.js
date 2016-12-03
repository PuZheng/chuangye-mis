import $$ from 'slot';
import { SmartGrid } from 'smart-grid';
import virtualDom from 'virtual-dom';
import meterStore from 'store/meter-store';
import meterTypeStore from 'store/meter-type-store';
import meterReadingStore from 'store/meter-reading-store';
import R from 'ramda';
import {$$toast} from '../toast';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');

var vf = function vf([loading, grid]) {
  return h('#meter-readings-app' + (loading? '.loading': ''), [
    h('.warning.color-accent', '注意,一旦初始化，无法修改!'),
    grid
  ]);
};

var smartGrid;
var $$view_;

export default {
  page: {
    get $$view() {
      return ($$view_ = $$.connect([$$loading], vf));
    },
    onUpdated() {
      smartGrid && smartGrid.onUpdated();
    }
  },
  init() {
    const header = {
      readonly: true,
      style: {
        background: 'teal',
        color: 'yellow',
        fontWeight: 'bold',
      }
    };
    $$loading.on();
    Promise.all([
      meterStore.list,
      meterTypeStore.list
    ])
    .then(function ([meters, meterTypes]) {
      let meterGroups = R.groupBy(R.prop('meterTypeId'))(meters);
      let sheets = R.toPairs(meterGroups)
      .map(function ([meterTypeId, meterGroup]) {
        let meterType = R.find(it => it.id == meterTypeId)(meterTypes);
        let headerRow = [
          '表设备ID',
          '表设备',
          '所属车间',
          ...meterType.meterReadingTypes.map(R.prop('name'))
        ].map(function (it) {
          return Object.assign({
            val: it
          }, header);
        });
        let meterRows = meterGroup.filter(it => !it.isTotal).map(
          function (meter) {
            let meterReadings = meterType.meterReadingTypes.map(
              function (mrt) {
                let meterReading =
                  R.find(it => it.meterReadingTypeId == mrt.id)(
                    meter.meterReadings);
                if (meterReading) {
                  return {
                    val: meterReading.value,
                    readonly: true,
                  };
                } else {
                  return {
                    __makeVNode(cell, val) {
                      let vNode = cell.makeVNode(val);
                      if (!val) {
                        vNode.properties.attributes.class += ' uninitialized';
                      }
                      return vNode;
                    },
                    __onchange() {
                      $$loading.on();
                      meterReadingStore.save({
                        value: this.def.val,
                        meterId: meter.id,
                        meterReadingTypeId: mrt.id
                      })
                      .then(function () {
                        $$loading.off();
                        $$toast.val({
                          type: 'success',
                          message: '保存成功',
                          duration: 500,
                        });
                      })
                      .catch(function (e) {
                        console.error(e);
                      });
                    }
                  };
                }
              }
            );
            return [
              {
                readonly: true,
                val: meter.id
              }, {
                readonly: true,
                val: meter.name
              }, {
                readonly: true,
                val: meter.department.name
              },
              ...meterReadings,
            ];
          }
        );
        return {
          label: meterType.name,
          grids: [
            headerRow,
            ...meterRows,
          ]
        };
      });
      smartGrid = new SmartGrid({ sheets });
      $$view_.connect([$$loading, smartGrid.$$view], vf).refresh();
      $$loading.off();
    });
  }
};
