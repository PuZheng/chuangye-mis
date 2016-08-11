export var notEmpty = function (label) {
  return function (v) {
    if (!v) {
      throw new Error(label + '不能为空');
    }
  };
};
