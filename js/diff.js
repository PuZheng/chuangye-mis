var diff = function (lhs, rhs) {
  let ret = {};
  for (let k in lhs) {
    if (lhs.hasOwnProperty(k)) {
      if (typeof lhs[k] === 'object' && lhs[k] !== null) {
        if (typeof rhs[k] != 'object') {
          ret[k] = lhs[k];
        } else {
          ret[k] = diff(lhs[k], rhs[k]);
          if (ret[k] === undefined) {
            delete ret[k];
          }
        } 
      } else {
        if (lhs[k] !== (rhs || {})[k]) {
          ret[k] = lhs[k];
        }
      }
    }
  }
  if (Object.keys(ret).length) {
    return ret;
  }
};

export default diff;
