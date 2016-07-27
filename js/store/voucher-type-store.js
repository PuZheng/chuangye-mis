export default {
  get list() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve([
          { id: 1, name: '银行凭证' },
          { id: 2, name: '现金凭证' },
        ]);
      }, 500);
    });
  }
};
