const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('pet',{
 command:(type,value)=>ipcRenderer.invoke('pixel-command',{type,value}),
 bounds:value=>ipcRenderer.send('pixel-bounds',value),
 on:(name,fn)=>{if(['open-assistant','voice-play','voice-stop','config','settings','summon','home','activity','action','pointer','cancel','area','speaking','preview'].includes(name))ipcRenderer.on(name,(_e,v)=>fn(v));}
});
