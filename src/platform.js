const path=require('path');
function processQuery(platform=process.platform,env=process.env){if(platform==='win32')return {file:path.win32.join(env.SystemRoot||'C:\\Windows','System32','tasklist.exe'),args:['/FO','CSV','/NH','/FI','IMAGENAME eq ChatGPT.exe']};return {file:'/bin/ps',args:['-axo','comm']};}
function hasChatGPT(output,platform=process.platform){if(platform==='win32')return output.split(/\r?\n/).some(line=>/^"ChatGPT\.exe",/i.test(line.trim()));return output.split('\n').some(line=>/\/ChatGPT\.app\/Contents\/MacOS\/ChatGPT$/.test(line.trim()));}
function loginSettings(general,executable=process.execPath){const watch=general.startWithChatGPT&&!general.startWithMac;return{openAtLogin:general.startWithMac||general.startWithChatGPT,path:executable,args:watch?['--watch-chatgpt']:[],openAsHidden:watch};}
module.exports={processQuery,hasChatGPT,loginSettings};
