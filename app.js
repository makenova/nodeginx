#!/usr/bin/env node

var fs = require('fs');
var chalk = require('chalk');
var async = require('async');
var inquirer = require('inquirer');
var exec = require('child_process').exec;

// nginx constants
const NGINX_PATH = '/etc/nginx/';
const sitesAvailableStr = 'sites-available';
const sitesEnabledStr = 'sites-enabled';
const CR = '\n';

// actions
const toggleSiteStr = 'enable/disable a site';
const manageSiteStr = 'add/remove a site';
const restartNginxStr = 'start/stop/restart nginx';
const exitProgramStr = 'exit';

// var cmdArgs = process.argv.slice(2);

fs.readdir(NGINX_PATH, (err, files) => {
  if (err) throw err;
  // if (err) process.exit(1);
  var sitesFolders = files.some((file)=>{
    return file === sitesAvailableStr || file === sitesEnabledStr;
  });
  if (sitesFolders){
    fs.readdir(NGINX_PATH + sitesAvailableStr, (err, files) => {
      'use strict';
      if (err) throw err;
      let sitesAvailable = files;
      fs.readdir(NGINX_PATH + sitesEnabledStr, (err, files) => {
        if (err) throw err;
        let sitesEnabled = files;

        // print list of sites, marked those that are enabled
        console.log(`${chalk.green('\u2714')} is enabled ${CR}${chalk.red('\u2718')} is disabled ${CR}`);
        let markedSites = sitesAvailable.map(site =>{
          let isEnabled = sitesEnabled.some( enabledSite => {
            return site === enabledSite;
          });
          if(isEnabled){
            console.log(site + chalk.green(' \u2714'));
            return {name: site, checked:isEnabled};
          }else{
            console.log(site + chalk.red(' \u2718'));
            return {name: site, checked:isEnabled};
          }
        });

        console.log(CR);

        // prep questions for user
        var questions = [
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              toggleSiteStr,
              manageSiteStr,
              restartNginxStr,
              exitProgramStr
            ]
          },
          {
            type: 'checkbox',
            name: 'askToggleSite',
            message: 'Select sites to enable (spacebar to select)',
            choices: markedSites,
            when: function (answers){
              return answers.action === toggleSiteStr;
            }
          },
          {
            type: 'list',
            name: 'askManageSite',
            message: 'Select site to ',
            choices: [],
            when: function (answers){
              return answers.action === manageSiteStr;
            }
          }
        ];

        // prompt user for action
        inquirer.prompt(questions, function (answers){
          // console.log(answers);
          if(answers.askToggleSite){
            toggleSites(sitesEnabled, answers.askToggleSite, (err)=>{
              if(err){
                console.log(err);
                process.exit(1);
              }
            });
          }
        });

      });
    });
  }
});

// Utility
function xorleft (array0, array1){
  return array0.filter(array0element=>{
    return !array1.some(array1element=>{
      return array1element === array0element;
    });
  });
}

// Nginx process functions
function manageNginx(action, callback) {
  // TODO: research if sending signals is better
  // i.e. sudo nginx -s stop|quit|reload
  exec(`sudo service nginx ${action}`, (err, stdout, stderr)=>{
    if(err){
      console.log(`failed to $(action) nginx`);
      return callback(err);
    }
    console.log(`${action}ed nginx`);
    return callback();
  });
}

// Toggle site function and helpers
function enableSite (site, callback){
  exec(`sudo ln -s ${NGINX_PATH}${sitesAvailableStr}/${site} ${NGINX_PATH}${sitesEnabledStr}/${site}`, (err, stdout, stderr)=>{
    if(err){
      return callback(err);
    }
    console.log(`enable ${site}`, stdout, stderr);
    callback();
  });
}

function disableSite (site, callback){
  exec(`sudo rm ${NGINX_PATH}${sitesEnabledStr}/${site}`, (err, stdout, stderr)=>{
    if(err){
      return callback(err);
    }
    console.log(`disable ${site}`, stdout, stderr);
    callback();
  });
}

function toggleSites (sitesEnabled, askToggleSiteAnswers, toggleDoneCB){
  async.series([
    // enable sites
    function(callback){
      async.eachSeries(xorleft(askToggleSiteAnswers, sitesEnabled),enableSite,
        callback);
    },
    // disable sites
    function(callback){
      async.eachSeries(xorleft(sitesEnabled, askToggleSiteAnswers),disableSite,
        callback);
    },
    // reload nginx configuration
    function(callback){
      manageNginx('reload', callback);
    }
  ], (err)=>{
    if (err) {
      return toggleDoneCB(err);
    }
    toggleDoneCB();
  });
}
