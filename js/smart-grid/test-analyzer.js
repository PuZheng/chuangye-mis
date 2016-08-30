import test from 'ava';
import Analyzer from './analyzer';
import R from 'ramda';

test('analyzer', function (t) {
  let def = [
    ['A', {
      grids: [
        ['1', '2', 'abc'],
        [, '3'],
      ],
    }],
    ['B', {}],
    ['', {}],
  ];
  let analyzer = new Analyzer(def);
  let sheets = analyzer.sheets;
  t.is(sheets[0].name, 'A');
  t.is(sheets[1].name, 'B');
  t.is(sheets[2].name, 'SHEET3');
  let cells = sheets[0].cells;
  let cell = cells['A1'];
  t.is(cell.val, '1');
  t.is(cell.tag, 'A1');
  t.true(cell.primitive);
  cell = cells['B1'];
  t.is(cell.val, '2');
  t.is(cell.tag, 'B1');
  t.true(cell.primitive);
  cell = cells['C1'];
  t.is(cell.val, 'abc');
  t.is(cell.tag, 'C1');
  t.true(cell.primitive);
  cell = cells['B2'];
  t.is(cell.val, '3');
  t.is(cell.tag, 'B2');
  t.true(cell.primitive);

  t.true(R.isEmpty(sheets[1].cells));
  t.true(R.isEmpty(sheets[1].cells));
});

test('getCellDef', function (t) {
  let def = [
    ['A', {
      grids: [
        ['a', 'b', 'c'],
        [, , 'f'],
      ]
    }]
  ];

  let analyzer = new Analyzer(def);
  let cellDef = analyzer.getCellDef('A', 'A1');
  t.is(cellDef.val, 'a');
});

test('dependencies', function (t) {
  let def = [
    ['A', {
      grids: [
        ['a', 'b', 'c'],
        ['=A1+B1+C1+A:A1', , 'f'],
      ]
    }]
  ];
  let analyzer = new Analyzer(def);
  let cellDef = analyzer.getCellDef('A', 'A2');
  t.is(cellDef.val, '=A1+B1+C1+A:A1');
  t.false(cellDef.primitive);

  let dependencies = cellDef.dependencies;
  t.deepEqual(dependencies[0], {
    sheetName: '',
    tag: 'A1'
  });
  t.deepEqual(dependencies[1], {
    sheetName: '',
    tag: 'B1'
  });
  t.deepEqual(dependencies[2], {
    sheetName: '',
    tag: 'C1'
  });
  t.deepEqual(dependencies[3], {
    sheetName: 'A',
    tag: 'A1'
  });
});
