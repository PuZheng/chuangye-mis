import $$ from './xx';
import { dropdown } from './dropdown.js';

var $$dropdown = function ({$$options, $$value, defaultText, onchange}) {
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, options, value) {
    return dropdown({
      defaultText, 
      options,
      value: value,
      activated: activated,
      onactivate: function (b) {
        $$activated.val(b);
      },
      onchange
    });
  };
  return $$.connect([$$activated, $$options, $$value], valueFunc);
};

export default $$dropdown;
