import page from 'page';
import * as invoicePage from './invoice-page.js';
import x from './xx.js';

page('/invoice', function (ctx, next) {
  const page = invoicePage;
  x.update([page.loading, false], 
           [page.invoice, null], 
           [page.vendorCandidates, [
             {id: 11, name: "张三"},
             {id: 22, name: "外部客户1"}
           ]], 
           [page.purchaserCandidates, [
             {id: 1, name: "厂部"},
             {id: 2, name: "外部客户1"}
           ]],
           [page.accountTerms, [
             {id: 1, name: "2016-06"},
             {id: 2, name: "2016-07"}
           ]]
          );
});

page();
