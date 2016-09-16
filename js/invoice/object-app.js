import $$ from 'slot';
import moment from 'moment';
import {$$loading, $$invoiceTypes, $$accountTerms, $$invoice} from './data-slots.js';
import page from './page.js';
import invoiceTypeStore from 'store/invoice-type-store';
import accountTermStore from 'store/account-term-store';
import invoiceStore from 'store/invoice-store';

export default {
  page,
  init(id) {
    let promises = [
      invoiceTypeStore.list, 
      accountTermStore.list,
      id? invoiceStore.get(id): {
        date: moment().format('YYYY-MM-DD')
      },
    ];
    $$loading.inc();
    Promise.all(promises).then(function ([invoiceTypes, accountTerms, invoice]) {
      let args = [
        [$$invoiceTypes, invoiceTypes],
        [$$accountTerms, accountTerms],
        [$$loading, 0],
        [$$invoice, invoice]
      ];
      $$.update(...args);
    });
  }
};
