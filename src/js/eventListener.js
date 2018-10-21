/**
 * 事件监听器
 */
export default function EventListener() {
  this.__fns = {
    default: []
  };
}

EventListener.prototype = {
  constructor: EventListener,

  add: function (type, fn) {
    if (typeof type === 'function') {
      fn = type;
      type = 'default';
    }
    type = type || 'default';
    var fns = this.__fns[type] || (this.__fns[type] = []);
    var index = fns.indexOf(fn);
    index < 0 && fns.push(fn);
  },

  remove: function (type, fn) {
    if (typeof type === 'function') {
      fn = type;
      type = 'default';
    }
    type = type || 'default';
    var fns = this.__fns[type];
    if (!fns) { return; }
    var index = fns.indexOf(fn);
    index > -1 && fns.splice(index, 1);
  },

  // 清除队列
  clear: function (type) {
    type = type || 'default';
    var fns = this.__fns[type];
    if (!fns) { return; }
    fns.length = 0;
  },

  // 可重复
  run: function (type) {
    type = type || 'default';
    var fns = this.__fns[type];
    if (!fns) { return; }
    var args = [].slice.call(arguments, 1);
    fns.forEach(function (fn) {
      fn.apply(global, args);
    });
  },

  // 不可重复
  done: function (type) {
    type = type || 'default';
    var fns = this.__fns[type];
    if (!fns) { return; }
    var fn = null;
    var args = [].slice.call(arguments, 1);
    while ((fn = fns.shift())) {
      fn.apply(global, args);
    }
  }
};
