/**
 * 资源集
 */
import EventListener from './eventListener';

// 管理单个资源
var Media = (function () {
  function Media(type, src) {
    this.__data = null;
    this.__type = type;
    this.__src = src;
    this.__events = new EventListener();
    this.init();
  }

  Media.prototype = {
    constructor: Media,
    init: init,
    isComplete: isComplete,
    onready: onready,
    onerror: onerror,
    use: use
  };

  function init() {
    // 初始化时判断类型使用不同方法创建对象
    var fn = init.fnMap[this.__type];
    fn && fn.call(this, this.__src);
  }
  init.fnMap = {
    'image': initImage
  };

  // 初始化图片
  function initImage() {
    var self = this;
    var image = new Image();

    // 注册加载就绪和失败的事件
    image.addEventListener('load', function () {
      self.__events.done('ready', image);
    });
    image.addEventListener('error', function (err) {
      self.__events.done('error', err);
    });

    image.src = this.__src;
    self.__data = image;
  }

  // 返回是否加载完成(Image)
  function isComplete() {
    return this.__data.complete;
  }

  // 绑定加载就绪事件
  function onready(fn) {
    this.__events.add('ready', fn);
  }

  // 绑定加载失败事件
  function onerror(fn) {
    this.__events.add('error', fn);
  }

  // 使用资源
  function use(fn) {
    if (this.isComplete()) {
      fn(this.__data);
    } else {
      this.onready(fn);
    }
  }

  return Media;
})();

// 资源集
export default function MediaSet(dataList) {
  this.__dataMap = {};
  this.__events = new EventListener();
  this.__completeCount = 0;
  this.__length = 0;
  dataList && this.load(dataList);
}

MediaSet.prototype = {
  constructor: MediaSet,
  load: load,
  onprocess: onprocess,
  onerror: onerror,
  use: use
};

// 加载文件列表
// dataList为数组，元素格式为
// { type: '初始化时的资源类型', name: '资源命名唯一值', src: 'z资源路径' }
function load(dataList) {
  var self = this;
  var dataMap = self.__dataMap;
  dataList.forEach(function (data) {
    // 构造资源
    var media = new Media(data.type, data.src);
    // 挂载进度事件
    media.onready(function () {
      self.__completeCount++;
      self.__events.run('process', self.__completeCount, self.__length);
    });
    // 挂载加载失败事件
    media.onerror(function (err) {
      self.__events.clear('process');
      self.__events.done('error', err);
    });
    dataMap[data.name] = media;
    self.__length++;
  });
}

// 绑定进度事件
function onprocess(fn) {
  this.__events.add('process', fn);
}

// 绑定加载失败事件
function onerror(fn) {
  this.__events.add('error', fn);
}

// 使用资源
function use(name, fn) {
  var media = this.__dataMap[name];
  media && media.use(fn);
}
