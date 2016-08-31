import test from 'ava';
import $$ from './';

test('basic', function (t) {
  var $$s1 = $$(1);
  t.is($$s1.val(), 1);
});

test('connect1', function (t) {
  var $$s1 = $$(1);
  var $$s2 = $$(2);
  var $$s3 = $$().connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2; 
  });
  t.is($$s3.val(), 3);
});

test('connect2', function (t) {
  $$.init({ debug: true });
  var $$s1 = $$(1, 's1');
  var $$s2 = $$(2, 's2');
  var $$s3 = $$(null, 's3').connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2; 
  });

  var $$s4 = $$(null, 's4').connect([$$s1, $$s2, $$s3], function ([s1, s2, s3]) {
    return s1 + s2 + s3;
  });

  t.is($$s4.val(), 6);

  $$s1.val(2);
  t.is($$s4.val(), 8);
});

test('connect3', function (t) {
  $$.init({ debug: true });
  var $$s1 = $$(1, 's1');
  var $$s2 = $$(2, 's2');

  var $$s4 = $$(null, 's4').connect([$$s1], function ([s1]) {
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
  $$.init({ debug: true });
  var $$s1 = $$(1, 's1');
  var $$s2 = $$(2, 's2');
  var $$s3 = $$(null, 's4').connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2;
  });

  var $$s4 = $$(null, 's4').connect([$$s1, $$s3], function ([s1, s3]) {
    return s1 + s3;
  });

  var $$s5 = $$(null, 's5').connect([$$s1, $$s4], function ([s1, s4]) {
    return s1 + s4; 
  });


  $$s1.val(2);
  t.is($$s5.val(), 8);
});

test('connect5', function (t) {
  
  var $$s1 = $$(1, 's1');
  var $$s2 = $$(2, 's2');

  var $$s3 = $$.connect([$$s1, $$s2], function ([s1, s2]) {
    return s1 + s2; 
  }, 's3');

  t.is($$s3.val(), 3);

  $$s1.val(2);
  t.is($$s3.val(), 4);
});
