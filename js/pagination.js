export default function pagination({ totalCnt, page,  pageSize}) {
  return {
    hasPrev: page > 1,
    hasNext: page * pageSize < totalCnt,
    page: page,
    totalCnt: totalCnt,
    totalPageCnt: Math.floor((totalCnt - 1) / pageSize) + 1
  }; 
};
