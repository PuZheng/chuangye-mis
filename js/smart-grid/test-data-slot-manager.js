import test from 'ava';
import DataSlotManager from './data-slot-manager';

test('empty', function (t) {
  let def = [
    ['A', {
      grids: []
    }]
  ];
  let mngr = new DataSlotManager(def);
  t.falsy(mngr.get('A', 'A1'));
});

test('simple', function (t) {
  let def = [
    ['A', {
      grids: [
        ['a', 'b', 'c'],
        [, , , 'x']
      ]
    }]
  ];
  let mngr = new DataSlotManager(def);
  t.is(mngr.get('A', 'A1').val(), 'a');
  t.is(mngr.get('A', 'B1').val(), 'b');
  t.is(mngr.get('A', 'C1').val(), 'c');
  t.falsy(mngr.get('A', 'C2'));
  t.is(mngr.get('A', 'D2').val(), 'x');
});

test('dependency1', function (t) {
  let def = [
    ['A', {
      grids: [
        ['1', '2', '3'],
        [, , , '=A1+B1*C1']
      ]
    }]
  ];
  let mngr = new DataSlotManager(def);
  t.is(mngr.get('A', 'D2').val(), '7');
  mngr.get('A', 'A1').val('3');
  t.is(mngr.get('A', 'D2').val(), '9');
});

test('dependency2', function (t) {
  let def = [
    ['A', {
      grids: [
        ['1', '2', '3'],
        [, , , '=A1+B:A1*C1']
      ]
    }],
    ['B', {
      grids: [
        ['10']
      ]
    }]
  ];
  let mngr = new DataSlotManager(def);
  t.is(mngr.get('A', 'D2').val(), '31');
  mngr.get('A', 'A1').val('3');
  t.is(mngr.get('A', 'D2').val(), '33');
});

test('dependency3', function (t) {
  let def = [
    ['A', {
      grids: [
        ['1', '2', '3'],
        [, , , '=A1+B:A1*C1'],
        [, , , '=D2+B1']
      ]
    }],
    ['B', {
      grids: [
      ]
    }]
  ];
  let mngr = new DataSlotManager(def);
  t.falsy(mngr.get('A', 'D2').val());
  mngr.get('B', 'A1').val('3');
  t.is(mngr.get('A', 'D2').val(), '10');
  t.is(mngr.get('A', 'D3').val(), '12');
});
