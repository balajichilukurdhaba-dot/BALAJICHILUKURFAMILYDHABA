const fs = require('fs');

const originalReadFileSync = fs.readFileSync;
const originalReadFile = fs.readFile;
const originalPromisesReadFile = fs.promises.readFile;

function readAllSync(path, options) {
  let fd;
  try {
    fd = fs.openSync(path, 'r');
    const stat = fs.fstatSync(fd);
    if (stat.size === 0) {
      const encoding = typeof options === 'string' ? options : options?.encoding;
      return encoding ? '' : Buffer.alloc(0);
    }
    const buffer = Buffer.alloc(stat.size);
    let bytesRead = 0;
    const CHUNK_SIZE = 64 * 1024;
    while (bytesRead < stat.size) {
      const toRead = Math.min(CHUNK_SIZE, stat.size - bytesRead);
      const read = fs.readSync(fd, buffer, bytesRead, toRead, bytesRead);
      if (read === 0) break;
      bytesRead += read;
    }
    const finalBuffer = bytesRead === stat.size ? buffer : buffer.subarray(0, bytesRead);
    const encoding = typeof options === 'string' ? options : options?.encoding;
    if (encoding) {
      return finalBuffer.toString(encoding);
    }
    return finalBuffer;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) {}
    }
  }
}

function safeReadSync(path, options) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return originalReadFileSync.call(fs, path, options);
    } catch (err) {
      if (err && (err.code === 'UNKNOWN' || err.errno === -4094 || (err.message && err.message.includes('unknown error, read')))) {
        try {
          return readAllSync(path, options);
        } catch (inner) {
          if (attempt === 4) throw inner;
        }
      } else {
        throw err;
      }
    }
  }
}

fs.readFileSync = function (path, options) {
  return safeReadSync(path, options);
};

fs.readFile = function (path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  try {
    originalReadFile.call(fs, path, options, (err, data) => {
      if (err && (err.code === 'UNKNOWN' || err.errno === -4094 || (err.message && err.message.includes('unknown error, read')))) {
        try {
          const res = safeReadSync(path, options);
          return callback(null, res);
        } catch (innerErr) {
          return callback(innerErr);
        }
      }
      return callback(err, data);
    });
  } catch (err) {
    try {
      const res = safeReadSync(path, options);
      return callback(null, res);
    } catch (innerErr) {
      return callback(innerErr);
    }
  }
};

fs.promises.readFile = async function (path, options) {
  try {
    return await originalPromisesReadFile.call(fs.promises, path, options);
  } catch (err) {
    if (err && (err.code === 'UNKNOWN' || err.errno === -4094 || (err.message && err.message.includes('unknown error, read')))) {
      return safeReadSync(path, options);
    }
    throw err;
  }
};
