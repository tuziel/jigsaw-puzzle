/**
 * canvas库
 */
export default function Canvas(id) {
  this.elm = document.getElementById(id) ||
    document.createElement('canvas');

  this.elm.onselectstart = function () {
    return false;
  };

  this.context = this.elm.getContext('2d');
  this.width = 0;
  this.height = 0;
}

Canvas.prototype = {
  constructor: Canvas,
  // 绑定事件
  on: function (ev, fn) {
    this.elm.addEventListener(ev, fn);
  },
  // 解除绑定
  off: function (ev, fn) {
    this.elm.removeEventListener(ev, fn);
  },
  // 清空画布
  reset: function () {
    this.setOrigin()
      .clearRect(0, 0, this.width, this.height);
    return this;
  },
  // 设置画布宽高
  setSize: function (width, height) {
    var elm = this.elm;
    this.width = elm.width = width;
    this.height = elm.height = height;
    return this;
  },
  // 擦除
  clearRect: function (x, y, width, height) {
    this.context.clearRect(x, y, width, height);
    return this;
  },
  // 填充色
  fillStyle: function (color) {
    this.context.fillStyle = color;
    return this;
  },
  // 填充矩形
  fillRect: function (x, y, width, height) {
    this.context.fillRect(x, y, width, height);
    return this;
  },
  // 描边
  stroke: function (color) {
    var ctx = this.context;
    color && (ctx.strokeStyle = color);
    ctx.stroke();
    return this;
  },
  // 描边颜色
  strokeStyle: function (color) {
    this.context.strokeStyle = color;
    return this;
  },
  // 矩形描边
  strokeRect: function (x, y, width, height) {
    this.context.strokeRect(x, y, width, height);
    return this;
  },
  // 填充颜色
  fill: function (color) {
    var ctx = this.context;
    color && (ctx.fillStyle = color);
    ctx.fill();
    return this;
  },
  lineWidth: function (width) {
    this.context.lineWidth = width;
    return this;
  },
  line: function (x0, y0, x1, y1) {
    var ctx = this.context,
      i = 2;
    ctx.beginPath();
    ctx.moveTo(arguments[0], arguments[1]);
    while (i < arguments.length) {
      ctx.lineTo(arguments[i++], arguments[i++]);
    }
    ctx.stroke();
    return this;
  },
  arc: function (x, y, radius, startAngle, endAngle, anticlockwise) {
    var ctx = this.context;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.stroke();
    return this;
  },
  circle: function (x, y, radius) {
    var ctx = this.context;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.stroke();
    return this;
  },
  font: function (font) {
    this.context.font = font;
    return this;
  },
  textBaseline: function (align) {
    this.context.textBaseline = align;
    return this;
  },
  strokeText: function (text, x, y) {
    this.context.strokeText(text, x, y);
    return this;
  },
  fillText: function (text, x, y) {
    this.context.fillText(text, x, y);
    return this;
  },
  shadow: function (offsetX, offsetY, blur, color) {
    var ctx = this.context;
    ctx.shadowOffsetX = offsetX || 0;
    ctx.shadowOffsetY = offsetY || 0;
    ctx.shadowColor = color || 'rgb(0,0,0)';
    ctx.shadowBlur = blur || 0;
    return this;
  },
  // 设置坐标系
  setTransform: function (m11, m12, m21, m22, dx, dy) {
    this.context.setTransform(m11, m12, m21, m22, dx, dy);
    return this;
  },
  // 坐标系归位
  setOrigin: function () {
    this.setTransform(1, 0, 0, 1, 0, 0);
    return this;
  },
  // 移动坐标系
  transform: function (m11, m12, m21, m22, dx, dy) {
    this.context.transform(m11, m12, m21, m22, dx, dy);
    return this;
  },
  // 平移坐标系
  translate: function (x, y) {
    this.context.translate(x, y);
    return this;
  },
  // 旋转坐标系
  rotate: function (angle) {
    this.context.rotate(angle);
    return this;
  },
  // 缩放坐标系
  scale: function (x, y) {
    this.context.scale(x, y);
    return this;
  },
  // 绘制图片
  drawImage: function (image, dx, dy, dWidth, dHeight) {
    var ctx = this.context;
    ctx.drawImage.apply(ctx, arguments);
    return this;
  },
  // 获取canvas图像数据
  getImageData: function (sx, sy, sw, sh) {
    return this.context.getImageData(sx, sy, sw, sh);
  },
  // 绘制图像
  putImageData: function (imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
    var ctx = this.context;
    ctx.putImageData.apply(ctx, arguments);
    return this;
  },
  // canvas转blob
  toBlob: function (callback, type, encoderOptions) {
    this.elm.toBlob(callback, type, encoderOptions);
  },
  // 转base64
  toDataURL: function (type, encoderOptions) {
    return this.elm.toDataURL(type, encoderOptions);
  },
  // 截图
  clipToBlob: function (sx, sy, sw, sh, callback, type, encoderOptions) {
    var canvas = new Canvas();
    var imageData = this.getImageData(sx, sy, sw, sh);
    canvas.setSize(sw, sh)
      .putImageData(imageData, 0, 0)
      .toBlob(callback, type, encoderOptions);
  }
};
