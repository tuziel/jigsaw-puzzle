/* global $ */
import EventListener from './eventListener';
import Step from './step';
import MediaSet from './mediaSet';
import Canvas from './canvas';
import { navData, mediaList } from './fileList';

function getId(id) {
  return document.getElementById(id);
}

/**
 * 全局变量
 */
var medias = new MediaSet();
var enents = new EventListener();
var step = new Step();
var painter = new Canvas('painter');

// 画布数据
var pics = {
  // 初始大小
  originWidth: 750,
  originHeight: 1206,
  // 显示位置大小
  top: 0,
  left: 0,
  width: 750,
  height: 1206,
  // 缩放比例
  scale: 1,
  // 贴图数据
  // { image, width, height, x, y, scale, mirror, rotate },
  // { 图片, 初始宽, 高, 中心坐标x, y, 缩放比例, 是否镜像翻转, 旋转角度 },
  data: [],
  // 获取最后一个贴图
  getLast: function () {
    return pics.data[pics.data.length - 1];
  },
  // 记录操作(下标, 操作类型. pic对象)
  record: (function () {
    // 缓存操作对象与上次操作记录
    var pic_, delta_;

    // 判断操作类型并记录操作
    function record(type, pic, delta) {
      var fn = ({
        'update': recordUpdatePic,
        'create': recordCreatePic,
        'delete': recordDeletePic,
        'background': recordSetBackground,
        'swap': recordSwap,
        'break': recordBreak
      })[type];
      fn && fn(pic, delta);
    }

    // 新增贴图
    function recordCreatePic(pic) {
      // 缓存全部数据，重做时可恢复
      var delta = {
        image: pic.image,
        width: pic.width,
        height: pic.height,
        x: pics.originWidth / 2,
        y: pics.originHeight / 2,
        scale: 1,
        mirror: 0,
        rotate: 0
      };
      createRecord('create', delta);
    }

    // 删除贴图
    function recordDeletePic(pic) {
      // 缓存全部数据，撤销时时可恢复
      var delta = {
        image: pic.image,
        width: pic.width,
        height: pic.height,
        x: pic.x,
        y: pic.y,
        scale: pic.scale,
        mirror: pic.mirror,
        rotate: pic.rotate
      };
      createRecord('delete', delta);
    }

    // 修改贴图
    function recordUpdatePic(pic, delta) {
      delta = fillDelta(delta);

      // 修改了相同对象则合并修改，否则新增
      if (pic === pic_) {
        updateRecode(delta);
      } else {
        createRecord('update', delta);
        // 缓存对象判断下次修改是否同一对象
        pic_ = pic;
        // 缓存差值在更新时合并
        delta_ = delta;
      }
    }

    // 切换背景图
    function recordSetBackground(pic, oldPic) {
      createRecord('background', { pic: pic, oldPic: oldPic });
    }

    // 更新记录
    function updateRecode(delta) {
      delta_.x += delta.x;
      delta_.y += delta.y;
      delta_.scale *= delta.scale;
      delta_.mirror ^= delta.mirror;
      delta_.rotate += delta.rotate;
    }

    // 交换顺序
    function recordSwap(index, oldIndex) {
      if (index === oldIndex) { return; }

      createRecord('swap', { index: index, oldIndex: oldIndex });
    }

    // 新增记录
    function createRecord(type, delta) {
      // 插入到步骤表中
      step.exec({ type: type, delta: delta });
    }

    // 下次操作相同对象不合并到上一条记录中
    function recordBreak() {
      pic_ = delta_ = null;
    }

    // 补充差值参数
    function fillDelta(delta) {
      delta = delta || {};
      return {
        x: delta.x || 0,
        y: delta.y || 0,
        scale: delta.scale || 1,
        mirror: delta.mirror || 0,
        rotate: delta.rotate || 0
      };
    }

    return record;
  })()
};

// 点击位置记录
var touchPos = {
  x: null,
  y: null,
  reset: function () {
    this.set(null, null);
  },
  set: function (x, y) {
    this.x = x;
    this.y = y;
  }
};

/**
 * 主逻辑
 */

// 全局初始化
export default function init() {
  // 初始化资源
  initMedias();

  // 初始化页面
  initNav();
  initSidebar();
  initHelp();
  initPainter();

  // 添加异常操作事件
  enents.add('error', onerror);
}

// 处理异常操作
function onerror(type, err) {
  if (type === 'loading') {
    $('#progressText').text('加载资源时发生错误，请稍候重试');
  }
}

// 初始化资源集
function initMedias() {
  navData.forEach(function (item) {
    [].push.apply(mediaList, item.data);
  });

  // 初始化实例
  medias.load(mediaList);

  // 加载中
  medias.onprocess(function (count, total) {
    enents.run('loading', count, total);
  });

  // 加载错误
  medias.onerror(function (err) {
    enents.run('error', 'loading', err);
  });

  enents.add('loading', onloading);
}

// 主页加载中
function onloading(count, total) {
  var length = count / total * 100 >> 0;

  // TODO: 显示进度条
  $('#progressLength').css('right', 100 - length + '%');
  $('#progressText').text('加载资源中: ' + length + '%');

  // 加载完成
  if (count >= total) {
    showCover();
  }
}

// 显示封面
function showCover() {
  $('#enter').on('click', showMainPage);
  $('#pageLoad').delay(600).fadeOut();
  $('#pageCover').delay(600).fadeIn();
}

// 显示内容页
function showMainPage() {
  $('#enter').off('click', showMainPage);
  $('#pageCover').delay(600).fadeOut();
  $('#pageMain').delay(600).fadeIn();

  var isBanTips = /notips=true/.test(document.cookie);
  isBanTips || $('#pageHelp').delay(600).fadeIn(help1);
}

// 初始化图片菜单
function initNav() {
  var $nav = $('#nav');
  var $selector = $('#selector');
  var tempNavItem = '<div class="nav-item"></div>';
  var tempSelectorBox = '<div style="display:none;"></div>';
  var tempSelectorItem = '<div class="selector-item"></div>';

  navData.forEach(function (item) {
    $nav.append($(tempNavItem).text(item.text));
    $nav.children().eq(0).addClass('act');

    var $selectorBox = $(tempSelectorBox);
    item.data.forEach(function (pic) {
      // 先占位
      var $selectorItem = $(tempSelectorItem);
      $selectorBox.append($selectorItem);

      medias.use(pic.name, function (img) {
        $selectorItem.data('type', item.name);
        $selectorItem.data('name', pic.name);
        $selectorItem.append(img);
      });
    });
    $selector.append($selectorBox);
    $selector.children().eq(0).show();
  });

  $nav.on('click', '.nav-item', navChange);
  $selector.on('click', '.selector-item', selectPic);
  $('#navTrigger').on('click', hideNav);
}

// 展开菜单
function showNav() {
  $('.bottombar').removeClass('hide');
  $('#navTrigger').off('click', showNav);
  $('#navTrigger').on('click', hideNav);
  resizePainter();
}

// 折叠菜单
function hideNav() {
  $('.bottombar').addClass('hide');
  $('#navTrigger').off('click', hideNav);
  $('#navTrigger').on('click', showNav);
  resizePainter();
}

// 切换选项卡
function navChange() {
  var $navs = $('#nav').children();
  var $selectors = $('#selector').children();
  var $this = $(this);
  var index = [].indexOf.call($navs, this);

  $navs.removeClass('act');
  $this.addClass('act');
  $selectors.hide();
  $selectors.eq(index).show();
}

// 放置图片
function selectPic() {
  var $this = $(this);
  var type = $this.data('type');
  var name = $this.data('name');
  if (type !== 'background') {
    medias.use(name, usePic);
  } else {
    medias.use(name, useBackground);
  }
}

// 生成背景图数据并设置背景
function useBackground(image) {
  var oldPic = useBackground.oldPic;
  var oldImage = useBackground.oldImage;

  if (oldImage === image) {
    return;
  }
  var image_ = image.cloneNode();

  // 生成pic数据
  image_.width = pics.originWidth;
  image_.height = pics.originHeight;

  var pic = createPicData(image_);

  // 替换新旧背景
  setBackground(pic, oldPic);

  // 记录步骤
  pics.record('background', pic, oldPic);

  useBackground.oldImage = image;
  useBackground.oldPic = pic;
}

// 放置新贴图
function usePic(image) {
  var image_ = image.cloneNode();

  var size = 250;
  var ow = image.naturalWidth;
  var oh = image.naturalHeight;

  if (ow < oh) {
    image_.height = size;
    image_.width = size * ow / oh;
  } else {
    image_.width = size;
    image_.height = size * oh / ow;
  }

  var pic = createPicData(image_);

  image_.addEventListener('touchstart', touchImage);
  image_.addEventListener('touchstart', stopPropagation);
  createPic(pic);

  // 记录步骤
  pics.record('create', pic);
}

// 创建pic数据
function createPicData(image) {
  return {
    image: image,
    width: image.width,
    height: image.height,
    x: pics.originWidth / 2,
    y: pics.originHeight / 2,
    scale: 1,
    mirror: 0,
    rotate: 0
  };
}

// 设置背景
function setBackground(pic, oldPic) {
  var picsData = pics.data;

  // 删除旧图片
  if (oldPic) {
    picsData.shift();
    $(oldPic.image).remove();
  }

  // 插入新图片
  if (pic) {
    picsData.unshift(pic);
    resizePic(pic);
    $('#pictures').prepend(pic.image);
  }

  // 缓存操作
  useBackground.oldImage = pic.image;
  useBackground.oldPic = pic;

  hideControl();
}

// 添加图片
function createPic(pic) {
  pics.data.push(pic);
  resizePic(pic);
  $('#pictures').append(pic.image);
  touchImage.call(pic.image);
  showControl();
}

// 删除图片
function deletePic(pic) {
  pics.data.pop();
  $(pic.image).remove();
  showControl();
}

// 修改图片
function updatePic(pic, delta) {
  pic.x += delta.x || 0;
  pic.y += delta.y || 0;
  pic.scale *= delta.scale || 1;
  pic.mirror ^= delta.mirror || 0;
  pic.rotate += delta.rotate || 0;
  resizePic(pic);
}

// 调整贴图位置大小
function resizePic(pic) {
  var image = pic.image;
  var scale = pic.scale;
  var mirror = pic.mirror ? -1 : 1;
  var rotate = pic.rotate;

  $(image).css({
    'top': pic.y,
    'left': pic.x,
    'transform': [
      'translate(-50%, -50%) ',
      'scale(', scale * mirror, ', ', scale, ') ',
      'rotate(', rotate * mirror, 'deg)'
    ].join('')
  });
  reziseControl(pic);
}

// 点击图片
function touchImage() {
  var self = this;
  var picsData = pics.data;
  var index = picsData.length;
  var end = picsData.length - 1;
  var pic = null;

  // 查找index
  for (; index--;) {
    pic = picsData[index];
    if (pic.image === self) {
      break;
    }
  }

  // 置顶并显示控件
  settopPic(index);

  // 记录图层交换
  pics.record('swap', end, index);
}

// 置顶图片
function settopPic(index) {
  var picsData = pics.data;

  // 当前图片放到末尾
  var pic = picsData.splice(index, 1)[0];
  picsData.push(pic);
  $('#pictures').append(pic.image);

  showControl();
}

// 交换图片位置
function swapPic(index, oldIndex) {
  var picsData = pics.data;

  // 从旧位置中拿出
  var pic = picsData.splice(oldIndex, 1)[0];
  $(pic.image).remove();

  // 插入新位置中，
  if (index < picsData.length) {
    picsData.splice(index, 0, pic);
    $('#pictures').children().eq(index).before(pic.image);
  } else {
    picsData.push(pic);
    $('#pictures').append(pic.image);
  }

  showControl();
}

// 显示控件
function showControl() {
  // XXX: 把顶层图片当成当前操作的图片
  var index = pics.data.length - 1;
  // XXX: 所以现在是强行让index 0为背景
  if (!index) { return hideControl(); }
  var pic = pics.data[index];

  $('#pictureControl').show();
  reziseControl(pic);
}

// 调整控件位置大小
function reziseControl(pic) {
  $('#pictureControl')
    .css({
      'top': pic.y,
      'left': pic.x,
      'width': pic.width * pic.scale,
      'height': pic.height * pic.scale,
      'transform': [
        'translate(-50%, -50%) ',
        'rotate(', pic.rotate, 'deg)'
      ].join('')
    });
}

// 初始化侧栏控件
function initSidebar() {
  $('#undo').on('click', undo);
  $('#redo').on('click', redo);
  $('#save').on('click', showShortcut);
  $('#sidebarTrigger').on('click', hideSidebar);
}

// 撤销
function undo() {
  step.undo(stepUndo);
}

// 重做
function redo() {
  step.redo(stepRedo);
}

// 保存成图片
function showShortcut() {
  // 清空画布
  painter.reset();
  $('#shortcutImage').empty();

  // 生成canvas图像
  pics.data.forEach(drawImage);
  use2dcode(drawImage);
  useLogo(drawImage);
  painter
    .font('16px Helvetica')
    .textBaseline('top')
    .shadow(0, 0, 2, '#fff')
    .fillStyle('#fff')
    .fillText('马上扫码 拼张贺卡', 20, 1171)
    .fillStyle('#333')
    .fillText('马上扫码 拼张贺卡', 21, 1172);

  // toDataURL
  var image = new Image();
  image.src = painter.toDataURL('image/png');
  $('#shortcutImage').append(image);

  // // 生成blob数据
  // painter.toBlob(setBlob);

  $('#shortcut').fadeIn();

  shortcutTips();
}

function hideShortcut() {
  $('#shortcut').fadeOut();
}

// 绘制图片到canvas
function drawImage(pic) {
  painter
    .translate(pic.x, pic.y)
    .rotate(pic.rotate * Math.PI / 180)
    .scale(pic.scale * (pic.mirror ? -1 : 1), pic.scale)
    .drawImage(pic.image, -pic.width / 2, - pic.height / 2, pic.width, pic.height)
    .setOrigin();

}

// 生成二维码图片数据
function use2dcode(fn) {
  medias.use('2dcode', function (image) {
    image.width = image.height = 400;
    var pic = createPicData(image);
    pic.x = 86;
    pic.y = 1126;
    pic.scale = 0.2;
    fn(pic);
  });
}

// 生成LOGO图片数据
function useLogo(fn) {
  medias.use('unicomLogo', function (image) {
    image.width = 491;
    image.height = 271;
    var pic = createPicData(image);
    pic.x = 668;
    pic.y = 54;
    pic.scale = 0.25;
    fn(pic);
  });
}

// 输出blob到元素
function setBlob(blob) {
  var reader = new FileReader();
  reader.addEventListener('load', function () {
    var image = new Image();
    image.addEventListener('load', function () {
      $('#shortcutImage').append(this);
    });

    image.src = reader.result;
  }, false);
  reader.readAsDataURL(blob);
}

// 提示5秒小时
function shortcutTips() {
  $('#shortcutTips').clearQueue()
    .fadeIn(600).delay(5000).fadeOut(600);
}

// 撤销步骤
function stepUndo(data) {
  var type = data.type;
  var delta = data.delta;

  pics.record('break');

  // 处理记录
  if (type === 'update') {
    updatePic(pics.getLast(), {
      x: -delta.x,
      y: -delta.y,
      scale: 1 / delta.scale,
      mirror: delta.mirror,
      rotate: -delta.rotate
    });
  } else if (type === 'swap') {
    swapPic(delta.oldIndex, delta.index);
  } else if (type === 'create') {
    deletePic(delta);
  } else if (type === 'delete') {
    createPic(delta);
  } else if (type === 'background') {
    setBackground(delta.oldPic, delta.pic);
  }
}

// 读取步骤
function stepRedo(data) {
  var type = data.type;
  var delta = data.delta;

  pics.record('break');

  // 处理记录
  if (type === 'update') {
    updatePic(pics.getLast(), delta);
  } else if (type === 'swap') {
    swapPic(delta.index, delta.oldIndex);
  } else if (type === 'create') {
    createPic(delta);
  } else if (type === 'delete') {
    deletePic(delta);
  } else if (type === 'background') {
    setBackground(delta.pic, delta.oldPic);
  }
}

// 展开侧栏
function showSidebar() {
  $('.sidebar').removeClass('hide');
  $('#sidebarTrigger').off('click', showSidebar);
  $('#sidebarTrigger').on('click', hideSidebar);
}

// 折叠侧栏
function hideSidebar() {
  $('.sidebar').addClass('hide');
  $('#sidebarTrigger').off('click', hideSidebar);
  $('#sidebarTrigger').on('click', showSidebar);
}

// 初始化帮助
function initHelp() {
  $('#helpSkip').on('click', skipHelp);
  $('#helpSkip').on('click', banTips);
  medias.use('help1', function (image) {
    image.id = 'helpStep1';
    $('#pageHelp').append(image);
  });
  medias.use('help2', function (image) {
    image.id = 'helpStep2';
    $('#pageHelp').append(image);
  });
  medias.use('help3', function (image) {
    image.id = 'helpStep3';
    $('#pageHelp').append(image);
  });

}

// 不再显示帮助
function banTips() {
  var d = new Date();
  d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
  document.cookie = 'notips=true; expires=' + d.toGMTString();
}

// 隐藏不需要的元素
function hideHelpStep() {
  $('#helpStep1').fadeOut();
  $('#helpStep2').fadeOut();
  $('#helpStep3').fadeOut();
}

function help1() {
  hideHelpStep();
  $('#pageHelp').show();
  $('#helpStep1').fadeIn();
  $('#helpStep1').on('click', help2);

  var $pet = $('.nav-item').eq(1)[0];
  navChange.call($pet);
}
function help2() {
  hideHelpStep();
  $('#pageHelp').show();
  $('#helpStep2').fadeIn();
  $('#helpStep1').off('click', help2);
  $('#helpStep2').on('click', help3);

  var $pet0 = $('#selector').children().eq(1).find('.selector-item')[0];
  selectPic.call($pet0);
}
function help3() {
  hideHelpStep();
  $('#pageHelp').show();
  $('#helpStep3').fadeIn();
  $('#helpStep2').off('click', help3);
  $('#helpStep3').on('click', skipHelp);
}


// 跳过帮助
function skipHelp() {
  $('#helpSkip').off('click', skipHelp);
  $('#helpStep3').off('click', skipHelp);
  $('#pageHelp').fadeOut();
}

// 初始化画布
function initPainter() {
  initPainterEnevt();
  resizePainter();
  initCanvas();

  // 设置初始背景
  medias.use('bg1', function (image) {
    useBackground(image);
    step.reset();
  });
}

// 画布事件
function initPainterEnevt() {
  getId('content').addEventListener('touchstart', preventDefault);
  getId('content').addEventListener('touchstart', hideControl);
  getId('pictureControl').addEventListener('touchstart', preventDefault);
  getId('pictureControl').addEventListener('touchstart', stopPropagation);
  getId('picBox').addEventListener('touchstart', picTranslateStart);
  getId('picBox').addEventListener('touchend', picTranslateEnd);
  getId('picBox').addEventListener('touchcancel', picTranslateEnd);
  getId('picRotate').addEventListener('touchstart', picRotateStart);
  getId('picRotate').addEventListener('touchend', picRotateEnd);
  getId('picRotate').addEventListener('touchcancel', picRotateEnd);
  getId('picDelete').addEventListener('touchstart', picDelete);
  getId('picScale').addEventListener('touchstart', picScaletart);
  getId('picScale').addEventListener('touchend', picScaleEnd);
  getId('picScale').addEventListener('touchcancel', picScaleEnd);
  getId('picMirror').addEventListener('touchstart', picMirror);
  $('#shortcut').on('click', hideShortcut);
  window.addEventListener('resize', resizePainter);
}

// 禁止默认事件，如长按
function preventDefault(ev) {
  ev.preventDefault();
}

// 阻止冒泡
function stopPropagation(ev) {
  ev.stopPropagation();
}

// 隐藏控件
function hideControl() {
  $('#pictureControl').hide();
}

// 获取点击位置相对画布的坐标
function getPos(ev) {
  var touch = ev.touches[0];
  var scale = pics.scale;

  // 点击位置
  var x = (touch.clientX - pics.left) / scale >> 0;
  var y = (touch.clientY - pics.top) / scale >> 0;
  var result = {
    x: x,
    y: y,
    offsetX: x - (touchPos.x || x),
    offsetY: y - (touchPos.y || y)
  };

  return result;
}

// 在画布上设置图片
function adjustPic(pic, delta) {
  // 记录步骤
  pics.record('update', pic, delta);

  // 更新显示
  updatePic(pic, delta);
}

function picTranslateStart(ev) {
  var pos = getPos(ev);
  touchPos.set(pos.x, pos.y);
  getId('picBox').addEventListener('touchmove', picTranslate);
}
function picTranslateEnd() {
  touchPos.reset();
  getId('picBox').removeEventListener('touchmove', picTranslate);
}
function picRotateStart(ev) {
  var pos = getPos(ev);
  touchPos.set(pos.x, pos.y);
  getId('picRotate').addEventListener('touchmove', picRotate);
}
function picRotateEnd() {
  touchPos.reset();
  getId('picRotate').removeEventListener('touchmove', picRotate);
}
function picScaletart(ev) {
  var pos = getPos(ev);
  touchPos.set(pos.x, pos.y);
  getId('picScale').addEventListener('touchmove', picScale);
}
function picScaleEnd() {
  touchPos.reset();
  getId('picScale').removeEventListener('touchmove', picScale);
}

// 平移
function picTranslate(ev) {
  var pic = pics.getLast();
  var pos = getPos(ev);

  // 更新旧值
  touchPos.set(pos.x, pos.y);

  // 更新显示
  adjustPic(pic, {
    x: pos.offsetX,
    y: pos.offsetY
  });
}

// 旋转
function picRotate(ev) {
  var pic = pics.getLast();
  var pos = getPos(ev);

  // 极坐标求夹角
  var x0 = touchPos.x - pic.x;
  var y0 = touchPos.y - pic.y;
  var x1 = pos.x - pic.x;
  var y1 = pos.y - pic.y;
  var theta0 = getTheta(x0, y0);
  var theta1 = getTheta(x1, y1);
  var rotate = (theta1 - theta0) * 180 / Math.PI;

  // 更新旧值
  touchPos.set(pos.x, pos.y);

  // 更新显示
  adjustPic(pic, {
    rotate: rotate
  });
}

// 求极坐标角
function getTheta(x, y) {
  var PI = Math.PI;
  var HALFPI = PI / 2;
  if (x > 0) {
    return Math.atan(y / x);
  } else if (x < 0) {
    return Math.atan(y / x) + PI;
  } else {
    return y > 0 ? HALFPI : HALFPI * 3;
  }
}

// 缩放
function picScale(ev) {
  var pic = pics.getLast();
  var pos = getPos(ev);

  var x0 = touchPos.x - pic.x;
  var y0 = touchPos.y - pic.y;
  var x1 = pos.x - pic.x;
  var y1 = pos.y - pic.y;
  var r0 = Math.sqrt(Math.pow(x0, 2) + Math.pow(y0, 2));
  var r1 = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2));
  var scale = r1 / r0;

  // 更新旧值
  touchPos.set(pos.x, pos.y);

  // 更新显示
  adjustPic(pic, {
    scale: scale
  });
}

// 镜像
function picMirror() {
  var pic = pics.getLast();

  // 更新显示
  adjustPic(pic, {
    mirror: true
  });
}

// 删除
function picDelete() {
  var pic = pics.getLast();

  // 记录步骤
  pics.record('delete', pic);

  deletePic(pic);
}

// 调整画布大小
function resizePainter() {
  var $bottombar = $('.bottombar');
  var $content = $('#content');

  // 画布宽高
  var pw = document.body.clientWidth;
  // 除去底栏高度
  // XXX: 好吧现在是写死的值
  var ph = document.body.clientHeight - ([].indexOf.call($bottombar.get(0).classList, 'hide') < 0 ? 134 : 20);
  // $bottombar.height() - parseInt($bottombar.css('bottom'));

  // 宽高比
  var ow = pics.originWidth;
  var oh = pics.originHeight;
  var originRatio = ow / oh;
  var ratio = pw / ph;

  // 计算缩放后位置大小
  if (originRatio <= ratio) {
    // 画布比较宽
    pics.height = ph;
    pics.width = ow * ph / oh >> 0;
    pics.top = 0;
    pics.left = (pw - pics.width) / 2;
  } else {
    // 画布比较窄
    pics.width = pw;
    pics.height = oh * pw / ow >> 0;
    pics.top = (ph - pics.height) / 2;
    pics.left = 0;
  }
  pics.scale = pics.height / oh;

  $content.css({
    'width': ow,
    'height': oh,
    'top': pics.top,
    'left': pics.left,
    'transform': 'scale(' + pics.scale + ')'
  });
}

function initCanvas() {
  painter.setSize(pics.originWidth, pics.originHeight);
}
