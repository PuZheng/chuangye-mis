import R from 'ramda';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';

var rules = {
  invoiceType: notEmpty('发票类型'),
  number: notEmpty('发票号码'),
  accountTermId: notEmpty('会计帐期'),
  vendorId: function (v) {
    if (this.invoiceType.vendorType)  {
      notEmpty('销售方')(v);
    }
  },
  purchaserId: function (v) {
    if (this.invoiceType.purchaserType)  {
      notEmpty('购买方')(v);
    }
  },
};

var validate = R.partialRight(validateObj, [rules]);

var invoice = {
  id: 1,
  invoiceTypeId: 1,
  date: '2016-06-17',
  number: '123456',
  accountTermId: 1,
  isVAT: true,
  vendorId: 11,
  purchaserId: 1,
  notes: 'lorem',
  materialNotes: [
    { 
      id: 1, 
      materialSubjectId: 2,  
      materialSubject: {
        id: 2,
        name: '原材料1',
        unit: 'kg',
      },
      quantity: 50,
      unitPrice: 40,
      taxRate: 17,
    }
  ],
};
export default {
  get: id => new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve(invoice);
    }, 500);
  }),
  save: function (data) {
    invoice = Object.assign(data, {
      id: 1,
    });
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(1);
      }, 500);
    });
  },
  validate,
};
