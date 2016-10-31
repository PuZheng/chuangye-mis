import {
  Lexer,
  Token
} from './engine/lexer.js';
import {
  Parser,
  Num,
  BinOp,
  UnaryOp,
  Var,
  Ref
} from './engine/parser.js';
import {
  Interpreter,
  types
} from './engine/interpreter.js';
import test from 'ava';
import R from 'ramda';

test('lexer', function (t) {
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

  lexer = new Lexer('TAB1:EE3');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 1);
  t.is(tokens[0].type, Token.VARIABLE);
  t.deepEqual(tokens[0].value, {
    sheet: 'TAB1',
    name: 'EE3'
  });

  lexer = new Lexer('E3 + (E2 * (TAB1:A1 + 2))');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 11);
  t.deepEqual(tokens.map(R.prop('type')), [
    Token.VARIABLE, Token.PLUS, Token.LPAREN, Token.VARIABLE, Token.MUL,
    Token.LPAREN, Token.VARIABLE, Token.PLUS, Token.NUMBER, Token.RPAREN,
    Token.RPAREN
  ]);
  lexer = new Lexer('SHEET2:${ref1}');
  tokens = [...lexer.tokens];
  t.is(tokens.length, 1);
  t.is(tokens[0].type, Token.REF);
  t.deepEqual(tokens[0].value, {
    sheet: 'SHEET2',
    name: 'REF1'
  });

  lexer = new Lexer('E1 + (${ref1} + ${ref2})');
  tokens = [...lexer.tokens];
  console.log(tokens);
  t.is(tokens.length, 7);
  t.deepEqual(tokens.map(R.prop('type')), [
    Token.VARIABLE, Token.PLUS, Token.LPAREN, Token.REF, Token.PLUS, Token.REF, Token.RPAREN
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

  lexer = new Lexer('1 * (2 + SHEET1:E3)');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof BinOp);
  t.true(expr.left instanceof Num);
  t.is(expr.left.value, 1);
  t.true(expr.right instanceof BinOp);
  t.true(expr.right.left instanceof Num);
  t.is(expr.right.left.value, 2);
  t.true(expr.right.right instanceof Var);
  t.is(expr.right.right.sheet, 'SHEET1');
  t.is(expr.right.right.name, 'E3');

  lexer = new Lexer('${REF1}');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof Ref);
  t.falsy(expr.sheet);
  t.is(expr.name, 'REF1');

  lexer = new Lexer('SHEET1:${REF1}');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof Ref);
  t.is(expr.sheet, 'SHEET1');

  lexer = new Lexer('SHEET1:${REF1} * (2 + ${REF2} + ${REF3})');
  parser = new Parser(lexer);
  expr = parser.expr;
  t.true(expr instanceof BinOp);
  t.true(expr.left instanceof Ref);
  t.is(expr.left.sheet, 'SHEET1');
  t.is(expr.left.name, 'REF1');
  t.true(expr.right instanceof BinOp);
  t.true(expr.right.left instanceof BinOp);
  t.true(expr.right.left.left instanceof Num);
  t.true(expr.right.left.right instanceof Ref);
  t.true(expr.right.right instanceof Ref);
});

test('interpreter', function (t) {
  let lexer = new Lexer('3');
  let parser = new Parser(lexer);
  let interpreter = new Interpreter(parser.expr);
  t.is(interpreter.eval(), '3');

  lexer = new Lexer('');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr);
  t.is(interpreter.eval(), '');

  lexer = new Lexer('E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E3: '10',
    }
  });
  t.is(interpreter.eval(), '10');

  lexer = new Lexer('-E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E3: '10',
    }
  });
  t.is(interpreter.eval(), '-10');

  lexer = new Lexer('E2 - E3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E2: '11',
      E3: '10',
    }
  });
  t.is(interpreter.eval(), '1');

  lexer = new Lexer('E2 - (E3 * (9 + D1))');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      D1: '-3',
      E2: '11',
      E3: '10',
    }
  });
  t.is(interpreter.eval(), '-49');

  lexer = new Lexer('E2');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr);
  t.true(isNaN(interpreter.eval(types.NUMBER)));

  lexer = new Lexer('E2 + (E3 * 2)');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E2: '1',
    }
  });
  t.is(interpreter.eval(), '');

  lexer = new Lexer('E2 + (E3 * 2)');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E2: '1asd',
    }
  });
  t.throws(interpreter.eval, Error);

  lexer = new Lexer('SHEET1:A1 + A2 * 3');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      A2: '9'
    },
    'SHEET1': {
      A1: '2'
    }
  });
  t.is(interpreter.eval(), '29');

  lexer = new Lexer('${REF1}');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {}, {
    '': {
      REF1: '1'
    }
  });
  t.is(interpreter.eval(), '1');

  lexer = new Lexer('${REF1} + (SHEET1:${REF2} * E3)');
  parser = new Parser(lexer);
  interpreter = new Interpreter(parser.expr, {
    '': {
      E3: '10'
    }
  }, {
    '': {
      REF1: '2',
    },
    'SHEET1': {
      REF2: '3'
    }
  });
  t.is(interpreter.eval(), '32');
});
