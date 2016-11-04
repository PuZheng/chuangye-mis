import test from 'ava';
import Analyzer from './analyzer';
import R from 'ramda';
import { Token } from './engine/lexer';

test('primitive', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['1', '2', 'abc'],
          [void 0, '3'],
        ],
      },
      {
        label: 'B',
      },
      {
        label: '',
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let sheets = analyzer.sheets;
  t.is(sheets[0].label, 'A');
  t.is(sheets[1].label, 'B');
  t.is(sheets[2].label, 'SHEET3');
  let cells = sheets[0].cells;
  let cell = cells['A1'];
  t.is(cell.val, '1');
  t.true(cell.__primitive);
  cell = cells['B1'];
  t.is(cell.val, '2');
  t.true(cell.__primitive);
  cell = cells['C1'];
  t.is(cell.val, 'abc');
  t.true(cell.__primitive);
  cell = cells['B2'];
  t.is(cell.val, '3');
  t.true(cell.__primitive);

  t.true(R.isEmpty(sheets[1].cells));
  t.true(R.isEmpty(sheets[1].cells));
});

test('getCellDef', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['a', 'b', 'c'],
          [void 0, void 0, 'f'],
        ]
      }
    ]
  };

  let analyzer = new Analyzer(def);
  let cellDef = analyzer.getCellDef(0, 'A1');
  t.is(cellDef.val, 'a');
});

test('dependencies', function (t) {
  let def = {
    sheets: [
      {
        name: 'A',
        grids: [
          ['a', 'b', 'c'],
          ['=A1+SHEET1:A1+SHEET2:${REF1}', void 0, 'f'],
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let cellDef = analyzer.getCellDef(0, 'A2');
  t.is(cellDef.val, '=A1+SHEET1:A1+SHEET2:${REF1}');
  t.false(cellDef.__primitive);

  let dependencies = cellDef.__dependencies;
  t.is(dependencies.length, 3);
  let dep = dependencies[0];
  t.is(dep.type, Token.VARIABLE);
  t.deepEqual(dep.value, {
    sheet: '',
    name: 'A1'
  });
  dep = dependencies[1];
  t.is(dep.type, Token.VARIABLE);
  t.deepEqual(dep.value, {
    sheet: 'SHEET1',
    name: 'A1'
  });
  dep = dependencies[2];
  t.is(dep.type, Token.REF);
  t.deepEqual(dep.value, {
    sheet: 'SHEET2',
    name: 'REF1'
  });
});

test('setCellDef', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grids: [
          ['a', 'b', 'c'],
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let cellDef = analyzer.setCellDef(0, 'A2', '=SHEET1:A1+B1+SHEET2:${REF1}');
  let dependencies = cellDef.__dependencies;
  t.is(dependencies.length, 3);
  let dep = dependencies[0];
  t.is(dep.type, Token.VARIABLE);
  t.deepEqual(dep.value, {
    sheet: 'SHEET1',
    name: 'A1'
  });
  dep = dependencies[1];
  t.is(dep.type, Token.VARIABLE);
  t.deepEqual(dep.value, {
    sheet: '',
    name: 'B1'
  });
  dep = dependencies[2];
  t.is(dep.type, Token.REF);
  t.deepEqual(dep.value, {
    sheet: 'SHEET2',
    name: 'REF1'
  });
});

test('getTagByLabel', function (t) {
  let analyzer = new Analyzer({
    sheets: [
      {
        grids: [
          [
            {
              label: 'foo'
            }, void 0, void 0, {
              label: 'bar'
            }
          ]
        ]
      }
    ]
  });
  t.is(analyzer.getTagByLabel(0, 'foo'), 'A1');
  t.is(analyzer.getTagByLabel(0, 'bar'), 'D1');
});
