const PixelConfig=(()=>{
const scenes=['wave','sleep','stretch','dance','coffee','biscuit','petting','praise','trip','duck','portal','patience','inspector','rh','wash','decoy'];
const defaults={
 appearance:{scale:1.5,palette:'blue',customColor:'#5269c5',theme:'original',accessories:[],daily:false,favorites:['glasses','tie'],shadow:true,particles:true},
 personality:{drama:1,affection:1,sarcasm:0,curiosity:1,energy:1},
 identity:{name:'Pixel',addressMode:'original',address:'',slang:'moderate',favorites:[],blocked:[]},
 audio:{voice:true,effects:true,voiceVolume:.7,effectsVolume:.6,spontaneous:'rare',greetings:true,completion:true},
 balloons:{enabled:true,fontSize:13,duration:1,contrast:false,spontaneous:true},
 behavior:{wander:true,gaze:true,ride:true,clicks:true,whip:true,playful:true,accessories:true,greetings:true,celebrate:true,frequency:'normal',speed:'normal',rare:'occasional',reduced:false,focus:false,favorites:[],disabled:[]},
 territory:{corner:'bottom-right',mode:'free',region:'full',display:'auto',edge:12,remember:true,left:0,top:0,width:100,height:100},
 integration:{enabled:true,start:true,ongoing:true,waiting:true,completed:true,attention:true,animation:true,balloon:true,sound:true},
 general:{startWithMac:false,startWithChatGPT:false,recordingHide:false}
};
const enums={
 'appearance.scale':[1,1.5,2,3],'appearance.palette':['blue','green','pastel','neon','quiet','custom'],'appearance.theme':['original','office','pajamas','gamer','inventor','assistant'],
 'identity.addressMode':['original','name','chief','boss','none'],'identity.slang':['discreet','moderate','informal'],
 'audio.spontaneous':['off','rare','normal'],'behavior.frequency':['low','normal','high'],'behavior.speed':['calm','normal','lively'],'behavior.rare':['off','occasional','frequent'],
 'territory.corner':['bottom-right','bottom-left','top-right','top-left'],'territory.mode':['free','fixed'],'territory.region':['full','bottom','left','right','custom']
};
const ranges={'audio.voiceVolume':[0,1],'audio.effectsVolume':[0,1],'balloons.fontSize':[11,20],'balloons.duration':[.5,2.5],'territory.edge':[4,100],'territory.left':[0,90],'territory.top':[0,90],'territory.width':[10,100],'territory.height':[10,100]};
const accessoryKeys=['cap','glasses','tie','helmet','headphones','mug'];
function clone(v){return JSON.parse(JSON.stringify(v));}
function validate(input){const out=clone(defaults);if(!input||typeof input!=='object')return out;
 for(const [cat,def]of Object.entries(defaults)){const src=input[cat];if(!src||typeof src!=='object')continue;
  for(const [key,d]of Object.entries(def)){const path=cat+'.'+key,v=src[key];if(v===undefined)continue;
   if(enums[path]){if(enums[path].includes(v))out[cat][key]=v;continue;}
   if(typeof d==='boolean'){if(typeof v==='boolean')out[cat][key]=v;}
   else if(typeof d==='number'){if(typeof v==='number'&&Number.isFinite(v)){const range=cat==='personality'?[0,2]:ranges[path];out[cat][key]=range?Math.max(range[0],Math.min(range[1],cat==='personality'?Math.round(v):v)):d;}}
   else if(Array.isArray(d)){if(Array.isArray(v)){const list=v.filter(x=>typeof x==='string').map(x=>x.trim().slice(0,140)).filter(Boolean).slice(0,24);const valid=cat==='appearance'?accessoryKeys:cat==='behavior'?scenes:null;out[cat][key]=[...new Set(valid?list.filter(x=>valid.includes(x)):list)];}}
   else if(typeof d==='string'&&typeof v==='string'){out[cat][key]=v.replace(/[\u0000-\u001f]/g,'').slice(0,key==='name'?30:60);}
  }
 }
 if(!/^#[0-9a-f]{6}$/i.test(out.appearance.customColor))out.appearance.customColor=defaults.appearance.customColor;
 if(!out.identity.name.trim())out.identity.name='Pixel';
 out.territory.width=Math.min(out.territory.width,100-out.territory.left);out.territory.height=Math.min(out.territory.height,100-out.territory.top);
 return out;
}
function patch(current,changes){const v=clone(validate(current));for(const k of Object.keys(defaults))if(changes&&changes[k]&&typeof changes[k]==='object')Object.assign(v[k],changes[k]);return validate(v);}
function preset(name,current){const changes={
 assistant:{behavior:{focus:true,frequency:'low',reduced:true},audio:{spontaneous:'rare'}},
 work:{behavior:{focus:true,frequency:'low',speed:'calm',reduced:true},audio:{spontaneous:'off'},balloons:{spontaneous:false}},
 fun:{personality:{drama:2,affection:1,sarcasm:1,energy:2},behavior:{focus:false,frequency:'high',rare:'frequent',speed:'lively',reduced:false},audio:{spontaneous:'normal'},balloons:{spontaneous:true}},
 recording:{audio:{voice:false,effects:false},behavior:{focus:true,wander:false},balloons:{enabled:false}},
 company:{personality:{drama:0,affection:2,sarcasm:0,energy:0},behavior:{focus:false,frequency:'low',speed:'calm',rare:'occasional',reduced:false},audio:{spontaneous:'rare'},balloons:{spontaneous:true}}
 };return changes[name]?patch(current,changes[name]):validate(current);}
function adapt(text,c){const i=c.identity;let t=text.replace(/\bPixel\b/g,i.name);if(i.addressMode==='name')t=t.replace(/chefe|patrão/gi,i.address||'você');if(i.addressMode==='chief')t=t.replace(/patrão/gi,'chefe');if(i.addressMode==='boss')t=t.replace(/chefe/gi,'patrão');if(i.addressMode==='none')t=t.replace(/,?\s*(chefe|patrão)([!?.,])?/gi,(_a,_b,p)=>p||'');if(i.slang==='discreet')t=t.replace(/\btô\b/gi,'estou').replace(/\btá\b/gi,'está').replace(/\bpra\b/gi,'para').replace(/\bbora\b/gi,'vamos');if(i.slang==='informal')t=t.replace(/\bVamos\b/g,'Bora').replace(/\bEstou\b/g,'Tô').replace(/\bpara\b/g,'pra');return t;}
function blocked(text,c){return c.identity.blocked.some(s=>text.toLocaleLowerCase('pt-BR').includes(s.toLocaleLowerCase('pt-BR')));}
function cleanImport(data){if(!data||data.format!=='pixel-profiles'||data.version!==1||!Array.isArray(data.profiles)||data.profiles.length>40)throw Error('Arquivo de perfis inválido. Use um arquivo exportado pelo Pixel.');return data.profiles.map(p=>{if(!p||typeof p.name!=='string'||!p.settings||typeof p.settings!=='object')throw Error('Há um perfil inválido no arquivo.');return{name:p.name.trim().slice(0,40)||'Perfil importado',settings:validate(p.settings)};});}
return{defaults,enums,ranges,accessoryKeys,scenes,clone,validate,patch,preset,adapt,blocked,cleanImport};
})();
if(typeof module!=='undefined')module.exports=PixelConfig;
