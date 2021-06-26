var config = {};

config.enableTelegramNotifications =  true; 

config.telegramUsers = [];
config.telegramUsers.push('121212');
config.telegramUsers.push('1221212');
config.telegramUsers.push('121212');

config.telegramToken =  '121212'; 


config.landingZone = '/Users/xxx/location1/';


config.hardDisks = [];
config.hardDisks.push('/Users/xxx/location2/');
config.hardDisks.push('/Users/xxx/location2/');
config.hardDisks.push('/Users/xxx/location2/');


config.fileExclusions = [];
config.fileExclusions.push('.plot.tmp');
config.fileExclusions.push('.test');

config.minimumDiskSizeInGB = 5;
config.minimumFreeSizeInGB =  1; 

config.MD5HashCalculation =  false; 



module.exports = config;