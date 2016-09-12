import pipeSlot from './';
import $$ from '../slot/';
import test from 'ava';

test('pipe-slot', function (t) {
  var $$s1 = pipeSlot(1, 's1');
  $$.connect([$$s1], function ([s1]) {
    return s1;
  }, 's2');
  t.throws(function () {
    $$.connect([$$s1], function ([s1]) {
      return s1;
    }, 's3');
  }, Error, 'pipe slot only accepts one child');
});
