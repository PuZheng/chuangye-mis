import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../../field';
import $$searchDropdown from 'widget/search-dropdown';
import R from 'ramda';
import storeSubjectStore from 'store/store-subject-store';
import classNames from '../../class-names';
import departmentStore from 'store/department-store';
import page from 'page';
import constStore from 'store/const-store';
import $$dropdown from 'widget/dropdown';
import co from 'co';
import storeOrderStore from 'store/store-order-store';
import { $$toast } from '../../toast.js';
import moment from 'moment';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$errors = $$({}, 'errors');
var $$obj = $$({}, 'obj');
var $$storeSubjects = $$([], 'store-subjects');
var $$departments = $$([], 'departments');
var $$storeOrderDirections = $$({}, 'store-order-directions');
var $$storeSubjectTypes = $$({}, 'store-order-types');
var copy = {};

var dirty = function (obj) {
  return !R.equals(obj, copy);
};

var formVf = function (
  [
    errors, obj, storeSubjectTypes, storeOrderDirections,
    storeSubjectDropdown, departmentsDropdown, directionDropdown
  ]
) {
  let fields = [
    field({
      key: 'storeSubjectId',
      label: '仓储科目',
      input: storeSubjectDropdown,
      errors,
      required: true
    }),
    field({
      key: 'direction',
      label: '仓储方向',
      input: directionDropdown,
      errors,
      required: true
    }),
    field({
      key: 'quantity',
      label: R.ifElse(
        R.identity,
        (ss) => '数量(' + ss.unit + ')',
        R.always('数量')
      )(obj.storeSubject),
      input: h('input', {
        type: 'number',
        value: obj.quantity,
        oninput() {
          $$obj.patch({ quantity: this.value });
        },
      }),
      errors,
      required: true
    }),
    field({
      key: 'departmentId',
      label: '车间',
      input: departmentsDropdown,
      errors,
      require: true,
    }),
    field({
      key: 'date',
      label: '日期',
      input: h('input', {
        type: 'date',
        value: obj.date || moment().format('YYYY-MM-DD'),
        oninput() {
          $$obj.patch({ date: this.value });
        }
      }),
      errors,
      required: true,
    })
  ];
  if (
    (obj.type === storeSubjectTypes.PRODUCT &&
     obj.direction === storeOrderDirections.OUTBOUND) ||
    (obj.type === storeSubjectTypes.MATERIAL &&
     obj.direction === storeOrderDirections.INBOUND)
  ) {
    fields = fields.concat([
      field({
        key: 'unitPrice',
        label: '单价(元)',
        input: h('input', {
          type: 'number',
          value: obj.unitPrice,
          oninput() {
            $$obj.patch({ unitPrice: this.value });
          }
        }),
        errors,
        required: true,
      }),
      field({
        key: '',
        label: '金额',
        input: h('.ca.text', R.ifElse(
          (quantity, unitPrice) => quantity && unitPrice,
            (quantity, unitPrice) => quantity * unitPrice + '(元)',
            R.always('--')
        )(obj.quantity, obj.unitPrice)),
      }),
    ]);
  }
  return h('form.form', {
    onsubmit() {
      co(function *() {
        try {
          yield storeOrderStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        if (obj.id && !dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '没有任何修改',
          });
          return;
        }
        try {
          $$loading.val(true);
          let { id=obj.id } = yield storeOrderStore.save(obj);
          copy = R.clone(obj);
          !obj.id && page('/store-order/' + id);
          $$toast.val({
            type: 'success',
            message: obj.id? '更新成功': '创建成功',
          });
        } catch (e) {
          console.error(e);
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    ...fields,
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        e.preventDefault();
        page('/store-order-list');
        return false;
      }
    }, '返回')
  ]);
};

var $$storeSubjectDropdown = $$searchDropdown({
  defaultText: '选择仓储科目',
  onchange(storeSubjectId, option) {
    $$obj.patch({ storeSubjectId, storeSubject: option.bundle });
  },
  $$value: $$obj.trans(R.prop('storeSubjectId')),
  $$options: $$storeSubjects.trans(R.map(function (record) {
    return {
      text: record.name,
      value: record.id,
      acronym: record.acronym,
      bundle: record,
    };
  }))
});

var $$departmentsDropdown = $$searchDropdown({
  defaultText: '选择车间',
  $$value: $$obj.trans(R.propOr('', 'departmentId')),
  $$options: $$departments.map(R.map(({ id, name, acronym }) => ({
    value: id,
    text: name,
    acronym,
  }))),
  onchange(departmentId) {
    $$obj.patch({ departmentId, });
  }
});

var $$directionDropdown = $$dropdown({
  defaultText: '请选择仓储方向',
  $$value: $$obj.trans(R.prop('direction')),
  $$options: $$storeOrderDirections.trans(R.values),
  onchange(direction) {
    $$obj.patch({ direction });
  },
  $$disabled: $$(true),
});

var $$form = $$.connect(
  [
    $$errors, $$obj, $$storeSubjectTypes, $$storeOrderDirections,
    $$storeSubjectDropdown, $$departmentsDropdown, $$directionDropdown
  ],
  formVf
);

var vf = function ([loading, obj, form]) {
  let title = function () {
    let { type, direction } = obj;
    if (obj.id) {
      if (type && direction) {
        return '编辑' + type + direction + '单';
      } else {
        return '编辑仓储单据';
      }
    } else {
      if (type && direction) {
        return '创建' + type + direction + '单';
      } else {
        return '创建仓储单据';
      }
    }
  }();
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'), title),
    form
  ]);
};

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$obj, $$form], vf);
    }
  },
  get diry() {
    return dirty($$obj.val());
  },
  init(ctx) {
    $$loading.toggle();
    Promise.all([
      storeSubjectStore.list,
      departmentStore.list,
      constStore.get(),
      R.ifElse(
        R.path(['params', 'id']),
        ctx => storeOrderStore.get(ctx.params.id),
        ctx => ({
          direction: R.path(['query', 'direction'])(ctx),
          date: moment().format('YYYY-MM-DD'),
        })
      )(ctx)
    ])
    .then(function (
      [
        storeSubjects, departments,
        { STORE_ORDER_DIRECTIONS, STORE_SUBJECT_TYPES }, obj
      ]
    ) {
      copy = R.clone(obj);
      let type = R.path(['query', 'type'])(ctx);
      if (type) {
        storeSubjects = storeSubjects.filter(R.propEq('type', type));
      }
      $$.update(
        [$$storeSubjects, storeSubjects],
        [$$departments, departments],
        [$$storeOrderDirections, STORE_ORDER_DIRECTIONS],
        [$$storeSubjectTypes, STORE_SUBJECT_TYPES],
        [$$obj, obj],
        [$$loading, false]
      );
    });
  }
};
