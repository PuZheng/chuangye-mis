import x from '../xx.js';
import R from 'ramda';
import {invoice, selectedInvoiceType} from './data-slots.js';
import tmpl from '../../template/invoice/materials-editor.ejs';
import once from 'once';

const materialSubjects = x([]).setTag('material-subjects');
// 选中的物料类型
const selectedMaterialSubject = x({}).setTag('selected-material-subject');
// 正在编辑的物料单
const materialNote = x({}).setTag('material-node');
const errors = x({}).setTag('materials-editor-errors');

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
        [invoice, Object.assign(invoice.val(), {
          materialNotes: (invoice.val().materialNotes || []).concat(materialNote.val()),
        })],
        [materialNote, {}]
      );
    }).catch(errors.val);
    return false;
  });
  $node.on('click', 'i.remove', function (e) {
    let materialNotes = invoice.val().materialNotes;
    materialNotes.splice($(this).data('idx'), 1);
    invoice.patch({
      materialNotes 
    });
  });
});

export default {
  view: x.connect(
    invoice, materialSubjects, selectedMaterialSubject,
    materialNote,
    materialsEditorValueFunc),
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
