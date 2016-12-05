import R from 'ramda';

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
    header('车间'), header('承包人'), header('表设备'),
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
      val: R.find(R.propEq('id', departmentId))(tenants).entity.name,
      readonly: true
    };
  };
  let nameCell = ({ name }) => ({ val: name, readonly: true });
  let lastAccountTermValueCell = function (meter, meterReadingType) {
    let { value } = R.find(
      R.propEq('meterReadingTypeId', meterReadingType.id)
    )(meter.meterReadings) || {};
    return {
      label: meter.name + '-上期' + meterReadingType.name,
      val: value,
      readonly: true
    };
  };
  let valueCell = function valueCell(meter, meterReadingType, onCellChange) {
    return {
      label: meter.name + '-' + meterReadingType.name,
      __onchange: onCellChange,
    };
  };
  let sumCell = function (meter, meterReadingTypes) {
    return {
      val: '=' + meterReadingTypes.map(
        function ({ name, priceSetting }) {
          let lastValueQuote = '${' + meter.name + '-上期' + name + '}';
          let valueQuote = '${' + meter.name + '-' + name + '}';
          let settingQuote = '${' + 'setting-' + priceSetting.name + '}';
          return `(${valueQuote} - ${lastValueQuote}) * ${settingQuote}`;
        }
      ).join('+'),
      __makeVNode: makeSumVNode,
      readonly: true,
      label: 'sum-of-' + meter.department.id,
    };
  };
  let { meterType } = meter;
  let { meterReadingTypes } = meterType;
  return [
    departmentCell(meter), entityCell(meter, tenants), nameCell(meter),
    ...meterReadingTypes.map(function (meterReadingType) {
      return lastAccountTermValueCell(meter, meterReadingType);
    }),
    ...meterReadingTypes.map(function (meter, meterReadingType) {
      return valueCell(meter, meterReadingType, onCellChange);
    }),
    sumCell(meter, meterReadingTypes),
  ];
};

var makeGridDef = function (meters, tenants, onCellChange) {
  let groups = R.toPairs(R.groupBy(R.prop('meterTypeId'))(meters));
  let sheets = groups.map(function ([, group]) {
    let meterType = group[0].meterType;
    return {
      label: meterType.name,
      grids: [
        settingsRow(meterType),
        headerRow(meterType),
        // meters
        group.filter(it => it.parentMeterId).map(
          R.partialRight(meterRow, [tenants, onCellChange])
        ),
      ]
    };
  });
  return { sheets };
};



export default makeGridDef;
