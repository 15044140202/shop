function UpdateCrc14443(ch, wCrc) {
  ch = ch ^ (wCrc & 0x00ff);
  ch = ch ^ ((ch << 4) & 0x00ff);
  wCrc = (wCrc >> 8) ^ (ch << 8) ^ (ch << 3) ^ ((ch >> 4) & 0xffff);
  return wCrc;
}

function ComputeCrc14443(data, length) {
  let pos = 0;
  let chBlock;
  let wCrc = 0x6363;

  do {
    chBlock = data.getUint8(pos++);
    wCrc = UpdateCrc14443(chBlock, wCrc) & 0xffff;
  } while (--length);

  return wCrc;
}

export default ComputeCrc14443;
