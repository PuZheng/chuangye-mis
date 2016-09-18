import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import field from '../field';
import pinyin from 'pinyin';
import $$dropdown from 'widget/dropdown';
import constStore from 'store/const-store';
import voucherSubjectStore from 'store/voucher-subject-store';
import R from 'ramda';
import page from 'page';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast';

var h = virtualDom.h;

var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$entityTypes = $$({}, 'entity-types');
var $$loading = $$(false, 'loading');

var formVf = function ([obj, errors, payerTypeDropdown, recipientTypeDropdown]) {
  return h('form.form', {
    onsubmit() {
      voucherSubjectStore
      .validate(obj)
      .then(function (obj) {
        $$loading.val(true);
        voucherSubjectStore
        .save(obj)
        .then(function ({ id }) {
          $$loading.val(false);
          $$toast.val({
            type: 'success',
            message: '创建成功',
          });
          page('/voucher-subject/' + id);
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
        $$obj.patch({ 
          name: this.value,
          acronym: pinyin(this.value, {
            style: pinyin.STYLE_NORMAL,
          }).map(i => i[0][0]).join(''),
        });
      }
    }), errors, true),
    field('acronym', '缩写', h('input', {
      value: obj.acronym,
      onchange() {
        $$obj.patch({ acronym: this.value });
      }
    }), errors, true),
    h('.inline.field', [
      h('label', '备注'),
      h('textarea', {
        onchange() {
          $$obj.patch({ notes: this.value });
        }
      }, obj.notes),
    ]),
    h('.inline.field', [
      h('input', {
        type: 'checkbox',
        checked: obj.isPublic,
        onchange() {
          $$obj.patch({ isPublic: this.checked });
        }
      }),
      h('label', {
        onclick() {
          $$obj.patch({ isPublic: !obj.isPublic });
        }
      }, '是否进入总账'),
    ]),
    field('payerType', '支付方类型', payerTypeDropdown, errors),
    field('purchaserType', '收入方类型', recipientTypeDropdown, errors),
    h('hr'),
    h('button.primary', '提交'),
    h('button', {
      onclick(e) {
        e.preventDefault();
        page('/voucher-subject-list');
      }
    }, '返回'),
  ]);
};

var $$payerTypeDropdown = $$dropdown({
  defaultText: '选择收入方类型',
  onchange(value) {
    $$obj.patch({ payerType: value });
  },
  $$value: $$obj.trans(R.prop('payerType')),
  $$options: $$entityTypes.trans(entityTypes => R.values(entityTypes)),
});

var $$recipientTypeDropdown = $$dropdown({
  defaultText: '选择收入方类型',
  onchange(value) {
    $$obj.patch({ recipientType: value });
  },
  $$value: $$obj.trans(R.prop('recipientType')),
  $$options: $$entityTypes.trans(entityTypes => R.values(entityTypes)),
});

var $$form = $$.connect(
  [$$obj, $$errors, $$payerTypeDropdown, $$recipientTypeDropdown], formVf
);

var vf = function ([form]) {
  return h(classNames('object-app'), [
    h(classNames('header'), '创建凭证项目'),
    form,
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$form], vf),
  },
  init(ctx) {
    let id = ctx.params.id;
    $$loading.val(true);
    Promise.all([
      id? voucherSubjectStore.get(id): {},
      constStore.get(),
    ])
    .then(function ([obj, { entityTypes }]) {
      $$.update(
        [$$loading, false],
        [$$entityTypes, entityTypes],
        [$$obj, obj]
      );
    });
  }
};
