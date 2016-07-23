import classNames from 'classnames';
import moment from 'moment';
import {invoice, invoiceTypes, loading, vendors, purchasers, accountTerms} from './data-slots.js';
import x from '../xx.js';
import { html } from 'snabbdom-jsx';
import R from 'ramda';

var If = (test, children) => {
  if (test) {
    return children[0];
  }
};

function invoiceFormValueFunc(
  loading, invoiceTypes, invoice, vendors, purchasers, accountTerms) {
    var disabled = invoice.status == 'completed'? 'disabled': '';
    return () => (
      <form className={ classNames('ui', 'form', { loading }) } hook-insert={ onInserted }>
        <div className="inline field">
          <label for="">发票类型</label>
          <select className="ui selection dropdown" name="invoiceType" disabled={ disabled }>
            { [{ id: "", name: "请选择发票类型" }].concat(invoiceTypes).map(function (t) {
            return <option value={ t.id } selected={ invoice.invoiceTypeId == t.id }>{ t.name }</option>;
            }) }
          </select>
        </div>
        <div className="required inline field">
          <label for="">发票日期</label>
          <input type="date" name="date" 
            value={ (invoice.date? moment(invoice.date): moment()).format('YYYY-MM-DD') } 
            on-change= { onDateChange }
            disabled={ disabled } />
        </div>
        <div className="required inline field">
          <label for="">发票号码</label>
          <input type="text" name="number" value={ invoice.number || '' } disabled={ disabled } />
        </div>
        <div className="required inline field">
          <label for="">会计账期</label>
          <select className="ui selection dropdown" name="accountTerm">
            { [{ id: '', name: '请选择会计帐期' }].concat(accountTerms).map((t) => (
            <option value={ t.id } selected={ invoice.accountTermId == t.id }>
              { t.name }
            </option>
            ))}
          </select>
        </div>
        <div className="inline field">
          <div className="is-vat ui checkbox">
            <input type="checkbox" name="isVAT" checked={ invoice.isVAT } disabled={ disabled } />
            <label for="">是否是增值税</label>
          </div>
        </div>
        <div className="required inline field">
          <label for="">(实际)销售方</label>
          <select className="ui search selection dropdown" name="vendor" disabled={ disabled }>
            { [{ id: '', name: '选择销售方' }].concat(vendors).map((v) => (
            <option value={ v.id }
              selected={invoice.vendorId == v.id}>
              { v.name }
            </option>
            )) }
          </select>
        </div>
        <div className="required inline field">
          <label for="">(实际)购买方</label>
          <select className="ui search selection dropdown" name="purchaser" disabled={ disabled }>
            { [{ id: '', name: '选择购买方' }].concat(purchasers).map((p) => (
            <option value={ p.id }
              selected={ invoice.purchaserId == p.id }>
              { p.name }
            </option>
            )) }
          </select>
        </div>
        <div className="inline field">
          <label for="">备注信息</label>
          <textarea name="notes" rows="4" disabled={ disabled } 
            style={ { 
            display: 'inline-block',
            width: '24em',
            } }>{ invoice.notes || '' }</textarea>
        </div>
        <div className="inline field">
          <label for="">物料明细</label>
        </div>
        <hr />
        <input type="submit" className="ui green button" value="提交" />
        <If test={ invoice.id && invoice.status != 'completed' }><input type="submit" className="ui button" value="标记完成"/></If>
      </form>
    );
  }


const onInserted = function (vnode) {
  console.debug('form inserted into dom');
  let $elm = $(vnode.elm);
  $elm.find('[name=invoiceType]').dropdown({
    onChange: function (value, text, $choice) {
      loading.val(true);
      setTimeout(function () {
        x.update(
          [invoice, Object.assign(invoice.val(), {
            invoiceTypeId: value,
          })],
          [loading, false],
          [vendors, [
            {id: 11, name: "张三"},
            {id: 22, name: "外部客户1"}
          ]], 
          [purchasers, [
            {id: 1, name: "厂部"},
            {id: 2, name: "外部客户1"}
          ]]
        );
      }, 500);
    }
  });
  $elm.find('[name=accountTerm]').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        accountTermId: value,
      });
    }
  });
  $elm.find('.is-vat.ui.checkbox').checkbox({
    onChecked: function () {
      invoice.patch({
        isVAT: true, 
      });
    },
    onUnchecked: function () {
      invoice.patch({
        isVAT: false, 
      });
    }
  });
  $elm.find('[name=vendor].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        vendorId: value,
      });
    }
  });
  $elm.find('[name=purchaser].ui.dropdown').dropdown({
    onChange: function (value, text, $choice) {
      invoice.patch({
        purchaserId: value,
      });
    }
  });
  $elm.find('[name=notes]').change(function (e) {
    invoice.patch({
      notes: this.value,
    });
  });
  $elm.find('[name=number]').change(function (e) {
    invoice.patch({
      number: this.value,
    });
  });
};

const onDateChange = function (e) {
  invoice.patch({
    date: this.value,
  });
};

export default x.connect(
  loading, invoiceTypes, invoice, vendors, purchasers, accountTerms,
  invoiceFormValueFunc
).setTag('invoice-form');
