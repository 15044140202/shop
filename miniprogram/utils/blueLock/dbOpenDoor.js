var crc = require("./crc14443.js");
var ble = require("./bleEncode.js");
var buf = require("./buffer.js");
var constants = require("./constants.js");
var moment = require("./moment.min.js");
var item = undefined;
var seckey = undefined;
var task = true;
var passward = 123456;
var psdEndTime = ''
export var cfg = {
  target_info: "", //目标地址
  onOpenNotify: null,
  agentID: 1, //设备代理ID
  sysID: 1, //系统id
  rgnID: 1, //区域id
  subrgnID: 1, //子区域ID
  lockID: 1, //锁ID
}
export var blue_data = {
  device_id: "",
}

function setCfg(obj) {
  cfg = Object.assign({}, cfg, obj);
}

async function connect() {
  if (!wx.openBluetoothAdapter) {
    wx.showModal({
      title: '提示',
      content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。',
    })
    return 'error';
  }
  return new Promise((resolve, reject) => {
    wx.openBluetoothAdapter({
      success: resolve,
      fail: (error) => {
        // 处理失败情况，这里可以选择返回一个包含错误信息的对象  
        resolve({
          error: true,
          errorMessage: error.errMsg,
          errorCode: error.errCode
        });
        // 或者，你也可以选择不解析Promise，让它保持挂起状态，但这通常不是个好主意  
        // 因为调用者可能会期望得到一个明确的成功或失败的结果  
      }
    });
  }).then(result => {
    if (result.error) {
      // 处理错误情况  
      console.error('打开蓝牙适配器失败', result.errorMessage, result.errorCode);
      // 这里可以返回一个特定的错误对象，或者null/undefined来表示失败  
      return result.errorCode;
    }
    // 处理成功情况  
    console.log('蓝牙适配器打开成功', result);
    return 'ok';
  });
}
//发送消息
function sendMsg(msg, toArrayBuf = true) {
  console.log(msg)
  let buf = toArrayBuf ? hexStringToArrayBuffer(msg) : msg;
  wx.writeBLECharacteristicValue({
    deviceId: blue_data.device_id,
    serviceId: constants.CabinetCat_Service_UUID,
    characteristicId: constants.CabinetCat_Write_Characteristics_UUID,
    value: buf,
    success: function (res) {
      console.log(res);
    },
  });
}

function encodeMomentToNumber(nowTime, num) {
  let baseSeqNo = (nowTime.year() - 2000) << 25;
  baseSeqNo |= (nowTime.month() + 1) << 21;
  baseSeqNo |= nowTime.date() << 16;
  baseSeqNo |= nowTime.hour() << 11;
  baseSeqNo |= nowTime.minute() << 5;
  return baseSeqNo | (num & 0x1f);
}
//监听消息
function onNotifyChange(callback) {
  wx.onBLECharacteristicValueChange(function (res) {
    console.log("rx:", buf.buf2hex(res.value));
    let msg = buf.str2buf(buf.buf2hex(res.value).toString());

    if (msg[2] === 0x01) { //0x01  为选择门锁
      console.log("select done");
      seckey = (msg[3] << 8) | msg[4];
      const beginDate = moment().clone().second(0).millisecond(0);
      console.log("begin date:", beginDate);
      const endDate = beginDate
        .clone()
        .add(1, "minute")
        .second(0)
        .millisecond(0);
      console.log("end date:", endDate);
      var battery = msg[8];
      var voltage = msg[9];
      var bv = battery * 256 + (voltage >> 0);
      console.log('电池电压!:' + bv)

      //分支 根据item值选择设置项目
      if (item === 'addLock') { //添加门锁此步骤为设置
        var setlock = buf.hexs2buf(
          ble.EncodeLockSetup(
            seckey,
            cfg.agentID,
            cfg.sysID,
            cfg.rgnID,
            cfg.subrgnID,
            cfg.lockID,
            0,
            0,
            false
          )
        );
        sendMsg(setlock, false);
      } else if (item === 'openLock') { //开锁
        console.log('执行开锁')
        var openlock = buf.hexs2buf(
          ble.EncodeUnlock(
            seckey,
            cfg.agentID,
            cfg.sysID,
            0,
            encodeMomentToNumber(beginDate, 0),
            encodeMomentToNumber(endDate, 0),
            0,
            true
          )
        );
        console.log(buf.buf2hex(openlock))
        sendMsg(openlock, false);
      } else if (item === 'unbindLock') { //解绑密码锁
        var unbindLock = buf.hexs2buf(
          ble.EncodeResetDefault(
            seckey,
            cfg.agentID,
            cfg.sysID,
            0,
            true
          )
        );
        console.log(buf.buf2hex(unbindLock))
        sendMsg(unbindLock, false);
      } else if (item === 'setLockPassword') { //设置密码
        const endDate = moment(psdEndTime).clone().second(0).millisecond(0);
        console.log(endDate)
        var invalidate = encodeMomentToNumber(endDate, 0);
        console.log(invalidate)
        var setLockPassword = buf.hexs2buf(
          ble.EncodeSetPassword(
            seckey,
            0,
            passward,
            invalidate,
            cfg.agentID,
            cfg.sysID,
            true
          )
        );
        console.log(buf.buf2hex(setLockPassword))
        sendMsg(setLockPassword, false);
      } else if (item === 'clearLockPassword') { //清除所有自定义密码
        var setLockPassword = buf.hexs2buf(
          ble.EncodeClearPassword(
            seckey,
            cfg.agentID,
            cfg.sysID,
            true
          )
        );
        console.log(buf.buf2hex(setLockPassword))
        sendMsg(setLockPassword, false);
      }

    } else if (msg[2] === 0x02) { //设置完成
      console.log("infiSet done");
      seckey = (msg[3] << 8) | msg[4];
      if (item === 'addLock') { //添加新设备
        //设置时间
        const now = new Date()
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        const week = now.getDay();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        console.log(year + "-" + month + "-" + day + "*" + week + "*" + hours + ":" + minutes + ":" + seconds)
        var setlockTime = buf.hexs2buf(
          ble.EncodeTimeSetup(
            seckey,
            cfg.agentID,
            cfg.sysID,
            year,
            month,
            day,
            week,
            hours,
            minutes,
            seconds,
            false
          )
        );
        console.log(buf.buf2hex(setlockTime))
        sendMsg(setlockTime, false);
      }
    } else if (msg[2] === 0x04) { //时间设置完成 
      console.log("timeSet done");
      seckey = (msg[3] << 8) | msg[4];
      if (item === 'addLock') { //添加新设备
        //设置蓝牙名称
        var setlockName = buf.hexs2buf(
          ble.EncodeBLESetup(
            seckey,
            cfg.agentID,
            cfg.sysID,
            `BLUELOCK_${cfg.lockID}`,
            true
          )
        );
        sendMsg(setlockName, false);
      }
    } else if (msg[2] === 0x03) { //名称设置完成
      console.log("nameSet done");
      task = true; //赋值任务完成

    } else if (msg[2] === 0x06) {
      if (msg[5] !== 0x00) {
        console.log("unlock failure");
        return;
      }
      console.log("unlock done");
      task = true; //赋值任务完成
      return;
    } else if (msg[2] === 0x05) { //恢复出厂设置完成
      if (msg[5] !== 0x00) {
        console.log("unbind failure");
        return;
      }
      console.log("unbind done");
      task = true; //赋值任务完成
      return;
    } else if (msg[2] === 0x0c) { //设置密码完成
      if (msg[5] !== 0x00) {
        console.log("setPsd failure");
        return;
      }
      console.log("setPsd done");
      task = true; //赋值任务完成
      return;
    } else if (msg[2] === 0x0a) { //清除密码完成
      if (msg[5] !== 0x00) {
        console.log("clearPsd failure");
        return;
      }
      console.log("clearPsd done");
      task = true; //赋值任务完成
      return;
    }
    if (callback) {
      console.log("go into callback");
      callback(msg);
    }
  });
}

function disconnect() {
  wx.closeBLEConnection({
    deviceId: blue_data.device_id,
    success(res) {},
  });
}
/*事件通信模块*/

/*连接设备模块*/
function getBlueState() {
  console.log('初始化蓝牙!')
  if (blue_data.device_id !== "") {
    connectDevice();
    return;
  }
  wx.getBluetoothAdapterState({
    success: function (res) {
      if (!!res && res.available) {
        //蓝牙可用
        startSearch();
      }
    },
    fail: function (err) {
      console.error(err)
    }
  });
}

function startSearch() {
  console.log('开始搜索蓝牙设备!')
  wx.startBluetoothDevicesDiscovery({
    services: [],
    success(res) {
      wx.onBluetoothDeviceFound(function (res) {
        // console.log("onsearch:", JSON.stringify(res.devices));
        console.log(res.devices)
        var device = filterDevice(res.devices, cfg.target_info);
        if (device && blue_data.device_id === '') {
          blue_data.device_id = device.deviceId;
          stopSearch();
          connectDevice();
        }
      });
    },
  });
}
//连接到设备
function connectDone() {
  wx.getBLEDeviceServices({
    deviceId: blue_data.device_id,
    success(res) {
      console.log({
        '连接设备成功!': res
      })
      wx.getBLEDeviceCharacteristics({
        deviceId: blue_data.device_id,
        serviceId: constants.CabinetCat_Service_UUID,
        success(res) {
          console.log({
            '服务特征': res
          })
          openNotify();
        },
      });
    },
  });
}

function connectDevice() {
  console.log("trying connect:", blue_data.device_id);
  wx.createBLEConnection({
    deviceId: blue_data.device_id,
    success(res) {
      console.log("yyyy");
      connectDone();
    },
  });
}

function openNotify() {
  wx.notifyBLECharacteristicValueChange({
    state: true,
    deviceId: blue_data.device_id,
    serviceId: constants.CabinetCat_Service_UUID,
    characteristicId: constants.CabinetCat_Notify_Characteristics_UUID,
    complete(res) {
      console.log("启用notify:", res);
      setTimeout(function () {
        cfg.onOpenNotify && cfg.onOpenNotify();
      }, 100);
      onNotifyChange(); //接受消息
    },
  });
}
/*连接设备模块*/

/*其他辅助模块*/
//停止搜索周边设备
function stopSearch() {
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {},
  });
}

function arrayBufferToHexString(buffer) {
  let bufferType = Object.prototype.toString.call(buffer);
  if (buffer != "[object ArrayBuffer]") {
    return;
  }
  let dataView = new DataView(buffer);

  var hexStr = "";
  for (var i = 0; i < dataView.byteLength; i++) {
    var str = dataView.getUint8(i);
    var hex = (str & 0xff).toString(16);
    hex = hex.length === 1 ? "0" + hex : hex;
    hexStr += hex;
  }

  return hexStr.toUpperCase();
}

function hexStringToArrayBuffer(str) {
  if (!str) {
    return new ArrayBuffer(0);
  }

  var buffer = new ArrayBuffer(str.length);
  let dataView = new DataView(buffer);

  let ind = 0;
  for (var i = 0, len = str.length; i < len; i += 2) {
    let code = parseInt(str.substr(i, 2), 16);
    dataView.setUint8(ind, code);
    ind++;
  }

  return buffer;
}
//过滤目标设备
function filterDevice(devices, target_name) {
  const test = devices
    .map((d) => {
      return d;
    })
    .find((d) => d && d.localName && d.localName === target_name);
  return test;
}

//添加设备函数
export async function addDevice(deviceId) {
  if (!(deviceId === '' || deviceId === undefined)) {
    blue_data.device_id = deviceId
  }
  item = 'addLock';
  task = false;
  //首先设置柜门参数
  setCfg({
    target_info: "KD-SETUP",
    onOpenNotify: function () {
      console.log("on add");
      var selectLock = buf.hexs2buf(
        ble.EncodeSelectLock(
          255,
          255,
          255,
          255,
          255,
          true
        )
      );
      sendMsg(selectLock, false);
    },
  });
  //连接锁
  const connectRes = await connect();
  if (connectRes !== 'ok') {
    wx.showModal({
      title: '提示',
      content: '蓝牙打开失败!',
    })
    return;
  }
  //获取蓝牙状态
  getBlueState();

  let valuePromise = new Promise((resolve) => {
    let timer = setTimeout(() => {
      // 如果在5秒内 value 达到了 targetValue，则清除定时器  
      if (task === true) {
        resolve
        clearTimeout(timer);
      }
    }, 10000); // 5000毫秒 = 5秒  
  });

  let timeoutPromise = new Promise((resolve) => {
    setTimeout(resolve, 10000); // 5000毫秒 = 5秒  
  });
  // 使用 Promise.race() 等待两个 Promise 中的一个 resolve  
  await Promise.race([timeoutPromise, valuePromise]);

  if (task === true) { //绑定完成返回 ID
    const r = blue_data.device_id;
    blue_data.device_id = '';
    return r;
  } else {
    return 'error'
  }
}
async function getBleState() {
  // 获取蓝牙适配器状态  
  return new Promise((resolve, reject) => {
    wx.getBluetoothAdapterState({
      success: (res) => {
        resolve(res.available); // 将蓝牙是否打开的状态作为Promise的解决值  
      },
      fail: (err) => {
        reject(err); // 如果获取状态失败，则拒绝Promise  
      }
    });
  });
}
async function delay(time) {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
  return;
}
export async function openLock(deviceId) {
  if (!(deviceId === '' || deviceId === undefined)) {
    blue_data.device_id = deviceId
  }
  console.log(blue_data.device_id)
  item = 'openLock';
  task = false;
  //首先设置柜门参数
  setCfg({
    target_info: `BLUELOCK_${cfg.lockID}`,
    onOpenNotify: function () {
      console.log("on open");
      var selectLock = buf.hexs2buf(
        ble.EncodeSelectLock(
          cfg.agentID,
          cfg.sysID,
          cfg.rgnID,
          cfg.subrgnID,
          cfg.lockID,
          0,
          true
        )
      );
      sendMsg(selectLock, false);
    },
  });
  console.log(cfg.target_info)
  //初始化蓝牙
  const connectRes = await connect();
  if (connectRes !== 'ok') {
    console.log(connectRes)
    if (connectRes === 10001) {
      wx.showModal({
        title: '提示',
        content: '当前蓝牙适配器不可用,请先打开手机蓝牙!'
      })
      return 'error'
    } else {
      wx.showModal({
        title: '提示',
        content: '蓝牙打开失败!',
      })
      return 'error';
    }
  }
  //获取蓝牙状态
  getBlueState();

  for (let index = 0; index < 500; index++) {
    if (task === true) {
      break;
    } else {
      await delay(30)
    }
  }

  if (task === true) { //绑定完成返回 ID
    console.log('开门成功!')
    const r = blue_data.device_id;
    blue_data.device_id = '';
    return r;
  } else {
    return 'error'
  }
}
export async function unbindLock(deviceId) {
  if (!(deviceId === "" || deviceId === undefined)) {
    blue_data.device_id = deviceId;
  }
  item = 'unbindLock';
  task = false;
  //首先设置柜门参数
  setCfg({
    target_info: `BLUELOCK_${cfg.lockID}`,
    onOpenNotify: function () {
      console.log("on unbind");
      var selectLock = buf.hexs2buf(
        ble.EncodeSelectLock(
          cfg.agentID,
          cfg.sysID,
          cfg.rgnID,
          cfg.subrgnID,
          cfg.lockID,
          0,
          true
        )
      );
      sendMsg(selectLock, false);
    },
  });
  //初始化蓝牙
  const connectRes = await connect();
  if (connectRes !== 'ok') {
    wx.showModal({
      title: '提示',
      content: '蓝牙打开失败!',
    })
    return 'error';
  }
  //获取蓝牙状态
  getBlueState();
  for (let index = 0; index < 500; index++) {
    if (task === true) {
      break;
    } else {
      await delay(30)
    }
  }

  if (task === true) { //绑定完成返回 ID
    const r = blue_data.device_id;
    blue_data.device_id = '';
    return r;
  } else {
    return 'error'
  }
}
export async function setLockPassword(deviceId, password_p, endTime) {
  if (!(deviceId === "" || deviceId === undefined)) {
    blue_data.device_id = deviceId;
  }
  item = 'setLockPassword';
  task = false;
  passward = password_p
  psdEndTime = endTime
  console.log(passward)
  //首先设置柜门参数
  setCfg({
    target_info: `BLUELOCK_${cfg.lockID}`,
    onOpenNotify: function () {
      console.log("on setLockPassword");
      var selectLock = buf.hexs2buf(
        ble.EncodeSelectLock(
          cfg.agentID,
          cfg.sysID,
          cfg.rgnID,
          cfg.subrgnID,
          cfg.lockID,
          0,
          true
        )
      );
      sendMsg(selectLock, false);
    },
  });
  //初始化蓝牙
  const connectRes = await connect();
  if (connectRes !== 'ok') {
    wx.showModal({
      title: '提示',
      content: '蓝牙打开失败!',
    })
    return 'error';
  }
  //获取蓝牙状态
  getBlueState();
  for (let index = 0; index < 500; index++) {
    if (task === true) {
      break;
    } else {
      await delay(30)
    }
  }

  if (task === true) { //绑定完成返回 ID
    const r = blue_data.device_id;
    blue_data.device_id = '';
    return r;
  } else {
    return 'error'
  }
}
export async function clearLockPassword(deviceId) {
  if (!(deviceId === "" || deviceId === undefined)) {
    blue_data.device_id = deviceId;
  }
  item = 'clearLockPassword';
  task = false;
  //首先设置柜门参数
  setCfg({
    target_info: `BLUELOCK_${cfg.lockID}`,
    onOpenNotify: function () {
      console.log("on setLockPassword");
      var selectLock = buf.hexs2buf(
        ble.EncodeSelectLock(
          cfg.agentID,
          cfg.sysID,
          cfg.rgnID,
          cfg.subrgnID,
          cfg.lockID,
          0,
          true
        )
      );
      sendMsg(selectLock, false);
    },
  });
  //初始化蓝牙
  const connectRes = await connect();
  if (connectRes !== 'ok') {
    wx.showModal({
      title: '提示',
      content: '蓝牙打开失败!',
    })
    return 'error';
  }
  //获取蓝牙状态
  getBlueState();
  for (let index = 0; index < 500; index++) {
    if (task === true) {
      break;
    } else {
      await delay(30)
    }
  }

  if (task === true) { //绑定完成返回 ID
    const r = blue_data.device_id;
    blue_data.device_id = '';
    return r;
  } else {
    return 'error'
  }
}