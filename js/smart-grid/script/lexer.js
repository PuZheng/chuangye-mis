export class Token {
  constructor(type, value='') {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `<Token: ${this.type}:${this.value}>`;
  }
}

[Token.PLUS, Token.MINUS, Token.MUL, Token.DIV, Token.NUMBER, Token.LPAREN, Token.RPAREN, Token.VARIABLE] = 
  ['PLUS', 'MINUS', 'MUL', 'DIV', 'NUMBER', 'LPAREN', 'RPAREN', 'VARIABLE'];

const TOKEN_TYPE_MAP = {
  '+': Token.PLUS,
  '-': Token.MINUS,
  '*': Token.MUL,
  '/': Token.DIV,
  '(': Token.LPAREN,
  ')': Token.RPAREN
};

const VARIABLE_RE = /^(\w+:)?\w+/;

export class Lexer {
  constructor(text) {
    this.text = text.toUpperCase();
    this.numberRegex = /^\d+(\.\d+)?/;
  }
  number(pos) {
    let m = this.text.slice(pos).match(this.numberRegex);
    return [Number(m[0]), pos + m[0].length];
  }
  variable(pos) {
    let m = this.text.slice(pos).match(VARIABLE_RE);
    let varLen = m? m[0].length: 0;
    return [m? m[0]: '', pos + varLen];
  }
  skipSpaces(pos) {
    for (; pos < this.text.length && (this.text[pos] === ' ' || this.text[pos] === '\t'); ++pos);
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
          } else if (c >= 'A' && c <= 'Z') {
            let name;
            [name, pos] = lexer.variable(pos);
            return {
              value: new Token(Token.VARIABLE, name),
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
};
