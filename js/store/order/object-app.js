import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../../field';
import $$searchDropdown from 'widget/search-dropdown';
import R from 'ramda';
import storeSubjectStore from 'store/store-subject-store';
import classNames from '../../class-names';
import tenantStore from 'store/tenant-store';
import page from 'page';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$errors = $$({}, 'errors');
var $$obj = $$({}, 'obj');
var $$storeSubjects = $$([], 'store-subjects');
var $$tenants = $$([], 'tenants');

var formVf = function ([errors, storeSubjectDropdown, tenantDropdown, obj]) {
  return h('form.form', {
    onsubmit() {
      return false;
    }
  }, [
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
        (ss) => '单价(' + ss.unit + ')',
        R.always('单价')
      )(obj.storeSubject),
      input: h('input', {
        type: 'number',
        onchange() {
          $$obj.patch({ quantity: this.value });
        },
      }),
      errors,
      required: true
    }),
    field({
      key: 'unit_price',
      label: '单价(元)',
      input: h('input', {
        type: 'number',
        onchange() {
          $$obj.patch({ unitPrice: this.value });
        }
      }),
      errors,
      required: true
    }),
    field({
      key: 'tenant_id',
      label: '相关承包人',
      input: tenantDropdown,
      errors,
    }),
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

var $$tenantDropdown = $$searchDropdown({
  defaultText: '选择承包人',
  $$value: $$obj.trans(R.prop('tenantId')),
  $$options: $$tenants.trans(function (rows) {
    return rows.map(function (row) {
      return {
        text: row.entity.name,
        value: row.id,
        acronym: row.entity.acronym
      };
    });
  }),
  onchange(tenantId) {
    $$obj.patch({ tenantId, });
  }
});

var $$form = $$.connect(
  [$$errors, $$storeSubjectDropdown, $$tenantDropdown, $$obj], 
  formVf
);

var vf = function ([loading, form]) {
  return h(classNames('object-app', loading && 'loading'), [
    h('.header', '创建仓储单据'),
    form
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$loading, $$form], vf),
  },
  init() {
    Promise.all([
      storeSubjectStore.list,
      tenantStore.list
    ])
    .then(function ([storeSubjects, tenants]) {
      $$.update(
        [$$storeSubjects, storeSubjects],
        [$$tenants, tenants]
      );
    });
  }
};
