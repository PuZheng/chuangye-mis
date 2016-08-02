export class Interpreter {
  constructor(tree, env) {
    this.tree = tree;
    this.env = env;
  }
  visitNum(node) {
    return node.value;
  }
  visitVar(node) {
    return this.env[node.name];
  }
  visitUnaryOp(node) {
    return {
      '+': (a) => a,
      '-': (a) => -a,
    }[node.op](this.iter(node.child));
  }
  visitBinOp(node) {
    return {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => a / b,
    }[node.op](this.iter(node.left), this.iter(node.right));
  }
  iter(node) {
    return this['visit' + node.constructor.name](node);
  }
  eval() {
    if (this.tree === undefined) {
      return undefined;
    } 
    return this.iter(this.tree);
  }
};
