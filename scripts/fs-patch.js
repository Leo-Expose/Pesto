// Workaround for Windows NTFS drives where fs.readlink() returns EISDIR
// instead of EINVAL for non-symlink files. This crashes Webpack's
// enhanced-resolve module during Next.js builds.
// Loaded via --require before Next.js starts.

const fs = require('fs');

// Patch callback-based fs.readlink
const _readlink = fs.readlink;
fs.readlink = function (p, ...args) {
  const cb = args[args.length - 1];
  if (typeof cb === 'function') {
    const newArgs = [...args.slice(0, -1), (err, ...rest) => {
      if (err && (err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTDIR')) {
        err.code = 'EINVAL';
        err.errno = -22;
      }
      cb(err, ...rest);
    }];
    return _readlink.call(fs, p, ...newArgs);
  }
  return _readlink.call(fs, p, ...args);
};

// Patch synchronous fs.readlinkSync
const _readlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, options) {
  try {
    return _readlinkSync.call(fs, p, options);
  } catch (err) {
    if (err && (err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTDIR')) {
      err.code = 'EINVAL';
      err.errno = -22;
    }
    throw err;
  }
};

// Patch promise-based fs.promises.readlink
const _promiseReadlink = fs.promises.readlink;
fs.promises.readlink = async function (p, options) {
  try {
    return await _promiseReadlink.call(fs.promises, p, options);
  } catch (err) {
    if (err && (err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTDIR')) {
      err.code = 'EINVAL';
      err.errno = -22;
    }
    throw err;
  }
};
