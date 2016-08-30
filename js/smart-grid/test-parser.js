import test from 'ava';
import Parser from './parser';

test('parser', function (t) {
  let def = [
    ['A', {
      grids: [
        ['1', '2', 'abc'],
        [, '3'],
      ],
    }],
    ['B', ''],
    ['', ''],
  ];
  let parser = new Parser(def);
  let sheets = Array.from(parser.sheets);
  t.is(sheets[0].name, 'A');
  t.is(sheets[1].name, 'B');
  t.is(sheets[2].name, 'SHEET3');
  let cells = Array.from(sheets[0].cells);
  t.is(cells.length, 4);
  t.is(cells[0].val, '1');
  t.is(cells[0].tag, 'A1');
  // t.is(cells[1].val, '2');
  // t.is(cells[1].tag, 'B1');
  // t.is(cells[2].val, 'abc');
  // t.is(cells[2].tag, 'C1');
  // t.is(cells[3].val, '3');
  // t.is(cells[3].tag, 'B2');
});
