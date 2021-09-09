const checkDiskSpace = require('check-disk-space').default
const pathLib = require('path');
const fs = require('fs-extra')
var chalk = require('chalk');
var roundround = require('roundround');
const config = require('./config');
const utilities = require("./utilities")
const telegramHandler = require("./telegram")
const md5File = require('md5-file')
const isIp = require('is-ip');
const PromiseFtp = require('promise-ftp');


var destinationStorage = roundround(config.destinationStorage);


module.exports = {

    pendingFileTransfer: 0,

    moveFile: async function (originalPath) {

        let fileName = pathLib.basename(originalPath);
        let chosenDestinationStorage = '/dev/null';
        let foundCandidate = false;
        let counterTries = 0;
        let diskSpecs = null;


        while (!foundCandidate) {


            chosenDestinationStorage = destinationStorage();
            counterTries++;



            if (isIp(chosenDestinationStorage)) {

                foundCandidate = true;

                if (this.pendingFileTransfer <= config.maxFileTransfer) {
                    this.pendingFileTransfer = this.pendingFileTransfer + 1;
                    this.moveFileRemoteServer(originalPath, chosenDestinationStorage);

                }else{
                    console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.red('[ERROR]') + '\tParallel file transfer is exceeding maximum');

                }
                break;


            } else if (fs.existsSync(chosenDestinationStorage)) {


                try {

                    diskSpecs = await checkDiskSpace(chosenDestinationStorage);

                } catch (err) {
                    console.log(err);
                    continue;

                }

                let diskSize = diskSpecs.size / 1073741824; // Convert to GB
                let freeSize = diskSpecs.free / 1073741824; // Convert to GB


                if (freeSize > config.minimumFreeSizeInGB && diskSize > config.minimumDiskSizeInGB) { // in GB
                    foundCandidate = true;

                    if (this.pendingFileTransfer <= config.maxFileTransfer) {
                        this.pendingFileTransfer = this.pendingFileTransfer + 1;
                        this.moveFileLocalStorage(originalPath, chosenDestinationStorage);

                    } else{
                        console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.red('[ERROR]') + '\tParallel file transfer is exceeding maximum');

                    }
                    
                    break;

                }

            }




            if (counterTries > 100 || foundCandidate) {
                console.log(utilities.consoleTimestamp() + 'Could not copy file ' + fileName);
                break;
            }



        }




    },


    moveFileLocalStorage: async function (originalPath, chosenDestinationStorage) {

        let diskSpecs = null;
        let fileName = pathLib.basename(originalPath);


        try {

            diskSpecs = await checkDiskSpace(chosenDestinationStorage);

        } catch (err) {

            this.pendingFileTransfer = this.pendingFileTransfer - 1;
            console.log(err);

        }

        let diskPath = diskSpecs.diskPath;
        let diskSize = diskSpecs.size / 1073741824; // Convert to GB
        let freeSize = diskSpecs.free / 1073741824; // Convert to GB
        let usedSpace = (diskSpecs.size - diskSpecs.free) / 1073741824; // Convert to GB


        let fileSize = utilities.getFilesizeInBytes(originalPath);
        let fileSizeMB = fileSize / (1024 * 1024);
        let fileSizeGB = fileSize / 1073741824;
        let startTimeStamp = Math.floor(Date.now() / 1000);


        console.log(chalk.blue(utilities.consoleTimestamp()) + 'Found candidate hard drive to move the file to. Hard drive: ' + diskPath + ', Total size: ' + diskSize.toFixed(2) + 'GB , Free Space: ' + freeSize.toFixed(2) + 'GB , Used Space: ' + usedSpace.toFixed(2) + 'GB');
        console.log(chalk.blue(utilities.consoleTimestamp()) + 'Initiating moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenDestinationStorage);



        fs.chmodSync(originalPath, '777');

        if (config.MD5HashCalculation) {
            let beforeCopyHash = md5File.sync(originalPath);
            console.log(chalk.blue(utilities.consoleTimestamp()) + fileName + 'MD5 hash before copying: ' + beforeCopyHash);
        }


        fs.copy(originalPath, chosenDestinationStorage + fileName, {
                overwrite: true
            })
            .then(() => {

                if (config.MD5HashCalculation) {

                    let afterCopyHash = md5File.sync(chosenDestinationStorage + fileName);
                    console.log(chalk.blue(utilities.consoleTimestamp()) + fileName + ' MD5 hash after copying: ' + afterCopyHash);

                    if (afterCopyHash != beforeCopyHash) {
                        console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.red('[ERROR]') + ' MD5 hash of file ' + fileName + ' before and after copy does not match');
                        fs.unlinkSync(chosenDestinationStorage + fileName);
                        return;
                    }
                }


                fs.unlinkSync(originalPath);
                this.pendingFileTransfer = this.pendingFileTransfer - 1;

                fs.chmodSync(chosenDestinationStorage + fileName, '777');


                let endTimeStamp = Math.floor(Date.now() / 1000);
                let transferSpeed = fileSizeMB / (endTimeStamp - startTimeStamp);

                console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[DONE]') + '\tSuccess moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenDestinationStorage + '. Taken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp) + '. Average transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s');

                let telegramString = '';
                telegramString = telegramString + '[' + config.nodeName + ']';
                telegramString = telegramString + '\n\nSuccess moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB)';
                telegramString = telegramString + '\n\nDestination: ' + chosenDestinationStorage;
                telegramString = telegramString + '\n\nTaken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp)
                telegramString = telegramString + '\n\nAverage transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s'

                if (config.MD5HashCalculation)
                    telegramString = telegramString + '\n\nFile MD5 hash before and after copy: ' + afterCopyHash

                if (config.enableTelegramNotifications)
                    telegramHandler.telegramBroadcast(telegramString);

            })
            .catch(err => {
                this.pendingFileTransfer = this.pendingFileTransfer - 1;

                console.error(err);
            })

    },

    moveFileRemoteServer: function (originalPath, chosenDestinationStorage) {


        let fileName = pathLib.basename(originalPath);


        let fileSize = utilities.getFilesizeInBytes(originalPath);
        let fileSizeMB = fileSize / (1024 * 1024);
        let fileSizeGB = fileSize / 1073741824;
        let startTimeStamp = Math.floor(Date.now() / 1000);


        let options = {
            host: chosenDestinationStorage,
            port: config.FileReceiveServerPort
        }


        let ftp = new PromiseFtp(options);


        ftp.connect(options)
            .then(function (serverMessage) {

                console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.yellow('[IN PROGRESS]') + 'Initiating moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenDestinationStorage);


                return ftp.put(originalPath, fileName);


            }).then(function () {

                fs.unlinkSync(originalPath);
                this.pendingFileTransfer = this.pendingFileTransfer - 1;

                let endTimeStamp = Math.floor(Date.now() / 1000);
                let transferSpeed = fileSizeMB / (endTimeStamp - startTimeStamp);
                console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[DONE]') + '\tSuccess moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenDestinationStorage + '. Taken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp) + '. Average transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s');


                let telegramString = '';
                telegramString = telegramString + '[' + config.nodeName + ']';
                telegramString = telegramString + '\n\nSuccess moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB)';
                telegramString = telegramString + '\n\nDestination: ' + chosenDestinationStorage;
                telegramString = telegramString + '\n\nTaken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp)
                telegramString = telegramString + '\n\nAverage transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s'


                if (config.enableTelegramNotifications)
                    telegramHandler.telegramBroadcast(telegramString);

                return ftp.end();


            });





    }

};