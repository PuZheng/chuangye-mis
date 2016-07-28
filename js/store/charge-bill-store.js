export default {
  get: function (id) {
    return new Promise(function (resolve, reject) {
      resolve({
        def: {
          alwaysShowHeader: true,
          columns: 10, 
          rows: 2,
          grids: [
            null,
            [
              {
                type: 'INT',
                readOnly: true,
              }, {
                type: 'STRING',
                readOnly: true,
              }, {
                type: 'STRING',
                readOnly: true,
              }, {
                type: 'FLOAT',
              }, {
                type: 'INT',
                readOnly: true,
              }, {
                value: '(* D2 E2)',
                readOnly: true,
              }, {
                type: 'FLOAT',
              }, {
                type: 'INT',
              }, {
                value: '(* G2 H2)',
                readOnly: true,
              }, {
                value: '(+ F2 I2)',
                readOnly: true,
              }
            ]
          ],
        },
        data: [
          ['ID', '承包人', '车间', '电表1读数', '电表1倍数', '电表1计数',  '电表2读数', '电表2倍数', '电表2计数', '总计数'],
          [1, '承包人1', '车间1', '', 5, '', '', 10]
        ] 
      });
    });
  },
};
