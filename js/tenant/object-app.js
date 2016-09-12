import $$ from 'slot';
import virtualDom from 'virtual-dom';
import field from '../field';
import $$searchDropdown from '../widget/search-dropdown';
import tenantStore from '../store/tenant-store.js';
import overlay from '../overlay';
import axiosError2Dom from '../axios-error-2-dom';
import { $$toast } from '../toast.js';
import page from 'page';
import pinyin from 'pinyin';
import R from 'ramda';
import diff from '../diff';

var h = virtualDom.h;
var $$tenant = $$({}, 'tenant');
var $$errors = $$({}, 'errors');
var $$departments = $$([], 'departments');
var $$loading = $$(false, 'loading');
var oldCopy = {};

var onTenantChange = function () {
  return function (tenant) {
    if (tenant && tenant.id) {
      oldCopy = R.clone(tenant);
      $$tenant.offChange(onTenantChange);
    }
  };
}();

$$tenant.change(onTenantChange);

var $$departmentDropdown = $$searchDropdown({
  defaultText: '请选择车间',
  $$options: $$departments.trans(function (l) {
    return l.map(function (d) {
      return {
        value: d.id,
        text: d.name,
        acronym: d.acronym,
      };
    });
  }),
  $$value: $$tenant.trans(t => t.departmentId),
  onchange(v) {
    $$tenant.patch({
      departmentId: v,
    });
  }
});

var formVf = function ([errors, departmentDropdown, tenant]) {
  return h('form.form', {
    onsubmit() {
      $$errors.val({});
      tenantStore
      .validate(tenant)
      .then(function (obj) {
        $$loading.toggle();
        let data = obj.id? diff(obj, oldCopy): obj;
        if (!data) {
          throw {
            code: 'unchanged',
          };
        }
        return tenantStore.save(data, obj.id);
      }, function (e) {
        throw {
          error: e,
          code: 'validation',
        };
      })
      .then(function ({id=tenant.id}) {
        $$loading.val(false); 
        oldCopy = R.clone(tenant);
        $$toast.val({
          type: 'success',
          message: tenant.id? '更新成功': '承包人创建成功',
        });
        page('/tenant/' + id);
      }, function (e) {
        $$loading.val(false); 
        if (e.response) {
          throw {
            error: e,
            code: 'server'
          };
        };
        throw e;
      })
      .catch(function (e) {
        switch (e.code) {
          case 'validation': {
            $$errors.val(e.error);
            break;
          }
          case 'server': {
            e = e.error;
            if (e.response.status == 403)  {
              $$errors.val(e.response.data.fields || {});
              return;
            }
            overlay.$$content.val({
              type: 'error',
              title: '很不幸, 出错了!',
              message: axiosError2Dom(e),
            });
            break;
          }
          case 'unchanged': {
            $$toast.val({
              type: 'info',
              message: '没有任何变化',
            });
            break;
          }
          default: 
            throw e;
        }
      });
      return false;
    }
  }, [
    field('name', '姓名', h('input', {
      value: (tenant.entity || {}).name,
      oninput() {
        $$tenant.patch({
          entity: Object.assign(tenant.entity || {}, {
            name: this.value, 
            acronym: pinyin(this.value, {
              style: pinyin.STYLE_NORMAL,
            }).map(i => i[0][0]).join(''),
          }),
        });
      }
    }), errors, true),
    field('acronym', '缩写', h('input', {
      value: (tenant.entity || {}).acronym,
      oninput() {
        $$tenant.patch({
          entity: Object.assign(tenant.entity || {}, {
            acronym: this.value,
          })
        });
      }
    }), errors, true),
    field('contact', '联系方式', h('input', {
      value: tenant.contact,
      oninput() {
        $$tenant.patch({
          contact: this.value,
        });
      }
    }), errors),
    field('departmentId', '车间', departmentDropdown, errors, true),
    h('hr'),
    h('button.primary', '提交'),
  ]);
};

var $$form = $$.connect([$$errors, $$departmentDropdown, $$tenant], formVf);


var vf = function ([tenant, form, loading]) {
  return h('.object-app' + (loading? '.loading': ''), [
    h('.header' + (diff(tenant, oldCopy)? '.dirty': ''), tenant.id? `编辑承包人-${tenant.entity.name}`: '创建承包人'),
    form,
  ]);
};


export default {
  page: {
    $$view: $$.connect([$$tenant, $$form, $$loading], vf),
  },
  $$tenant,
  $$departments,
  $$loading,
};
