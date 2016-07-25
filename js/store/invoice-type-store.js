export default {
  get list() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve([
          { 
            id: 1, 
            name: '进项增值税',  
            vendorType: 'supplier',
            purchaserType: 'tenant',
            isVAT: true,
            materialType: 'inbound',
          },
          { 
            id: 2, 
            name: '销项增值税',
            vendorType: 'tenant',
            purchaserType: 'customer',
            isVAT: true,
            materialType: 'outbound',
          },
          { 
            id: 3, 
            name: '普通发票',
            purchaserType: 'owner',
            isVAT: false,
          }
        ]);
      }, 500);
    });
  }
};
