export class Token {
  constructor(type, value='') {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `<Token: ${this.type}:${this.value}>`;
  }
}

[
  Token.PLUS, Token.MINUS, Token.MUL, Token.DIV, Token.NUMBER, Token.LPAREN,
  Token.RPAREN, Token.VARIABLE, Token.REF
] = [
  'PLUS', 'MINUS', 'MUL', 'DIV', 'NUMBER', 'LPAREN', 'RPAREN', 'VARIABLE', 'REF'
];

const TOKEN_TYPE_MAP = {
  '+': Token.PLUS,
  '-': Token.MINUS,
  '*': Token.MUL,
  '/': Token.DIV,
  '(': Token.LPAREN,
  ')': Token.RPAREN
};

const VARIABLE_RE = /^(\w+:)?([A-Z]+[0-9]+)/;
const REF_RE = /^(\w+:)?[\$|@]\{([^{}]+)\}/;

export class Lexer {
  constructor(text) {
    this.text = text.toUpperCase();
    this.numberRegex = /^\d+(\.\d+)?/;
  }
  number(pos) {
    let m = this.text.slice(pos).match(this.numberRegex);
    return [Number(m[0]), pos + m[0].length];
  }
  /**
   * process variable
   *
   * @param {Number} pos
   * @returns {Array}
   *
   * @memberOf Lexer
   */
  variableOrRef(pos) {
    let m = this.text.slice(pos).match(REF_RE);
    if (m) {
      return [Token.REF, {
        sheet: m[1] ? m[1].substr(0, m[1].length - 1) : '',
        name: m[2],
      }, pos + m[0].length];
    }
    m = this.text.slice(pos).match(VARIABLE_RE);
    // since 'A' <= this.text[pos] <= 'Z', so m can't be null
    return [Token.VARIABLE, {
      sheet: m[1] ? m[1].substr(0, m[1].length - 1) : '',
      name: m[2]
    }, pos + m[0].length];
  }
  skipSpaces(pos) {
    for (; pos < this.text.length &&
         (this.text[pos] === ' ' || this.text[pos] === '\t'); ++pos);
    return pos;
  }

  get tokens() {
    let pos = 0;
    let opSet = new Set(['+', '-', '*', '/', '(', ')']);
    let lexer = this;
    return {
      [Symbol.iterator]() { return this; },
      next() {
        if (pos < lexer.text.length) {
          pos = lexer.skipSpaces(pos);
          let c = lexer.text[pos];
          if (opSet.has(c)) {
            pos += 1;
            return {
              value: new Token(TOKEN_TYPE_MAP[c], c),
              done: false,
            };
          } else if (c >= '0' && c <= '9') {
            let value;
            [value, pos] = lexer.number(pos);
            return {
              value: new Token(Token.NUMBER, value),
              done: false,
            };
          } else if ((c >= 'A' && c <= 'Z') || c == '$' || c == '@') {
            let value, tokenType;
            [tokenType, value, pos] = lexer.variableOrRef(pos);
            return {
              value: new Token(tokenType, value),
              done: false,
            };
          } else {
            throw new Error('invalid character: ' + c);
          }
        }
        return { done: true };
      }
    };
  }
}
