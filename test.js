var fs = require('fs')
var os = require('os')
var path = require('path')
var test = require('ava').test
var nodeginx = require('./nodeginx')

const TEMP_FOLDER = os.tmpdir()
const AVAILABLE = path.join(TEMP_FOLDER, nodeginx.constants.sitesAvailableStr)
const ENABLED = path.join(TEMP_FOLDER, nodeginx.constants.sitesEnabledStr)

// test objects
const staticSiteObj = {
  askAddSite: 'use static template',
  tplPort: '80',
  tplServerName: 'bums',
  tplSiteRoot: '~/bums'
}
const staticSiteFilepath = path.join(nodeginx.constants.NGINX_PATH, nodeginx.constants.sitesAvailableStr, staticSiteObj.tplServerName)

// helpers
function fileExists (path, callback) {
  fs.stat(path, callback)
}

function makefolder (folder) {
  console.log(folder)
  return new Promise(function (resolve, reject) {
    fs.mkdir(folder, function(err) {
      if(err) return reject(err)
      resolve()
    })
  })
}

function deletefolder (folder) {
  return new Promise(function (resolve, reject) {
    fs.rmdir(folder, function (err) {
      if (err) return reject(err)
      resolve()
    })
  })
}

test.before(async function (t) {
  await makefolder(AVAILABLE)
    .then(makefolder(ENABLED))
})

test.after.always( async function () {
  await deletefolder(AVAILABLE)
    .then(deletefolder(ENABLED))
})

test.cb('add static site', function (t) {
  nodeginx.addSite(staticSiteObj, function(err, message) {
    if (err) t.end(err)
    fs.stat(staticSiteFilepath, function (err) {
      if (err) return t.end(err)
      t.end()
    })
  })
})

test.cb('remove static site', function (t) {
  nodeginx.removeSite(staticSiteObj.tplServerName, function (err) {
    if (err) return t.end(err)
    fileExists(staticSiteFilepath, function (err) {
      // The file should not exist, so an error is expected
      if (err) return t.end()
      t.end('File should not exist')
    })
  })
})
