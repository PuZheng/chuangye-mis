export default {
  get: id => new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve({
        id: 1,
        invoiceTypeId: 1,
        date: '2016-06-17',
        number: '123456',
        accountTermId: 1,
        isVAT: true,
        vendorId: 11,
        purchaserId: 1,
        notes: 'lorem',
      });
    }, 500);
  }),
  save: function (invoice) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(1);
      }, 500);
    });
  },
};
