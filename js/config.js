import _config from './config.json';

export default Object.assign({}, _config, {
  getPageSize(type) {
    return _config[type + 'pageSize'] || _config.pageSize;
  },
});
