// priceGenerator.js
const app = getApp()
let canvas = null;
let ctx = null;
let tempFilePath = '';
let dpr = 1

const data = {
  itemsPerPage: 20, // 每页商品数(实际使用可改为20)
}

export function onReady() {
  setTimeout(() => {
    initCanvas();
  }, 300); // 添加适当延迟
}

export async function initCanvas() {
  return new Promise(async (resolve, reject) => {
    try {
      dpr = 2; // 确保DPI有效
      // 计算尺寸（确保不小于300x500物理像素）
      const width = Math.max(375 * 0.95 * dpr, 300);
      const height = Math.max((data.itemsPerPage * (150 + 20) + 160) * dpr, 500);
      canvas = wx.createOffscreenCanvas({
        type: '2d',
        width: width,
        height: height
      });

      ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // 强制验证
      if (canvas.width <= 0 || canvas.height <= 0) {
        throw new Error(`无效的Canvas尺寸: ${canvas.width}x${canvas.height}`);
      }

      console.log(`Canvas初始化完成，物理尺寸: ${canvas.width}x${canvas.height} (逻辑尺寸: ${width / dpr}x${height / dpr})`);
      resolve();
    } catch (err) {
      console.error('初始化Canvas失败:', err);
      reject(err);
    }
  });
}

/**
 * 生成报价单并保存到相册
 * @param {Array} goodsList 商品列表
 */
export async function generateQuotation(goodsList) {
  console.log(goodsList)
  //统一获取图片
  const goodsPicArr = []
  goodsList.forEach(item =>{
    goodsPicArr.push(
      app.getHeadImage(item.headPic,false)
    )
  })
  //获取小程序码
  goodsPicArr.push(
    app.getHeadImage('cloud://billiards-0g53628z5ae826bc.6269-billiards-0g53628z5ae826bc-1326882458/qrBuff/智享自助桌球.png',false)
  )
  let goodsTempPicArr = await Promise.all(goodsPicArr)

  try {
    if (!canvas || !ctx) {
      await initCanvas();
    }
    // 1. 绘制报价单
    const contentHeight = await drawQuotation(goodsList,goodsTempPicArr);

    // 2. 获取临时文件路径
    tempFilePath = await getTempFilePath(contentHeight * dpr);

    // 3. 保存到相册
    await saveToAlbum(tempFilePath);

    return { success: true };
  } catch (err) {
    console.error('生成报价单失败:', err);
    return { success: false, error: err.message };
  }
}

// 获取临时文件路径（改为返回Promise）
function getTempFilePath(contentHeight) {
  return new Promise((resolve, reject) => {
    if (!canvas || canvas.width <= 10 || canvas.height <= 10) {
      reject(new Error(`无效的Canvas尺寸: ${canvas?.width || 'null'}x${canvas?.height || 'null'}`));
      return;
    }

    const tryExport = (attempt = 0) => {
      wx.canvasToTempFilePath({
        canvas: canvas,
        x: 0,
        y: 0,
        width: canvas.width,
        height: contentHeight,
        destWidth: canvas.width,
        destHeight: contentHeight,
        fileType: 'png',
        quality: 1,
        success: (res) => {
          console.log('临时文件路径:', res.tempFilePath);
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          if (attempt < 2) {
            console.warn(`第${attempt + 1}次尝试失败，200ms后重试...`);
            setTimeout(() => tryExport(attempt + 1), 200);
          } else {
            reject(new Error(`最终导出失败: ${err.errMsg}`));
          }
        }
      }, this);
    };

    tryExport();
  });
}

/**
 * 绘制报价单（修复版本）
 */
async function drawQuotation(products , goodsTempPicArr) {
  console.log(canvas)
  const canvasWidth = canvas.width
  const leftPadding = 20;       // 左侧边距
  const rightPadding = 20;      // 右侧边距
  const columnGap = 30;         // 两列间距
  const lineHeight = 20;        // 行高
  const imageSize = 100;        // 商品图片尺寸
  const cardPadding = 15;       // 卡片内边距

  // 计算列宽
  const leftColumnWidth = (canvasWidth - leftPadding - rightPadding - columnGap) / dpr / 2;

  let yPos = 40; // 初始Y位置

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvas.height);

  // 绘制标题
  ctx.font = 'bold 20px system-ui';
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.fillText('智享批发商城(部分)报价', canvasWidth / dpr / 2, yPos);

  // 绘制日期
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  ctx.font = '14px system-ui';
  ctx.fillText(dateStr, canvasWidth / dpr / 2, yPos + 30);

  yPos += 70;

  // 绘制表头
  ctx.fillStyle = '#1aad19';
  ctx.fillRect(leftPadding, yPos, canvasWidth / dpr - leftPadding - rightPadding, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText('商品信息', leftPadding + 10, yPos + 25);
  ctx.fillText('价格信息', leftPadding + leftColumnWidth + columnGap + 10, yPos + 25);

  yPos += 50;

  // 绘制商品列表
  for (const [index, product] of products.entries()) {
    // 商品卡片背景
    ctx.fillStyle = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
    ctx.fillRect(leftPadding, yPos, canvasWidth - leftPadding - rightPadding, 150);

    // 绘制商品图片
    await drawProductImage(goodsTempPicArr[index], leftPadding + cardPadding, yPos + cardPadding, imageSize, imageSize);

    // 商品基本信息
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px system-ui';
    wrapText(
      `${product.brand} | ${product.commotydiName}`,
      leftPadding + imageSize + cardPadding * 2,
      yPos + cardPadding + 20,
      leftColumnWidth * dpr - imageSize - cardPadding * 2,
      lineHeight
    );

    // 颜色和价格
    let colorY = yPos + cardPadding + 40;
    ctx.font = '14px system-ui';

    for (const colorKey in product.color) {
      const colorInfo = product.color[colorKey];
      const formattedPrice = formatPrice(colorInfo.merchantPrice);

      // 颜色名称（左列）
      wrapText(
        `▪ ${colorInfo.color}`,
        leftPadding + imageSize + cardPadding * 2,
        colorY,
        leftColumnWidth * dpr - imageSize - cardPadding * 2,
        lineHeight
      );

      // 经销商价格（右列）
      ctx.fillText(
        `¥${formattedPrice}`,
        canvasWidth / dpr - rightPadding - 80,
        colorY
      );

      colorY += lineHeight + 5;
    }
    // 单位信息
    let unitY = yPos + cardPadding + 40 + Object.keys(product.color).length * 24 ;
    wrapText(
      `单位: ${product.unit}`,
      leftPadding + imageSize + cardPadding * 2,
      unitY,
      leftColumnWidth * dpr - imageSize - cardPadding * 2,
      lineHeight
    );
    yPos += 150; // 商品卡片高度
  }
  //绘制小程序二维码
  // 绘制商品图片
  await drawProductImage(goodsTempPicArr.at(-1), canvas.width / dpr / 2 - 50, yPos + cardPadding, imageSize, imageSize);
  yPos += 100
  // 商品基本信息
  ctx.fillStyle = '#333333';
  ctx.font = 'bold 16px system-ui';
  wrapText(
    `长按进入小程序查看更多报价`,
    canvas.width / dpr /2 /2 -10  ,
    yPos + cardPadding + 20,

    leftColumnWidth * dpr - imageSize - cardPadding * 2,
    lineHeight
  );
  yPos += 150; // 商品卡片高度

  // 计算内容高度
  const contentHeight = yPos + 100;

  console.log(`内容高度: ${contentHeight}px`);

  // 添加验证点
  ctx.fillStyle = 'rgba(0,255,0,0.5)';
  ctx.fillRect(0, 0, 5, 5); // 左上角绘制绿点验证
  ctx.fillRect(canvasWidth - 5, contentHeight - 5, 5, 5); // 右下角绘制绿点验证

  return contentHeight;
}

/**
 * 文字换行函数（解决长文本溢出问题）
 */
function wrapText(text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  let testLine = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth * 2 && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[n];
      lineCount++;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y + lineCount * lineHeight);
  return y + (lineCount + 1) * lineHeight;
}
// 绘制商品图片
function drawProductImage(templatePath, x, y, width, height) {
  return new Promise((resolve) => {
    // 下载云存储图片
    if (templatePath) {
      const image = canvas.createImage();
      image.onload = () => {
        ctx.drawImage(image, x, y, width, height);
        resolve();
      };
      image.src = templatePath;
      image.onerror = (e) => {
        console.error('图片加载失败:', e, templatePath);
        // 如果加载失败，绘制占位图
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = '#999999';
        ctx.font = '12px PingFang SC, Microsoft YaHei, sans-serif';
        ctx.fillText('绘图失败', x + 10, y + height / 2);
        resolve();
      };
    }else{// 如果下载失败，绘制占位图
      ctx.fillStyle = '#eeeeee';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#999999';
      ctx.font = '12px PingFang SC, Microsoft YaHei, sans-serif';
      ctx.fillText('图片加载失败', x + 10, y + height / 2);
      resolve();
    }
  });
}

// 保存到相册（接收文件路径参数）
async function saveToAlbum(filePath) {
  // 新增类型检查
  if (typeof filePath !== 'string') {
    throw new Error(`无效的文件路径类型: ${typeof filePath}`);
  }

  return new Promise((resolve, reject) => {
    // 检查权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => saveImage(filePath, resolve, reject),
            fail: reject
          });
        } else {
          saveImage(filePath, resolve, reject);
        }
      },
      fail: reject
    });
  });
}
// 实际保存图片函数
function saveImage(filePath, resolve, reject) {
  wx.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      wx.showToast({ title: '保存成功', icon: 'success' });
      resolve();
    },
    fail: (err) => {
      console.error('保存失败:', err);
      if (err.errMsg.includes('auth deny')) {
        wx.showModal({
          title: '提示',
          content: '需要相册权限才能保存图片',
          showCancel: false
        });
      } else {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
      reject(err);
    }
  });
}

// 格式化价格
function formatPrice(price) {
  const yuan = price / 100;
  return yuan.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}