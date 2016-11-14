import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import field from '../field';
import acronym from '../utils/acronym';
import $$dropdown from 'widget/dropdown';
import constStore from 'store/const-store';
import voucherSubjectStore from 'store/voucher-subject-store';
import R from 'ramda';
import page from 'page';
import { $$toast } from '../toast';
import co from 'co';

var h = virtualDom.h;

var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$entityTypes = $$({}, 'entity-types');
var $$loading = $$(false, 'loading');

var copy;

var dirty = function (obj) {
  return !R.equals(obj, copy);
};

var formVf = function ([obj, errors, payerTypeDropdown, recipientTypeDropdown]) {
  return h('form.form', {
    onsubmit() {
      co(function *() {
        try {
          yield voucherSubjectStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        if (!dirty(obj)) {
          $$.update(
            [$$toast, {
              type: 'info',
              message: '没有做出任何修改',
            }],
            [$$loading, false]
          );
          return;
        }
        try {
          $$loading.val(true);
          let { id } = yield voucherSubjectStore.save(obj);
          copy = R.clone(obj);
          $$toast.val({
            type: 'success',
            message: '提交成功',
          });
          id && page('/voucher-subject/' + id);
        } catch (e) {
          console.error(e);
          if ((e.response || {}).status == 400) {
            $$errors.val(e.response.data.fields || {});
          }
        } finally {
          $$loading.val(false);
        }

      });
      return false;
    }
  }, [
    field({
      key: 'name',
      label: '名称',
      input: h('input', {
        value: obj.name,
        oninput() {
          $$obj.patch({
            name: this.value,
            acronym: acronym(this.value),
          });
        }
      }),
      errors,
      required: true
    }),
    field({
      key: 'acronym',
      label: '缩写',
      input: h('input', {
        value: obj.acronym,
        onchange() {
          $$obj.patch({ acronym: this.value });
        }
      }),
      errors,
      required: true
    }),
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
    field({
      key: 'payerType',
      label: '支付方类型',
      input: payerTypeDropdown,
      errors,
    }),
    field({
      key: 'purchaserType',
      label: '收入方类型',
      input: recipientTypeDropdown,
      errors,
    }),
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
  $$options: $$entityTypes.trans(R.values),
});

var $$recipientTypeDropdown = $$dropdown({
  defaultText: '选择收入方类型',
  onchange(value) {
    $$obj.patch({ recipientType: value });
  },
  $$value: $$obj.trans(R.prop('recipientType')),
  $$options: $$entityTypes.trans(R.values),
});

var $$form = $$.connect(
  [$$obj, $$errors, $$payerTypeDropdown, $$recipientTypeDropdown], formVf
);

var vf = function ([loading, obj, form]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'), R.ifElse(
      R.prop('id'),
      R.always(`编辑凭证项目-${obj.name}`),
      R.always('创建凭证项目')
    )(obj)),
    form,
  ]);
};

export default {
  page: {
    $$view: $$.connect([$$loading, $$obj, $$form], vf),
  },
  init(ctx) {
    let id = ctx.params.id;
    $$loading.val(true);
    Promise.all([
      id? voucherSubjectStore.get(id): {},
      constStore.get(),
    ])
    .then(function ([obj, { entityTypes }]) {
      copy = R.clone(obj);
      $$.update(
        [$$loading, false],
        [$$entityTypes, entityTypes],
        [$$obj, obj]
      );
    });
  },
  get dirty() {
    return dirty($$obj.val());
  }
};
