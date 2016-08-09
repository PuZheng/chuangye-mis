import x from '../xx.js';
import R from 'ramda';
import {$$invoice, $$selectedInvoiceType} from './data-slots.js';
import once from 'once';
import { dropdown } from '../dropdown.js';

export var $$materialSubjects = x([], 'material-subjects');
// 选中的物料类型
const $$selectedMaterialSubject = x({}, 'selected-material-subject');
// 正在编辑的物料单
const $$materialNote = x({}, 'material-node');
const $$errors = x({}, 'materials-editor-errors');
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

const validate = function () {
  return Promise.resolve();
};


var $$materialSubjectDropdown = function () {
  let $$activated = x(false, 'activated');
  return x.connect([
    $$activated, 
    $$materialSubjects,
    $$materialNote
  ], function (activated, materialSubjects, materialNote) {
    return dropdown({
      defaultText: '请选择物料类别',
      options: materialSubjects.map( ms => ({ value: ms.id, text: ms.name }) ),
      onactivate(b) {
        $$activated.val(b);
      },
      activated: activated,
      value: materialNote.materialSubjectId,
      onchange(value, option) {
        value = parseInt(value);
        x.update( 
                 [$$materialNote, Object.assign($$materialNote.val(), {
                   materialSubjectId: value,
                   materialSubject: R.find(R.propEq('id', value))($$materialSubjects.val()),
                 })],
                 [$$selectedMaterialSubject, R.find(R.propEq('id', value))($$materialSubjects.val())]
                );
      }
    });
  });
}();


function materialsEditorValueFunc(
  invoice, selectedMaterialSubject,
  materialNote, materialSubjectDropdown
) {
  return h('.border-box.border.rounded', [
    h('.form', [
      h('.field.inline.required', [
        h('label', '物料类别'),
        materialSubjectDropdown,
      ]),
      h('.field.inline.required', [
        h('label', '数量'),
        h('input', {
          value: materialNote.quantity || '',
          onchange(e) {
            $$materialNote.patch({
              quantity: parseInt(this.value),
            });
          }
        }),
        h('label', selectedMaterialSubject.unit),
      ]),
      h('.field.inline.required', [
        h('label', '单价(元)'),
        h('input', {
          value: materialNote.unitPrice || '',
          onchange(e) {
            $$materialNote.patch({
              unitPrice: parseFloat(this.value),
            });
          }
        })
      ]),
      h('.field.inline', [
        h('label', '总金额(元)'),
        h('.color-accent', (materialNote.quantity || 0) * (materialNote.unitPrice || 0)),
      ]),
      h('.field.inline.required', [
        h('label', '税率(百分比)'),
        h('input', {
          value: materialNote.taxRate || '',
          onchange(e) {
            $$materialNote.patch({
              taxRate: parseFloat(this.value),
            });
          }
        })
      ]),
      h('.field.inline', [
        h('label', '税额(元)'),
        h('.text-accent', (materialNote.quantity || 0) * (materialNote.unitPrice || 0) * (materialNote.taxRate || 0) / 100),
      ]),
      h('button.btn.btn-outline.ml2.bc2.b2', '添加'),
    ]),
  ]);
};

var bindEvents = once(function (node) {
  let $node = $(node);
  $node.find('[name=quantity]').change(function (e) {
    $$materialNote.patch({
      quantity: parseFloat(this.value),
    });
  });
  $node.find('[name=unitPrice]').change(function (e) {
    $$materialNote.patch({
      unitPrice: parseFloat(this.value),
    });
  });
  $node.find('[name=taxRate]').change(function (e) {
    $$materialNote.patch({
      taxRate: parseFloat(this.value),
    });
  });
  $node.find('button.add').click(function (e) {
    e.preventDefault();
    validate().then(function () {
      x.update(
        [$$invoice, Object.assign($$invoice.val(), {
          $$materialNotes: ($$invoice.val().materialNotes || []).concat($$materialNote.val()),
        })],
        [$$materialNote, {}]
      );
    }).catch($$errors.val);
    return false;
  });
  $node.on('click', 'i.remove', function (e) {
    let materialNotes = $$invoice.val().materialNotes;
    materialNotes.splice($(this).data('idx'), 1);
    $$invoice.patch({
      materialNotes 
    });
  });
});

export var $$materialsEditor = x.connect(
    [$$invoice, $$selectedMaterialSubject,
    $$materialNote, $$materialSubjectDropdown],
    materialsEditorValueFunc, 'materials-editor');

export default {
  $$materialSubjects,
  config: function (node) {
    bindEvents(node);
    let $node = $(node);
    $(node).find('[name=materialSubject]').dropdown({
      onChange: function (value, text, $choice) {
        value = parseInt(value);
        x.update( 
                 [$$materialNote, Object.assign($$materialNote.val(), {
                   materialSubjectId: value,
                   materialSubject: R.find(R.propEq('id', value))($$materialSubjects.val()),
                 })],
                 [$$selectedMaterialSubject, R.find(R.propEq('id', value))($$materialSubjects.val())]
                );
      }
    });
  },
};
