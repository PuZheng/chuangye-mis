import $$ from './xx';
import { searchDropdown } from './dropdown';
import { match, optionContent } from './dropdown-utils';

var $$searchDropdown = function ({defaultText, $$value, $$options, onchange}) {
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, searchText, options, value) {
    return searchDropdown({
      defaultText,
      searchText,
      options,
      value,
      activated,
      onactivate(b) {
        $$activated.val(b);
      },
      onchange,
      onsearch(searchText) {
        $$searchText.val(searchText);
      },
      match,
      optionContent(option) {
        return optionContent(option, searchText);
      },
    });
  };
  return $$.connect([$$activated, $$searchText, $$options, $$value], 
                    valueFunc);
};

export default $$searchDropdown;
