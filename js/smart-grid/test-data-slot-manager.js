import test from 'ava';
import DataSlotManager from './data-slot-manager';
import Analyzer from './analyzer';

test('empty', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: []
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.falsy(mngr.get(0, 'A1'));
});

test('simple', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['a', 'b', 'c'],
          [, , , 'x']
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.falsy(mngr.get(0, 'A1'));
  t.falsy(mngr.get(0, 'B1'));
  t.falsy(mngr.get(0, 'C1'));
  t.falsy(mngr.get(0, 'C2'));
  t.falsy(mngr.get(0, 'D2'));
});

test('dependency1', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['1', '2', '3'],
          [, , , '=SHEET1:A1*3']
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.is(mngr.get(0, 'D2').val(), '3');
  mngr.get(0, 'A1').val('3');
  t.is(mngr.get(0, 'D2').val(), '9');
  t.falsy(mngr.get(0, 'B1'));
  t.falsy(mngr.get(0, 'C1'));
});

test('dependency2', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['1', '2', '3'],
          [, , , '=A1+SHEET2:A1*C1']
        ]
      }, {
        label: 'B',
        grids: [
          ['10']
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.is(mngr.get(0, 'D2').val(), '31');
  mngr.get(0, 'A1').val('3');
  t.is(mngr.get(0, 'D2').val(), '33');
});

test('dependency3', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['1', '2', '3'],
          [, , , '=A1+SHEET2:A1*C1'],
          [, , , '=D2+B1']
        ]
      }, {
        label: 'B',
        grids: [
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.falsy(mngr.get(0, 'D2').val());
  mngr.get(1, 'A1').val('3');
  t.is(mngr.get(0, 'D2').val(), '10');
  t.is(mngr.get(0, 'D3').val(), '12');
});
