import $$ from 'slot';

var $$view = $$(
  <div className="warn box border bca rounded max-width-2 mx-auto p2 mt4">
    <h2 className="header ca">网页丢失了<span>:(</span></h2>
    <div className="c1 p1">
      <p>原因可能是:</p>
      <ul>
        <li>地址错误</li>
        <li>链接过期</li>
      </ul>
      <div className="color-gray">
        <span>返回</span>
        <a href="/">首页</a>
      </div>
    </div>
  </div>
);

export default {
  page: {
    $$view,
  }
};
