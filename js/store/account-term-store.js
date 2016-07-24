export default {
  get list() {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve([
          {id: 1, name: "2016-06"},
          {id: 2, name: "2016-07"}
        ]);
      }, 500);
    });
  }
};
