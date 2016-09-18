import $$ from 'slot';
import virtualDom from 'virtual-dom';
import invoiceTypeStore from 'store/invoice-type-store';
import field from '../field';
import $$dropdown from 'widget/dropdown';
import R from 'ramda';
import constStore from 'store/const-store';
import page from 'page';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast';
import classNames from '../class-names';

var h = virtualDom.h;
var $$obj = $$({}, 'obj');
var $$loading = $$(false, 'loading');
var $$errors = $$({}, 'errors');
var $$entityTypes = $$({}, 'entity-types');
var $$materialTypes = $$({}, 'material-types');

var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};

var formVf = function (
  [obj, errors, vendorDropdown, purchaserDropdown, materialTypeDropdown]
) {
  return h('form.form', {
    onsubmit() {
      invoiceTypeStore
      .validate(obj)
      .then(function (obj) {
        $$loading.val(true);
        if (obj.id && !dirty(obj)) {
          $$.update(
            [$$toast, {
              type: 'info',
              message: '没有做出任何修改',
            }],
            [$$loading, false]
          );
          return;
        }
        invoiceTypeStore.save(obj)
        .then(function ({ id }) {
          copy = R.clone(obj);
          $$loading.val(false);
          $$toast.val({
            type: 'success',
            message: '创建成功',
          });
          !obj.id && page('/invoice-type/' + id);
        }, function (e) {
          $$loading.val(false);
          if ((e.response || {}).status == 403) {
            $$errors.val(e.response.data.fields || {});
            return;
          }
          overlay.$$content.val({
            type: 'error',
            title: '很不幸, 出错了!',
            message: axiosError2Dom(e),
          });
        });
      }, function (errors) {
        $$errors.val(errors);
      });
      return false;
    }
  }, [
    field('name', '名称', h('input', {
      value: obj.name,
      onchange() {
        $$obj.patch({ name: this.value });
      }
    }), errors, true),
    h('.field.inline', [
      h('input', {
        type: 'checkbox',
        checked: obj.isVat,
        onchange() {
          $$obj.patch({ isVat: this.checked });
        }
      }),
      h('label', {
        onclick: function () {
          $$obj.patch({ isVat: !obj.isVat });
        }
      }, '是否增值税'),
    ]),
    field('vendorType', '销售方类型', vendorDropdown, errors),
    field('purchaserType', '购买方类型', purchaserDropdown, errors),
    field('materialType', '相关物料单类型', materialTypeDropdown, errors),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        page('/invoice-type-list');
        e.preventDefault();
        return false;
      }
    }, '返回'),
  ]);
};

var $$vendorDropdown = $$dropdown({
  defaultText: '选择销售方类型',
  $$value: $$obj.trans(o => o.vendorType),
  $$options: $$entityTypes.trans(entityTypes => R.values(entityTypes)),
  onchange(value) {
    $$obj.patch({ vendorType: value });
  }
});

var $$purchaserDropdown = $$dropdown({
  defaultText: '选择购买方类型',
  $$value: $$obj.trans(o => o.purchaserType),
  $$options: $$entityTypes.trans(entityTypes => R.values(entityTypes)),
  onchange(value) {
    $$obj.patch({ purchaserType: value });
  }
});

var $$materialTypeDropdown = $$dropdown({
  defaultText: '选择物料单类型',
  $$value: $$obj.trans(o => o.materialType || ''),
  $$options: $$materialTypes.trans(materialTypes => R.values(materialTypes)),
  onchange(value) {
    $$obj.patch({ materialType: value });
  }
});

var $$form = $$.connect(
  [$$obj, $$errors, $$vendorDropdown, $$purchaserDropdown, 
    $$materialTypeDropdown], 
  formVf
);

var vf = function ([obj, loading, form]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'),
      obj.id? '编辑发票类型-' + obj.name: '创建发票类型'),
    form,
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$obj, $$loading, $$form], vf),
  },
  init(ctx) {
    $$loading.val(true);
    Promise.all([
      ctx.params.id? invoiceTypeStore.get(ctx.params.id): {},
      constStore.get()
    ])
    .then(function ([obj, { materialTypes, entityTypes }]) {
      copy = R.clone(obj);
      $$.update(
        [$$loading, false],
        [$$obj, obj],
        [$$materialTypes, materialTypes],
        [$$entityTypes, entityTypes]
      );
    });
  },
  get dirty() {
    return dirty($$obj.val());
  }
};
