import x from '../js/xx.js';
var h = virtualDom.h;

const $$def = x({}, 'def');
const $$data = x([], 'data');
const $$selectedCellTag = x('', 'selected-cell-tag');
const $$editingCellTag = x('', 'editing-cell-tag');

const range = function (start, end) {
  var a = Array(end - start);
  for (var i = start; i < end; ++i) {
    a[i - start] = i;
  }
  return a;
};

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
const toColumnIdx = function (idx) {
  var idx = Number(idx).toString(26).split('').map((c, idx) => parseInt(c, 26) + 'A'.charCodeAt(0));
  if (idx.length > 1) {
    --idx[0];
  }
  return idx.map(i => String.fromCharCode(i)).join('');
};

const getCellVal = function (data, row, col) {
  return ((data || [])[row] || [])[col] || '';
};


const getCellDef = function (def, row, col) {
  return ((((def || [])[row] || [])[col]) || {});
};

const getCellEditor = function (cellDef, val) {
  // it could be more sophisticated
  return h('input', {
    type: 'text',
    value: val,
    onkeydown: function (e) {
      if (e.keyCode == 27 || e.keyCode == 13) {
        // do update;
        $$editingCellTag.val('');
        return false;
      }
    }
  });
};

const getContentVnode = function (def, val) {
  // it could be more sophisticated
  return h('span', String(val));
};

var smartGridValueFunc = function (def, data, selectedCellTag, editingCellTag) {
  if (Object.getOwnPropertyNames(def).length != 0) {
    return h('table.ui.compact.celled.table.smart-grid', [
      h('thead', [
        h('tr', [
          h('th', {
            style: {
              padding: '0.1em 0' 
            }
          }, ''),
          ...range(0, def.columns).map(idx => h('th', {
            style: {
              textAlign: 'center',
              padding: '0.1em 0' 
            }
          }, toColumnIdx(idx)))
        ]),
      ]),
      h('tbody', range(0, def.rows).map(row => h('tr', [
        h('th', { 
          style: {
            padding: '0.2em 0',
            textAlign: 'center',
            background: '#F9FAFB',
          }
        }, row + 1),
        ...range(0, def.columns).map(function (col) {
          let tag = `${toColumnIdx(row)}${col + 1}`;
          let selected = selectedCellTag == tag;
          let editing = editingCellTag == tag;
          let className = [tag];
          if (selected) {
            className.push('selected');
          }
          if (editing) {
            className.push('editing');
          }

          let style = Object.assign({}, {
            padding: '0.2em 0',
            textAlign: 'center',
          }, getCellDef(def.grids, row, col).style);
          selected && Object.assign(style, {
            background: 'lightpink',
          });
          let val = getCellVal(data, row, col);
          let cellDef = getCellDef(def.grids, row, col);
          let editor = getCellEditor(cellDef, val);
          let contentVnode = getContentVnode(cellDef, val);
          !editing && (editor.properties.style = Object.assign({}, editor.properties.style, {
            display: 'none',
          }));
          editing && (contentVnode.properties.style = Object.assign({}, contentVnode.properties.style, {
            display: 'none'
          }));
          return h('td' + className.map( i => '.' + i ), {
            style,
            onclick: function (e) {
              if (!selected && !editing) {
                x.update([$$selectedCellTag, tag], [$$editingCellTag, '']);
              }
            },
            ondblclick: cellDef.readOnly? undefined: function (e) {
              if (!editing) {
                x.update([$$editingCellTag, tag], [$$selectedCellTag, '']);
              }
            },
          }, [
            editor,
            contentVnode, 
          ]);
        })
      ])))
    ]);
  }
};

export default {
  $$view: x.connect([$$def, $$data, $$selectedCellTag, $$editingCellTag], smartGridValueFunc, 'smart-grid'),
  $$def,
  $$data,
  didMount: function (node) {
    var inputEl = node.querySelector('td.editing > input');
    inputEl && inputEl.focus();
  }
};
