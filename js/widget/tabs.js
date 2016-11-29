import $$ from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var $$tabs = function ({
  $$tabNames,
  $$activeIdx,
  onchange,
  $$content,
}) {
  return $$.connect(
    [$$tabNames, $$activeIdx, $$content],
    function ([tabNames, activeIdx, content]) {
      return h('.tabs', [
        h('.tabular.menu', tabNames.map(function (tn, idx) {
          return h('.item' + (idx === activeIdx? '.active': ''), {
            onclick() {
              onchange(idx, tn);
            }
          }, tn);
        })),
        h('.content', content)
      ]);
    }
  );
};

export default $$tabs;
