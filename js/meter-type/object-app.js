import $$ from 'slot';
import virtualDom from 'virtual-dom';
import R from 'ramda';
import classNames from '../class-names';
import field from '../field';
import page from 'page';
import co from 'co';
import meterTypeStore from 'store/meter-type-store';
import { $$toast } from '../toast';
import $$searchDropdown from 'widget/search-dropdown';
import settingsStore from 'store/settings-store';

var h = virtualDom.h;
var $$loading = $$(false, 'loading');
var $$errors = $$({}, 'errors');
var $$obj = $$({}, 'obj');
var $$settings = $$([], 'settings');
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
          value: obj.name || '',
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
  let $$meterReading = $$({}, 'meter-reading');
  let $$settingsDropdown = $$searchDropdown({
    defaultText: '选择相关价格配置项',
    $$value: $$meterReading.trans(R.propOr('', 'priceSettingId')),
    $$options: $$settings.trans(R.map(function ({ id, name, group }) {
      return {
        value: id,
        text: name,
        group: group
      };
    })),
    onchange(priceSettingId) {
      $$meterReading.patch({ priceSettingId });
    },
    optionGroup: R.prop('group')
  });
  let vf = function ([obj, meterReading, errors, settingsDropdown, settings]) {
    let err = errors['meterReadings'];
    return h('.field.inline', [
      h('.border.border-box.p2', [
        h('input', {
          placeholder: '输入读数名称',
          oninput() {
            $$meterReading.patch({ name: this.value });
          },
          value: meterReading.name || '',
        }),
        settingsDropdown,
        h('button.btn.btn-outline', {
          style: {
            background: 'none',
          },
          onclick(e) {
            e.preventDefault();
            if (meterReading.name && meterReading.priceSettingId) {
              $$obj.patch({
                meterReadings: (obj.meterReadings || []).concat([R.clone(meterReading)])
              });
              $$meterReading.patch({ 
                name: '', 
                priceSettingId: '',
              });
            }
            return false;
          },
        }, '添加读数'),
        R.ifElse(
          (meterReadings) => meterReadings == undefined || R.isEmpty(meterReadings),
            R.always(''),
          function (meterReadings=[]) {
            return h('.segment', meterReadings.map(function (it, idx) {
              let setting = R.find(R.propEq('id', it.priceSettingId))(settings);
              return h('.item', [
                h('.title', it.name + `(${setting.name})`),
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
  return $$.connect([$$obj, $$meterReading, $$errors, $$settingsDropdown, $$settings], 
                    vf);
}();

export default {
  page: {
    $$view: $$.connect([$$loading, $$obj, $$errors, $$readingEditor], vf),
  },
  init(ctx) {
    let { id } = ctx.params;
    $$loading.val(true);
    Promise.all([
      id? meterTypeStore.get(id): {},
      settingsStore.list
    ])
    .then(function ([obj, settings]) {
      copy = R.clone(obj);
      $$.update(
        [$$obj, obj],
        [$$settings, settings],
        [$$loading, false]
      );
    });
  }
};
