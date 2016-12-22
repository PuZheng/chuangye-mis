import test from 'ava';
import DataSlotManager from './data-slot-manager';
import Analyzer from './analyzer';

test('empty', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: []
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
        grid: [
          ['a', 'b', 'c'],
          [void 0, void 0, void 0, 'x']
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
        grid: [
          ['1', '2', '3'],
          [void 0, void 0, void 0, '=SHEET1:A1*3']
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
        grid: [
          ['1', '2', '3'],
          [void 0, void 0, void 0, '=A1+SHEET2:A1*C1']
        ]
      }, {
        label: 'B',
        grid: [
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
        grid: [
          ['1', '2', '3'],
          [void 0, void 0, void 0, '=A1+SHEET2:A1*C1'],
          [void 0, void 0, void 0, '=D2+B1']
        ]
      }, {
        label: 'B',
        grid: [
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

test('dependency4', function (t) {
  let def = {
    sheets: [
      {
        grid: [
          [{
            label: 'FOO',
            val: '19'
          }, '=${FOO} * 2']
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.is(mngr.get(0, 'B1').val(), '38');
});

test('dependency5', function (t) {
  let def = {
    sheets: [
      {
        grid: [
          ['=SHEET2:${FOO} * A2'],
          ['9']
        ]
      }, {
        grid: [
          [{
            label: 'FOO'
          }]
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.falsy(mngr.get(0, 'A1').val());
  mngr.get(1, 'A1').val('3');
  t.is(mngr.get(0, 'A1').val(), '27');
});

test('create', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
          ['1', '2', '3'],
          [void 0, void 0, void 0, '=A1*2'],
          [void 0, void 0, void 0, '=D2']
        ]
      }, {
        label: 'B',
        grid: [
        ]
      }
    ]
  };
  let mngr = new DataSlotManager(new Analyzer(def));
  t.is(mngr.create(0, 'B1').val(), '2');
  t.is(mngr.create(0, 'A2').val(), void(0));
});

test('reset1', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let mngr = new DataSlotManager(analyzer);
  analyzer.setCellDef(0, 'A1', {
    val: '1',
  });
  mngr.reset();
  let $$slot = mngr.get(0, 'A1');
  t.is($$slot, void(0));
});

test('reset2', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
          ['1', '2']
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let mngr = new DataSlotManager(analyzer);
  analyzer.setCellDef(0, 'C1', {
    val: '=A1+B1',
  });
  mngr.reset();
  let $$slot = mngr.get(0, 'C1');
  t.is($$slot.val(), '3');
});

test('reset3', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
          ['1', '2', '3'],
          ['=C1*2'],
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let mngr = new DataSlotManager(analyzer);
  analyzer.setCellDef(0, 'C1', {
    val: '=B1-A1',
  });
  mngr.reset();
  let $$slot = mngr.get(0, 'C1');
  t.is($$slot.val(), '1');
  $$slot = mngr.get(0, 'A2');
  t.is($$slot.val(), '2');
});

test('reset4', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
          ['1', '2', '3'],
          ['=C1*2'],
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let mngr = new DataSlotManager(analyzer);
  let $$slot = mngr.get(0, 'C1');
  t.is($$slot.val(), '3');
  analyzer.setCellDef(0, 'A2', {
    val: '1',
  });
  mngr.reset();
  $$slot = mngr.get(0, 'A2');
  t.is($$slot, void(0));
  $$slot = mngr.get(0, 'C1');
  t.is($$slot, void(0));
});

test('reset5', function (t) {
  let def = {
    sheets: [
      {
        label: 'A',
        grid: [
          ['1'],
        ]
      }
    ]
  };
  let analyzer = new Analyzer(def);
  let mngr = new DataSlotManager(analyzer);
  let $$slot = mngr.create(0, 'A1');
  t.is($$slot.val(), '1');
  analyzer.setCellDef(0, 'A1', {
    val: '10',
  });
  mngr.reset();
  $$slot = mngr.get(0, 'A1');
  t.is($$slot.val(), '10');
});
