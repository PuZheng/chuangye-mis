import $$ from '../xx';
import { $$dropdown } from '../widget/dropdown';
import { $$invoice, $$accountTerms } from './data-slots';

export var $$accountTermDropdown = $$dropdown({
  defaultText: '请选择会计账期',
  $$options: $$.connect([$$accountTerms], function (l) {
    return l.map(function (t) {
      return {
        value: t.id,
        text: t.name,
      };
    });
  }),
  $$value: $$.connect([$$invoice], function (o) {
    return o.accountTermId;
  }),
  onchange(value) {
    $$invoice.patch({
      accountTermId: parseInt(value),
    });
  },
});
