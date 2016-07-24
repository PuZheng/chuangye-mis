export default {
  fetchList: function (opts) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        switch (opts.type) {
          case 'tenant': {
            resolve([
              {id: 1, name: '承包人1'},
              {id: 2, name: '承包人2'},
            ]);
            break;
          }
          case 'owner': {
            resolve([
              { id: 3, name: '业主' }
            ]);
            break;
          }
          case 'customer': {
            resolve([
              { id: 4, name: '客户1' },
              { id: 5, name: '客户2' },
              { id: 6, name: '客户3' },
            ]);
          }
          case 'supplier': {
            resolve([
              { id: 7, name: '供应商1' },
              { id: 8, name: '供应商2' },
            ]);
          }
          default:
            reject("invalid entity type: " + opts.type);
        } 
      }, 500);
    });
  }
};
