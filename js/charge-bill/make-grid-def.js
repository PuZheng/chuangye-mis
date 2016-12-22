import R from 'ramda';
import { $$toast } from '../toast';

var makeSumVNode = function (cell, val) {
  let vNode = cell.makeVNode(val);
  if (!val) {
    vNode.properties.attributes.class += ' unfullfilled';
  }
  return vNode;
};

var header = function header(s) {
  return {
    val: s,
    readonly: true,
    style: {
      background: 'teal',
      color: 'yellow',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
    }
  };
};

var settingsRow = function settingsRow(meterType) {
  let settingCell = function settingCell({ name, value }) {
    return {
      readonly: true,
      val: value,
      label: 'setting-' + name,
      style: {
        border: '1px solid red',
      }
    };
  };
  return R.flatten(meterType.meterReadingTypes.map(function ({ priceSetting }) {
    return [header(priceSetting.name + '(元)'), settingCell(priceSetting)];
  }));
};

var headerRow = function headerRow(meterType) {
  return [
    header('表设备'), header('车间'), header('承包人'), header('倍数'),
    ...meterType.meterReadingTypes.map(({ name }) => header('上期' + name)),
    ...meterType.meterReadingTypes.map(({ name }) => header(name)),
    header('总费用(元)')
  ];
};

var meterRow = function meterRow(meter, tenants, onCellChange) {
  let departmentCell = (({ department: { name } }) =>
                        ({ val: name, readonly: true }));
  let entityCell = function ({ departmentId }, tenants) {
    return {
      val: R.find(R.propEq('departmentId', departmentId))(tenants).entity.name,
      readonly: true
    };
  };
  let nameCell = ({ id, name }) => ({
    val: name,
    readonly: true,
    data: {
      meterId: id,
    }
  });
  let lastAccountTermValueCell = function (meter, meterReadingType) {
    let meterReading = R.find(
      it => it.meterReadingTypeId == meterReadingType.id
    )(meter.meterReadings);
    return {
      label: meter.name + '-上期' + meterReadingType.name,
      val: meterReading.value,
      readonly: true
    };
  };
  let valueCell = function valueCell(meter, meterReadingType, onCellChange) {
    let meterReading = R.find(
      it => it.meterReadingTypeId == meterReadingType.id
    )(meter.meterReadings);
    let { value: lastAccountTermValue, id } = meterReading.value;
    return {
      label: meter.name + '-' + meterReadingType.name,
      data: {
        tag: 'meter-reading',
        id,
        name: meterReadingType.name,
        price: meterReadingType.priceSetting.value,
        lastAccountTermValue,
        meterReadingTypeId: meterReadingType.id
      },
      __validate: function (val) {
        if (val <= lastAccountTermValue) {
          $$toast.val({
            type: 'error',
            message: '至少大于上账期数据'
          });
          return Promise.reject();
        }
        return Promise.resolve();
      },
      __onchange: function () {
        onCellChange.apply(this);
      }
    };
  };
  let sumCell = function (meter, meterReadingTypes) {
    let readingSumQuote = meterReadingTypes.map(
      function ({ name, priceSetting }) {
        let lastValueQuote = '${' + meter.name + '-上期' + name + '}';
        let valueQuote = '${' + meter.name + '-' + name + '}';
        let settingQuote = '${' + 'setting-' + priceSetting.name + '}';
        return `(${valueQuote} - ${lastValueQuote}) * ${settingQuote}`;
      }
    ).join('+');
    let timesQuote = '${' + meter.name + '倍数}';
    return {
      val: `=(${readingSumQuote}) * ${timesQuote}`,
      __makeVNode: makeSumVNode,
      readonly: true,
      label: 'sum-of-' + meter.department.id,
    };
  };
  let timesCell = ({ times, name }) => ({
    val: times,
    readonly: true,
    label: name + '倍数',
  });
  let { meterType } = meter;
  let { meterReadingTypes } = meterType;
  let { id, name, departmentId, times } = meter;
  return {
    data: {
      tag: 'meter',
      id,
      name,
      departmentId,
      times,
    },
    cells: [
      nameCell(meter), departmentCell(meter), entityCell(meter, tenants),
      timesCell(meter),
      ...meterReadingTypes.map(function (meterReadingType) {
        return lastAccountTermValueCell(meter, meterReadingType);
      }),
      ...meterReadingTypes.map(function (meterReadingType) {
        return valueCell(meter, meterReadingType, onCellChange);
      }),
      sumCell(meter, meterReadingTypes),
    ],
  };
};

export var makeGridDef = function (meters, tenants, onCellChange) {
  let groups = R.toPairs(R.groupBy(R.prop('meterTypeId'))(meters));
  let sheets = groups.map(function ([, group]) {
    let meterType = group[0].meterType;
    return {
      label: meterType.name,
      grid: [
        settingsRow(meterType),
        headerRow(meterType),
        ...group.filter(it => it.parentMeterId).map(
          it => meterRow(it, tenants, onCellChange)
        ),
      ]
    };
  });
  return { sheets };
};

export var interpolateGridDef = function interpolateGridDef(def, onCellChange) {
  for (let sheet of def.sheets) {
    for (let row of sheet.grid) {
      console.log(row);
      for (let cellDef of row) {
        if (!cellDef) continue;
        if (!cellDef.readonly) {
          cellDef.__onchange = onCellChange;
        }
        if ((cellDef.label || '').startsWith('sum-of')) {
          cellDef.__makeVNode = makeSumVNode;
        }
      }
    }
  }
};
