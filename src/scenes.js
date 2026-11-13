/* Temporary scene props drawn at sprite resolution. */
function drawProps(ctx,a,c){const k=a.scale,x=Math.round(a.x),y=Math.round(a.y),t=a.time,age=a.age;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.imageSmoothingEnabled=false;const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);},text=(str,x,y)=>{ctx.fillStyle='#fff2d0';ctx.font='7px monospace';ctx.fillText(str,x,y);};
 if(c.appearance.theme==='assistant'&&(a.speaking||a.textSource==='activity'&&a.text)){for(const xx of [-27,24]){r(xx,-56,5,1,'#76dbe8');r(xx,-56,1,5,'#76dbe8');r(xx,3,5,1,'#76dbe8');}r(-11,-61,22,1,'#4a9ea8');}
 const paper=()=>{r(22,-22,19,24,'#403b4b');r(23,-21,17,22,'#fff0cd');for(let i=0;i<4;i++)r(25,-18+i*4,12,1,'#75849c');};
 if(a.state==='move_mug'){r(25,-10,12,8,'#7c614c');r(29,-18,6,8,'#e7d6b3');r(34,-16,3,4,'#a4b6bb');r(22,-2,20,2,'#dfc589');}
 if(a.state==='move_measure'){r(-35,-2,70,3,'#e5bb5d');for(let i=-34;i<35;i+=5)r(i,-2,1,2,'#5a4744');r(29,-8,9,7,'#887c82');}
 if(a.state==='move_box'){r(-35,-14,15,14,'#ba8c5e');r(-29,-14,3,14,'#ecd098');}
 if(a.state==='wash'){r(24,-14,20,13,'#738ca4');r(27,-11,14,7,'#a5d4d7');r(35,-24,3,12,'#b8d5d8');r(29,-24,8,3,'#b8d5d8');r(30,-20,1,7,'#dbf6ee');r(27,-7,7,5,'#f7e8c3');}
 if(a.state==='rh'||a.state==='inspector'){paper();if(a.state==='rh'){r(29,-18+Math.sin(t*6)*3,7,5,'#6e4860');r(27,-14+Math.sin(t*6)*3,11,3,'#9d6573');}if(a.state==='inspector'){r(-38,-30,20,12,'#29314a');text(String(a.hits),-35,-22);}}
 if(a.state==='repair'){r(24,-10,22,10,'#ae785c');r(30,-14,10,4,'#53505c');r(28,-27,3,16,'#97acb0');r(25,-30,9,5,'#c4d0ce');}
 if(a.state==='biscuit'&&c.appearance.particles){for(let i=0;i<4;i++)r(-8+i*5,-4+(Math.floor(t*4)+i)%4,2,2,'#e7bc77');}
 if(a.state==='duck'){r(-36,-10,15,3,'#796d61');r(-35,-7,2,8,'#796d61');r(-24,-7,2,8,'#796d61');r(43,-7,12,3,'#796d61');r(52,-7,2,9,'#796d61');r(21,-11,26,3,'#927b64');r(25,-8,3,8,'#6d6059');r(42,-8,3,8,'#6d6059');r(30,-18,12,7,'#f3ce69');r(37,-24,6,8,'#f3ce69');r(41,-20,5,3,'#de8c55');r(40,-23,1,1,'#283448');r(-34,-18,12,17,'#fff0c7');}
 if(a.state==='trip'){r(-26,-2,5,5,'#655e89');if(age>2){r(22,-10,5,5,'#655e89');r(22,-12,2,2,'#aeb2d7');}}
 if(a.state==='wait'){for(let i=0;i<3;i++)r(-8+i*8,-65-Math.abs(Math.sin(t*3+i))*5,3,3,'#c7d6ee');}
 if(a.state==='patience'){r(-29,-68,58,10,'#30354e');r(-27,-66,Math.floor(54*Math.min(1,age/7)),6,'#a4ce9c');text('PACIÊNCIA',-23,-73);}
 if(a.state==='deliver'){r(20,-17,25,17,'#b58b62');r(22,-15,21,13,'#d7b583');r(31,-15,3,13,'#fff0c4');text({video:'▶',research:'?',writing:'A',coding:'>_'}[a.delivery]||'OK',23,-6);}
 if(a.state==='portal'){ctx.save();const openness=Math.min(1,age*2,(7-age)*2);ctx.translate(40,0);ctx.scale(Math.max(.02,openness),1);ctx.translate(-40,0);r(27,-52,27,50,'#37315c');r(30,-49,21,44,'#8b83bb');r(33,-46,15,38,'#253956');r(35,-35,12,14,'#91a77e');r(37,-32,9,7,'#304751');r(39,-30,2,2,'#d8f0ce');r(34,-20,14,12,'#728d69');r(35,-8,4,6,'#485f50');r(43,-8,4,6,'#485f50');ctx.restore();}
 if(a.state==='peek'){r(15,-40,15,41,'#b59b82');r(16,-39,2,38,'#d9c5a1');}
 if(c.appearance.particles&&['praise','petting','coffee','dance','deliver'].includes(a.state)){for(let i=0;i<3;i++){let px=-25+i*22,py=-58-Math.sin(t*2+i)*5;r(px,py,2,5,'#e8c88e');r(px-1,py+1,4,2,'#e8c88e');}}
 ctx.restore();
 if(a.decoy){const d=a.decoy;ctx.save();ctx.translate(d.x,d.y);if(d.fallen){ctx.rotate(Math.min(Math.PI/2,(t-d.fallen)*3));}ctx.fillStyle='#8e684c';ctx.fillRect(-23,-70,46,65);ctx.fillStyle='#c3a278';ctx.fillRect(-20,-67,40,60);ctx.fillStyle='#574e50';ctx.fillRect(-14,-52,28,19);ctx.fillStyle='#e6d3ae';ctx.fillRect(-9,-46,5,3);ctx.fillRect(5,-46,5,3);ctx.fillStyle='#8e684c';ctx.fillRect(-2,-8,4,14);ctx.restore();}
}
