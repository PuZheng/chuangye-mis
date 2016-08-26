import test from 'ava';
import diff from './diff';

test('basic', function (t) {
  t.deepEqual(diff({
    a: 1
  }), {
    a: 1
  });
  t.deepEqual(diff({
    a: 1
  }, {
    a: 1
  }), undefined);
  t.deepEqual(diff({
    a: 1
  }, {
    a: 2
  }), {
    a: 1
  });
  t.deepEqual(diff({
    a: null
  }, {
    a: null
  }), undefined);
  console.log(diff({
    a: {
      b: 1
    }
  }, {
    a: {
      b: 1
    }
  }));
  t.deepEqual(diff({
    a: {
      b: 1
    }
  }, {
    a: {
      b: 1
    }
  }), undefined);
});
