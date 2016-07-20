import page from 'page';
import invoiceApp from './invoice/main.js';
import x from './xx.js';

x.init({ debug: true });

page('/invoice/:id?', function (ctx, next) {
  var app = invoiceApp;
  app.loading(true);
  setTimeout(function () {
    var args = [
      [app.invoiceTypes, [
        { id: 1, name: '进项增值税' },
        { id: 2, name: '销项增值税' },
        { id: 3, name: '普通发票' }
      ]],
      [app.accountTerms, [
        {id: 1, name: "2016-06"},
        {id: 2, name: "2016-07"}
      ]],
      [app.loading, false]
    ];
    if (ctx.params.id) {
      args = args.concat([
        [app.invoice, {
          id: 1,
          invoiceTypeId: 1,
          date: '2016-06-17',
          number: '123456',
          accountTermId: 1,
          isVAT: true,
          vendorId: 11,
          purchaserId: 1,
          notes: 'lorem',
        }],
        [app.vendors, [
          {id: 11, name: "张三"},
          {id: 22, name: "外部客户1"}
        ]], 
        [app.purchasers, [
          {id: 1, name: "厂部"},
          {id: 2, name: "外部客户1"}
        ]]
      ]);
    }
    x.update(...args);
  }, 500);
});

page();
