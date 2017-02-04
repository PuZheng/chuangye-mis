import $$ from 'slot';
import { h } from 'virtual-dom';
import field from '../field';
import R from 'ramda';
import <%= store模块引入名 %> from 'store/<%= store模块文件 %>';
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
          yield <%= store模块引入名 %>.validate(obj);
        } catch (e) {
          if (e instanceof ValidationError) {
            $$errors.val(e.errors);
            return;
          }
          throw e;
        }
        $$loading.on();
        try {
          let { id } = yield <%= store模块引入名 %>.save(obj);
          copy = R.clone(obj);
          $$.update([
            [$$toast, {
              type: 'success',
              message: '提交成功',
            }],
            [$$errors, {}]
          ]);
          !obj.id && page('/<%= 对象名称.replace('_', '-') %>/' + id);
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
      label: '',
      key: '',
      required: true,
      errors,
      input: h()
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('a.btn.btn-outline', {
      href: '/<%= 对象名称.replace('_', '-') %>-list',
    }, '返回')
  ]);
};

let $$form = $$.connect([$$obj, $$errors], formVf);

let vf = function ([loading, obj, form]) {
  let header = h(classNames('header', dirty(obj) && dirty),
                 obj.id? '编辑<%= 对象中文名称 %>(' + obj.<%= 对象名称字段 %> + ')': '创建<%= 对象中文名称 %>');
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
      let obj = id? (yield <%= store模块引入名 %>.get(id)): {};
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$obj, obj]
      ]);
    });
  }
};
