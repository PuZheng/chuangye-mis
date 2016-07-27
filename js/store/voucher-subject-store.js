export default {
  get list() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve([
          { id: 1, name: '项目1', payerType: 'customer', recipientType: 'tenant', comment: '项目1的说明', isPublic: true },
          { id: 2, name: '项目2', payerType: 'tenant', recipientType: 'owner', comment: '项目2的说明', isPublic: true },
          { id: 2, name: '项目3', payerType: 'tenant', recipientType: 'supplier', comment: '项目3的说明', isPublic: false },
        ]);
      }, 500);
    });
  }
};
