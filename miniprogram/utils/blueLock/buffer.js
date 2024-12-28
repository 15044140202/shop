export function buf2hex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

export function hexs2buf(hexs) {
  var array = new Uint8Array(hexs);
  for (var i = 0; i < hexs.length; i++) {
    array[i] = hexs[i];
  }
  return array.buffer;
}

export function str2arrayBuf(str) {
  // 首先将字符串转为16进制
  let val = "";
  for (let i = 0; i < str.length; i++) {
    if (val === "") {
      val = str.charCodeAt(i).toString(16);
    } else {
      val += "," + str.charCodeAt(i).toString(16);
    }
  }
  // 将16进制转化为ArrayBuffer
  return new Uint8Array(
    val.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16);
    })
  ).buffer;
}
export function str2buf(str) {
  let bytes = new Uint8Array(Math.ceil(str.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(str.substr(i * 2, 2), 16);
  }
  return bytes;
}
