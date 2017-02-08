import $$ from 'slot';
import { h } from 'virtual-dom';
import field from '../field';
import R from 'ramda';
import plantStore from 'store/plant-store';
import co from 'co';
import classNames from '../class-names';
import { ValidationError } from '../validate-obj';
import page from 'page';
import { $$toast } from '../toast';

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
          yield plantStore.validate(obj);
        } catch (e) {
          if (e instanceof ValidationError) {
            $$errors.val(e.errors);
            return;
          }
          throw e;
        }
        $$loading.on();
        try {
          let { id } = yield plantStore.save(obj);
          copy = R.clone(obj);
          $$.update([
            [$$toast, {
              type: 'success',
              message: '提交成功',
            }],
            [$$errors, {}]
          ]);
          !obj.id && page('/plant/' + id);
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
      key: 'name',
      required: true,
      errors,
      input: h('input', {
        oninput() {
          $$obj.patch({ name: this.value });
        },
        value: obj.name
      }),
    }),
    field({
      label: '面积',
      key: 'area',
      required: true,
      errors,
      input: h('input', {
        oninput() {
          $$obj.patch({ area: this.value });
        },
        value: obj.area,
        type: 'number'
      }),
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('a.btn.btn-outline', {
      href: '/plant-list',
    }, '返回')
  ]);
};

let $$form = $$.connect([$$obj, $$errors], formVf);

let vf = function ([loading, obj, form]) {
  let header = h(classNames('header', dirty(obj) && 'dirty'),
                 obj.id? '编辑厂房(' + obj.name + ')': '创建厂房');
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
      let obj = id? (yield plantStore.get(id)): {};
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$obj, obj]
      ]);
    });
  }
};
