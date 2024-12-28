import ComputeCrc14443 from "./crc14443";

const startFlag = 0x3a;
const startFlagDisc = 0x3b;
// const startFlagReboot = 0x3c;
// const ansStartFlag = 0x4b;

const Fix_Verify_Code = 0x01;

const KeyType = {
  SelectLock: 0x01,
  LockSetup: 0x02,
  SetupBLE: 0x03,
  TimeSetup: 0x04,
  ResetDefault: 0x05,
  Unlock: 0x06,
  setEnd:0x16,
  setPassword:0x0c,
  clearPsd:0x0a
};

function EncodeSelectLock(
  _agentID,
  _sysID,
  _rgnID,
  _subrgnID,
  _lockID,
  withLongRes
) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);
  data.setUint8(pos++, startFlag);
  data.setUint8(pos++, 0x7);
  data.setUint8(pos++, KeyType.SelectLock & 0xff);
  data.setUint8(pos++, (_rgnID >> 0) & 0xff);
  data.setUint8(pos++, (_subrgnID >> 8) & 0xff);
  data.setUint8(pos++, (_subrgnID >> 0) & 0xff);
  data.setUint8(pos++, (_lockID >> 8) & 0xff);
  data.setUint8(pos++, (_lockID >> 0) & 0xff);

  if (withLongRes) {
    data.setUint8(pos++, 0); // 增加保留参数
  }

  data.setUint8(pos, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 1);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

function EncodeLockSetup(
  _secKey,
  _agentID,
  _sysID,
  _rgnID,
  _subrgnID,
  _lockID,
  _options,
  _longOptions,
  _lastPackage
) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, startFlag);
  } else {
    data.setUint8(pos++, startFlagDisc);
  }
  data.setUint8(pos++, 0x10);
  data.setUint8(pos++, KeyType.LockSetup & 0xff);
  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);
  data.setUint8(pos++, (_agentID >> 8) & 0xff);
  data.setUint8(pos++, (_agentID >> 0) & 0xff);
  data.setUint8(pos++, (_sysID >> 8) & 0xff);
  data.setUint8(pos++, (_sysID >> 0) & 0xff);
  data.setUint8(pos++, (_rgnID >> 0) & 0xff);
  data.setUint8(pos++, (_subrgnID >> 8) & 0xff);
  data.setUint8(pos++, (_subrgnID >> 0) & 0xff);
  data.setUint8(pos++, (_lockID >> 8) & 0xff);
  data.setUint8(pos++, (_lockID >> 0) & 0xff);
  data.setUint8(pos++, (_options >> 0) & 0xff);
  if (_longOptions) {
    data.setUint8(pos++, (_options >> 8) & 0xff);
    data.setUint8(pos++, (_options >> 16) & 0xff);
    data.setUint8(pos++, (_options >> 24) & 0xff);
  }

  data.setUint8(pos, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 1);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

function EncodeBLESetup(_secKey, _agentID, _sysID, _bleName, _lastPackage) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, startFlag);
  } else {
    data.setUint8(pos++, startFlagDisc);
  }
  data.setUint8(pos++, 0x00);
  data.setUint8(pos++, KeyType.SetupBLE & 0xff);
  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);
  for (let i = 0; i < 16; i++) {
    if (i < _bleName.length) {
      data.setUint8(pos++, _bleName.charCodeAt(i));
    } else {
      data.setUint8(pos++, 0);
    }
  }

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

function EncodeTimeSetup(
  _secKey,
  _agentID,
  _sysID,
  _year,
  _mon,
  _day,
  _dow,
  _hour,
  _min,
  _sec,
  _lastPackage
) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, startFlag);
  } else {
    data.setUint8(pos++, startFlagDisc);
  }
  data.setUint8(pos++, 0x00);
  data.setUint8(pos++, KeyType.TimeSetup & 0xff);
  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);
  data.setUint8(pos++, (_year - 2000) & 0xff);
  data.setUint8(pos++, _mon & 0xff);
  data.setUint8(pos++, _day & 0xff);
  data.setUint8(pos++, _dow & 0xff);
  data.setUint8(pos++, _hour & 0xff);
  data.setUint8(pos++, _min & 0xff);
  data.setUint8(pos++, _sec & 0xff);

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

function EncodeResetDefault(_secKey, _agentID, _sysID, _options, _lastPackage) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, startFlag);
  } else {
    data.setUint8(pos++, startFlagDisc);
  }
  data.setUint8(pos++, 0x00);
  data.setUint8(pos++, KeyType.ResetDefault & 0xff);
  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);
  data.setUint8(pos++, _options & 0xff);

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

function EncodeUnlock(
  _secKey,
  _agentID,
  _sysID,
  _options,
  _beginTime,
  _endTime,
  _issuer,
  _lastPackage
) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, startFlag);
  } else {
    data.setUint8(pos++, startFlagDisc);
  }
  data.setUint8(pos++, 0x00);
  data.setUint8(pos++, KeyType.Unlock & 0xff);
  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);
  data.setUint8(pos++, (_options >> 0) & 0xff);
  data.setUint8(pos++, (_beginTime >> 24) & 0xff);
  data.setUint8(pos++, (_beginTime >> 16) & 0xff);
  data.setUint8(pos++, (_beginTime >> 8) & 0xff);
  data.setUint8(pos++, (_beginTime >> 0) & 0xff);
  data.setUint8(pos++, (_endTime >> 24) & 0xff);
  data.setUint8(pos++, (_endTime >> 16) & 0xff);
  data.setUint8(pos++, (_endTime >> 8) & 0xff);
  data.setUint8(pos++, (_endTime >> 0) & 0xff);
  data.setUint8(pos++, (_issuer >> 24) & 0xff);
  data.setUint8(pos++, (_issuer >> 16) & 0xff);
  data.setUint8(pos++, (_issuer >> 8) & 0xff);
  data.setUint8(pos++, (_issuer >> 0) & 0xff);

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}
function EncodeSetEnd(_secKey) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  data.setUint8(pos++, startFlag);

  data.setUint8(pos++, 0x03);
  data.setUint8(pos++, KeyType.setEnd & 0xff);

  data.setUint8(pos++, (_secKey >> 8) & 0xff);
  data.setUint8(pos++, (_secKey >> 0) & 0xff);

  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}
function EncodeSetPassword(_secKey,passwardAdd,passward,endTime,_agentID,_sysID,_lastPackage) {
  if (!endTime) {
    endTime = 4294967295
  }
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);
  if (!_lastPackage) {
    data.setUint8(pos++, 0x3A);
  } else {
    data.setUint8(pos++, 0x3B);
  }

  data.setUint8(pos++, 0x0d);//0x0d
  data.setUint8(pos++, KeyType.setPassword & 0xff);//0x0c

  data.setUint8(pos++, (_secKey >> 8) & 0xff);//随机验证码2个字节
  data.setUint8(pos++, (_secKey >> 0) & 0xff);

  data.setUint8(pos++, (passwardAdd >> 0) & 0xff);//密码序号 1个字节
  data.setUint8(pos++, (6 >> 0) & 0xff);//密码长度 可输入6-8为  本程序设定为6位
  //处理密码
  const lenOfPin = Math.min(passward.length, 8);
  const userPin = [0xff, 0xff, 0xff, 0xff];
  for (let i = 0; i < lenOfPin && i < 8; i++) {
    if (i % 2 === 0) {
      userPin[Math.floor(i / 2)] &= ~0xf0;
      userPin[Math.floor(i / 2)] |=
        (passward[i] << 4) & 0xf0;
    } else {
      userPin[Math.floor(i / 2)] &= ~0x0f;
      userPin[Math.floor(i / 2)] |=
      passward[i] & 0x0f;
    }
  }
  let hexUserPin = 0;
  for (let i = 0; i < userPin.length; i++) {
    hexUserPin |= userPin[i] << (24 - i * 8);
  }

  data.setUint8(pos++, (hexUserPin >> 24) & 0xff);//4个字节 计算后的密码
  data.setUint8(pos++, (hexUserPin >> 16) & 0xff);
  data.setUint8(pos++, (hexUserPin >> 8) & 0xff);
  data.setUint8(pos++, (hexUserPin >> 0) & 0xff);

  data.setUint8(pos++, (endTime >> 24) & 0xff);
  data.setUint8(pos++, (endTime >> 16) & 0xff);
  data.setUint8(pos++, (endTime >> 8) & 0xff);
  data.setUint8(pos++, (endTime >> 0) & 0xff);

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}
function EncodeClearPassword(_secKey,_agentID,_sysID,_lastPackage) {
  let pos = 0;
  let data = new DataView(new Uint8Array(32).buffer);

  if (!_lastPackage) {
    data.setUint8(pos++, 0x3A);
  } else {
    data.setUint8(pos++, 0x3B);
  }

  data.setUint8(pos++, 0x05);//0x0d
  data.setUint8(pos++, KeyType.clearPsd & 0xff);//0x0a

  data.setUint8(pos++, (_secKey >> 8) & 0xff);//随机验证码2个字节
  data.setUint8(pos++, (_secKey >> 0) & 0xff);

  data.setUint8(pos++, ((Math.floor(Math.random() * 255) + 1) >> 0) & 0xff);//密匙值
  data.setUint8(pos++, (4 >> 0) & 0xff);// 4清空所有自定义密码

  data.setUint8(pos + 0, (_agentID >> 8) & 0xff);
  data.setUint8(pos + 1, (_agentID >> 0) & 0xff);
  data.setUint8(pos + 2, (_sysID >> 8) & 0xff);
  data.setUint8(pos + 3, (_sysID >> 0) & 0xff);
  data.setUint8(pos + 4, Fix_Verify_Code);

  data.setUint8(1, pos - 2);
  let cs = ComputeCrc14443(data, pos + 5);

  data.setUint8(pos++, (cs >> 8) & 0xff);
  data.setUint8(pos++, (cs >> 0) & 0xff);
  return [...new Uint8Array(data.buffer)].slice(0, pos);
}

export {
  EncodeSelectLock,
  EncodeLockSetup,
  EncodeBLESetup,
  EncodeTimeSetup,
  EncodeResetDefault,
  EncodeUnlock,
  EncodeSetEnd,
  EncodeSetPassword,
  EncodeClearPassword
};
