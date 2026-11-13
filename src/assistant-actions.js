// Model responses can never execute commands. Only exact user requests reach this map.
const APPS={
 calculadora:{label:'Calculadora',mac:'/System/Applications/Calculator.app',win:'calc.exe'},
 notas:{label:'Notas',mac:'/System/Applications/Notes.app',win:'notepad.exe'},
 chatgpt:{label:'ChatGPT',mac:'/Applications/ChatGPT.app'},
 codex:{label:'Codex',mac:'/Applications/Codex.app'},
 calendario:{label:'Calendário',mac:'/System/Applications/Calendar.app'},
 safari:{label:'Safari',mac:'/Applications/Safari.app'},
};
function parseAction(text,platform=process.platform){const normalized=String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[.!?]+$/,'').trim();const match=normalized.match(/^(?:pixel(?:ito)?[, ]+)?(?:abra|abrir|abre) (?:o |a )?(calculadora|notas|chatgpt|codex|calendario|safari)(?: por favor)?$/);const app=match&&APPS[match[1]];return app&&(platform==='darwin'?app.mac:platform==='win32'?app.win:null)?{id:match[1],label:app.label}:null;}
function executable(id,platform=process.platform){const app=APPS[id];if(!app)throw Error('Aplicativo não permitido.');if(platform==='darwin'&&app.mac)return {file:'/usr/bin/open',args:['-a',app.mac]};if(platform==='win32'&&app.win)return {file:require('path').win32.join(process.env.SystemRoot||'C:\\Windows','System32',app.win),args:[]};throw Error('Aplicativo indisponível neste sistema.');}
module.exports={parseAction,executable};
