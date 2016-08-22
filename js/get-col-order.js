var getColOrder = function getColOrder(colName, queryObj) {
  if (!queryObj.sort_by) {
    return '';
  }
  let [sortByCol, order] = queryObj.sort_by.split('.');
  if (sortByCol == colName) {
    return order || 'asc';
  } else {
    return '';
  }
};

export default getColOrder;
