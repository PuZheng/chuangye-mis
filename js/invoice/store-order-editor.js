import $$searchDropdown from 'widget/search-dropdown';
import virtualDom from 'virtual-dom';
import $$ from 'slot';
import { field } from '../field.js';
import R from 'ramda';

var h = virtualDom.h;

var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');



var $$storeOrderEditor = function ($$storeSubjects, $$storeOrders) {
  var $$storeSubjectDropdown = $$searchDropdown({
    defaultText: '选择仓储科目',
    $$value: $$obj.trans(R.prop('storeSubjectId')),
    $$options: $$storeSubjects.trans(R.map(ss => ({
      value: ss.id,
      text: ss.name,
      acronym: ss.acronym,
    }))),
    onchange(storeSubjectId) {
      $$obj.patch({
        storeSubjectId,
        storeSubject:
          R.find(R.propEq('id', storeSubjectId))($$storeSubjects.val()),
      });
    }
  });
  var storeOrderListElVf = function ([list]) {
    return h('.segment', list.map(function (so, idx) {
      return h('.item', [
        h(
          '.title',
          /* eslint-disable max-len */
          `${so.storeSubject.name}-${so.quantity}${so.storeSubject.unit}x${so.unitPrice}元, 共${so.quantity*so.unitPrice}元`
          /* eslint-enable max-len */
        ),
        h('.ops', h('button', {
          onclick(e) {
            e.preventDefault();
            $$storeOrders.val(list.filter(function (so_, idx_) {
              return idx_ != idx;
            }));
            return false;
          }
        }, h('i.fa.fa-remove.color-accent'))),
      ]);
    }));
  };
  var $$storeOrderListEl = $$.connect([$$storeOrders], storeOrderListElVf);
  var storeOrderEditorVf = function (
    [errors, obj, storeSubjectDropdown, storeOrderListEl]
  ) {
    return h('.form.border.border-box.store-order-editor', [
      field({
        key: 'storeSubjectId',
        label: '仓储科目',
        input: storeSubjectDropdown,
        errors,
        required: true
      }),
      field({
        key: 'quantity',
        label: R.ifElse(
          R.identity,
          it => '数量(' + it.unit + ')',
          R.always('数量')
        )(obj.storeSubject),
        input: h('input', {
          value: obj.quantity || '',
          oninput() {
            $$obj.patch({ quantity: this.value });
          }
        }),
        errors,
        required: true,
      }),
      field({
        key: 'unitPrice',
        label: '单价(元)',
        input: h('input', {
          value: (obj.unitPrice || ''),
          oninput() {
            $$obj.patch({ unitPrice: this.value });
          }
        }),
        errors,
        required: true
      }),
      h('.col.col-6', [
        field({
          label: '金额(元)',
          input: h('.text', R.ifElse(
            (quantity, unitPrice) => quantity && unitPrice,
              (quantity, unitPrice) => quantity * unitPrice + '',
              R.always('--')
          )(obj.quantity, obj.unitPrice))
        }),
      ]),
      h('.col.col-6', [
        h('.field.inline', [
          h('button.primary.ml1', {
            onclick(e) {
              e.preventDefault();
              let errors = {};
              for (let k of ['storeSubjectId', 'quantity', 'unitPrice']) {
                if (!obj[k]) {
                  errors[k] = '不能为空';
                }
              }
              if (!R.isEmpty(errors)) {
                $$errors.val(errors);
                return false;
              }
              $$.update(
                [$$storeOrders, $$storeOrders.val().concat([obj])],
                [$$obj, {}]
              );
              return false;
            }
          }, '添加'),
        ])
      ]),
      h('.clearfix'),
      storeOrderListEl,
    ]);
  };

  return $$.connect(
    [$$errors, $$obj, $$storeSubjectDropdown, $$storeOrderListEl],
    storeOrderEditorVf
  );
};


export default $$storeOrderEditor;
