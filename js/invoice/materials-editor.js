import x from '../xx.js';
import R from 'ramda';
import {invoiceSlot, selectedInvoiceType} from './data-slots.js';
import tmpl from './materials-editor.ejs';
import once from 'once';

const materialSubjects = x([], 'material-subjects');
// 选中的物料类型
const selectedMaterialSubject = x({}, 'selected-material-subject');
// 正在编辑的物料单
const materialNote = x({}, 'material-node');
const errors = x({}, 'materials-editor-errors');

const validate = function () {
  return Promise.resolve();
};

function materialsEditorValueFunc(
  invoice, materialSubjects, selectedMaterialSubject,
  materialNote
) {
  return ejs.render(tmpl, {
    self: this,
    invoice,
    materialSubjects,
    selectedMaterialSubject,
    materialNote
  });
};

var bindEvents = once(function (node) {
  let $node = $(node);
  $node.find('[name=quantity]').change(function (e) {
    materialNote.patch({
      quantity: parseFloat(this.value),
    });
  });
  $node.find('[name=unitPrice]').change(function (e) {
    materialNote.patch({
      unitPrice: parseFloat(this.value),
    });
  });
  $node.find('[name=taxRate]').change(function (e) {
    materialNote.patch({
      taxRate: parseFloat(this.value),
    });
  });
  $node.find('button.add').click(function (e) {
    e.preventDefault();
    validate().then(function () {
      x.update(
        [invoiceSlot, Object.assign(invoiceSlot.val(), {
          materialNotes: (invoiceSlot.val().materialNotes || []).concat(materialNote.val()),
        })],
        [materialNote, {}]
      );
    }).catch(errors.val);
    return false;
  });
  $node.on('click', 'i.remove', function (e) {
    let materialNotes = invoiceSlot.val().materialNotes;
    materialNotes.splice($(this).data('idx'), 1);
    invoiceSlot.patch({
      materialNotes 
    });
  });
});

export default {
  view: x.connect(
    [invoiceSlot, materialSubjects, selectedMaterialSubject,
    materialNote],
    materialsEditorValueFunc, 'materials-editor'),
  materialSubjects,
  config: function (node) {
    bindEvents(node);
    let $node = $(node);
    $(node).find('[name=materialSubject]').dropdown({
      onChange: function (value, text, $choice) {
        value = parseInt(value);
        x.update( 
                 [materialNote, Object.assign(materialNote.val(), {
                   materialSubjectId: value,
                   materialSubject: R.find(R.propEq('id', value))(materialSubjects.val()),
                 })],
                 [selectedMaterialSubject, R.find(R.propEq('id', value))(materialSubjects.val())]
                );
      }
    });
  },
};
