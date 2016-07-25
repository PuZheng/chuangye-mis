export default {
  fetchList: function (opts) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        switch (opts.type) {
          case 'inbound': {
            resolve([
              { id: 1, name: '原材料1', unit: 'kg' },
              { id: 2, name: '原材料2', unit: '吨' },
              { id: 3, name: '原材料3', unit: '桶' },
            ]);
            break;
          } 
          case 'outbound': {
            resolve([
              { id: 11, name: '产成品1', unit: '箱' },
              { id: 12, name: '产成品2', unit: 'kg' },
              { id: 13, name: '产成品3', unit: '吨' },
            ]);
            break;
          }
          default:
            resolve([]);
        }
      }, 500);
    });
  }
};
