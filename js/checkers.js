export var notEmpty = function (label='') {
  return function (v) {
    if (!v ||
       (Array.isArray(v) && v.length == 0)) {
      throw new Error(label + '不能为空');
    }
  };
};
