import pinyin from 'pinyin';

var acronym = function acronym(text) {
  return pinyin(text, {
    style: pinyin.STYLE_FIRST_LETTER
  }).map(it => it[0]).join('');
};

export default acronym;
