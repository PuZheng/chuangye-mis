var $$newSearchDropdown = function (defaultText, value, options, onchange) {
  let $$searchText = $$('', 'search-text');
  let $$activated = $$(false, 'activated');
  let valueFunc = function (activated, searchText, accountTerms, queryObj) {
    return searchDropdown({
      defaultText: '请选择帐期',
      searchText,
      options: accountTerms.map(at => (
        {
          value: at.id,
          text: at.name,
        }
      )),
      value: queryObj.account_term_id,
      activated,
      onactivate(b) {
        $$activated.val(b);
      },
    onchange(value) {
      $$voucher.patch({
        payerId: parseInt(value),
      });
    },
    onsearch(searchText) {
      $$searchText.val(searchText);
    },
    match,
    optionContent(option) {
      return optionContent(option, searchText);
    },
    });
  };
}();
