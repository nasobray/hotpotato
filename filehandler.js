const checkDiskSpace = require('check-disk-space').default
const pathLib = require('path');
const fs = require('fs-extra')
var chalk = require('chalk');
var roundround = require('roundround');
const config = require('./config');
const utilities = require("./utilities")
const telegramHandler = require("./telegram")
const md5File = require('md5-file')


var hardDisks = roundround(config.hardDisks);


module.exports = {


    moveFile: async function (originalPath) {

        let fileName = pathLib.basename(originalPath);
        let chosenHardDisk = '/dev/null';
        let foundCandidate = false;
        let counterTries = 0;
        let diskSpace = null;


        while (!foundCandidate) {
            chosenHardDisk = hardDisks();
            counterTries++;

            try {

                diskSpace = await checkDiskSpace(chosenHardDisk);

            } catch (err) {
                console.log(err);
                continue;

            }

            let diskPath = diskSpace.diskPath;
            let diskSize = diskSpace.size / 1073741824; // Convert to GB
            let freeSize = diskSpace.free / 1073741824; // Convert to GB
            let usedSpace = (diskSpace.size - diskSpace.free) / 1073741824; // Convert to GB


            if (freeSize > config.minimumFreeSizeInGB && diskSize > config.minimumDiskSizeInGB) { // in GB
                foundCandidate = true;
                let fileSize = utilities.getFilesizeInBytes(originalPath);
                let fileSizeMB = fileSize / (1024 * 1024);
                let fileSizeGB = fileSize / 1073741824;
                let startTimeStamp = Math.floor(Date.now() / 1000);


                console.log(chalk.blue(utilities.consoleTimestamp()) + 'Found candidate hard drive to move the file to. Hard drive: ' + diskPath + ', Total size: ' + diskSize.toFixed(2) + 'GB , Free Space: ' + freeSize.toFixed(2) + 'GB , Used Space: ' + usedSpace.toFixed(2) + 'GB');
                console.log(chalk.blue(utilities.consoleTimestamp()) + 'Initiating moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenHardDisk + fileName);



                fs.chmodSync(originalPath, '777');

                if (config.MD5HashCalculation) {
                    let beforeCopyHash = md5File.sync(originalPath);
                    console.log(chalk.blue(utilities.consoleTimestamp()) + fileName + 'MD5 hash before copying: ' + beforeCopyHash);
                }


                fs.copy(originalPath, chosenHardDisk + fileName, {
                        overwrite: true
                    })
                    .then(() => {

                        if (config.MD5HashCalculation) {

                            let afterCopyHash = md5File.sync(chosenHardDisk + fileName);
                            console.log(chalk.blue(utilities.consoleTimestamp()) + fileName + ' MD5 hash after copying: ' + afterCopyHash);

                            if (afterCopyHash != beforeCopyHash) {
                                console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.red('[ERROR]') + ' MD5 hash of file ' + fileName + ' before and after copy does not match');
                                fs.unlinkSync(chosenHardDisk + fileName);
                                return;
                            }
                        }


                        fs.unlinkSync(originalPath);
                        fs.chmodSync(chosenHardDisk + fileName, '777');


                        let endTimeStamp = Math.floor(Date.now() / 1000);
                        let transferSpeed = fileSizeMB / (endTimeStamp - startTimeStamp);

                        console.log(chalk.blue(utilities.consoleTimestamp()) + chalk.green('[DONE]') + '\tSuccess moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB) to destination ' + chosenHardDisk + fileName + '. Taken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp) + '. Average transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s');

                        let telegramString = '';
                        telegramString = telegramString + 'Success moving file ' + fileName + ' (' + fileSizeGB.toFixed(2) + 'GB)';
                        telegramString = telegramString + '\n\nDestination: ' + chosenHardDisk;
                        telegramString = telegramString + '\n\nTaken time: ' + utilities.secondsToDhms(endTimeStamp - startTimeStamp)
                        telegramString = telegramString + '\n\nAverage transfer speed is ' + transferSpeed.toFixed(2) + ' MB/s'

                        if (config.MD5HashCalculation)
                            telegramString = telegramString + '\n\nFile MD5 hash before and after copy: ' + afterCopyHash

                        if (config.enableTelegramNotifications)
                            telegramHandler.telegramBroadcast(telegramString);

                    })
                    .catch(err => {
                        console.error(err);
                    })





            }





            if (counterTries > 100) {
                console.log(consoleTimestamp() + 'Could not copy file ' + fileName);
                break;
            }



        }




    }

};