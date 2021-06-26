const fileServerHandler = require("./fileserver")
const telegramHandler = require("./telegram")
const fileHandler = require("./filehandler")
const utilities = require("./utilities")
const config = require('./config');
const pathLib = require('path');



const watcher = require('chokidar');
var chalk = require('chalk');

if (config.enableFileReceiveServer)
  fileServerHandler.initFileReceiveServer();


telegramHandler.initHelpHandler();

console.log(chalk.blue(utilities.consoleTimestamp()) + 'Welcome! HotPotato. System has been loaded.');


watcher.watch(config.landingZone, {
  depth: 0,
  awaitWriteFinish: {
    stabilityThreshold: 4000,
    pollInterval: 200
  },
}).on('all', (eventType, path) => {

  let fileName = pathLib.basename(path);
  let notAllowedExtention = false;

  for (let i = 0; i < config.fileExclusions.length; i++)
    if (fileName.includes(config.fileExclusions[i]))
      notAllowedExtention = true;

  if (eventType == 'add' && !notAllowedExtention) {
    console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[NEW]') + '\tNew file has been found in the Landing Zone. File: ' + path);
    fileHandler.moveFile(path);

  }


});