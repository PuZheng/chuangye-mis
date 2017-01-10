import $$ from 'slot';
import { h } from 'virtual-dom';
import $$queryObj from '../query-obj';
import field from '../field';
import acronym from '../utils/acronym';
import constStore from 'store/const-store';
import partnerStore from 'store/partner-store';
import R from 'ramda';
import $$dropdown from 'widget/dropdown';
import co from 'co';
import classNames from '../class-names';
import { $$toast } from '../toast';
import page from 'page';

var $$obj = $$({ entity: {} }, 'obj');
var $$errors = $$({}, 'errors');
var copy = {};
var $$loading = $$(false, 'loading');
var $$entityTypes = $$({}, 'entity-types');

var dirty = function dirty(obj) {
  return !R.equals(obj, copy);
};

var vf = function vf([obj, errors, queryObj, entityTypeDropdown, loading]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'),
      obj.id? '编辑往来户(' + obj.entity.name + ')': '创建往来户'),
    h('form.form', {
      onsubmit() {
        co(function *() {
          try {
            yield partnerStore.validate(obj);
          } catch (e) {
            console.error(e);
            $$errors.val(e);
            return;
          }
          $$loading.on();
          try {
            let { id } = yield partnerStore.save(obj);
            copy = R.clone(obj);
            $$.update([
              [$$toast, {
                type: 'success',
                message: '提交成功',
              }],
              [$$errors, {}]
            ]);
            !obj.id && page('/partner/' + id);
          } catch (e) {
            if ((e.response || {}).status == 400) {
              $$errors.val(e.response.data || {});
              return;
            }
            throw e;
          } finally {
            $$loading.off();
          }
        });
        return false;
      }
    }, [
      field({
        label: '名称',
        key: 'entity.name',
        required: true,
        errors,
        input: h('input', {
          oninput() {
            let val = $$obj.val();
            val.entity.name = this.value;
            val.entity.acronym = acronym(this.value);
            $$obj.val(val);
          },
          value: obj.entity.name,
        }),
      }),
      field({
        label: '缩写',
        key: 'entity.acronym',
        required: true,
        errors,
        input: h('input', {
          oninput() {
            let val = $$obj.val();
            val.entity.acronym = this.value;
            $$obj.val(val);
          },
          value: obj.entity.acronym,
        })
      }),
      field({
        label: '类型',
        key: 'entity.type',
        required: true,
        errors,
        input: entityTypeDropdown,
      }),
      field({
        label: '税号',
        key: 'taxNumber',
        errors,
        input: h('input', {
          oninput() {
            $$obj.patch({ taxNumber: this.value });
          },
          value: obj.taxNumber,
        })
      }),
      field({
        label: '开户行',
        key: 'bank',
        errors,
        input: h('input', {
          oninput() {
            $$obj.patch({ bank: this.value });
          },
          value: obj.bank
        })
      }),
      field({
        label: '银行账号',
        key: 'account',
        errors,
        input: h('input', {
          oninput() {
            $$obj.patch({ account: this.value });
          },
          value: obj.account,
        })
      }),
      field({
        label: '联系方式',
        key: 'contact',
        errors,
        input: h('input', {
          oninput() {
            $$obj.patch({ contact: this.value });
          },
          value: obj.contact,
        })
      }),
      obj.id?
      h('.field.inline', [
        h(classNames('toggle', obj.enabled && 'checked'), {
          onclick() {
            $$obj.patch({ enabled: !obj.enabled });
          }
        }, [
          h('input', {
            type: 'checkbox',
          }),
          h('label', {
            onclick() {
              $$obj.patch({ enabled: !obj.enabled });
            }
          }, '是否激活'),
        ]),
      ]): void 0,
      h('hr'),
      h('button.primary', '提交'),
      h('a.btn.btn-outline', {
        href: '/partner-list?type=' + (obj.entity.type || queryObj.type),
      }, '返回')
    ]),
  ]);
};

var $$entityTypeDropdown = $$dropdown({
  defaultText: '请选择类型',
  $$value: $$obj.trans(R.path(['entity', 'type'])),
  $$options: $$entityTypes.trans(it => [ it.CUSTOMER, it.SUPPLIER ]),
  onchange(type) {
    let val = $$obj.val();
    val.entity.type = type;
    $$obj.val(val);
  }
});

export default {
  get dirty() {
    return dirty($$obj.val());
  },
  page: {
    get $$view() {
      return $$.connect(
        [$$obj, $$errors, $$queryObj, $$entityTypeDropdown, $$loading],
        vf
      );
    }
  },
  init(ctx) {
    let { id } = ctx.params;
    Promise.all([
      constStore.get(),
      id? partnerStore.get(id): { entity: { type: ctx.query.type } }
    ])
    .then(function ([{ ENTITY_TYPES }, obj]) {
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$entityTypes, ENTITY_TYPES],
        [$$obj, obj]
      ]);
    });
  }
};
