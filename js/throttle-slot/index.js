import $$ from 'slot';

var ThrottleSlot = function () {
  $$.Slot.apply(this);
  let that = this;
  let propagate = function () {
    if (that.dirty) {
      that.onChangeCbs.forEach(function (cb) {
        cb.call(that, that.value);
      });
      for (var level of that.offspringsByLevels) {
        for (var slot of level) {
          opt.debug && console.info(`slot: slot ${slot.tag} will be refreshed`);
          slot.refresh(null, true);
        }
      }
      that.dirty = false;
    }
    requestAnimationFrame(propagate);
  };
  requestAnimationFrame(propagate);
};

ThrottleSlot.prototype = Object.create($$.Slot.prototype);

ThrottleSlot.prototype.val = function (newValue) {
  if (newValue === undefined) {
    if (this.value === void 0 && this.valueFunc) {
      this.value = this.valueFunc.apply(
        this, [this.parents.map(it => it.val())]
      );
    }
    return this.value;
  } else {
    opt.debug && console.info(
      `slot: slot ${this.tag} updated -- `, this.value, '->', newValue
    );
    var oldValue = this.value;
    this.value = newValue;
    this.dirty = true;
    return oldValue;
  }
};

var opt = {};

var init = function (opt_ = {}) {
  opt.debug = !!opt_.debug;
};

export default (function (p) {
  p.Slot = ThrottleSlot;
  p.slot = function (...args) {
    return new ThrottleSlot(args);
  };
  p.init = init;
  return p;
})((initial, tag, changed) => new ThrottleSlot(initial, tag, changed));
