import $$ from 'slot';
import virtualDom from 'virtual-dom';
import classNames from '../class-names';
import R from 'ramda';
import field from '../field';
import acronym from '../utils/acronym';
import storeSubjectStore from '../store/store-subject-store';
import constStore from '../store/const-store';
import co from 'co';
import { $$toast } from '../toast.js';
import page from 'page';
import $$dropdown from 'widget/dropdown';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$obj = $$({}, 'obj');
var $$errors = $$({}, 'errors');
var $$storeSubjectTypes = $$({}, 'store-subject-types');
var copy = {};

var dirty = function (obj) {
  return !R.equals(copy, obj);
};

var vf = function ([loading, obj, form]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(
      classNames('header', dirty(obj) && 'dirty'),
      obj.id? `编辑仓储科目${obj.name}`: '创建仓储科目'
    ),
    form,
  ]);
};

var formVf = function ([obj, errors, typeDropdown]) {
  console.log(obj);
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      co(function *() {
        try {
          yield storeSubjectStore.validate(obj);
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
          let { id } = yield storeSubjectStore.save(obj);
          copy = R.clone(obj);
          $$.update([
            [$$loading, false],
            [$$toast, {
              type: 'success',
              message: obj.id? '更新成功': '创建成功',
            }]
          ]);
          !obj.id && page('/store-subject/' + id);
        } catch (e) {
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
        value: obj.name || '',
        oninput() {
          let name = this.value;
          $$obj.patch({
            name,
            acronym: acronym(name),
          });
        }
      }),
      errors,
      required: true,
    }),
    field({
      key: 'unit',
      label: '单位',
      input: h('input', {
        value: obj.unit || '',
        oninput() {
          $$obj.patch({ unit: this.value });
        }
      }),
      errors,
      required: true,
    }),
    field({
      key: 'acronym',
      label: '缩写',
      input: h('input', {
        value: obj.acronym || '',
        oninput() {
          $$obj.patch({ acronym: this.value });
        }
      }),
      errors,
      required: true,
    }),
    field({
      key: 'type',
      label: '类型',
      input: typeDropdown,
      required: true
    }),
    h('hr'),
    h('button.primary', '提交'),
    h('a.btn.btn-outline', {
      href: '/store-subject-list',
    }, '返回')
  ]);
};

var $$typeDropdown = $$dropdown({
  $$options: $$storeSubjectTypes.map(R.values),
  $$value: $$obj.map(R.propOr('', 'type')),
  defaultText: '请选择类型',
  onchange(type) {
    $$obj.patch({ type });
  }
});

var $$form = $$.connect([$$obj, $$errors, $$typeDropdown], formVf);

export default {
  page: {
    get $$view() {
      return $$.connect([$$loading, $$obj, $$form], vf);
    }
  },
  get dirty() {
    return dirty($$obj.val());
  },
  init(ctx) {
    let { id } = ctx.params;
    $$loading.val(true);
    Promise.all([
      id? storeSubjectStore.get(id): {},
      constStore.get(),
    ])
    .then(function ([obj, { STORE_SUBJECT_TYPES }]) {
      copy = R.clone(obj);
      $$.update([
        [$$loading, false],
        [$$obj, obj],
        [$$storeSubjectTypes, STORE_SUBJECT_TYPES]
      ]);
    });
  }
};
