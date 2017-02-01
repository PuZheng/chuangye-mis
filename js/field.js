import virtualDom from 'virtual-dom';
import R from 'ramda';
var h = virtualDom.h;

/**
 * @param key - the key of the field, used to locate error in errors.
 *  could be an array or string. for example:
 *  if errors is { a: 'foo', b: { c: 'bar' } },
 *  both key ['a'] and 'a' will find 'foo'
 *  key ['b', 'c'] will find 'bar'
 * */
export var field = function field({
  key, label='', input, errors={}, required
}) {
  let err = key && R.path([].concat(key))(errors);
  let classNames = ['field', 'inline'];
  required && classNames.push('required');
  err && classNames.push('error');
  classNames = classNames.map(c => '.' + c).join('');
  return h(classNames, [
    label? h('label.align-middle', label): '',
    h('.input', [
      input,
      err? h('div', h('.label.pointing.error', err)): ''
    ]),
  ]);
};

export default field;
