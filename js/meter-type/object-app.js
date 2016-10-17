import $$ from 'slot';
import virtualDom from 'virtual-dom';
import R from 'ramda';
import classNames from '../class-names';
import field from '../field';
import page from 'page';
import co from 'co';
import meterTypeStore from 'store/meter-type-store';
import { $$toast } from '../toast';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$errors = $$({}, 'errors');
var $$obj = $$({}, 'obj');
var copy = {};

var dirty = function (obj) {
  return !R.equals(obj, copy);
};

var vf = function ([loading, obj, errors, readingEditor]) {
  return h(classNames('object-app', loading && 'loading'), [
    h(classNames('header', dirty(obj) && 'dirty'), R.ifElse(
      R.prop('id'),
      () => `编辑表设备类型${obj.name}`,
        () => '创建表设备类型'
    )(obj)),
    h('form.form', {
      onsubmit() {
        co(function *() {
          try {
            yield meterTypeStore.validate(obj);
          } catch (e) {
            $$errors.val(e);
            return;
          }
          if (!dirty(obj)) {
            $$toast.val({
              type: 'info',
              message: '您没有做出任何修改'
            });
            return;
          }
          try {
            $$loading.val(true);
            let { id=obj.id } = yield meterTypeStore.save(obj);
            copy = R.clone(obj);
            $$toast.val({
              type: 'success',
              message: obj.id? '修改成功': '成功创建表设备类型',
            });
            !obj.id && page('/meter-type/' + id);
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
            $$obj.patch({ name: this.value });
          }
        }),
        errors,
        required: true
      }),
      readingEditor,
      h('hr'),
      h('button.primary', '提交'),
      h('button', {
        onclick(e) {
          e.preventDefault();
          page('/meter-type-list');
          return false;
        }
      }, '返回')
    ])
  ]);
};

// 读数编辑器
var $$readingEditor = function () {
  var $$meterReading = $$({}, 'meter-reading');
  let vf = function ([obj, meterReading, errors]) {
    let err = errors['meterReadings'];
    return h('.field.inline', [
      h('.border.border-box.p2', [
        h('label', '读数'),
        h('input', {
          oninput() {
            $$meterReading.patch({ name: this.value });
          },
          value: meterReading.name || '',
        }),
        h('button', {
          style: {
            background: 'none',
            outline: 'none',
            border: 'none'
          },
          title: '添加读数',
          onclick(e) {
            e.preventDefault();
            if (meterReading.name) {
              $$obj.patch({
                meterReadings: (obj.meterReadings || []).concat([{
                  name: meterReading.name
                }])
              });
              $$meterReading.patch({ name: '' });
            }
            return false;
          },
        }, h('i.fa.fa-plus.color-success')),
        R.ifElse(
          (meterReadings) => meterReadings == undefined || R.isEmpty(meterReadings),
            R.always(''),
          function (meterReadings=[]) {
            return h('.segment', meterReadings.map(function (it, idx) {
              return h('.item', [
                h('.title', it.name),
                h('.ops', h('button', {
                  onclick(e) {
                    e.preventDefault();
                    $$obj.patch({
                      meterReadings: obj.meterReadings.filter(function (it, idx_) {
                        return idx_ != idx;
                      })
                    });
                    return false;
                  }
                }, h('i.fa.fa-remove.color-accent'))),
              ]);
            }));
          }
        )(obj.meterReadings),
      ]), 
      err? h('.label.pointing.error', err): '',
    ]);
  };
  return $$.connect([$$obj, $$meterReading, $$errors], vf);
}();

export default {
  page: {
    $$view: $$.connect([$$loading, $$obj, $$errors, $$readingEditor], vf),
  },
  init(ctx) {
    let { id } = ctx.params;
    if (id) {
      $$loading.val(true);
      meterTypeStore.get(id)
      .then(function (obj) {
        copy = R.clone(obj);
        $$.update(
          [$$obj, obj],
          [$$loading, false]
        );
      });
    }
  }
};
