var voucher = {};
export default {
  save: function (data) {
    voucher = data;
    voucher.id = 1;
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(voucher.id);
      }, 500);
    });
  }
};
