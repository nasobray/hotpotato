var config = {};

config.nodeName =  'TEST'; 
config.nodeIP =  '192.168.1.1'; 

config.enableTelegramNotifications =  true; 

config.telegramUsers = [];
config.telegramUsers.push('TELEGRAM_USERID');
config.telegramUsers.push('TELEGRAM_USERID');
config.telegramUsers.push('TELEGRAM_USERID');

config.telegramToken =  'TELEGRAM_KEY'; 


config.landingZone = '/path/to/landing/zone/';


config.destinationStorage = [];
config.destinationStorage.push('/path/to/destinationStorage/');
config.destinationStorage.push('/path/to/destinationStorage/');
config.destinationStorage.push('192.168.0.1');


config.fileExclusions = [];
config.fileExclusions.push('.EXCLUDED_EXTENTIONS');
config.fileExclusions.push('.EXCLUDED_EXTENTIONS');

config.minimumDiskSizeInGB = 5;
config.minimumFreeSizeInGB =  1; 

config.MD5HashCalculation =  false; 


config.enableFileReceiveServer =  true; 
config.FileReceiveServerPort = 6969;
config.RecieveBufferSize  = 2 * 1024 * 1024;
config.SendBufferSize  = 1 * 1024 * 1024;


config.deleteOldFiles =  true; 
config.deleteOldFilesExtention =  '.img'; 
config.deleteOldFilesPath =  '/path/path/path'; 
config.deleteOldFilesTimer =  60 * 1; 


config.maxFileTransfer =  4 - 1; 


module.exports = config;