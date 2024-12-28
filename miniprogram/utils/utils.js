  async function downTempFile(cloudObj,FileId) {
  //根据保存的 ID  下载文件 获取临时地址
  wx.showLoading({
    title: '加载中...',
    mask: true
  })
  var tempFilePath = '';
  try {
    const result = await cloudObj.getTempFileURL({
      fileList: [FileId] // 文件 ID
    });
    // 如果下载成功，result 会包含临时文件路径等信息
    console.log(result)
    tempFilePath = result.fileList[0].tempFileURL
  } catch (error) {
    // 如果发生错误，error 对象会包含错误信息
    console.error('下载文件出错：', error);
  }
  console.log(tempFilePath);
  wx.hideLoading();
  return tempFilePath;
}

module.exports.downTempFile = downTempFile;