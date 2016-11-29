import virtualDom from 'virtual-dom';
var h = virtualDom.h;

var formatParagraph = function (paragraph) {
  return paragraph.split('\n').map(function (l) {
    let i = 0;
    for (; i < l.length && l[i] == ' '; ++i);
    return h('p', {
      style: {
        paddingLeft: i + 'rem',
      }
    }, l.substr(i));
  });
};

var axiosError2Dom = function (error) {
  let dom =  [
    h('h3', error.message),
    h('.stack', formatParagraph(error.stack)),
  ];
  if (error.response) {
    dom.push(h('.response.pt3', [
      h(
        'h3',
        `Response (${error.response.status}, ${error.response.statusText})`
      ),
      h('.data', formatParagraph(JSON.stringify(error.response.data, null, 4))),
    ]));
  }
  return dom;
};

export default axiosError2Dom;
