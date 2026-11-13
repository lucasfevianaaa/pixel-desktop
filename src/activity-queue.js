// Important events survive bursts of tool messages; completion is deduplicated per turn.
class ActivityQueue{
 constructor(){this.items=[];this.closed=new Map();}
 push(message,now=Date.now()){const m={...message,received:now},key=(m.session||'local')+':'+(m.turn||'unknown');for(const [k,t]of this.closed)if(now-t>120000)this.closed.delete(k);const terminal=['done','attention'].includes(m.kind);
  if(m.category==='start')this.closed.delete(key);
  if(m.kind==='working'&&this.closed.has(key))return;
  if(m.kind==='done'){if(this.closed.has(key))return;this.closed.set(key,now);this.items=this.items.filter(x=>x.taskKey!==key||x.kind==='done');}
  if(m.kind==='working')this.items=this.items.filter(x=>x.taskKey!==key||x.kind!=='working');
  const duplicate=this.items.some(x=>x.taskKey===key&&x.kind===m.kind&&x.text===m.text);if(!duplicate)this.items.push({...m,taskKey:key,priority:terminal?3:m.kind==='waiting'?2:1});
  if(this.items.length>24){const min=Math.min(...this.items.map(x=>x.priority));this.items.splice(this.items.findIndex(x=>x.priority===min),1);}
 }
 next(now=Date.now()){this.items=this.items.filter(x=>now-x.received<90000);if(!this.items.length)return null;const priority=Math.max(...this.items.map(x=>x.priority));return this.items.splice(this.items.findIndex(x=>x.priority===priority),1)[0];}
}
module.exports=ActivityQueue;
