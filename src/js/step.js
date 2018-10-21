/**
 * 记录步骤
 */
export default function Step() {
  this.__stepStack = [];
  this.__undoStack = [];
}

Step.prototype = {
  constructor: Step,
  exec: exec,
  undo: undo,
  redo: redo,
  traverse: traverse,
  reset: reset
};

// 添加步骤并执行
function exec(step, fn) {
  this.__stepStack.push(step);
  this.__undoStack.length = 0;
  fn && fn(step);
}

// 撤销
function undo(fn) {
  var step = this.__stepStack.pop();
  if (step) {
    this.__undoStack.push(step);
    fn && fn(step);
    return true;
  }
  return false;
}

// 重做
function redo(fn) {
  var step = this.__undoStack.pop();
  if (step) {
    this.__stepStack.push(step);
    fn && fn(step);
    return true;
  }
  return false;
}

// 从头遍历执行步骤
function traverse(fn) {
  var self = this;
  self.__stepStack.forEach(function (step) {
    fn && fn(step);
  });
}

// 重置
function reset(callback) {
  this.__stepStack.length = 0;
  this.__undoStack.length = 0;
  callback && callback();
}
