import $$ from 'slot';

var $$view = $$(
  <div className="warn box border bca rounded max-width-2 mx-auto p2 mt4">
    <h2 className="header ca">权限错误</h2>
    <p className="c1 p4">
      <span>您无权访问本模块！请联系管理员. 返回</span>
      <a href="/">首页</a>
    </p>
  </div>
);

export default {
  page: {
    $$view,
  }
};
