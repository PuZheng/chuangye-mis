import $$ from 'slot';
import virtualDom from 'virtual-dom';
var h = virtualDom.h;
import voucherTypeStore from 'store/voucher-type-store';
import voucherSubjectStore from 'store/voucher-subject-store';
import moment from 'moment';
import voucherStore from 'store/voucher-store';
import casing from 'casing';
import co from 'co';
import { $$toast } from '../toast';
import { field } from '../field';
import page from 'page';
import { $$dropdown } from '../widget/dropdown';
import R from 'ramda';
import { $$searchDropdown } from '../widget/search-dropdown';
import entityStore from '../store/entity-store';
import classNames from '../class-names';
import overlay from '../overlay';

var $$obj = $$({}, 'obj');
var $$voucherTypes = $$([], 'voucher-types');
var $$loading = $$(false, 'loading');
var $$voucherSubjects = $$([], 'voucher-subjects');
var $$errors = $$({}, 'errors');
var $$entities = $$([], 'entities');
var $$currentVoucherSubject = $$(null, 'current-voucher-subject');
// why bother make these 2 slots? to avoid refresh
// payerDropdown/recipientDropdown whenever obj changed
var $$currentPayerId = $$(null, 'current-payer-id');
var $$currentRecipientId = $$(null, 'current-recipient-id');

var copy = {};

var dirty = function (obj) {
  return !R.equals(obj, copy);
};

const vf = function([obj, form]) {
  let readonly = R.path(['accountTerm', 'closed'])(obj);
  return h('.object-app', [
    h(
      classNames('header', dirty(obj) && 'dirty'),
      obj.id? `编辑凭证-${obj.number}` + (readonly? '(已锁定)': ''): '创建新凭证'
    ),
    form,
  ]);
};

const formVf = function formVf([
  loading, obj, errors,
  voucherTypeDropdown, voucherSubjectDropdown,
  payerDropdown, recipientDropdown
]) {
  let classNames = ['form', 'relative'];
  loading && classNames.push('loading');
  classNames = classNames.map(c => '.' + c).join('');
  let readonly = R.path(['accountTerm', 'closed'])(obj);
  return h('form' + classNames, {
    onsubmit() {
      co(function*() {
        if (!dirty(obj)) {
          $$toast.val({
            type: 'info',
            message: '您没有做出任何修改',
          });
          return;
        }
        $$errors.val({});
        try {
          yield voucherStore.validate(obj);
        } catch (e) {
          $$errors.val(e);
          return;
        }
        try {
          $$loading.val(true);
          let { id } = obj;
          Object.assign(obj, yield voucherStore.save(obj));
          copy = R.clone(obj);
          $$toast.val({
            type: 'success',
            message: '提交成功',
          });
          !id && page('/voucher/' + obj.id);
        } catch (e) {
          console.error(e);
          if (e.response && e.response.status == 400) {
            $$errors.val(e.response.data);
          }
        } finally {
          $$loading.val(false);
        }
      });
      return false;
    }
  }, [
    obj.id? field({
      label: '经办人',
      input: h('.text', R.path(['creator', 'username'])(obj)),
    }): void 0,
    obj.id? field({
      label: '创建于',
      input: h('.text', moment(obj.created).format('YYYY-MM-DD HH:mm')),
    }): void 0,
    obj.id? field({
      label: '账期',
      input: h('.text', h('span', [
        R.path(['accountTerm', 'name'])(obj),
        ...readonly?
          [h('span', '('), h('i.fa.fa-lock'), h('span', '已关闭'), h('span', ')')]:
          []
      ])),
    }): void 0,
    readonly?
    field({
      label: '凭证类型',
      input: h('.text', R.path(['voucherType', 'name'])(obj))
    }):
    field({
      key: 'voucherTypeId',
      label: '凭证类型',
      input: voucherTypeDropdown,
      errors,
      required: true,
    }),
    readonly?
    field({
      label: '科目',
      input: h('.text', R.path(['voucherSubject', 'name'])(obj))
    }):
    field({
      key: 'voucherSubjectId',
      label: '科目',
      input: voucherSubjectDropdown,
      errors,
      required: true,
    }),
    readonly?
    field({
      label: '金额',
      input: h('.text', '' + obj.amount),
    }):
    field({
      key: 'amount',
      label: '金额(元)',
      input: h('input', {
        type: 'number',
        oninput() {
          $$obj.patch({ amount: this.value });
        },
        value: obj.amount,
      }),
      errors,
      required: true,
    }),
    readonly?
    field({
      label: '日期',
      input: h('.text', obj.date)
    }):
    field({
      key: 'date',
      label: '日期',
      input: h('input', {
        type: 'date',
        value: obj.date,
        oninput() {
          $$obj.patch({
            date: this.value,
          });
        }
      }),
      errors,
      required: true
    }),
    readonly?
    field({ label: '凭证号', input: h('.text', obj.number) }):
    field({
      key: 'number',
      label: '凭证号',
      input: h('input', {
        placeholder: '请输入凭证号',
        value: obj.number,
        oninput() {
          $$obj.patch({ number: this.value });
        }
      }),
      errors,
      required: true
    }),
    readonly?
    field({
      label: '(实际)支付方',
      input: h('.text', R.path(['payer', 'name'])(obj)),
    }):
    field({
      key: 'payerId',
      label: '(实际)支付方',
      input: payerDropdown,
      errors,
      required: true
    }),
    readonly?
    field({
      label: '(实际)收入方',
      input: h('.text', R.path(['recipient', 'name'])(obj))
    }):
    field({
      key: 'recipientId',
      label: '(实际)收入方',
      input: recipientDropdown,
      errors,
      required: true
    }),
    h('.clearfix'),
    h('hr'),
    readonly? void 0: h('button.primary', '提交'),
    readonly || !obj.id? void 0 : h('a.btn.btn-outline.ca', {
      onclick() {
        overlay.show({
          type: 'warning',
          title: '您确认要删除该凭证?',
          message: [
            h('.ca.pt4.pb4', '该操作将不可逆!'),
            h('a.btn.btn-outline', {
              onclick() {
                overlay.dismiss();
                return false;
              }
            }, '取消'),
            h('a.btn.btn-outline.ca', {
              onclick() {
                voucherStore.del(obj.id)
                .then(function () {
                  overlay.show({
                    cancelable: false,
                    type: 'success',
                    title: '删除成功!',
                    message: h('a.btn.btn-outline', {
                      onclick() {
                        overlay.dismiss();
                        page('/voucher-list');
                        return false;
                      }
                    }, 'OK')
                  });
                });
                return false;
              }
            }, '确认')
          ],
        });
        return false;
      }
    }, '删除'),
    h('a.btn.btn-outline', {
      href: '/voucher-list',
    }, '返回'),
  ]);
};


var $$voucherTypeDropdown = $$dropdown({
  defaultText: '请选择凭证类型',
  onchange(voucherTypeId) {
    $$obj.patch({
      voucherTypeId
    });
  },
  $$options: $$voucherTypes.trans(R.map(it => ({
    value: it.id,
    text: it.name
  }))),
  $$value: $$obj.trans(R.prop('voucherTypeId')),
});

var $$voucherSubjectDropdown = $$searchDropdown({
  defaultText: '请选择凭证科目',
  $$value: $$obj.trans(R.prop('voucherSubjectId')),
  $$options: $$voucherSubjects.trans(R.map(it => ({
    value: it.id,
    text: it.name,
    acronym: it.acronym,
  }))),
  onchange(voucherSubjectId) {
    $$obj.patch({
      voucherSubjectId
    });
    $$currentVoucherSubject.val(
      R.find(R.propEq('id', voucherSubjectId))($$voucherSubjects.val())
    );
  },
});

var $$payerDropdown = $$searchDropdown({
  defaultText: '请选择支付方',
  onchange(payerId) {
    $$obj.patch({ payerId });
    $$currentPayerId.val(payerId);
  },
  $$options: $$.connect(
    [$$currentVoucherSubject, $$entities],
    function([currentVoucherSubject, entities]) {
      let payerType = R.prop('payerType')(currentVoucherSubject || {});
      if (payerType) {
        return entities.filter(R.propEq('type', payerType)).map(it => ({
          value: it.id,
          text: it.name,
          acronym: it.acronym,
        }));
      }
      return [];
    }
  ),
  $$value: $$currentPayerId
});

var $$recipientDropdown = $$searchDropdown({
  defaultText: '请选择支付方',
  onchange(recipientId) {
    $$obj.patch({ recipientId });
    $$currentRecipientId.val(recipientId);
  },
  $$options: $$.connect(
    [$$currentVoucherSubject, $$entities],
    function([currentVoucherSubject, entities]) {
      let recipientType = R.prop('recipientType')(currentVoucherSubject || {});
      if (recipientType) {
        return entities.filter(R.propEq('type', recipientType)).map(it => ({
          value: it.id,
          text: it.name,
          acronym: it.acronym,
        }));
      }
      return [];
    }
  ),
  $$value: $$currentRecipientId,
});

var $$form = $$.connect([
  $$loading, $$obj, $$errors,
  $$voucherTypeDropdown, $$voucherSubjectDropdown,
  $$payerDropdown, $$recipientDropdown
], formVf, 'voucher-form');

export
default {
  page: {
    get $$view() {
      return $$.connect(
        [$$obj, $$form],
        vf,
        'voucher-object-app'
      );
    }
  },
  get dirty() {
    return dirty($$obj.val());
  },
  init(ctx) {
    let {
      id
    } = ctx.params;
    $$loading.val(true);
    let promises = [
      voucherTypeStore.list,
      voucherSubjectStore.fetchList({ only_unreserved: 1 }),
      entityStore.list,
      id ? voucherStore.get(id) : Object.assign({
        date: moment().format('YYYY-MM-DD')
      }, casing.camelize(ctx.query)),
    ];
    Promise.all(promises)
      .then(function([voucherTypes, voucherSubjects, entities, obj]) {
        console.log(obj);
        copy = R.clone(obj);
        $$.update([
          [$$voucherTypes, voucherTypes],
          // why not R.propEq, since it use '===' instead of '=='
          [
            $$currentVoucherSubject,
            R.find(it => it.id == obj.voucherSubjectId)(voucherSubjects)
          ],
          [$$currentPayerId, obj.payerId],
          [$$currentRecipientId, obj.recipientId],
          [$$loading, false],
          [$$voucherSubjects, voucherSubjects],
          [$$obj, obj],
          [$$entities, entities]
        ]);
      });
  }
};
