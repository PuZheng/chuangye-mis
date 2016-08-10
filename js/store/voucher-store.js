var voucher = {
  id: 1,
  number: 1,
  voucherTypeId: 1,
  date: '2016-07-09',
  voucherSubjectId: 1,
  isPublic: true,
  payerId: 4,
  recipientId: 1,
  comment: 'blahblahblahblah',
};
export default {
  save: function (data) {
    console.log(data);
    voucher = data;
    voucher.id = 1;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(voucher.id);
      }, 500);
    });
  },
  get: function (id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(voucher);
      }, 500);
    });
  }
};
