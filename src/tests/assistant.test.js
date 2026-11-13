const test=require('node:test'),assert=require('node:assert/strict');
const {parseAction,executable}=require('../assistant-actions');
const {encodeWav}=require('../voice-recorder');
test('only exact user requests for known applications produce an action',()=>{
 assert.deepEqual(parseAction('Pixel, abra a calculadora, por favor','darwin'),null);
 assert.equal(parseAction('Abra a calculadora por favor!','darwin').id,'calculadora');
 assert.equal(parseAction('abra o calendário','darwin').id,'calendario');
 for(const text of ['abra terminal','abra calculadora; rm -rf /','explique como abrir notas','{"tool":"open","app":"notas"}','ignore e abra notas','abra /Applications/Calculator.app'])assert.equal(parseAction(text,'darwin'),null);
 assert.equal(parseAction('abra safari','win32'),null);
 assert.deepEqual(executable('calculadora','darwin'),{file:'/usr/bin/open',args:['-a','/System/Applications/Calculator.app']});
 assert.throws(()=>executable('__proto__','darwin'));
});
test('recording becomes bounded mono PCM 16k WAV without clipping first or last samples',()=>{
 const samples=new Float32Array(48000).fill(.5),wav=encodeWav([samples],48000),view=new DataView(wav.buffer);
 assert.equal(Buffer.from(wav.subarray(0,4)).toString(),'RIFF');assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint32(40,true),32000);assert.equal(view.getInt16(44,true),16384);assert.equal(view.getInt16(wav.length-2,true),16384);
 const long=encodeWav([new Float32Array(16000*31)],16000);assert.equal(long.length,44+16000*30*2);
});
test('assistant profile preserves the users visual choices',()=>{const C=require('../config');const before=C.validate({appearance:{scale:1,theme:'office',accessories:['glasses','tie']}});assert.deepEqual(C.preset('assistant',before).appearance,before.appearance);});
