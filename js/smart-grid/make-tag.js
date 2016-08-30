/**
 * change to column index notation, this notation is very bizzare, for example:
 * 0 -> A  // assume A denotes 0
 * ...
 * 25 -> Z
 * but, 26, which is '10' as 26-based integer, converted to 'AA' (which should be 'BA' if we assume B denotes 1),
 * so the most significant digit should be minus one. 
 * This flow shows how 26 is changed to 'AA'
 * 26 -> 10 -> BA -> AA 
 * */
var toColumnIdx = function (idx) {
  var idx = Number(idx).toString(26).split('').map(c => parseInt(c, 26) + 'A'.charCodeAt(0));
  if (idx.length > 1) {
    --idx[0];
  }
  return idx.map(i => String.fromCharCode(i)).join('');
};

const makeTag = function (row, col) {
  return `${toColumnIdx(col)}${row + 1}`;
};

export default makeTag;
