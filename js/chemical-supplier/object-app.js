import $$ from 'slot';
import { h } from 'virtual-dom';
import field from '../field';
import R from 'ramda';
import chemicalSupplierStore from 'store/chemical-supplier-store';
import co from 'co';
import classNames from '../class-names';
import { ValidationError } from '../validate-obj';
import page from 'page';
import { $$toast } from '../toast';
import acronym from '../utils/acronym';

let copy;
let $$loading = $$(false, 'loading');
let $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');

var dirty = function dirty(obj) {
  return !R.equals(obj, copy);
};

let formVf = function ([obj, errors]) {
  return h('form.form', {
    onsubmit() {
      co(function *() {
        try {
          yield chemicalSupplierStore.validate(obj);
        } catch (e) {
          if (e instanceof ValidationError) {
            $$errors.val(e.errors);
            return;
          }
          throw e;
        }
        $$loading.on();
        try {
          let { id } = yield chemicalSupplierStore.save(obj);
          copy = R.clone(obj);
          $$.update([
            [$$toast, {
              type: 'success',
              message: '提交成功',
            }],
            [$$errors, {}]
          ]);
          !obj.id && page('/chemical-supplier/' + id);
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
      key: ['entity', 'name'],
      required: true,
      errors,
      input: h('input', {
        oninput() {
          $$obj.patch({
            entity: Object.assign(obj.entity, {
              name: this.value,
              acronym: acronym(this.value),
            }),
          });
        },
        value: R.pathOr('', ['entity', 'name'])(obj),
      })
    }),
    field({
      label: '缩写',
      key: ['entity', 'acronym'],
      required: true,
      errors,
      input: h('input', {
        oninput() {
          $$obj.patch({
            entity: Object.assign(obj.entity, { acronym: this.value })
          });
        },
        value: R.pathOr('', ['entity', 'acronym'])(obj),
      })
    }),
    field({
      label: '联系方式',
      key: 'contact',
      required: true,
      errors,
      input: h('input', {
        oninput() {
          $$obj.patch({ contact: this.value });
        },
        value: obj.contact || '',
      })
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('a.btn.btn-outline', {
      href: '/chemical-supplier-list',
    }, '返回')
  ]);
};

let $$form = $$.connect([$$obj, $$errors], formVf);

let vf = function ([loading, obj, form]) {
  let header = h(classNames('header', dirty(obj) && 'dirty'),
                 obj.id? '编辑化学品供应商(' + obj.entity.name + ')': '创建化学品供应商');
  return h(classNames('object-app', loading && 'loading'), [
    header,
    form,
  ]);
};

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$obj, $$form], vf);
    },
    onUpdated() {
    },
  },
  get dirty() {
    return !R.equals($$obj.val(), copy);
  },
  init({ params: { id } }) {
    return co(function *() {
      $$loading.on();
      let obj = id? (yield chemicalSupplierStore.get(id)): { entity: {} };
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$obj, obj]
      ]);
    });
  }
};
