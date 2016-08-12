import virtualDom from 'virtual-dom';
var h = virtualDom.h;
export var field = function field(field, label, input, errors, required) {
  let err = errors[field];
  let classNames = ['field', 'inline'];
  required && classNames.push('required');
  err && classNames.push('error');
  classNames = classNames.map(c => '.' + c).join('');
  return h(classNames, [
    label? h('label.align-middle', label): '',
    h('.input', [
      input,
      err? h('.label.pointing.error', err): ''
    ]),
  ]);
};
