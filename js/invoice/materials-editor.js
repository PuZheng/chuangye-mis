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
              quantity: parseFloat(this.value),
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
        h('label', '总金额'),
        h('span.color-accent', (materialNote.quantity || 0) * (materialNote.unitPrice || 0) + '(元)'),
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
        h('label', '税额'),
        h('span.text-accent', ((materialNote.quantity || 0) * (materialNote.unitPrice || 0) * (materialNote.taxRate || 0) / 100) + '(元)'),
      ]),
      h('button.btn.btn-outline.ml2.bca.b2', {
        onclick(e) {
          e.preventDefault();
          validate().then(function () {
            x.update(
              [$$invoice, Object.assign($$invoice.val(), {
                materialNotes: ($$invoice.val().materialNotes || []).concat($$materialNote.val()),
              })],
              [$$materialNote, {}]
            );
          }).catch($$errors.val);
          return false;
        }
      }, '添加'),
      h('hr'),
      h('table.striped', [
        h('thead', [
          h('tr', [
            h('th', '物料类别'),
            h('th', '数量'),
            h('th', '单价(元)'),
            h('th', '总金额(元)'),
            h('th', '税率'),
            h('th', '税额(元)'),
            h('th', '')
          ])
        ]),
        h('tbody', (invoice.materialNotes || []).map(function (mn, idx) {
          return h('tr', [
            h('td', mn.materialSubject.name),
            h('td', '' + mn.quantity),
            h('td', '' + mn.unitPrice),
            h('td', '' + (mn.unitPrice * mn.quantity)),
            h('td', '' + mn.taxRate),
            h('td', '' + (mn.taxRate * mn.quantity * mn.unitPrice / 100.0)),
            h('td', [
              h('i.fa.fa-remove.ca', {
                onclick(e) {
                  let materialNotes = $$invoice.val().materialNotes;
                  materialNotes.splice(idx, 1);
                  $$invoice.patch({
                    materialNotes 
                  });
                }
              })
            ])
          ]);
        })),
      ])
    ]),
  ]);
};

export var $$materialsEditor = x.connect(
    [$$invoice, $$selectedMaterialSubject,
    $$materialNote, $$materialSubjectDropdown],
    materialsEditorValueFunc, 'materials-editor');

export default {
  $$materialSubjects,
};
