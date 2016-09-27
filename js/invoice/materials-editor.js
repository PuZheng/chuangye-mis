import $$ from 'slot';
import R from 'ramda';
import { $$invoice } from './data-slots';
import { $$dropdown } from '../widget/dropdown';
import { field } from '../field';
import { validateObj } from '../validate-obj';
import { notEmpty } from '../checkers';


export var $$materialSubjects = $$([], 'material-subjects');
// 正在编辑的物料单
const $$materialNote = $$({}, 'material-node');
const $$errors = $$({}, 'materials-editor-errors');
import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var rules = {
  materialSubjectId: notEmpty('物料类别'),
  quantity: notEmpty('数量'),
  unitPrice: notEmpty('单价'),
  taxRate: notEmpty('税率'),
};

var validate = R.partialRight(validateObj, [rules]);

var $$materialSubjectDropdown = $$dropdown({
  defaultText: '请选择物料类别',
  $$options: $$.connect([$$materialSubjects], function ([l]) {
    return l.map(ms => ({ value: ms.id, text: ms.name }));
  }),
  $$value: $$.connect([$$materialNote], function ([mn]) {
    return mn.materialSubjectId;
  }),
  onchange(value) {
    value = parseInt(value);
    $$materialNote.val(Object.assign($$materialNote.val(), {
      materialSubjectId: value,
      materialSubject: R.find(R.propEq('id', value))($$materialSubjects.val()),
    }));
  }
});

let wrapIf = function wrapId(s, left='(', right=')') {
  return s? left + s + right: '';
};

function materialsEditorValueFunc([
  invoice, errors,
  materialNote, materialSubjectDropdown
]) {
  return h('.border-box.border.rounded', [
    h('.form', [
      field({
        key: 'materialSubjectId', 
        label: '物料类别', 
        input: materialSubjectDropdown, 
        errors,
        required: true
      }),
      field({
        key: 'quantity', 
        label: '数量' + wrapIf((materialNote.materialSubject || {}).unit), 
        input: h('input', {
          value: materialNote.quantity || '',
          onchange() {
            $$materialNote.patch({
              quantity: parseFloat(this.value),
            });
          }
        }), 
        errors,
        required: true
      }),
      field({
        key: 'unitPrice', 
        label: '单价(元)', 
        input: h('input', {
          value: materialNote.unitPrice || '',
          onchange() {
            $$materialNote.patch({
              unitPrice: parseFloat(this.value),
            });
          }
        }), 
        errors,
        required: true
      }),
      h('.field.inline', [
        h('label', '总金额'),
        h('span.color-accent.input', (materialNote.quantity || 0) * (materialNote.unitPrice || 0) + '(元)'),
      ]),
      field({
        key: 'taxRate', 
        label: '税率(百分比)', 
        input: h('input', {
          value: materialNote.taxRate || '',
          onchange() {
            $$materialNote.patch({
              taxRate: parseFloat(this.value),
            });
          }
        }), 
        errors,
        required: true
      }),
      h('.field.inline', [
        h('label', '税额'),
        h('span.ca.input', ((materialNote.quantity || 0) * (materialNote.unitPrice || 0) * (materialNote.taxRate || 0) / 100) + '(元)'),
      ]),
      h('button.btn.btn-outline.ml2.bca.bw2', {
        onclick(e) {
          e.preventDefault();
          validate(materialNote).then(function () {
            $$.update(
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
                onclick() {
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

export var $$materialsEditor = $$.connect(
    [$$invoice, $$errors,
    $$materialNote, $$materialSubjectDropdown],
    materialsEditorValueFunc, 'materials-editor');

export default {
  $$materialSubjects,
};
