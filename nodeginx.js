const fs = require('fs')
const exec = require('child_process').exec
const async = require('async')
const mustache = require('mustache')

// TODO: account for alternate install locations
// http://nginx.org/en/docs/beginners_guide.html
// nginx may be installed in /usr/local/nginx/conf, /etc/nginx, or
// /usr/local/etc/nginx.

// nginx constants
const NGINX_PATH = process.env.NGINX_PATH || '/etc/nginx/'
const sitesAvailableStr = 'sites-available'
const sitesEnabledStr = 'sites-enabled'
const sitesEnabledDirStr = `${NGINX_PATH}${sitesEnabledStr}`
const sitesAvailableDirStr = `${NGINX_PATH}${sitesAvailableStr}`;

module.exports = {
  manageNginx: manageNginx,
  enableSite: enableSite,
  disableSite: disableSite,
  removeSite: removeSite,
  addStaticSite: addStaticSite,
  addProxySite: addProxySite,
  addSiteFromUserFile: makeSiteFromUserTemplate,
  constants: {
    NGINX_PATH: NGINX_PATH,
    sitesAvailableStr: sitesAvailableStr,
    sitesEnabledStr: sitesEnabledStr
  }
}

// Utility
function fileExists (filepath) {
  try {
    Boolean(fs.statSync(filepath))
  } catch (e) {
    return false
  }
  return true
}

function sudoRemove (filepath, callback) {
  // Would prefer `fs.unlink` but, I don't know how to make it work with sudo
  exec(`sudo rm ${filepath}`, (err, stdout, stderr) => {
    if (err) return callback(err)
    callback()
  })
}

function sudoMove (filepath, dest, mvBool, callback) {
  // Would prefer `fs.writeFile` but sudo
  var mvORcp = mvBool ? 'mv' : 'cp'
  var cmd = `sudo ${mvORcp} ${filepath} ${dest}`
  exec(cmd, (err, stdout, stderr) => {
    if (err) return callback(err)
    callback()
  })
}

// Nginx process functions
function manageNginx (action, callback) {
  // TODO: research if sending signals is better
  // i.e. sudo nginx -s stop|quit|reload
  exec(`sudo service nginx ${action}`, (err, stdout, stderr) => {
    if (err) return callback(err)
    return callback()
  })
}

function enableSite (site, callback) {
  // would prefer `fs.symlink` but, sudo
  const availablePath = `${sitesAvailableDirStr}/${site}`
  const enabledPath = `${sitesEnabledDirStr}/${site}`
  const cmd = `sudo ln -s ${availablePath} ${enabledPath}`

  exec(cmd, callback)
}

function disableSite (site, callback) {
  sudoRemove(`${sitesEnabledDirStr}/${site}`, callback)
}

function makeSiteFromTemplate (tplFilePath, options, callback) {
  fs.readFile(tplFilePath, 'utf8', (err, tmpl) => {
    if (err) return callback(err)

    try {
      var config = mustache.render(tmpl, options)
    } catch (e) {
      return callback(e)
    }

    const siteName = options.serverName
    const tempfilepath = `${__dirname}/${siteName}`

    fs.writeFile(tempfilepath, config, (err) => {
      if (err) return callback(err)
      sudoMove(tempfilepath, sitesAvailableDirStr, true, (err) => {
        if (err) return callback(err)
        const msg = `${siteName} config file will be added to ${sitesAvailableStr}`
        callback(null, msg)
      })
    })
  })
}

function makeSiteFromUserTemplate (addSiteObj, callback) {
  const usrTplFilePath = addSiteObj.path

  return sudoMove(usrTplFilePath, sitesAvailableDirStr, false, callback)
}

function addStaticSite (options, callback) {
  const templateFilePath = `${__dirname}/templates/static`

  return makeSiteFromTemplate(templateFilePath, options, callback)
}

function addProxySite (options, callback) {
  const templateFilePath = `${__dirname}/templates/proxy`

  return makeSiteFromTemplate(templateFilePath, options, callback)
}



function removeSite (site, removeSiteDoneCB) {
  // if the file is currently enabled, disable it before removing it.
  async.series([
    (callback) => {
      if (fileExists(`${sitesEnabledDirStr}/${site}`)) {
        disableSite(site, callback)
      } else {
        return callback()
      }
    }, (callback) => {
      sudoRemove(`${sitesAvailableDirStr}/${site}`, (err) => {
        if (err) return callback(err)
        return callback()
      })
    }, (callback) => {
      manageNginx('reload', callback)
    }
  ], (err) => {
    if (err) return removeSiteDoneCB(err)
    return removeSiteDoneCB()
  })
}
