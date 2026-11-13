const {app,BrowserWindow,ipcMain,globalShortcut,screen,Menu,Tray,nativeImage,dialog}=require('electron');
const fs=require('fs'),path=require('path'),os=require('os'),{execFile}=require('child_process');
const {processQuery,hasChatGPT,loginSettings}=require('./platform');
const C=require('./config'),Store=require('./store'),{describe}=require('./activity');
app.setName('Pixel');
const smokeTest=process.argv.includes('--smoke-test');if(smokeTest){const dir=path.join(os.tmpdir(),'pixel-smoke-'+process.pid);fs.mkdirSync(dir,{recursive:true});app.setPath('userData',dir);}
const root=app.getPath('userData'),eventsDir=path.join(root,'events'),store=new Store(root);fs.mkdirSync(eventsDir,{recursive:true});
let win,settingsWin,tray,area,speaking=null,lastVoice=0,lastClip='',hitboxes=[],mode={},interactive=false,dragSince=0,chatWasOpen=false,shutting=false,pendingActivity,lastActivity=0,menuOpen=false;
const shortcut=process.platform==='darwin'?'⌘⇧':'Ctrl+Shift+';let startupError='';
let lastRealActivity=null;
const timers=[];const phrases={greeting:'Oi, chefe! Bora trabalhar? Tô aqui com você.',hit:'Eita! Calma, chefe!',hit2:'Opa, opa! Eu sou pequeno, mas tenho sentimentos!',run:'Eu já tô indo trabalhar!',scratch:'Ai ai tá doendo tudo! Pega leve, chefe!',work:'Vou sentar um pouquinho e terminar essa tarefa.',done:'Prontinho! A resposta ficou pronta. Dá uma olhada no chat.',attention:'O chat precisa da sua aprovação.',arrive:'Cheguei, chefe!',wave:'Oi! Tô passando só pra dar um alô.',sleep:'Acho que vou tirar um cochilo rapidinho... me chama quando precisar.',stretch:'Ah... nada como uma boa espreguiçada. Agora sim!',dance:'Opa! Pausa pra dancinha da vitória!',coffee:'Um cafezinho agora ia cair bem, hein, chefe?'};
Object.assign(phrases,require('./voices/catalog.json'));
const LocalAssistant=require('./local-assistant'),{parseAction,executable}=require('./assistant-actions');
const local=new LocalAssistant(root,app.isPackaged?path.join(process.resourcesPath,'local-assistant'):path.join(__dirname,'../local-assistant'));
let conversationBusy=false,conversationGeneration=0,pendingLocalVoice=null;
const ActivityQueue=require('./activity-queue'),activityQueue=new ActivityQueue();let importantQueue=[];
const cfg=()=>store.data.settings;
function queueImportant(key,tag){if(!importantQueue.some(x=>x.key===key&&x.tag===tag))importantQueue.push({key,tag,time:Date.now()});importantQueue=importantQueue.slice(-8);}
function drainImportant(){if(speaking)return;if(!cfg().audio.voice||!cfg().integration.enabled||!cfg().integration.sound){importantQueue=[];return;}let item;while((item=importantQueue.shift())){if(item.key==='done'&&(!cfg().audio.completion||!cfg().integration.completed))continue;if(item.key==='attention'&&!cfg().integration.waiting)continue;if(Date.now()-item.time<90000){speak(item.key,{important:true,tag:item.tag});break;}}}

function send(name,value){if(win&&!win.isDestroyed())win.webContents.send(name,value);}
function stopVoice(clearPending=true){if(clearPending){importantQueue=[];pendingLocalVoice=null;}speaking=null;send('voice-stop');send('speaking',false);}
function speak(key,{ambient=false,test=false,important=false,tag='',text:customText}={}){const c=cfg(),original=phrases[key]||(typeof customText==='string'?customText.slice(0,240):null),text=original&&C.adapt(original,c);if(speaking){if(important)queueImportant(key,tag);return;}if(!text||!c.audio.voice||c.audio.voiceVolume===0||C.blocked(text,c))return;if(ambient&&c.audio.spontaneous==='off')return;const gap=test?0:ambient?(c.audio.spontaneous==='rare'?90000:35000):['hit','hit2','scratch'].includes(key)?2200:9000;if(!test&&!important&&(Date.now()-lastVoice<gap||key===lastClip&&Date.now()-lastVoice<30000))return;const file=key&&path.join(__dirname,'voices',key+'.mp3');const cached=file&&fs.existsSync(file)&&text===original;stopVoice(false);lastVoice=Date.now();lastClip=key||text;speaking=key||'system';send('voice-play',{key:cached?key:null,text,volume:c.audio.voiceVolume,showBalloon:important?c.integration.balloon:true,ambient});}
function startupFlags(){if(smokeTest||!app.isPackaged)return;try{app.setLoginItemSettings(loginSettings(cfg().general));startupError='';}catch(error){startupError='O sistema não permitiu configurar a inicialização: '+error.message;}}
function display(){const ds=screen.getAllDisplays();return ds.find(d=>String(d.id)===cfg().territory.display)||screen.getPrimaryDisplay();}
function layout(){const next=display().workArea;if(!area||JSON.stringify(area)!==JSON.stringify(next)){area=next;win.setBounds(area);send('area',area);}}
function snapshot(){return {...store.data,lastRealActivity,localAssistant:local.status(),voiceClips:Object.entries(phrases).filter(([key])=>fs.existsSync(path.join(__dirname,'voices',key+'.mp3'))).map(([key,text])=>({key,text})),platform:process.platform,startupError,packaged:app.isPackaged,canUndoImport:fs.existsSync(path.join(root,'before-last-import.json')),displays:screen.getAllDisplays().map(d=>({id:String(d.id),label:(d.label||'Monitor')+' · '+d.size.width+'×'+d.size.height})),hookStatus:fs.existsSync(path.join(root,'last-real-event'))?'Já recebeu eventos locais.':'Aguardando eventos locais. Revise os hooks em Configurações → Hooks no ChatGPT/Codex.'};}
function changed(){store.save();startupFlags();if(!cfg().audio.voice||cfg().audio.voiceVolume===0)stopVoice();layout();send('config',cfg());if(settingsWin&&!settingsWin.isDestroyed())settingsWin.webContents.send('settings',snapshot());if(store.data.active==='Gravação'&&cfg().general.recordingHide)win.hide();else win.showInactive();refreshMenu();}
function showConversation(){showSettings();if(settingsWin.webContents.isLoading())settingsWin.webContents.once('did-finish-load',()=>settingsWin.webContents.send('open-assistant'));else settingsWin.webContents.send('open-assistant');}
function showSettings(){if(settingsWin&&!settingsWin.isDestroyed()){settingsWin.show();settingsWin.focus();return;}settingsWin=new BrowserWindow({width:930,height:760,minWidth:810,minHeight:600,title:'Configurações do Pixel',backgroundColor:'#101522',webPreferences:{preload:path.join(__dirname,'preload.js'),sandbox:true,contextIsolation:true,nodeIntegration:false}});secure(settingsWin);settingsWin.loadFile(path.join(__dirname,'settings.html'));settingsWin.on('closed',()=>settingsWin=null);}
function secure(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());w.webContents.on('render-process-gone',(_e,info)=>fs.appendFileSync(path.join(root,'errors.log'),JSON.stringify(info)+'\n'));w.webContents.on('console-message',(_e,level,message)=>{if(level>=3)fs.appendFileSync(path.join(root,'errors.log'),message+'\n');});}
function action(name){send('action',name);}
function template(){return [
 {label:'Conversar com o Pixel…',accelerator:'CommandOrControl+Shift+P',click:showConversation},
 {label:'Configurações do Pixel…',accelerator:'CommandOrControl+Shift+,',click:showSettings},
 {label:'Perfis',submenu:[...Object.entries({work:'Trabalho',fun:'Resenha',recording:'Gravação',company:'Companhia',assistant:'Assistente'}).map(([id,label])=>({label,type:'radio',checked:store.data.active===label,click:()=>{store.apply(id);changed();if(id==='recording')send('home');}})),...store.data.profiles.map(p=>({label:p.name,click:()=>{store.apply(p.id);changed();}})),{label:'Sair de Gravação e restaurar anterior',enabled:!!store.data.previous,click:()=>{store.apply('restore');changed();}}]},
 {label:'Cuidar e brincar',submenu:Object.entries({coffee:'Dar café',biscuit:'Dar biscoito',petting:'Fazer carinho',praise:'Elogiar',wave:'Acenar',dance:'Dançar',sleep:'Cochilar',stretch:'Espreguiçar',duck:'Reunião com o pato',portal:'Visita de outro Pixel',trip:'Pixel quebrado',patience:'Teste de paciência',inspector:'Fiscal de cliques',rh:'Chamar o RH'}).map(([k,label])=>({label,enabled:!cfg().behavior.disabled.includes(k),click:()=>action(k)}))},
 {label:'Voltar para casa',click:()=>{win.showInactive();send('home');}},
 {label:'Ficar aqui',type:'checkbox',checked:cfg().territory.mode==='fixed',click:()=>{store.patch({territory:{mode:'fixed'}});changed();}},
 {label:'Pode passear',click:()=>{store.patch({territory:{mode:'free'},behavior:{wander:true,focus:false}});changed();}},
 {label:'Volume da voz',submenu:[.25,.5,.7,1].map(v=>({label:Math.round(v*100)+'%',type:'radio',checked:Math.abs(cfg().audio.voiceVolume-v)<.01,click:()=>{store.patch({audio:{voiceVolume:v}});changed();}}))},
 {label:'Modo foco',type:'checkbox',checked:cfg().behavior.focus,click:i=>{store.patch({behavior:{focus:i.checked}});changed();}},
 {label:'Poucas brincadeiras',type:'checkbox',checked:cfg().behavior.frequency==='low',click:i=>{store.patch({behavior:{frequency:i.checked?'low':'normal'}});changed();}},
 {label:'Voz',type:'checkbox',checked:cfg().audio.voice,click:i=>{store.patch({audio:{voice:i.checked}});changed();}},
 {label:'Mostrar / ocultar ('+shortcut+'M)',click:()=>win.isVisible()?win.hide():win.showInactive()},
 {label:'Chega aqui! ('+shortcut+'J)',click:summon}, {type:'separator'},{label:'Sair do Pixel',click:()=>app.quit()}];}
function refreshMenu(){const m=Menu.buildFromTemplate(template());if(tray)tray.setContextMenu(m);if(app.dock)app.dock.setMenu(m);}
function summon(){const p=screen.getCursorScreenPoint();win.showInactive();send('summon',{x:p.x-area.x,y:p.y-area.y});}
function greet(){if(!cfg().behavior.greetings)return;send('activity',{text:phrases.greeting,kind:'greeting',animation:true,balloon:true});if(cfg().audio.greetings)speak('greeting');}
function inspectChat(){const q=processQuery();execFile(q.file,q.args,{timeout:3000,maxBuffer:4*1024*1024,windowsHide:true},(err,out)=>{if(err||shutting)return;const live=hasChatGPT(out);if(live&&!chatWasOpen){if(cfg().general.startWithChatGPT&&store.data.active!=='Gravação')win.showInactive();if(Date.now()-lastVoice>15000)greet();}chatWasOpen=live;});}
function readEvents(){try{for(const name of fs.readdirSync(eventsDir).filter(n=>/^\d+-[a-f0-9]+\.json$/.test(n)).sort()){const file=path.join(eventsDir,name);try{if(fs.statSync(file).size<8192){const e=JSON.parse(fs.readFileSync(file,'utf8'));if(Date.now()/1000-e.time<20&&e.time<=Date.now()/1000+5){const m=describe(e);if(m){fs.writeFileSync(path.join(root,'last-real-event'),String(Date.now()));activityQueue.push(m);lastRealActivity={text:m.text,kind:m.kind,time:Date.now()};}}}}catch{}finally{try{fs.unlinkSync(file)}catch{}}}if(Date.now()-lastActivity>2200){const m=activityQueue.next();if(!m)return;lastActivity=Date.now();const c=cfg(),i=c.integration;if(!i.enabled||!i[m.category])return;send('activity',{...m,animation:i.animation&&(m.kind!=='done'||c.behavior.celebrate),balloon:i.balloon});if(i.sound&&m.voice&&(m.kind!=='done'||c.audio.completion))speak(m.voiceKey||m.kind,{important:true,tag:m.taskKey});}}catch{}}
function interactiveMode(value){if(value!==interactive){interactive=value;win.setIgnoreMouseEvents(!value,{forward:true});}}
function poll(){if(menuOpen)return;const p=screen.getCursorScreenPoint(),x=p.x-area.x,y=p.y-area.y;send('pointer',{x,y});if(mode.drag&&Date.now()-dragSince>26000){mode.drag=false;send('cancel');}const inside=hitboxes.some(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);interactiveMode(win.isVisible()&&!mode.ride&&(mode.drag||inside));}
function assistantCommand(value){const text=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();let reply;
 if(/^(status|o que esta fazendo|o que voce esta fazendo|andamento)$/.test(text)){reply=lastRealActivity?'Último evento real: '+lastRealActivity.text:'Ainda não recebi eventos do chat. Revise a integração em Trabalho real.';}
 else if(/^(foco|trabalho|modo foco)$/.test(text)){store.apply('work');changed();reply='Modo foco ativado, chefe.';}
 else if(/^(resenha|brincar)$/.test(text)){store.apply('fun');changed();reply='Modo Resenha ativado.';}
 else if(/^(assistente|jarvis|modo assistente)$/.test(text)){store.apply('assistant');changed();reply='Modo assistente ativado. Estou acompanhando os eventos disponíveis.';}
 else if(/^(silencio|silenciar|calar|mudo)$/.test(text)){store.patch({audio:{voice:false,effects:false}});changed();reply='Voz e efeitos silenciados.';}
 else if(/^(falar|ativar voz|voz)$/.test(text)){store.patch({audio:{voice:true}});changed();reply='Voz ativada.';}
 else if(/^(casa|voltar para casa)$/.test(text)){send('home');reply='Voltando para meu canto.';}
 else if(/^(aqui|vem aqui|chega aqui)$/.test(text)){summon();reply='Cheguei, chefe.';}
 else if(/^(cafe|dar cafe)$/.test(text)){action('coffee');return 'Café a caminho.';}
 else if(/^(ocultar|esconder)$/.test(text)){win.hide();reply='Fiquei oculto. Use o menu da barra do sistema para me chamar.';}
 else return null;
 send('activity',{text:reply,kind:'ready',animation:false,balloon:true});return reply;
}
function playLocalVoice(message){if(!cfg().audio.voice||cfg().audio.voiceVolume===0)return;if(speaking){pendingLocalVoice=message;return;}speaking='local';send('voice-play',{...message,volume:cfg().audio.voiceVolume});}
async function converse(value){
 if(conversationBusy)throw Error('Aguarde a resposta atual.');
 const text=typeof value==='string'?value.trim():'';if(!text||text.length>1000)throw Error('Digite de 1 a 1000 caracteres.');
 conversationBusy=true;const generation=conversationGeneration;
 try{
  let reply=assistantCommand(text);const proposed=reply?null:parseAction(text);
  if(proposed){const result=await dialog.showMessageBox(settingsWin,{type:'question',message:'Abrir '+proposed.label+'?',detail:'Pedido reconhecido: “'+text+'”',buttons:['Cancelar','Abrir aplicativo'],defaultId:0,cancelId:0});if(result.response===1){const cmd=executable(proposed.id);await new Promise((resolve,reject)=>execFile(cmd.file,cmd.args,{timeout:10000,windowsHide:true},err=>err?reject(err):resolve()));reply='Solicitei a abertura de '+proposed.label+'.';}else reply='Certo, cancelei a abertura.';}
  if(!reply)reply=(await local.request('/chat',{text,context:lastRealActivity?.text||'Nenhum evento recebido.'})).reply;
  if(generation!==conversationGeneration)return {cancelled:true};
  send('activity',{text:reply,kind:'ready',animation:false,balloon:true});
  let voiceError='';
  if(cfg().audio.voice&&cfg().audio.voiceVolume>0&&!C.blocked(reply,cfg())){try{const result=await local.request('/speech',{text:reply});if(generation===conversationGeneration&&cfg().audio.voice){playLocalVoice({audio:result.audio,text:reply});}}catch(e){voiceError=e.message;}}
  return {reply,voiceError};
 }finally{conversationBusy=false;}
}
ipcMain.handle('pixel-command',async(e,request)=>{const isSettings=settingsWin&&e.sender===settingsWin.webContents,isPet=win&&e.sender===win.webContents;if(!isSettings&&!isPet)return null;const {type,value}=request||{};if(type==='get')return snapshot();if(type==='ready'&&isPet){if(smokeTest){setTimeout(()=>{process.stdout.write(JSON.stringify({smoke:'passed',clips:snapshot().voiceClips.length,name:cfg().identity.name,scale:cfg().appearance.scale})+'\n');app.exit(0);},1500);}else if(win.isVisible())greet();return;}if(type==='voice-ended'&&isPet){speaking=null;send('speaking',false);drainImportant();if(!speaking&&pendingLocalVoice){const message=pendingLocalVoice;pendingLocalVoice=null;playLocalVoice(message);}return;}if(type==='menu'&&isPet){menuOpen=true;interactiveMode(true);Menu.buildFromTemplate(template()).popup({window:win,callback:()=>{menuOpen=false;}});return;}if(type==='speech'&&isPet){speak(value?.key,{ambient:value?.ambient,text:value?.text});return;}if(type==='stopVoice'&&isPet){stopVoice();return;}if(type==='state'&&isPet){if(value?.memory&&typeof value.memory==='object')store.data.memory=value.memory;if(value?.position&&Number.isFinite(value.position.x)&&Number.isFinite(value.position.y))store.data.position={x:value.position.x,y:value.position.y};store.save();return;}if(!isSettings)return;
 try{switch(type){case 'patch':store.patch(value);changed();break;case 'reset':if(value==='all'){const r=await dialog.showMessageBox(settingsWin,{type:'question',message:'Restaurar todas as configurações do Pixel?',detail:'Seus perfis salvos e os áudios serão preservados.',buttons:['Cancelar','Restaurar'],cancelId:0,defaultId:0});if(r.response!==1)break;store.data.settings=C.clone(C.defaults);store.data.active='Personalizado';store.data.previous=null;}else if(C.defaults[value])store.data.settings[value]=C.clone(C.defaults[value]);changed();break;
 case 'assistantCommand':return {reply:assistantCommand(value)||'Use o campo de conversa para perguntas livres.'};
 case 'converse':return await converse(value);
 case 'localStatus':return local.status();
 case 'transcribe':{if(typeof value!=='string'||value.length>1400000)throw Error('Gravação grande demais.');return await local.request('/transcribe',{audio:value});}
 case 'assistantReset':conversationGeneration++;local.stop();stopVoice();return {cleared:true};
 case 'microphone':return process.platform==='darwin'?{granted:await require('electron').systemPreferences.askForMediaAccess('microphone')}:{granted:true};
 case 'test':send('action',value||'coffee');send('preview',value||'coffee');break;case 'voice':speak(Object.hasOwn(phrases,value)?value:'wave',{test:true});break;case 'voiceStop':stopVoice();break;
 case 'profile':store.apply(value);changed();if(value==='recording')send('home');break;
 case 'saveProfile':{const name=String(value?.name||'Meu perfil').trim().slice(0,40);if(value?.id){const p=store.data.profiles.find(p=>p.id===value.id);if(p)p.settings=C.clone(cfg());}else if(store.data.profiles.length<40)store.data.profiles.push({id:String(Date.now()),name,settings:C.clone(cfg())});store.data.active=name;changed();break;}
 case 'renameProfile':{const p=store.data.profiles.find(p=>p.id===value?.id);if(p){const previous=p.name;p.name=String(value.name||p.name).trim().slice(0,40);if(store.data.active===previous)store.data.active=p.name;}changed();break;}
 case 'duplicateProfile':{const p=store.data.profiles.find(p=>p.id===value);if(p&&store.data.profiles.length<40)store.data.profiles.push({id:String(Date.now()),name:p.name+' (cópia)',settings:C.clone(p.settings)});changed();break;}
 case 'export':{const r=await dialog.showSaveDialog(settingsWin,{defaultPath:'Pixel-perfis.json',filters:[{name:'Perfis Pixel',extensions:['json']}]});if(!r.canceled)fs.writeFileSync(r.filePath,JSON.stringify(store.export(),null,2));break;}
 case 'undoImport':store.undoImport();changed();break;
 case 'import':{const r=await dialog.showOpenDialog(settingsWin,{properties:['openFile'],filters:[{name:'Perfis Pixel',extensions:['json']}]});if(!r.canceled){if(fs.statSync(r.filePaths[0]).size>500000)throw Error('Arquivo grande demais.');store.import(JSON.parse(fs.readFileSync(r.filePaths[0],'utf8')));changed();}break;}
 }return snapshot();}catch(error){return {error:error.message};}});
ipcMain.on('pixel-bounds',(e,v)=>{if(!win||e.sender!==win.webContents)return;hitboxes=Array.isArray(v?.boxes)?v.boxes.filter(b=>b&&['x','y','w','h'].every(k=>Number.isFinite(b[k]))).slice(0,2):[];if(v.drag&&!mode.drag)dragSince=Date.now();mode={drag:v.drag===true,ride:v.ride===true};});
if(!app.requestSingleInstanceLock())app.quit();else{
 app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');app.on('second-instance',()=>win?.showInactive());
 app.whenReady().then(()=>{require('electron').session.defaultSession.setPermissionRequestHandler((contents,permission,callback,details)=>callback(!!(settingsWin&&contents===settingsWin.webContents&&permission==='media'&&details.mediaTypes?.every(t=>t==='audio'))));if(smokeTest)setTimeout(()=>{process.stderr.write('Renderer smoke test timed out\n');app.exit(1);},15000);area=display().workArea;win=new BrowserWindow({...area,title:'Pixel',show:!smokeTest&&!process.argv.includes('--watch-chatgpt'),transparent:true,frame:false,hasShadow:false,resizable:false,focusable:false,alwaysOnTop:true,backgroundColor:'#00000000',webPreferences:{preload:path.join(__dirname,'preload.js'),sandbox:true,contextIsolation:true,nodeIntegration:false}});win.setAlwaysOnTop(true,'floating');if(process.platform==='darwin')win.setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:true});win.setIgnoreMouseEvents(true,{forward:true});secure(win);win.loadFile(path.join(__dirname,'index.html'));win.webContents.once('did-finish-load',()=>{startupFlags();if(store.data.active==='Gravação'&&cfg().general.recordingHide)win.hide();chatWasOpen=true;inspectChat();timers.push(setInterval(readEvents,700),setInterval(inspectChat,4000));});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Pixel',submenu:[{label:'Conversar com o Pixel…',accelerator:'CommandOrControl+Shift+P',click:showConversation},{label:'Configurações…',click:showSettings},{type:'separator'},{role:'quit'}]},{role:'editMenu'},{role:'windowMenu'}]));
 const icon=nativeImage.createFromPath(path.join(__dirname,'../assets/tray.png')).resize({width:20,height:20});tray=new Tray(icon);if(process.platform==='darwin')tray.setTitle('Pixel');tray.setToolTip('Pixel — configurações e mostrar mascote');refreshMenu();
 timers.push(setInterval(poll,32));for(const ev of ['display-added','display-removed','display-metrics-changed'])screen.on(ev,layout);
 if(!smokeTest)globalShortcut.register('CommandOrControl+Shift+P',showConversation);if(!smokeTest)globalShortcut.register('CommandOrControl+Shift+M',()=>win.isVisible()?win.hide():win.showInactive());if(!smokeTest)globalShortcut.register('CommandOrControl+Shift+J',summon);if(!smokeTest)globalShortcut.register('CommandOrControl+Shift+,',showSettings);app.on('activate',()=>win.showInactive());
 });app.on('window-all-closed',()=>app.quit());app.on('will-quit',()=>{shutting=true;local.stop();timers.forEach(clearInterval);stopVoice();store.save();globalShortcut.unregisterAll();});
}
