
page('/foo/:id?', function (ctx, next) {
  let app = fooObjectApp;
  mount(fooObject.page);
  app.$$loading.val(true);
  let promises = [
    ...,
    ctx.params.id? fooStore.get(ctx.params.id): {}
  ];
  Promise.all(promises).then(function ([..., object]) {
    x.update(
      [app.$$loading, false],
      [app.$$object, voucher]
    );
  });
});
