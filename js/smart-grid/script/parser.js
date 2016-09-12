import { Token } from './lexer.js';

export class BinOp {
  constructor(op, left, right) {
    this.op = op;
    this.left = left;
    this.right = right;
  }
}

export class UnaryOp {
  constructor(op, child) {
    this.op = op;
    this.child = child;
  }
}

export class Num {
  constructor(value) {
    this.value = value;
  }
}

export class Var {
  constructor(name) {
    this.name = name;
  }
}

export class Parser {
  constructor(lexer) {
    this.tokens = lexer.tokens;
    this.currentToken = this.tokens.next();
    // null denotes EOF
    this.currentToken = this.currentToken.done? null: this.currentToken.value;
  }
  get expr() {
    if (!this.currentToken) {
      return;
    }
    let node = this.term;
    while (this.currentToken && 
           (this.currentToken.type === Token.MINUS || this.currentToken.type === Token.PLUS)) {
      let op = this.currentToken.value;
      this.eat(this.currentToken.type);
      node = new BinOp(op, node, this.term);
    }
    return node;
  }
  get term() {
    let node = this.factor;
    while (this.currentToken && 
           (this.currentToken.type === Token.MUL || this.currentToken.type === Token.DIV)) {
      let op = this.currentToken.value;
      this.eat(this.currentToken.type);
      node = new BinOp(op, node, this.factor);
    }
    return node;
  }
  get factor() {
    var node;
    switch (this.currentToken.type) {
      case Token.PLUS: {
        let op = this.currentToken.value;
        this.eat(Token.PLUS);
        node = new UnaryOp(op, this.factor);
        break;
      }
      case Token.MINUS: {
        let op = this.currentToken.value;
        this.eat(Token.MINUS);
        node = new UnaryOp(op, this.factor);
        break;
      }
      case Token.NUMBER: {
        node = new Num(this.currentToken.value);
        this.eat(Token.NUMBER);
        break;
      }
      case Token.LPAREN: {
        this.eat(Token.LPAREN);
        node = this.expr;
        this.eat(Token.RPAREN);
        break;
      }
      case Token.VARIABLE: {
        node = new Var(this.currentToken.value);
        this.eat(Token.VARIABLE);
        break;
      }
      default: {
        throw new Error('unexpected token: ' + this.currentToken.toString());
      }
    }
    return node;
  }
  eat(type) {
    if (this.currentToken.type == type) {
      this.currentToken = this.tokens.next();
      this.currentToken = this.currentToken.done? null: this.currentToken.value;
    } else {
      throw new Error('unexpected token: ' + this.currentToken.toString());
    }
  }
};
