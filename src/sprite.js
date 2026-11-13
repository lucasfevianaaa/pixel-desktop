const PIXEL_PALETTES={blue:{outline:'#22243f',shadow:'#30418b',blue:'#5269c5',light:'#8797e1',shine:'#bdc5f1',face:'#28344e',eye:'#afe4cf',foot:'#354b99'},green:{outline:'#213c32',shadow:'#345e43',blue:'#62955b',light:'#a8c982',shine:'#d6e3ad',face:'#294238',eye:'#e2dcb0',foot:'#486b43'},pastel:{outline:'#5a526f',shadow:'#8c7caa',blue:'#b8a7d6',light:'#e1cfef',shine:'#fff0dd',face:'#605774',eye:'#e6f3d9',foot:'#9f8cba'},neon:{outline:'#16283d',shadow:'#255270',blue:'#1d9aad',light:'#6cf5d3',shine:'#e4ffc7',face:'#242d4c',eye:'#f2a6e1',foot:'#347389'},quiet:{outline:'#303849',shadow:'#596778',blue:'#798899',light:'#abb7c3',shine:'#d4d9d9',face:'#384453',eye:'#c4d6ca',foot:'#647185'}};
function pixelPalette(a){if(a.palette!=='custom')return PIXEL_PALETTES[a.palette]||PIXEL_PALETTES.blue;const base=a.customColor;function shade(n){const v=parseInt(base.slice(1),16);return '#'+[16,8,0].map(s=>Math.max(0,Math.min(255,((v>>s)&255)+n)).toString(16).padStart(2,'0')).join('');}return {...PIXEL_PALETTES.blue,blue:base,shadow:shade(-45),light:shade(45),shine:shade(85),foot:shade(-25)};}
function drawPixel(s,actor,config){
 const C=pixelPalette(config.appearance);
 const rect=(x,y,w,h,c)=>{s.fillStyle=c;s.fillRect(Math.round(x),Math.round(y),w,h);};s.clearRect(0,0,48,56);const t=actor.time,state=actor.state,moving=(state==='walk'&&!actor.paused)||state==='run'||state==='decoy_leave',phase=Math.floor(t*(state==='run'?15:7))%4,step=moving?[0,2,0,-2][phase]:['ride','drag'].includes(state)?Math.round(Math.sin(t*8)*3):0,back=actor.facing==='back'||state==='scratch',side=actor.facing==='side'&&state!=='work'&&state!=='scratch',seated=['work','coffee','wash','biscuit','research','writing','coding','video','repair','wait'].includes(state);
 s.save();if(actor.dir<0){s.translate(48,0);s.scale(-1,1);}const bob=moving?(phase%2):state==='dance'?Math.round(Math.sin(t*12)*2):state==='sleep'?Math.round(Math.sin(t*2)):0;s.translate(0,bob+(seated?5:0));
 // Short legs, alternate stride, outlined in a four-shade handheld palette.
 rect(14,43+(seated?-2:step),9,9,C.outline);rect(15,43+(seated?-2:step),6,6,C.foot);rect(27,43+(seated?-2:-step),9,9,C.outline);rect(28,43+(seated?-2:-step),6,6,C.blue);
 rect(13,31,23,15,C.outline);rect(15,32,19,11,C.blue);rect(15,32,4,10,C.shadow);rect(20,32,12,2,C.light);
 // Arms swing opposite the feet, then type or scratch.
 if(['wave','stretch','dance','ride','drag','praise'].includes(state)){const lift=['stretch','ride','drag'].includes(state)?16:5+Math.round(Math.sin(t*12)*3);rect(36,28-lift,5,13,C.outline);rect(37,29-lift,3,10,C.light);rect(36,26-lift,6,4,C.shine);const lift2=state==='stretch'?10:state==='dance'?9-lift:0;rect(9,33-lift2,5,10,C.outline);rect(10,34-lift2,3,7,C.blue);}
 else if(state==='scratch'){rect(10,34,6,9,C.outline);rect(11,34,4,7,C.blue);let sy=39+Math.floor(t*9)%2*3;rect(31,34,6,9,C.shadow);rect(26,sy,9,4,C.light);rect(26,sy,2,3,C.shine);}
 else if(seated){rect(12,35,6,7,C.shadow);rect(30,36,6,6,C.shadow);rect(17,40+phase%2,6,4,C.shine);rect(28,40+(phase+1)%2,6,4,C.shine);}
 else{rect(9,33-step,6,10,C.outline);rect(10,34-step,4,7,C.blue);rect(35,33+step,6,10,C.outline);rect(36,34+step,4,7,C.light);}
 // Rounded, stepped pixel head with a shaded side to suggest depth.
 rect(13,2,22,2,C.outline);rect(8,4,31,4,C.outline);rect(5,8,37,20,C.outline);rect(8,28,31,4,C.outline);rect(13,32,22,2,C.outline);
 rect(13,4,21,2,C.light);rect(9,6,29,4,C.light);rect(7,10,33,16,C.blue);rect(10,26,28,4,C.blue);rect(14,30,20,2,C.shadow);rect(7,12,4,12,C.shadow);rect(11,8,22,2,C.shine);rect(36,10,4,15,C.shadow);
 if(back){rect(12,12,23,12,C.blue);rect(14,11,3,13,C.light);rect(19,24,12,2,C.shadow);rect(22,7,8,2,C.shine);}
 else{const faceX=side?19:12,faceW=side?18:24;rect(faceX,12,faceW,15,C.outline);rect(faceX+2,13,faceW-4,12,C.face);const blink=Math.floor(t*6)%37===0,ouch=state==='hit';for(const ex of(side?[29]:[18,29])){if(ouch){rect(ex-2,17,2,2,C.eye);rect(ex,19,2,2,C.eye);rect(ex-2,21,2,2,C.eye);}else if(blink||state==='sleep'||state==='petting'){rect(ex-2,20,5,1,C.eye);}else{rect(ex-2,18,2,3,C.eye);rect(ex,16,2,2,C.eye);rect(ex+2,18,2,3,C.eye);}}}
 if(!back&&!seated){rect(side?27:22,36,2,2,C.shine);rect(side?29:24,38,2,2,C.shine);rect(side?27:22,40,2,2,C.shine);}
 if(state==='work'||state==='coding'){ // Tiny hinged laptop, angled lid and keyboard.
 rect(22,32,21,2,C.outline);rect(23,34,20,12,C.outline);rect(25,34,16,9,'#71999b');rect(27,36,5,1,'#d4e5be');rect(27,39,9,1,'#d4e5be');rect(19,46,24,3,C.outline);rect(21,46,20,1,'#b7b3a5');}
 if(state==='coffee'){rect(32,35,8,8,'#eee0b7');rect(39,36,3,5,C.outline);rect(33,34,6,2,'#5e3e38');rect(34,29+phase%2,1,4,'#d3dfda');rect(37,27+phase%2,1,4,'#d3dfda');}
 if(state==='sleep'){s.fillStyle=C.eye;s.font='7px monospace';s.fillText('z',35,10-Math.floor(t*2)%4);s.fillText('Z',40,5-Math.floor(t)%4);}
 if(state==='run'){rect(3,28,2,4,'#b8e9e4');rect(1,30,2,2,'#b8e9e4');}

 // Scene-specific gestures remain readable without sound.
 if(state==='biscuit'){rect(15,33,8,4,C.light);rect(27,33,8,4,C.light);rect(20,31,10,9,'#c79350');rect(21,32,8,7,'#ebc486');rect(23,34,2,2,'#71513c');rect(27,37,2,2,'#71513c');}
 if(state==='petting'){rect(18,24,3,1,'#d89ca8');rect(30,24,3,1,'#d89ca8');}
 if(state==='research'){rect(29,27,12,3,'#252943');rect(27,29,3,10,'#252943');rect(29,37,12,3,'#252943');rect(39,29,3,9,'#252943');rect(30,30,8,6,'#a6d9d1');rect(38,39,3,8,'#845d3c');}
 if(state==='writing'){rect(14,38,29,10,'#b5ad94');rect(17,30,22,10,'#fff5d5');rect(20,33,14,1,'#6d6d68');rect(20,36,10,1,'#6d6d68');for(let i=0;i<5;i++)rect(18+i*4,42+phase%2,2,2,'#33354b');}
 if(state==='video'){rect(20,35,24,14,'#24293f');rect(22,40,20,7,'#7c88ab');for(let i=0;i<4;i++)rect(20+i*6,32+phase%2,3,3,'#f5e5c0');}
 if(['move_box','decoy_fetch'].includes(state)){rect(13,33,26,17,'#805b3f');rect(15,35,22,13,'#bf9461');rect(24,35,4,13,'#ebca8e');}
 if(config.appearance.theme==='assistant'){rect(16,33,18,2,'#86e9ed');rect(21,38,7,3,'#afedf0');if(!back){rect(side?21:14,25,side?13:20,1,'#6db9d1');}}
 const themed={office:['tie'],pajamas:[],gamer:['headphones'],inventor:['glasses'],assistant:['tie']}[config.appearance.theme]||[];
 let acc=[...config.appearance.accessories,...themed];
 if(config.appearance.daily&&config.appearance.favorites.length){const day=Math.floor(Date.now()/86400000);acc.push(config.appearance.favorites[day%config.appearance.favorites.length]);}
 if(config.behavior.accessories){if(['repair','rh'].includes(state))acc.push('helmet');if(state==='inspector')acc.push('cap');if(actor.confident||state==='praise')acc.push('tie');}
 if(config.appearance.theme==='pajamas'||(state==='sleep'&&config.behavior.accessories)){rect(16,34,18,8,'#798cb0');for(let i=0;i<4;i++)rect(17+i*4,34,1,8,'#d9d6c8');}
 if(acc.includes('tie')){rect(24,34,3,3,'#e5b26e');rect(23,37,5,7,'#b86b60');}
 if(acc.includes('glasses')&&!back){rect(side?26:14,15,10,8,'#121b31');rect(side?28:16,17,6,4,'#a5d0d9');if(!side){rect(27,15,10,8,'#121b31');rect(29,17,6,4,'#a5d0d9');rect(24,18,3,2,'#121b31');}}
 if(acc.includes('cap')){rect(11,2,26,5,'#4b5878');rect(9,7,32,3,'#283550');rect(23,3,4,3,'#edcd77');}
 if(acc.includes('helmet')){rect(10,3,28,6,'#e5bd53');rect(7,9,34,3,'#907137');rect(22,1,4,10,'#f8d775');}
 if(acc.includes('headphones')){rect(10,6,26,3,'#1c2038');rect(7,9,4,16,'#1c2038');rect(36,9,4,16,'#1c2038');rect(6,16,6,10,'#c692c1');rect(35,16,6,10,'#c692c1');}
 if(acc.includes('mug')&&state!=='coffee'){rect(35,38,8,10,'#ede1b9');rect(41,40,4,5,'#a7b3bc');}
 if(state==='praise'&&config.behavior.accessories){rect(14,34,3,11,'#f4d788');rect(17,37,3,10,'#f4d788');rect(20,40,3,6,'#f4d788');}
 s.restore();}
if(typeof module!=='undefined')module.exports={drawPixel,pixelPalette};
