import x from '../xx.js';
import {invoice, selectedInvoiceType} from './data-slots.js';
import tmpl from '../../template/invoice/materials-editor.ejs';


function materialsEditorValueFunc(
  invoice, selectedInvoiceType
) {
  return ejs.render(tmpl, {
    self: this,
    invoice,
    selectedInvoiceType,
  });
};

export default {
  view: x.connect(invoice, materialsEditorValueFunc),
  config: function (node) {

  },
};
