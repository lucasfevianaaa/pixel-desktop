/* Deterministic scene controller. No filesystem, OS input or network access. */
const PC=typeof module!=='undefined'?require('./config'):PixelConfig;
const dialogueData=typeof module!=='undefined'?require('./dialogue'):{PIXEL_LINES,PIXEL_AUDIO};
const DIRECT_STATES=new Set(['hit','run','scratch','ride','drag','move_box','move_mug','move_measure','coffee','biscuit','petting','praise','decoy_fetch','decoy_leave','peek','inspector','rh','patience','look']);
const SCENES=new Set(['wave','sleep','stretch','dance','coffee','biscuit','petting','praise','trip','duck','portal','patience','inspector','rh','wash','decoy']);
class PetModel{
 constructor(w,h,random=Math.random){
  this.w=w;this.h=h;this.random=random;this.x=w*.7;this.y=h*.76;this.dir=1;this.facing='front';
  this.time=0;this.wall=Date.now()/1000;this.state='idle';this.started=0;this.until=2;this.target={x:this.x,y:this.y};
  this.text='';this.textUntil=0;this.textSource='scene';this.events=[];this.hits=0;this.lastHit=-10000;this.clicks=[];
  this.config=PC.validate({});this.settings={...this.config.behavior,paused:false,cursorRide:true};this.ambient=false;this.memory={coffeeAt:0,praiseAt:0,scareAt:0,drags:[],cupDirty:false};
  this.nextMood=16;this.nextRare=100;this.nextRide=0;this.nextMove=0;this.nextDecoy=0;this.nextInspector=0;this.nextRh=0;
  this.pointer=null;this.pointerSpeed=0;this.handDwell=0;this.rideDistance=0;this.rideStopped=0;
  this.press=null;this.decoy=null;this.pendingActivity=null;this.activityUntil=0;this.activityScene=null;this.lastActivityScene='work';this.lastVariant={};this.nextMemory=0;
 }
 get now(){return this.wall+this.time;}
 get scale(){return this.config.appearance.scale;}
 get dragging(){return this.state==='drag';}
 get riding(){return this.state==='ride';}
 get age(){return this.time-this.started;}
 get confident(){return this.now-this.memory.praiseAt<150;}
 get caffeinated(){return this.now-this.memory.coffeeAt<100;}
 get scared(){return this.now-this.memory.scareAt<70;}
 restore(memory){if(!memory||typeof memory!=='object')return;for(const k of ['coffeeAt','praiseAt','scareAt'])if(Number.isFinite(memory[k])&&memory[k]<=this.now+5)this.memory[k]=memory[k];this.memory.cupDirty=memory.cupDirty===true;this.memory.drags=Array.isArray(memory.drags)?memory.drags.filter(n=>Number.isFinite(n)&&n>this.now-600&&n<=this.now).slice(-8):[];}
 snapshot(){return {...this.memory,drags:this.memory.drags.filter(t=>t>this.now-600).slice(-8)};}
 bounds(){const k=this.scale;return{x:this.x-22*k,y:this.y-54*k,w:44*k,h:56*k};}
 hand(){return{x:this.x+this.dir*20*this.scale,y:this.y-38*this.scale};}
 contains(x,y,b=this.bounds()){return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;}
 decoyBounds(){return this.decoy?{x:this.decoy.x-25,y:this.decoy.y-72,w:50,h:76}:null;}
 territory(){const c=this.config.territory,k=this.scale,props=['portal','duck','rh','inspector','repair','wash','move_mug','move_measure','deliver','patience'].includes(this.state),m=c.edge+(props?56:24)*k;let x=0,y=0,w=this.w,h=this.h;if(c.region==='bottom'){y=h*.65;h*=.35;}if(c.region==='left')w*=.5;if(c.region==='right'){x=w*.5;w*=.5;}if(c.region==='custom'){x=this.w*c.left/100;y=this.h*c.top/100;w=this.w*c.width/100;h=this.h*c.height/100;}const left=Math.min(this.w-m,x+Math.min(m,w/2)),right=Math.max(left,Math.min(this.w-m,x+w-Math.min(m,w/2)));return{left,right,top:Math.min(this.h-10,Math.max(100,y+(this.state==='patience'?80:56)*k+c.edge)),bottom:Math.max(100,Math.min(this.h-c.edge-3,y+h-c.edge-3))};}
 clamp(){const b=this.territory();this.x=Math.max(b.left,Math.min(b.right,this.x));this.y=Math.max(Math.min(b.top,b.bottom),Math.min(b.bottom,this.y));}
 home(){const b=this.territory(),c=this.config.territory.corner;this.x=c.endsWith('left')?b.left:b.right;this.y=c.startsWith('top')?b.top:b.bottom;this.enter('idle',3);this.clamp();}
 configure(config){this.config=PC.validate(config);this.settings={...this.config.behavior,paused:this.config.territory.mode==='fixed',cursorRide:this.config.behavior.ride};if(this.settings.focus||this.settings.paused||!this.settings.wander){if(['walk','sleep','wave','dance','duck','portal','trip'].includes(this.state))this.enter('idle',2);}if((!this.settings.cursorRide||this.settings.focus||this.settings.reduced||this.settings.paused)&&this.riding)this.releaseRide();if(this.settings.disabled.includes(this.state))this.enter('idle',2);this.clamp();}
 permitted(key){return !this.settings.disabled.includes(key);}
 line(key,forceFirst=false){let a=dialogueData.PIXEL_LINES[key]||[key];const p=this.config.personality;if(key==='coffee'){a=p.sarcasm===2?['Agora o departamento volta a funcionar.']:p.drama===2?["Finalmente, condições mínimas de trabalho. O departamento voltou a funcionar!"]:p.affection===2?['Você lembrou de mim!']:a;}if(key==='hit'&&p.drama===0)a=['Opa! Vamos com calma.'];if(key==='hit'&&p.drama===2)a=[...a,'Vou registrar esse incidente no RH!'];if(key==='praise'&&p.affection===2)a=['Ganhei meu dia, chefe!'];if(p.sarcasm>0&&key==='work')a=[...a,'Produtividade subiu. O salário continua em pixels.'];if(this.config.identity.favorites.length&&this.random()<.18&&!['hit','scratch'].includes(key))a=this.config.identity.favorites;let choices=a.filter(t=>!PC.blocked(t,this.config));if(!choices.length){this.text='';return;}let i=forceFirst?0:Math.floor(this.random()*choices.length);if(choices.length>1&&i===this.lastVariant[key]&&!forceFirst)i=(i+1)%choices.length;this.lastVariant[key]=i;const text=choices[i];this.say(text,Math.min(7,2+text.length/14));const clip=dialogueData.PIXEL_AUDIO[text];this.events.push({type:'speech',key:clip,text,urgent:['hit','hit2','scratch'].includes(clip),ambient:this.ambient});}
 say(text,seconds=5,source='scene'){const adapted=PC.adapt(text,this.config);this.text=PC.blocked(adapted,this.config)?'':adapted;this.textUntil=this.time+seconds*this.config.balloons.duration;this.textSource=source==='activity'?'activity':this.ambient?'ambient':'scene';}
 enter(state,duration,line){if(state==='decoy'){state='decoy_fetch';duration=1.4;line='decoy_fetch';}this.state=state;this.started=this.time;this.until=this.time+duration;this.handDwell=0;if(!['run','walk'].includes(state))this.facing='front';if(line)this.line(line);}
 remember(){this.events.push({type:'memory',value:this.snapshot()});}
 chooseWalk(){if(this.settings.focus||this.settings.paused||!this.settings.wander||this.settings.reduced){this.enter('idle',3);return;}const range=this.caffeinated?240:180;this.target={x:Math.max(55,Math.min(this.w-55,this.x+(this.random()-.5)*range*2)),y:Math.max(150,Math.min(this.h-15,this.y+(this.random()-.5)*150))};this.enter('walk',3+this.random()*4);}
 act(name){if(this.dragging||this.press)return false;if(!SCENES.has(name)||!this.permitted(name))return false;this.ambient=false;if(this.riding)this.releaseRide();this.pendingActivity=null;this.events.push({type:'cancelSpeech'});this.text='';
  if(name==='coffee'){this.memory.coffeeAt=this.now;this.memory.cupDirty=true;}
  if(name==='praise')this.memory.praiseAt=this.now;
  const durations={sleep:14,coffee:7,biscuit:7,petting:6,praise:6,duck:9,portal:7,trip:5,patience:7,wash:6};this.enter(name,durations[name]||6,name);this.nextMood=this.time+this.interval();this.remember();return true;
 }
 interval(){return ({low:140,normal:55,high:22}[this.settings.frequency]+this.random()*25)/(1+this.config.personality.energy*.15);}
 pointerAt(x,y,dt=.032){const prev=this.pointer;const raw=prev?Math.hypot(x-prev.x,y-prev.y)/Math.max(.01,dt):0;this.pointerSpeed=this.pointerSpeed*.45+raw*.55;this.pointer={x,y};if(this.dragging&&this.press){this.x=x-this.press.offsetX;this.y=y-this.press.offsetY;this.clamp();}
  if(this.riding){if(x<5||y<5||x>this.w-5||y>this.h-5){this.releaseRide();return;}this.rideDistance+=prev?Math.hypot(x-prev.x,y-prev.y):0;this.x=x-this.dir*20*this.scale;this.y=y+38*this.scale;this.clamp();this.rideStopped=raw<10?this.rideStopped+dt:0;if(this.rideDistance>230||this.age>5||(this.age>1&&this.rideStopped>.8))this.releaseRide();}
 }
 releaseRide(){this.nextRide=this.time+35;this.enter('idle',2);this.text='';this.events.push({type:'mode'});}
 down(x,y){this.ambient=false;if(this.riding)return false;this.press={x,y,offsetX:x-this.x,offsetY:y-this.y,started:this.time};return true;}
 dragTo(x,y){if(!this.press)return;if(!this.dragging&&Math.hypot(x-this.press.x,y-this.press.y)>5){this.enter('drag',30);this.text='';this.events.push({type:'cancelSpeech'});this.events.push({type:'mode'});}if(this.dragging){this.x=x-this.press.offsetX;this.y=y-this.press.offsetY;this.clamp();}}
 up(x,y,cancel=false){if(!this.press)return;const drag=this.dragging,p=this.press;this.press=null;if(drag){this.memory.drags=this.memory.drags.filter(t=>t>this.now-600);this.memory.drags.push(this.now);this.remember();if(!cancel&&this.time>=this.nextMove){const n=this.memory.drags.length;const choices=['move_box','move_mug','move_measure'];const state=n>=3?'move_box':choices[Math.floor(this.random()*3)];this.enter(state,5,state);this.nextMove=this.time+22;}else this.enter('idle',1);this.events.push({type:'mode'});}else if(!cancel)this.strike(p.x);}
 summon(x,y){this.press=null;if(this.riding)this.releaseRide();this.x=x;this.y=y+50;this.clamp();this.enter('wave',4,'arrive');this.events.push({type:'mode'});}
 strike(x){this.ambient=false;if(!this.settings.clicks)return false;if(!this.settings.whip)return this.act('petting');if(this.dragging||this.riding||this.time-this.lastHit<.22)return false;this.lastHit=this.time;this.memory.scareAt=this.now;this.hits++;this.clicks=this.clicks.filter(t=>t>this.time-7);this.clicks.push(this.time);this.events.push({type:'cancelSpeech'});this.events.push({type:'crack'});this.remember();
  if(this.state==='patience'){this.started=this.time;this.until=this.time+7;this.line('patience_reset');return true;}
  this.sore=this.hits%6===0;this.dir=x<this.x?1:-1;
  this.afterHit=this.sore?'run':this.clicks.length>=9?'patience':this.clicks.length>=5&&this.time>=this.nextInspector?'inspector':this.settings.rare!=='off'&&this.hits>=4&&this.time>=this.nextDecoy&&this.random()<(this.settings.rare==='frequent'?.35:.12)?'decoy_fetch':'run';
  if(this.afterHit==='inspector')this.nextInspector=this.time+75;
  if(this.afterHit==='decoy_fetch')this.nextDecoy=this.time+180;
  if(!this.settings.playful||!this.permitted(this.afterHit==='decoy_fetch'?'decoy':this.afterHit))this.afterHit='run';this.enter('hit',.36,'hit');return true;
 }
 hitDecoy(){if(!this.decoy||this.decoy.fallen)return false;this.decoy.fallen=this.time;this.decoy.expires=this.time+5;this.enter('peek',5,'decoy_hit');this.events.push({type:'crack'});return true;}
 activity(m){this.ambient=false;if(!m||typeof m.text!=='string')return;this.text='';if(m.session&&m.kind==='working')this.sessionScenes=Object.fromEntries(Object.entries({...this.sessionScenes,[m.session]:m.scene}).slice(-64));const allowed=new Set(['work','research','writing','coding','video','repair','wait']);const scene=allowed.has(m.scene)?m.scene:'work';if(m.kind==='working')this.lastActivityScene=scene;
  if(this.press||DIRECT_STATES.has(this.state)){this.pendingActivity={...m,received:this.time};return;}
  if(m.kind==='greeting'){this.enter('wave',5);if(m.balloon!==false)this.say(m.text,6,'activity');return;}
  if(m.kind==='done'){this.delivery=allowed.has(m.scene)?m.scene:m.session&&this.sessionScenes?.[m.session]||'work';this.enter('deliver',7);if(m.balloon!==false)this.say(m.text,6,'activity');this.activityUntil=0;this.activityScene=null;}
  else if(m.kind==='working'||m.kind==='attention'||m.kind==='error'||m.kind==='waiting'){this.activityScene=scene;this.activityUntil=this.time+18;this.enter(scene,18);if(m.balloon!==false)this.say(m.text,6,'activity');}
  else{this.activityUntil=0;this.activityScene=null;this.enter('idle',2);if(m.balloon!==false)this.say(m.text,5,'activity');}
 }
 finish(){switch(this.state){
 case 'hit':if(this.afterHit==='run'){this.enter('run',3.6,'run');this.target={x:Math.max(55,Math.min(this.w-55,this.x+this.dir*260)),y:Math.max(150,Math.min(this.h-15,this.y-35+this.random()*70))};}else this.enter(this.afterHit,this.afterHit==='decoy_fetch'?1.4:7,this.afterHit);break;
 case 'run':if(this.sore){this.enter('scratch',6);this.line('scratch',true);}else if(this.settings.playful&&this.permitted('rh')&&this.hits>=10&&this.time>=this.nextRh){this.nextRh=this.time+150;this.enter('rh',6,'rh');}else this.enter('look',1.5,'look');break;
 case 'scratch':case 'rh':case 'inspector':case 'patience':this.enter('look',1.5);break;
 case 'look':this.enter('work',8,'work');break;
 case 'decoy_fetch':this.decoy={x:this.x,y:this.y,expires:this.time+25,fallen:0};this.enter('decoy_leave',1.8);this.target={x:Math.max(55,Math.min(this.w-55,this.x+(this.x>this.w/2?-240:240))),y:this.y};break;
 case 'decoy_leave':this.enter('peek',9,'peek');break;
 case 'peek':this.enter('idle',2);break;
 case 'wash':this.memory.cupDirty=false;this.remember();this.enter('idle',2);break;
 case 'ride':this.releaseRide();break;
 case 'drag':this.up(this.x,this.y,true);break;
 case 'idle':if(!this.settings.focus&&!this.settings.paused&&this.settings.playful&&this.time>=this.nextMood){this.nextMood=this.time+this.interval();this.ambient=true;let list=['wave','stretch','sleep','dance'];if(this.config.personality.affection===0)list=['stretch','sleep','dance'];if(this.config.personality.affection===2)list.push('wave','petting','wave');if(this.config.personality.energy===0)list=['sleep','stretch'];if(this.config.personality.energy===2)list.push('dance','dance');if(this.memory.cupDirty&&this.now-this.memory.coffeeAt>35&&this.permitted('wash'))list=['wash'];else if(this.settings.rare!=='off'&&this.time>=this.nextRare&&this.random()<(this.settings.rare==='frequent'?.7:.28)){this.nextRare=this.time+(this.settings.rare==='frequent'?70:180);list=['trip','duck','portal','decoy'];}list=[...list,...this.settings.favorites].filter(k=>this.permitted(k)&&SCENES.has(k)&&(!this.settings.reduced||!['dance','trip','portal'].includes(k))&&(this.settings.rare!=='off'||!['trip','duck','portal','decoy'].includes(k)));if(list.length){const n=list[Math.floor(this.random()*list.length)];this.enter(n,n==='sleep'?12:7,n);}else this.enter('idle',3);}else this.chooseWalk();break;
 default:this.enter('idle',1+this.random()*2);
 }}
 update(dt){dt=Math.max(0,Math.min(.1,dt));this.time+=dt;if(this.time>this.textUntil)this.text='';if(this.decoy&&this.time>this.decoy.expires)this.decoy=null;
  if(this.press&&this.time-this.press.started>25)this.up(this.x,this.y,true);
  if(!this.press&&this.time>=this.until)this.finish();
  if(!this.press&&!DIRECT_STATES.has(this.state)&&this.pendingActivity){const m=this.pendingActivity;this.pendingActivity=null;if(this.time-m.received<20)this.activity(m);}
  let hover=false;if(this.pointer&&!this.press&&!this.settings.focus&&!this.settings.paused&&this.settings.cursorRide&&!this.settings.reduced&&this.config.personality.curiosity>0&&['idle','walk'].includes(this.state)&&this.time>this.nextRide){const h=this.hand();hover=Math.hypot(this.pointer.x-h.x,this.pointer.y-h.y)<18&&this.pointerSpeed<65;if(hover){this.handDwell+=dt;if(this.handDwell>(this.config.personality.curiosity===2?.55:.9)){this.enter('ride',5,'ride');this.rideDistance=0;this.rideStopped=0;this.events.push({type:'mode'});}}else this.handDwell=0;}
  const move=['walk','run','decoy_leave'].includes(this.state)&&!this.press&&!hover;
  if(move&&(!this.settings.paused||this.state!=='walk')&&(!this.settings.focus||this.state!=='walk')){let dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy),speed=this.state==='run'?190:this.state==='decoy_leave'?150:this.caffeinated?51:this.confident?30:34;this.dir=dx>=0?1:-1;this.facing=Math.abs(dy)>Math.abs(dx)*.7?(dy<0?'back':'front'):'side';speed*=({calm:.65,normal:1,lively:1.4}[this.settings.speed])*(.75+this.config.personality.energy*.25);if(this.settings.reduced||this.settings.paused)speed=0;if(d>2){const step=Math.min(d,speed*dt);this.x+=dx/d*step;this.y+=dy/d*step;}else if(this.state==='walk')this.enter('idle',1.5);}
  if(this.pointer&&this.settings.gaze&&['idle','look'].includes(this.state)){this.dir=this.pointer.x<this.x?-1:1;this.facing=this.scared&&Math.sin(this.time*3)>.7?'back':Math.abs(this.pointer.x-this.x)>60?'side':'front';}
  this.clamp();
 }
}
if(typeof module!=='undefined')module.exports=PetModel;
