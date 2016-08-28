import { Var } from './parser.js';

const NUMBER_REGEX = /^[+-]?\d+(\.\d+)?$/;

export const types = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
};

export class Interpreter {
  constructor(tree, env={}) {
    this.tree = tree;
    this.env = env;
  }
  visitNum(node, type) {
    return this.coerce(node.value, type);
  }
  /**
   * coerce a value to a given type, if type is NUMBER:
   *  undefined => NaN
   *  '' => NaN
   *  NaN => NaN
   *  /^[+-]?\d+(\.\d+)?$/ => Number
   *  else => throws
   * if type is STRING:
   *  undefined => ''
   *  NaN => ''
   *  else => String
   * @param {val} - the value to be coerced
   * @param {types.NUMBER|types.STRING} - the type to coerce
   * */
  coerce(val, type) {
    switch (type) {
      case types.NUMBER: {
        // if val is undefined or empty, we just pass it silently
        if (val === undefined || val === '' || isNaN(val)) {
          val = NaN;
        } else {
          if (!NUMBER_REGEX.test(val)) {
            throw new Error(`"${val}" can't be converted to Number`); 
          }
          val = Number(val);
        }
        break;
      }
      case types.STRING: {
        if (val === undefined || isNaN(val)) {
          val = '';
        } else {
          val = String(val);
        }
      }
      default:
        break;
    }
    return val;
  }
  visitVar(node, type) {
    return this.coerce(this.env[node.name], type);
  }
  visitUnaryOp(node, type) {
    let child = this.iter(node.child, 'NUMBER');
    if (isNaN(child)) {
      return NaN;
    }
    return this.coerce({
      '+': (a) => a,
      '-': (a) => -a,
    }[node.op](child), type);
  }
  visitBinOp(node, type) {
    let left = this.iter(node.left, 'NUMBER');
    let right = this.iter(node.right, 'NUMBER');
    if (isNaN(left) || isNaN(right)) {
      return this.coerce(NaN, type);
    }
    return this.coerce({
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
    }[node.op](left, right), type);
  }
  iter(node, type) {
    return this['visit' + node.constructor.name](node, type);
  }
  eval(type='STRING') {
    if (this.tree === undefined) {
      return this.coerce(undefined, type);
    } 
    return this.iter(this.tree, type);
  }
};
