export var classNames = function (...classes) {
  return classes.filter(c => !!c).map(c => '.' + c).join('');
};

export default classNames;
