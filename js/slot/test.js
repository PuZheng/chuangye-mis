import test from 'ava';
import $$ from './';

test('basic', function (t) {
  let $$s1 = $$(1);
  t.is($$s1.val(), 1);
});

test('connect1', function (t) {
  let $$s1 = $$(1);
  let $$s2 = $$(2);
  let $$s3 = $$().connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2;
  });
  t.is($$s3.val(), 3);
});

test('connect2', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$(2, 's2');
  let $$s3 = $$(null, 's3').connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2;
  });

  let $$s4 = $$(null, 's4').connect(
    [$$s1, $$s2, $$s3], function ([s1, s2, s3]) {
      return s1 + s2 + s3;
    }
  );

  t.is($$s4.val(), 6);
});

test('connect3', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$(2, 's2');

  let $$s4 = $$(null, 's4').connect([$$s1], function ([s1]) {
    return s1 * 2;
  });
  $$s4.connect([$$s2], function ([s2]) {
    return s2 * 2;
  });

  t.is($$s4.val(), 4);

  $$s1.val(2);
  t.is($$s4.val(), 4);

  $$s2.val(3);
  t.is($$s4.val(), 6);
});

test('connect4', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$(2, 's2');
  let $$s3 = $$(null, 's4').connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2;
  });

  let $$s4 = $$(null, 's4').connect([$$s1, $$s3], function ([s1, s3]) {
    return s1 + s3;
  });

  let $$s5 = $$(null, 's5').connect([$$s1, $$s4], function ([s1, s4]) {
    return s1 + s4;
  });


  $$s1.val(2);
  t.is($$s5.val(), 8);
});

test('connect5', function (t) {

  let $$s1 = $$(1, 's1');
  let $$s2 = $$(2, 's2');

  let $$s3 = $$.connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2;
  }, 's3');

  t.is($$s3.val(), 3);

  $$s1.val(2);
  t.is($$s3.val(), 4);
});

test('changed1', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$.connect([$$s1], function ([s1]) {
    return s1 + 1;
  }, 's2', function () {
    return false;
  });
  let cnt = 0;
  let $$s3 = $$.connect([$$s2], function([s2]) {
    ++cnt;
    return s2 + 1;
  });
  t.is($$s3.val(), 3);
  t.is(cnt, 1);
  $$s1.val(2);
  t.is(cnt, 1);
  t.is($$s3.val(), 3);
});

test('changed2', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$.connect([$$s1], function ([s1]) {
    return s1 + 1;
  }, 's2', function () {
    return false;
  });
  let $$s3 = $$.connect([$$s2], function([s2]) {
    return s2 + 1;
  });
  let cnt = 0;
  let $$s4 = $$.connect([$$s3, $$s2], function ([s3, s2]) {
    cnt++;
    return s3 + s2;
  });
  t.is($$s4.val(), 5);
  t.is(cnt, 1);
  $$s1.val(2);
  t.is(cnt, 1);
  t.is($$s4.val(), 5);
});

test('changed3', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$(2, 's2');
  let $$s3 = $$.connect([$$s1], function ([s1]) {
    return s1 + 1;
  }, 's3', function () {
    return false;
  });
  let $$s4 = $$.connect([$$s2], function([s2]) {
    return s2 + 1;
  }, 's4', function () {
    return true;
  });
  let cnt = 0;
  let $$s5 = $$.connect([$$s3, $$s4], function ([s3, s4]) {
    cnt++;
    return s3 + s4;
  });
  t.is($$s5.val(), 5);
  t.is(cnt, 1);
  $$.update(
    [$$s1, 2],
    [$$s2, 3]
  );
  t.is(cnt, 2);
  t.is($$s5.val(), 7);
});

test('changed4', function (t) {
  let $$s1 = $$(1, 's1', function () {
    return false;
  });
  let $$s2 = $$(2, 's2', function () {
    return false;
  });
  let $$s3 = $$.connect([$$s1], function ([s1]) {
    return s1 + 1;
  }, 's3', function () {
    return false;
  });
  t.is($$s3.val(), 2);
  $$.update([$$s1, 2]);
  t.is($$s3.val(), 2);
  let $$s4 = $$.connect([$$s2], function([s2]) {
    return s2 + 1;
  }, 's4', function () {
    return false;
  });
  let cnt = 0;
  let $$s5 = $$.connect([$$s3, $$s4], function ([s3, s4]) {
    cnt++;
    return s3 + s4;
  });
  t.is($$s5.val(), 5);
  t.is(cnt, 1);
  $$.update(
    [$$s1, 2],
    [$$s2, 3]
  );
  t.is(cnt, 1);
  t.is($$s5.val(), 5);
});

test('map', function (t) {
  let $$s1 = $$(1, 's1');
  let $$s2 = $$.connect([$$s1], function (s1) {
    return s1 * 2;
  }).map(function (v) {
    return v * 2;
  });

  t.is($$s2.val(), 4);
});

test('refresh', function (t) {
  let $$s1 = $$.connect([], function () {
    return 1;
  }, 'slot1', function (oldV, newV) {
    return oldV !== newV;
  });

  let b = $$s1.refresh();
  t.true(b);

  $$s1 = $$.connect([], function () {
    let counter = 1;
    return function () {
      return counter++;
    };
  }(), function (oldV, newV) {
    return oldV === newV;
  });

  let called;
  $$s1.change(function () {
    called = true;
  });
  b = $$s1.refresh();
  t.true(b);
  t.true(called);

  $$s1 = $$(1, 'slot1');
  let $$s2 = $$.connect([$$s1], function ([s1]) {
    return s1 * 2;
  }, 'slot2');
  $$s1.refresh(null, true);
  t.is($$s2.val(), 2);
});
