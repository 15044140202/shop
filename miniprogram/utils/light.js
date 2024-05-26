const aliSdk = require("./aliIot-sdk");
import {
  Base64
} from 'js-base64';
const app = getApp();
const db = wx.cloud.database();

//获取现行时间 
function getNowTime() {
  var now = new Date();
  return now.toLocaleString()
}

//获取随机字符串
function getRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}


//获取 身份  函数
function getStatus(openid) {
  const member = app.globalData.shopInfo.shop.member
  if (openid === app.globalData.shopInfo._openid) {
    return 'boss'
  } else {
    for (let index = 0; index < member.length; index++) {
      const element = member[index].memberOpenid;
      if (element === openid) {
        return member[index].position
      }
    }
    //没有职位信息  返回'NO'
    return 'NO'
  }
}

//获取 店铺头像函数
async function getLogo(p) {
  var url = 'https://636c-cloud1-4ga7jm4aad5de5c5-1324387207.tcb.qcloud.la/image/logo.png?sign=aa2e5b4912a6cf22308985950708ff86&t=1712498421'
  if (p === '1') {
    console.log('返回默认图片地址')
    return url;
  } else {
    console.log('根据ID 获取临时地址!')
    const res = await wx.cloud.getTempFileURL({
      fileList: [p],
    })
    console.log(res.fileList[0].tempFileURL)
    return res.fileList[0].tempFileURL
  }

}

//开灯关灯函数**********************************
async function lightCtrl(p) {
  const {
    lightName,
    lightData
  } = p;
  const productKey = app.globalData.productKey;
  console.log('下发数据:' + lightData);
  const openIoCode = Base64.encode(lightData);
  console.log('下发数据:' + openIoCode);

  var res = await aliSdk.request({
    Action: "Pub",
    ProductKey: productKey,
    MessageContent: openIoCode,
    TopicFullName: `/${productKey}/${lightName}/user/get`,
    IotInstanceId: 'iot-06z00is8v1fpvsn',
    DeviceName: lightName
  }, {
    method: "POST"
  });
  console.log(res)
}
//更新店铺信息数据**********************************************************
async function updataShopInfo() {
  let res = await db.collection('shopAccount').doc(app.globalData.shopInfo._id).get()
  app.globalData.shopInfo = res.data
  console.log({
    '更新': '成功!',
    'shopInfo:': app.globalData.shopInfo
  })
  return
}
//向某服务器数组 添加新成员*****************************************************
async function addArrayDatabase_op(params) {
  const {
    collection,
    openid,
    objName,
    data
  } = params;
  const res = await app.callFunction({
    name: 'addArrayDatabase_op',
    data: {
      collection,
      openid,
      objName,
      data
    }
  })
  return res
}
//向某服务器数组 添加新成员*****************************************************
async function addArrayDatabase(params) {
  const {
    collection,
    shopFlag,
    objName,
    data
  } = params;
  const res = await app.callFunction({
    name: 'addArrayDatabase_op',
    data: {
      collection,
      shopFlag,
      objName,
      data
    }
  })
  return res
}
//修改服务器数据函数********(根据openid 除了shopAccount外的数据库)*******************
async function amendDatabase_op(p) {
  const {
    collection,
    openid,
    objName,
    data
  } = p;
  const res = await app.callFunction({
    name: 'amendDatabase_op',
    data: {
      collection: collection,
      openid: openid,
      objName: objName,
      data: data
    }
  })
  console.log(res)
  return res
}
//修改数据库数据函数********(根据_id)*******************************************
async function amendDatabase(p) {
  const {
    collectionName,
    _id,
    objName,
    data
  } = p
  const db = wx.cloud.database()
  console.log('集合名称:' + collectionName + ' --_id:' + _id + '--OBJname:' + objName + '--要修改成:' + data)

  const res = await db.collection(collectionName).doc(_id).update({
    data: {
      [objName]: data
    }
  })
  console.log(res)
  if (res.stats.updated === 1) {
    await this.updataShopInfo();
    return ('ok')
  } else {
    return ('error')
  }
}
async function updataImage(openid, name) {
  const r = await wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album'],
  })
  console.log(r)
  const path = r.tempFiles[0].tempFilePath
  const res = await wx.cloud.uploadFile({
    cloudPath: `image/${openid}${name}.img`, // 上传至云端的路径
    filePath: path, // 小程序临时文件路径
  })
  console.log(res)
  if (res.sizeOf != 'undefine') {
    return res.fileID;
  } else {
    wx.showToast({
      title: '错误!',
      icon: 'error'
    })
  }
}
module.exports.updataImage = updataImage;
module.exports.updataShopInfo = updataShopInfo;
module.exports.lightCtrl = lightCtrl;
module.exports.amendDatabase = amendDatabase;
module.exports.getLogo = getLogo;
module.exports.getStatus = getStatus;
module.exports.getRandomString = getRandomString;
module.exports.addArrayDatabase = addArrayDatabase;
module.exports.addArrayDatabase_op = addArrayDatabase_op;
module.exports.amendDatabase_op = amendDatabase_op;
module.exports.getNowTime = getNowTime;