// this file generated automatically, don't MODIFY this file
var _config = eval(({
  "backend": "http://127.0.0.1:5000",
  "pageSize": 16,
  "invoicePageSize": 18
}));
export default Object.assign(_config, {
  getPageSize(type) {
    return _config[type + 'PageSize'] || _config.pageSize;
  },
});