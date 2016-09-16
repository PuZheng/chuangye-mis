import $$ from 'slot';
import accountTermStore from 'store/account-term-store';

var $$list = $$([], 'list');
var $$loading = $$(false, 'loading');

var vf = ([list]) => {
  let listEl = list.map(
    at =>
    <div className="card">
      <div className="content">
        { at.name }
      </div>
    </div>
  );
  return (
    <div className="list-app account-terms">
      <div className="header">
        <div className="title">会计期列表</div>
        <button className="new-btn" title="创建帐期">
          <i className="fa fa-plus"></i>
        </button>
      </div>
      { listEl }
    </div>
  );
};

var $$view = $$.connect([$$list], vf);

export default {
  page: {
    $$view,
  },
  init() {
    $$loading.val(true);
    accountTermStore.list
    .then(function (list) {
      $$.update(
        [$$loading, false],
        [$$list, list]
      );
    });
  }
};
