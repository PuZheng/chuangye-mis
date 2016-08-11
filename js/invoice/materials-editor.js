import x from '../xx.js';
import R from 'ramda';
import {$$invoice} from './data-slots.js';
import once from 'once';
import { dropdown } from '../dropdown.js';
import { field } from '../field.js';
import { validateObj } from '../validate-obj.js';
import { notEmpty } from '../checkers.js';


export var $$materialSubjects = x([], 'material-subjects');
// 正在编辑的物料单
const $$materialNote = x({}, 'material-node');
const $$errors = x({}, 'materials-editor-errors');
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var rules = {
  materialSubjectId: notEmpty('物料类别'),
  quantity: notEmpty('数量'),
  unitPrice: notEmpty('单价'),
  taxRate: notEmpty('税率'),
};

var validate = R.partialRight(validateObj, [rules]);

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
                 })]
                );
      }
    });
  });
}();


let wrapIf = function wrapId(s, left='(', right=')') {
  return s? left + s + right: '';
};

function materialsEditorValueFunc(
  invoice, errors,
  materialNote, materialSubjectDropdown
) {
  return h('.border-box.border.rounded', [
    h('.form', [
      field('materialSubjectId', '物料类别', 
           materialSubjectDropdown, errors, true),
      field('quantity', '数量' + wrapIf((materialNote.materialSubject || {}).unit), h('input', {
        value: materialNote.quantity || '',
        onchange(e) {
          $$materialNote.patch({
            quantity: parseFloat(this.value),
          });
        }
      }), errors, true),
      field('unitPrice', '单价(元)', h('input', {
          value: materialNote.unitPrice || '',
          onchange(e) {
            $$materialNote.patch({
              unitPrice: parseFloat(this.value),
            });
          }
      }), errors, true),
      h('.field.inline', [
        h('label', '总金额'),
        h('span.color-accent.input', (materialNote.quantity || 0) * (materialNote.unitPrice || 0) + '(元)'),
      ]),
      field('taxRate', '税率(百分比)', h('input', {
        value: materialNote.taxRate || '',
        onchange(e) {
          $$materialNote.patch({
            taxRate: parseFloat(this.value),
          });
        }
      }), errors, true),
      h('.field.inline', [
        h('label', '税额'),
        h('span.ca.input', ((materialNote.quantity || 0) * (materialNote.unitPrice || 0) * (materialNote.taxRate || 0) / 100) + '(元)'),
      ]),
      h('button.btn.btn-outline.ml2.bca.b2', {
        onclick(e) {
          e.preventDefault();
          validate(materialNote).then(function () {
            x.update(
              [$$invoice, Object.assign($$invoice.val(), {
                materialNotes: ($$invoice.val().materialNotes || []).concat($$materialNote.val()),
              })],
              [$$materialNote, {}]
            );
          }).catch(function (errors) {
            $$errors.val(errors);
          });
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
    [$$invoice, $$errors,
    $$materialNote, $$materialSubjectDropdown],
    materialsEditorValueFunc, 'materials-editor');

export default {
  $$materialSubjects,
};
