import R from 'ramda';

export default {
  get: function (id) {
    return new Promise(function (resolve, reject) {
      let readOnly = {
        readOnly: true
      };
      resolve({
        def: {
          alwaysShowHeader: true,
          columns: 12, 
          rows: 4,
          grids: [
            R.repeat({
              readOnly: true,
              style: {
                background: 'teal',
                color: 'yellow',
                fontWeight: 'bold',
              }
            }, 12),
            [readOnly, readOnly, readOnly, , readOnly, readOnly, , readOnly, readOnly, readOnly, readOnly, readOnly],
            [readOnly, readOnly, readOnly, , readOnly, readOnly, , readOnly, readOnly, readOnly, readOnly, readOnly],
            [Object.assign({
              style: {
                fontWeight: 'bold',
              }
            }, readOnly), readOnly]
          ],
        },
        data: [
          ['ID', '承包人', '车间', '电表1读数', '电表1倍数', '电表1计数',  '电表2读数', '电表2倍数', '电表2计数', '总计数', '电费单价', '费用'],
          ['1', '承包人1', '车间1', , 5, '=D2*E2', , '10', '=G2*H2', '=F2+I2', '1.5', '=J2*K2'],
          ['2', '承包人2', '车间2', , 5, '=D3*E3', , '10', '=G3*H3', '=F3+I3', '1.5', '=J3*K3'],
          ['总费用(元):', '=L2+L3'],
        ] 
      });
    });
  },
};
