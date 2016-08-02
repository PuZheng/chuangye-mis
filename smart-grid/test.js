import { Lexer, Token } from './script/lexer.js';
import { Parser, Num, BinOp, UnaryOp, Var } from './script/parser.js';
import { Interpreter } from './interpreter.js';
import test from 'ava';

test('lexer', function(t) {
  let lexer = new Lexer('1');
  let tokens = [...lexer.tokens];
  t.is(tokens.length, 1);
  t.is(tokens[0].type, Token.NUMBER);
  t.is(tokens[0].value, 1);

  lexer = new Lexer('');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 0);
  

  lexer = new Lexer('+');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 1);
  t.is(tokens[0].type, Token.PLUS);

  lexer = new Lexer('EE3');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 1);
  t.is(tokens[0].type, Token.VARIABLE);
  t.is(tokens[0].value, 'EE3');

  lexer = new Lexer('E3 + (E2 * (A1 + 2))');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 11);
  t.deepEqual(tokens.map( t => t.type ), [
    Token.VARIABLE, Token.PLUS, Token.LPAREN, Token.VARIABLE, Token.MUL, Token.LPAREN, Token.VARIABLE, Token.PLUS, Token.NUMBER, Token.RPAREN, Token.RPAREN
  ]);
});

test('parser', function (t) {
  let lexer = new Lexer('');
  let parser = new Parser(lexer);
  t.is(parser.expr, undefined);

  lexer = new Lexer('1');
  parser = new Parser(lexer);
  let expr = parser.expr;
  t.is(expr.value, 1);
  t.true(expr instanceof Num);

  lexer = new Lexer('E3');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.is(expr.name, 'E3');
  t.true(expr instanceof Var);

  lexer = new Lexer('-1');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof UnaryOp);
  t.true(expr.child instanceof Num);
  t.is(expr.child.value, 1);


  lexer = new Lexer('1 * 2');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof BinOp);
  t.true(expr.left instanceof Num);
  t.is(expr.left.value, 1);
  t.true(expr.right instanceof Num);
  t.is(expr.right.value, 2);

  lexer = new Lexer('1 * (2 + e3)');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof BinOp);
  t.true(expr.left instanceof Num);
  t.is(expr.left.value, 1);
  t.true(expr.right instanceof BinOp);
  t.true(expr.right.left instanceof Num);
  t.is(expr.right.left.value, 2);
  t.true(expr.right.right instanceof Var);
  t.is(expr.right.right.name, 'E3');
});

test('interpreter', function (t) {
  let lexer = new Lexer('3');
  let parser = new Parser(lexer);
  let interpreter = new Interpreter(parser.expr, {
    E3: 10,
  });
  t.is(interpreter.eval(), 3);

  lexer = new Lexer('');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr);
  t.is(interpreter.eval(), undefined);

  lexer = new Lexer('E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    E3: 10,
  });
  t.is(interpreter.eval(), 10);

  lexer = new Lexer('-E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    E3: 10,
  });
  t.is(interpreter.eval(), -10);

  lexer = new Lexer('E2 - E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    E2: 11,
    E3: 10,
  });
  t.is(interpreter.eval(), 1);

  lexer = new Lexer('E2 - (E3 * (9 + D1))');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    D1: -3,
    E2: 11,
    E3: 10,
  });
  t.is(interpreter.eval(), -49);
});

