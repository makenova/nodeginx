var fs = require('fs')
var os = require('os')
var path = require('path')
var test = require('ava').test
var rimraf = require('rimraf')
var nodeginx = require('./nodeginx')

const TEMP_FOLDER = os.tmpdir()
const AVAILABLE = path.join(TEMP_FOLDER, nodeginx.constants.sitesAvailableStr)
const ENABLED = path.join(TEMP_FOLDER, nodeginx.constants.sitesEnabledStr)

// test objects
const staticSiteObj = {
  askAddSite: 'use static template',
  tplPort: '80',
  tplServerName: 'panda',
  tplSiteRoot: '/home/user/panda'
}

const proxySiteObj = {
  askAddSite: 'use proxy template',
  tplPort: '80',
  tplServerName: 'otter',
  proxyServerIp: '127.0.0.1',
  proxyServerPort: '8080'
}


// helpers
function fileExists (path, callback) {
  fs.stat(path, function (err) {
    return callback(!Boolean(err))
  })
}

function makefolder (folder) {
  return new Promise(function (resolve, reject) {
    fs.mkdir(folder, function(err) {
      if(err) return reject(err)
      resolve()
    })
  })
}

function deletefolder (folder) {
  return new Promise(function (resolve, reject) {
    rimraf(folder, function (err) {
      if (err) return reject(err)
      resolve()
    })
  })
}

// tests
test.before(async function (t) {
  await makefolder(AVAILABLE)
    .then(makefolder(ENABLED))
})

test.after.always( async function () {
  await deletefolder(AVAILABLE)
    .then(deletefolder(ENABLED))
})

test.cb('add static site', function (t) {
  nodeginx.addStaticSite(staticSiteObj, function(err, message) {
    if (err) t.end(err)
    fileExists(path.join(AVAILABLE, staticSiteObj.tplServerName),
      function (exists) {
        if (!exists) return t.end(new Error('Failed to add static site'))
        t.end()
      }
    )
  })
})

test.cb('enable a site', function (t) {
  nodeginx.enableSite(staticSiteObj.tplServerName, function (err) {
    if (err) return t.end(err)
    fs.lstat(path.join(ENABLED, staticSiteObj.tplServerName),
      function (err, stats) {
        if (err) return t.end(err)
        t.truthy(stats.isSymbolicLink(stats))
        t.end()
      }
    )
  })
})

test.cb('disable a site', function (t) {
  nodeginx.disableSite(staticSiteObj.tplServerName, function (err) {
    if (err) return t.end(err)
    fileExists(path.join(ENABLED, staticSiteObj.tplServerName),
      function (exists) {
        if (exists) return t.end(new Error('Failed to disable site'))
        t.end()
      }
    )
  })
})

test.cb('remove site', function (t) {
  nodeginx.removeSite(staticSiteObj.tplServerName, function (err) {
    if (err) return t.end(err)
    fileExists(path.join(AVAILABLE, staticSiteObj.tplServerName),
      function (exists) {
        if (exists) return t.end(new Error('Failed to remove static site'))
        t.end()
      }
    )
  })
})

test.cb('add proxy site', function (t) {
  nodeginx.addProxySite(proxySiteObj, function(err, message) {
    if (err) return t.end(err)
    fs.stat(path.join(AVAILABLE, proxySiteObj.tplServerName),
      function (err) {
        if (err) return t.end(err)
        t.end()
      }
    )
  })
})

test.cb(`make sure site is disabled before it's removed`, function (t) {
  nodeginx.enableSite(proxySiteObj.tplServerName, function (err) {
    if (err) return t.end('Failed to enable site befort test')
    nodeginx.removeSite(proxySiteObj.tplServerName, function (err) {
        if (err) return t.end(err)
        fileExists(path.join(ENABLED, proxySiteObj.tplServerName),
        function (exists) {
          if (exists) return t.end(new Error('Failed to remove proxy site'))
          t.end()
        }
      )
    })
  })
})

test.cb('test nodeginx.manageNginx("stop")', function (t) {
  nodeginx.manageNginx('stop', function (err) {
    require('child_process').exec('ps aux | grep nginx | grep "master process"',
      function (err, stdout, stderr) {
        var processIsRunning = stdout.trim().split('\n').length > 1
        if (err) return t.end(err)
        if(processIsRunning)
          return t.end(new Error('process should not be running'))
        t.end()
      }
    )
  })
})

test.cb('test nodeginx.manageNginx("start")', function (t) {
  nodeginx.manageNginx('start', function (err) {
    require('child_process').exec('ps aux | grep nginx | grep "master process"',
      function (err, stdout, stderr) {
        var processIsRunning = stdout.trim().split('\n').length > 1
        if (err) return t.end(err)
        if(!processIsRunning)
          return t.end(new Error('process should be running'))
        t.end()
      }
    )
  })
})

test.todo('add site from user template')
test.todo('use temp folder instead of /etc/nginx')
