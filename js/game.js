/* Pelada Absurda — futebol de bonecos molengas com regras que mudam no meio do jogo.
   Canvas 2D + Web Audio, sem dependências. */
(()=>{
'use strict';
/* ================= constantes & utilidades ================= */
const W=1280,H=720,GROUND=624,GD=92,TAU=Math.PI*2,INK='#1b1430';
const $=id=>document.getElementById(id);
const app=$('app'),stage=$('stage'),cvs=$('game'),ctx=cvs.getContext('2d');
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function mulberry(s){return()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ================= config salva ================= */
const SKEY='pelada-absurda-v1';
let cfg={slots:[[{ctrl:'k1',char:0},{ctrl:'none',char:2}],[{ctrl:'bot',char:4},{ctrl:'none',char:5}]],duration:180,stadium:0,ruleEvery:25,bot:1,muted:false,music:true};
try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&s.slots)cfg=Object.assign(cfg,s)}catch(e){}
function persist(){try{localStorage.setItem(SKEY,JSON.stringify(cfg))}catch(e){}}

/* ================= dados ================= */
const TEAMS=[{name:'MANGA',color:'#ff8a1f',dark:'#c4530a',light:'#ffc98f'},{name:'AÇAÍ',color:'#8f4dff',dark:'#5320b0',light:'#cdb2ff'}];
const CHARS=[
  {name:'Tiozão',kind:'human',skin:'#c68642',acc:'bigode'},
  {name:'Vovó Turbo',kind:'human',skin:'#f5d0b5',acc:'coque'},
  {name:'Craque Mirim',kind:'human',skin:'#e0ac69',acc:'bone'},
  {name:'Tia do Zap',kind:'human',skin:'#8d5524',acc:'rolos'},
  {name:'Capivara',kind:'capi',skin:'#a5774c'},
  {name:'Pombo',kind:'pombo',skin:'#9aa3b5'},
  {name:'Robô Peladeiro',kind:'robo',skin:'#b8c4d6'},
  {name:'Cabeça de Bagre',kind:'bagre',skin:'#8fae7a'},
];
const CTRLS=['none','bot','k1','k2','gp0','gp1','gp2','gp3'];
const CTRL_LABEL={none:'Ninguém',bot:'Bot',k1:'Teclado 1',k2:'Teclado 2',gp0:'Controle 1',gp1:'Controle 2',gp2:'Controle 3',gp3:'Controle 4'};
const CTRL_HINT={none:'Vaga vazia.',bot:'O computador joga nessa vaga.',k1:'A D andar · W pular · F chutar · G carrinho',k2:'← → andar · ↑ pular · K chutar · L carrinho',gp0:'Conecte o controle e aperte qualquer botão.',gp1:'Conecte o controle e aperte qualquer botão.',gp2:'Conecte o controle e aperte qualquer botão.',gp3:'Conecte o controle e aperte qualquer botão.'};
const CTRL_TAG={bot:'BOT',k1:'P1',k2:'P2',gp0:'C1',gp1:'C2',gp2:'C3',gp3:'C4'};
const STADIUMS=[
  {id:'varzea',name:'Campo de Várzea',desc:'Terra batida, morro e caixa d’água.'},
  {id:'praia',name:'Futevôlei na Praia',desc:'Areia, coqueiro e pôr do sol.'},
  {id:'noite',name:'Estádio à Noite',desc:'Refletores e torcida lotada.'},
  {id:'laje',name:'Pelada na Laje',desc:'Telhado, varal e pipa no céu.'},
];
const RULES={
  lua:{name:'Gravidade Lunar',desc:'Todo mundo flutua. A bola também.'},
  boliche:{name:'Bola de Boliche',desc:'Pesada, quica pouco e derruba quem estiver no caminho.',group:'ball'},
  praia:{name:'Bola de Praia',desc:'Gigante, levinha e impossível de controlar.',group:'ball'},
  pulapula:{name:'Bola Pula-Pula',desc:'Quica sem perder força nenhuma.',group:'ball'},
  cabecao:{name:'Cabeção',desc:'Cabeças em tamanho família. Cabeceio liberado.'},
  tampinha:{name:'Time Tampinha',desc:'Todo mundo encolheu.'},
  golpequeno:{name:'Gol de Pebolim',desc:'As traves encolheram.',group:'goal'},
  golgigante:{name:'Gol de Gigante',desc:'Trave lá em cima. O goleiro chora.',group:'goal'},
  sabao:{name:'Campo Ensaboado',desc:'Ninguém consegue frear.'},
  vento:{name:'Ventania',desc:'O vento troca de lado a cada 6 segundos.'},
  multibola:{name:'Multibola',desc:'Três bolas em campo ao mesmo tempo!'},
  mola:{name:'Pernas de Mola',desc:'Pulo duas vezes mais alto.'},
  invertido:{name:'Controle Invertido',desc:'Esquerda virou direita. Só para humanos.'},
  melancia:{name:'Chuva de Melancia',desc:'Olha a cabeça!'},
  vale3:{name:'Gol Vale 3',desc:'Cada gol vale três pontos.'},
  turbo:{name:'Modo Turbo',desc:'Tudo 35% mais rápido.'},
  fantasma:{name:'Bola Fantasma',desc:'A bola some de vez em quando.'},
};
const RULE_IDS=Object.keys(RULES);
const LINES={
  goal:['QUE ISSO, MINHA GENTE?!','ENTROU CHORANDO!','PEGOU NA GORDURINHA DA BOLA!','É CAIXA, É CAIXA!','NA GAVETA!','ONDE A CORUJA DORME!','GOLAÇO DE PLACA!','A REDE BALANÇOU, TORCIDA!','CHUTOU COM A ALMA!','SEM CHANCE PRO GOLEIRO!','É TETRA? NÃO, É SÓ PELADA MESMO!'],
  own:['GOL CONTRA, PELO AMOR!','FEZ NO PRÓPRIO GOL! O TIME TODO ESTÁ CHORANDO!','TROCOU DE TIME NO MEIO DO JOGO?!','ISSO NÃO SE FAZ COM A MÃE!'],
  knock:['FOI NO CHÃO FEITO JACA!','DESMONTOU!','O JUIZ ESTÁ OLHANDO O CELULAR!','ISSO FOI FALTA? NINGUÉM SABE!','ESSE AÍ VAI PRECISAR DE GELO!'],
  slide:['CARRINHO CRIMINOSO!','ENTROU DE SOLA, SEM DÓ!','VOOU NO TORNOZELO!'],
  bike:['BICICLETA! QUE PLASTICIDADE!','DE BICICLETA, MINHA GENTE!'],
  post:['NA TRAVE!','QUASE! A TRAVE AGRADECE O CARINHO!','UH! TIROU TINTA DA TRAVE!'],
  stomp:['PISOU NA CABEÇA DO COLEGA!','USOU O ADVERSÁRIO DE TRAMPOLIM!'],
  melon:['TOMOU UMA MELANCIA NA CABEÇA!','MELANCIA NA MOLEIRA!'],
  dive:['PEIXINHO!','CABEÇADA VOADORA!'],
};

/* ================= áudio ================= */
let AC=null,master=null,musBus=null,noiseBuf=null;const last={};
function ensureAudio(){
  if(AC){if(AC.state==='suspended')AC.resume();return}
  try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=cfg.muted?0:.55;master.connect(AC.destination);
    musBus=AC.createGain();musBus.gain.value=cfg.music?.32:0;musBus.connect(master);
    noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    mus.next=AC.currentTime+.1}catch(e){AC=null}
}
function tn(f1,f2,dur,vol,type,delay=0,bus){const t=AC.currentTime+Math.max(0,delay);const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(bus||master);o.start(t);o.stop(t+dur+.03)}
function nz(dur,freq,q,vol,type,freq2,delay=0,bus,attack=0){const t=AC.currentTime+Math.max(0,delay);const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(freq2)f.frequency.exponentialRampToValueAtTime(freq2,t+dur);f.Q.value=q;const g=AC.createGain();if(attack){g.gain.setValueAtTime(.0008,t);g.gain.exponentialRampToValueAtTime(vol,t+attack)}else g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(bus||master);s.start(t,Math.random());s.stop(t+dur+.03)}
const GAP={bounce:.05,kick:.04,tick:.05,splat:.08,boing:.1,clang:.15};
function sfx(n,v=1){
  if(!AC||cfg.muted)return;const now=AC.currentTime;if(now-(last[n]||0)<(GAP[n]||0))return;last[n]=now;
  try{switch(n){
    case'kick':tn(140,45,.14,.5*v,'sine');nz(.06,1800,1,.35*v,'bandpass');break;
    case'bounce':tn(220+v*160,90,.08,.18*v,'sine');break;
    case'swing':nz(.09,2500,.8,.12,'highpass');break;
    case'jump':tn(260,620,.12,.08,'square');break;
    case'boing':tn(180,900,.25,.14,'sine');tn(900,300,.2,.08,'triangle',.12);break;
    case'slide':nz(.35,900,1,.25,'bandpass',260);break;
    case'tumble':tn(1500,260,.55,.12,'sine');nz(.12,300,1,.4,'lowpass',null,.05);break;
    case'whistle':[0,.2].forEach((d,i)=>{const t=AC.currentTime+d;const o=AC.createOscillator(),lf=AC.createOscillator(),lg=AC.createGain(),g=AC.createGain();o.type='square';o.frequency.value=2850;lf.frequency.value=32;lg.gain.value=90;lf.connect(lg);lg.connect(o.frequency);const du=i?.5:.14;g.gain.setValueAtTime(.06,t);g.gain.setValueAtTime(.06,t+du-.03);g.gain.exponentialRampToValueAtTime(.001,t+du);o.connect(g);g.connect(master);o.start(t);lf.start(t);o.stop(t+du+.02);lf.stop(t+du+.02)});break;
    case'cheer':nz(3,900,.5,.32,'bandpass',600,0,null,.35);nz(2.6,2400,.6,.12,'bandpass',1800,.1,null,.3);for(let i=0;i<6;i++)tn(rand(300,600),rand(500,900),.3,.03,'sawtooth',rand(0,1.2));break;
    case'ooh':nz(1.4,500,.8,.2,'bandpass',300,0,null,.25);break;
    case'clang':tn(1750,1700,.5,.12,'triangle');tn(2630,2600,.4,.06,'sine');break;
    case'tick':tn(900,900,.03,.06,'square');break;
    case'ding':tn(1320,1320,.15,.12,'triangle');tn(1760,1760,.3,.1,'triangle',.1);break;
    case'splat':nz(.25,700,1,.4,'lowpass',200);tn(300,90,.2,.15,'sine');break;
    case'pop':tn(500,1400,.08,.1,'square');break;
    case'fanfare':[523,659,784,1046,784,1046].forEach((f,i)=>tn(f,f,.2,.11,'square',i*.14));break;
    case'click':tn(700,700,.03,.07,'square');break;
  }}catch(e){}
}
/* samba de fundo: surdo, tamborim, ganzá e agogô gerados na hora */
const mus={next:0,step:0};
function musicTick(){
  if(!AC||!cfg.music||cfg.muted)return;const spb=60/104/4;
  if(mus.next<AC.currentTime-.2)mus.next=AC.currentTime+.05;
  while(mus.next<AC.currentTime+.15){const s=mus.step,d=mus.next-AC.currentTime,b=s%16;
    if(b===4)tn(70,42,.35,.5,'sine',d,musBus);if(b===12)tn(58,38,.4,.6,'sine',d,musBus);if(b===0)tn(64,40,.25,.25,'sine',d,musBus);
    if([0,3,6,8,10,13,14].includes(b))tn(2300,2100,.035,.07,'square',d,musBus);
    nz(.04,7000,1,b%2?.04:.08,'highpass',null,d,musBus);
    if(s>=16&&[0,2,4,7,10].includes(b))tn(b%4?660:880,b%4?650:870,.12,.06,'triangle',d,musBus);
    mus.next+=spb*(s%2?.86:1.14);mus.step=(mus.step+1)%32}
}

/* ================= pintura dos estádios ================= */
function stroke(g,lw=3){g.lineWidth=lw;g.strokeStyle=INK;g.lineJoin='round';g.lineCap='round';g.stroke()}
function fillInk(g,fill,lw=3){g.fillStyle=fill;g.fill();stroke(g,lw)}
function circ(g,x,y,r){g.beginPath();g.arc(x,y,r,0,TAU)}
function rr(g,x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r)}
function poly(g,pts){g.beginPath();g.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)g.lineTo(pts[i],pts[i+1]);g.closePath()}
function blob(g,cs,fill,lw=5){cs.forEach(([x,y,r])=>{circ(g,x,y,r);g.lineWidth=lw;g.strokeStyle=INK;g.stroke()});g.fillStyle=fill;cs.forEach(([x,y,r])=>{circ(g,x,y,r);g.fill()})}
function vgrad(g,y0,y1,stops){const gr=g.createLinearGradient(0,y0,0,y1);stops.forEach(([o,c])=>gr.addColorStop(o,c));return gr}
function halftone(g,y0,y1,col){g.fillStyle=col;for(let y=y0;y<y1;y+=9)for(let x=(y/9%2)*4.5;x<W;x+=9){const r=1.6*(1-(y-y0)/(y1-y0));if(r>.2){g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}}}
function cloud(g,x,y,s){blob(g,[[x,y,26*s],[x+30*s,y-14*s,32*s],[x+62*s,y,26*s],[x+32*s,y+8*s,28*s]],'#ffffff',4)}
function kite(g,x,y,c1,c2){g.save();g.translate(x,y);g.rotate(.2);poly(g,[0,-22,16,0,0,26,-16,0]);fillInk(g,c1,2.5);g.beginPath();g.moveTo(0,-22);g.lineTo(0,26);g.moveTo(-16,0);g.lineTo(16,0);stroke(g,1.5);g.beginPath();g.moveTo(0,26);g.bezierCurveTo(10,50,-14,70,6,96);stroke(g,1.5);g.fillStyle=c2;[[3,46],[-3,64],[5,82]].forEach(([a,b])=>{poly(g,[a-5,b,a+5,b-3,a+5,b+3]);g.fill()});g.restore()}
function waterTank(g,x,y,s=1){rr(g,x-14*s,y-20*s,28*s,20*s,4*s);fillInk(g,'#2d7be0',2);g.beginPath();g.ellipse(x,y-20*s,14*s,4*s,0,0,TAU);fillInk(g,'#4b95f0',2)}
function groundBase(g,c1,c2){g.fillStyle=vgrad(g,GROUND,H,[[0,c1],[1,c2]]);g.fillRect(0,GROUND,W,H-GROUND);g.beginPath();g.moveTo(0,GROUND);g.lineTo(W,GROUND);stroke(g,4)}
function chalk(g,col='rgba(255,255,255,.75)'){g.strokeStyle=col;g.lineWidth=3;g.beginPath();g.ellipse(W/2,GROUND+44,110,16,0,0,TAU);g.stroke();g.beginPath();g.moveTo(W/2,GROUND+6);g.lineTo(W/2,H);g.stroke();
  [[GD+120,1],[W-GD-120,-1]].forEach(([x,d])=>{g.beginPath();g.moveTo(x,GROUND+6);g.lineTo(x-d*40,H);g.stroke()})}

function stadVarzea(g,R){
  g.fillStyle=vgrad(g,0,GROUND,[[0,'#56bdf5'],[1,'#c9efff']]);g.fillRect(0,0,W,GROUND);halftone(g,0,260,'rgba(255,255,255,.18)');
  cloud(g,140,110,1);cloud(g,720,70,.8);cloud(g,1020,150,1.1);kite(g,520,120,'#ff4f5e','#ffd23f');kite(g,1180,80,'#8f4dff','#3ad1a0');
  const hill=x=>430-Math.sin(x/W*Math.PI)*190+Math.sin(x*.012)*14;
  g.beginPath();g.moveTo(0,GROUND);for(let x=0;x<=W;x+=10)g.lineTo(x,hill(x));g.lineTo(W,GROUND);g.closePath();fillInk(g,'#62b85a',4);
  const cols=['#ff8a5b','#ffd23f','#4fc3f7','#f06292','#fff4dc','#9be15d','#ffb74d','#ce93d8'];
  const houses=[];for(let i=0;i<46;i++){const x=R()*W;const y=hill(x)+12+R()*150;houses.push([x,y])}houses.sort((a,b)=>a[1]-b[1]);
  houses.forEach(([x,y])=>{if(y>GROUND-40)return;const w=30+R()*30,h=24+R()*22;rr(g,x-w/2,y-h,w,h,2);fillInk(g,cols[Math.floor(R()*cols.length)],2.2);
    g.fillStyle=INK;g.fillRect(x-w/2+6,y-h+7,6,7);if(w>40)g.fillRect(x+w/2-12,y-h+7,6,7);if(R()<.55)waterTank(g,x+(R()-.5)*w*.4,y-h,.7)});
  g.fillStyle='#6b4a2e';rr(g,1150,330,22,300,8);fillInk(g,'#7a5232',3);blob(g,[[1160,300,70],[1100,330,50],[1220,340,52],[1160,360,58]],'#3f9a46',5);
  rr(g,0,GROUND-70,W,70,0);fillInk(g,'#ece0c6',4);g.strokeStyle='rgba(27,20,48,.18)';g.lineWidth=2;for(let y=GROUND-52;y<GROUND;y+=18){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
  g.save();g.translate(W/2,GROUND-34);g.rotate(-.04);g.font='40px "Titan One", Impact, sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=8;g.strokeStyle=INK;g.lineJoin='round';const w1=g.measureText('PELADA ').width,w2=g.measureText('ABSURDA').width,x0=-(w1+w2)/2;g.textAlign='left';[['PELADA',x0,'#ff8a1f'],['ABSURDA',x0+w1,'#8f4dff']].forEach(([t,x,c])=>{g.strokeText(t,x,0);g.fillStyle=c;g.fillText(t,x,0)});g.restore();
  groundBase(g,'#cf9356','#a86a35');
  for(let i=0;i<34;i++){g.fillStyle=R()<.5?'#6fb84a':'#5ea83f';g.beginPath();g.ellipse(R()*W,GROUND+10+R()*80,20+R()*40,5+R()*6,0,0,TAU);g.fill()}
  g.fillStyle='rgba(90,50,20,.25)';for(let i=0;i<120;i++)g.fillRect(R()*W,GROUND+6+R()*90,3,2);
  chalk(g);
}
function palm(g,x,y,h,lean){g.beginPath();g.moveTo(x-8,y);g.bezierCurveTo(x-6+lean*.3,y-h*.4,x+lean*.7,y-h*.8,x+lean,y-h);g.lineTo(x+lean+10,y-h);g.bezierCurveTo(x+lean*.7+10,y-h*.8,x+8+lean*.3,y-h*.4,x+10,y);g.closePath();fillInk(g,'#a8743f',3);
  const tx=x+lean+5,ty=y-h;for(let i=0;i<6;i++){const a=-Math.PI*.95+i*Math.PI/5.2;g.beginPath();g.moveTo(tx,ty);g.quadraticCurveTo(tx+Math.cos(a)*70,ty+Math.sin(a)*70-30,tx+Math.cos(a)*120,ty+Math.sin(a)*60+20);g.quadraticCurveTo(tx+Math.cos(a)*60,ty+Math.sin(a)*40,tx,ty);fillInk(g,i%2?'#3fa34d':'#55c063',3)}
  circ(g,tx-6,ty+8,8);fillInk(g,'#6b4a2e',2);circ(g,tx+8,ty+10,8);fillInk(g,'#6b4a2e',2)}
function stadPraia(g,R){
  g.fillStyle=vgrad(g,0,GROUND,[[0,'#ff7e8a'],[.55,'#ffae6b'],[1,'#ffe08a']]);g.fillRect(0,0,W,GROUND);halftone(g,0,300,'rgba(255,255,255,.16)');
  circ(g,860,440,120);fillInk(g,'#fff1a8',5);
  cloud(g,200,140,.9);cloud(g,1050,110,.7);
  g.fillStyle='#e05a7a';g.beginPath();g.moveTo(0,470);g.quadraticCurveTo(200,400,420,470);g.closePath();g.fill();
  rr(g,-5,468,W+10,100,0);fillInk(g,'#25a9b8',4);g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=3;for(let i=0;i<14;i++){const x=R()*W,y=490+R()*60;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+16,y-8,x+32,y);g.quadraticCurveTo(x+48,y+8,x+64,y);g.stroke()}
  g.fillStyle='rgba(255,241,168,.55)';for(let i=0;i<10;i++)g.fillRect(780+R()*160,480+i*8,40+R()*60,3);
  rr(g,-5,560,W+10,70,0);fillInk(g,'#f6dd9c',4);
  palm(g,130,600,260,30);palm(g,1150,600,230,-40);
  g.save();g.translate(980,600);g.beginPath();g.moveTo(0,0);g.lineTo(6,-110);stroke(g,4);g.beginPath();g.moveTo(-70,-90);g.quadraticCurveTo(6,-170,82,-90);g.closePath();fillInk(g,'#ff4f5e',3);
  g.save();g.clip();g.fillStyle='#fff';for(let i=-3;i<4;i+=2){g.beginPath();g.moveTo(6,-140);g.lineTo(-60+i*22,-80);g.lineTo(-40+i*22,-80);g.closePath();g.fill()}g.restore();g.beginPath();g.moveTo(-70,-90);g.quadraticCurveTo(6,-170,82,-90);g.closePath();stroke(g,3);g.restore();
  g.beginPath();g.moveTo(220,575);g.lineTo(1060,575);g.strokeStyle='rgba(27,20,48,.5)';g.lineWidth=2;g.stroke();
  groundBase(g,'#f6d892','#e2b865');
  g.fillStyle='rgba(160,110,40,.25)';for(let i=0;i<200;i++)g.fillRect(R()*W,GROUND+6+R()*90,2,2);
  for(let i=0;i<12;i++){g.fillStyle='rgba(160,110,40,.3)';g.beginPath();g.ellipse(200+i*80,GROUND+30+(i%2)*20,6,3,0,0,TAU);g.fill()}
  chalk(g,'rgba(40,120,160,.55)');
}
function stadNoite(g,R){
  g.fillStyle=vgrad(g,0,GROUND,[[0,'#0c1230'],[1,'#26336b']]);g.fillRect(0,0,W,GROUND);
  g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<90;i++)g.fillRect(R()*W,R()*200,2,2);
  [[180,-1],[1100,1]].forEach(([x,d])=>{const gr=g.createRadialGradient(x,70,10,x,70,420);gr.addColorStop(0,'rgba(255,250,210,.32)');gr.addColorStop(1,'rgba(255,250,210,0)');g.fillStyle=gr;g.fillRect(x-420,0,840,520);
    rr(g,x-6,70,12,240,3);fillInk(g,'#4a5170',3);rr(g,x-50,30,100,52,6);fillInk(g,'#2b3150',3);g.fillStyle='#fffbe0';for(let i=0;i<4;i++)for(let j=0;j<2;j++){circ(g,x-36+i*24,44+j*24,8);g.fill()}});
  poly(g,[-10,560,-10,250,W+10,250,W+10,560]);fillInk(g,'#1f2a55',4);
  const tc=['#ff8a1f','#8f4dff','#ffd23f','#ffffff','#ff4f5e','#3ad1a0'];
  for(let row=0;row<9;row++){const y=272+row*31;g.beginPath();g.moveTo(0,y+20);g.lineTo(W,y+20);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.stroke();
    for(let x=10+(row%2)*11;x<W;x+=22){const c=x<W/2?(R()<.6?tc[0]:pick2(R,tc)):(R()<.6?tc[1]:pick2(R,tc));g.fillStyle=c;rr(g,x-7,y+6,14,14,4);g.fill();g.fillStyle=R()<.5?'#e0ac69':'#8d5524';circ(g,x,y+2,6);g.fill()}}
  rr(g,500,262,280,64,8);fillInk(g,'#11152b',4);g.font='26px "Titan One", Impact, sans-serif';g.textAlign='center';g.fillStyle='#ffd23f';g.fillText('PELADA ABSURDA',640,303);
  const ads=[['PASTEL DO ZÉ','#ffd23f'],['CALDO DE CANA','#3ad1a0'],['BORRACHARIA 24H','#ff4f5e'],['AÇAÍ DA TIA','#8f4dff'],['CHURRASQUINHO','#ff8a1f']];
  let ax=0;let i=0;while(ax<W){const [t,c]=ads[i%ads.length];const w=260;rr(g,ax,560,w,58,0);fillInk(g,c,4);g.font='22px "Titan One", Impact, sans-serif';g.fillStyle=INK;g.textAlign='center';g.fillText(t,ax+w/2,597);ax+=w;i++}
  groundBase(g,'#2f9f4a','#237a38');for(let x=0;x<W;x+=80){g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x,GROUND+2,40,H-GROUND)}
  chalk(g);
}
function pick2(R,a){return a[Math.floor(R()*a.length)]}
function stadLaje(g,R){
  g.fillStyle=vgrad(g,0,GROUND,[[0,'#7ccdfc'],[1,'#e2f6ff']]);g.fillRect(0,0,W,GROUND);halftone(g,0,240,'rgba(255,255,255,.2)');
  cloud(g,300,90,.8);cloud(g,900,140,1);kite(g,180,180,'#ffd23f','#ff4f5e');kite(g,760,90,'#3ad1a0','#8f4dff');kite(g,1130,200,'#ff8a1f','#4fb4ff');
  const cols=['#f4a6a6','#ffe0a3','#a6d8f4','#c9b6f2','#b9e8b0','#f7c59f','#e8e2d0'];
  let x=-20;while(x<W){const w=60+R()*90,h=120+R()*200;rr(g,x,GROUND-h,w,h,3);fillInk(g,pick2(R,cols),3);g.fillStyle='rgba(27,20,48,.7)';for(let wy=GROUND-h+14;wy<GROUND-90;wy+=26)for(let wx=x+10;wx<x+w-14;wx+=22)g.fillRect(wx,wy,10,12);
    if(R()<.6)waterTank(g,x+w*.5,GROUND-h,1);if(R()<.4){g.beginPath();g.moveTo(x+12,GROUND-h);g.lineTo(x+12,GROUND-h-30);g.moveTo(x+4,GROUND-h-24);g.lineTo(x+20,GROUND-h-24);g.moveTo(x+6,GROUND-h-16);g.lineTo(x+18,GROUND-h-16);stroke(g,2)}x+=w+6}
  rr(g,0,GROUND-60,W,60,0);fillInk(g,'#9a948a',4);g.strokeStyle='rgba(27,20,48,.3)';g.lineWidth=2;for(let yy=GROUND-40;yy<GROUND;yy+=20){g.beginPath();g.moveTo(0,yy);g.lineTo(W,yy);g.stroke()}for(let xx=0;xx<W;xx+=40){g.beginPath();g.moveTo(xx+(Math.floor(xx/40)%2)*20,GROUND-60);g.lineTo(xx+(Math.floor(xx/40)%2)*20,GROUND);g.stroke()}
  rr(g,600,GROUND-150,90,90,8);fillInk(g,'#2d7be0',4);g.beginPath();g.ellipse(645,GROUND-150,45,12,0,0,TAU);fillInk(g,'#4b95f0',4);g.font='18px "Titan One", Impact, sans-serif';g.fillStyle='#fff';g.textAlign='center';g.fillText('1000L',645,GROUND-100);
  rr(g,940,GROUND-130,110,70,4);fillInk(g,'#c2573c',4);g.strokeStyle='rgba(27,20,48,.4)';g.lineWidth=2;for(let yy=GROUND-115;yy<GROUND-60;yy+=14){g.beginPath();g.moveTo(940,yy);g.lineTo(1050,yy);g.stroke()}rr(g,955,GROUND-160,80,30,3);fillInk(g,'#3a3a44',3);
  g.beginPath();g.moveTo(240,GROUND-60);g.lineTo(240,GROUND-200);g.moveTo(520,GROUND-60);g.lineTo(520,GROUND-200);stroke(g,5);g.beginPath();g.moveTo(240,GROUND-190);g.quadraticCurveTo(380,GROUND-160,520,GROUND-190);stroke(g,2);
  [['#ff4f5e',280],['#ffd23f',330],['#4fb4ff',390],['#ffffff',450]].forEach(([c,cx])=>{const cy=GROUND-178+((cx-380)**2)/1400;rr(g,cx-16,cy,32,40,3);fillInk(g,c,2.5)});
  groundBase(g,'#c4beb2','#a29b8e');g.strokeStyle='rgba(27,20,48,.25)';g.lineWidth=2;for(let i=0;i<8;i++){let cx=R()*W,cy=GROUND+10+R()*80;g.beginPath();g.moveTo(cx,cy);for(let k=0;k<4;k++){cx+=(R()-.3)*30;cy+=(R()-.5)*14;g.lineTo(cx,cy)}g.stroke()}
  g.fillStyle='rgba(120,170,220,.45)';g.beginPath();g.ellipse(820,GROUND+60,70,10,0,0,TAU);g.fill();
  chalk(g,'rgba(255,240,140,.8)');
}
const PAINT=[stadVarzea,stadPraia,stadNoite,stadLaje];
function paintStadium(g,i){PAINT[i](g,mulberry(i*7919+3))}

/* ================= tela & escala ================= */
let K=1,bg=document.createElement('canvas');
function buildBg(){bg.width=cvs.width;bg.height=cvs.height;const g=bg.getContext('2d');g.setTransform(K,0,0,K,0,0);paintStadium(g,cfg.stadium)}
function resize(){
  const r=app.getBoundingClientRect();const aw=Math.max(200,r.width-32),ah=Math.max(120,r.height-32);
  let w=aw,h=w*9/16;if(h>ah){h=ah;w=h*16/9}
  stage.style.width=w+'px';stage.style.height=h+'px';stage.style.fontSize=Math.max(8.5,w/1280*16)+'px';
  const dpr=Math.min(2,window.devicePixelRatio||1);cvs.width=Math.round(w*dpr);cvs.height=Math.round(h*dpr);K=cvs.width/W;buildBg();
}
window.addEventListener('resize',resize);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{buildBg();if(state==='lobby')renderLobby()});

/* ================= estado do jogo ================= */
let state='menu',time=0;
const game={players:[],balls:[],fx:[],hazards:[],active:[],score:[0,0],clock:180,phase:'countdown',phaseT:0,sudden:false,ruleT:15,rolling:0,rollShow:'',
  cam:{x:W/2,y:H/2,z:1,tx:W/2,ty:H/2,tz:1},slowT:0,hitstop:0,shake:0,wind:0,windT:0,melonT:0,elapsed:0,first:true,keysT:8,lastNarr:-9,lastScorer:-1,goalTeam:-1,bigText:null};
const R=id=>game.active.includes(id);
let K_={};function phys(){
  const SC=R('tampinha')?.8:1.35;
  K_={SC,HRL:25*(R('cabecao')?1.85:1),grav:1900*(R('lua')?.38:1),CB:GROUND-(R('golpequeno')?120:R('golgigante')?300:196),
    jump:740*(R('mola')?1.38:1)*(R('lua')?.62:1)*(SC<1?.9:1),speed:390*(SC<1?.9:1),
    ballR:R('praia')?46:R('boliche')?19:22,ballBounce:R('boliche')?.22:R('pulapula')?1.0:R('praia')?.82:.68,ballG:R('praia')?.42:R('boliche')?1.25:1,ballDrag:R('praia')?1.1:.38,
    ts:R('turbo')?1.35:1};return K_}
phys();

/* ================= entidades ================= */
function makePlayer(team,def){
  return{team,ctrl:def.ctrl,char:CHARS[def.char],x:0,y:GROUND,py:GROUND,vx:0,vy:0,pvx:0,pvy:0,face:team?-1:1,grounded:true,kickT:0,kickCd:0,kicked:false,slideT:0,slideCd:0,dive:false,
    stun:0,inv:0,ang:0,angV:0,run:0,prev:{j:false,k:false,s:false},arms:[{x:0,y:0,vx:0,vy:0},{x:0,y:0,vx:0,vy:0}],eye:{x:0,y:0,vx:0,vy:0},mood:'normal',celebrate:0,squish:0,
    ai:{t:0,x:0,j:false,k:false,s:false,stuck:0},stats:{goals:0,own:0,falls:0,kicks:0},tag:CTRL_TAG[def.ctrl]||''};
}
function makeBall(x,y,vx=0,vy=0){return{x,y,vx,vy,r:K_.ballR,spin:0,last:null,trail:[],dead:false}}
function headPos(p){return toWorld(p,2,-(60+K_.HRL*.8))}
function toWorld(p,lx,ly){const SC=K_.SC,c=Math.cos(p.ang),s=Math.sin(p.ang);const rx=lx*p.face,ry=ly+38;return{x:p.x+(rx*c-ry*s)*SC,y:p.y+(-38+rx*s+ry*c)*SC}}
function placePlayers(kt){
  const by=[[],[]];game.players.forEach(p=>by[p.team].push(p));
  by.forEach((list,t)=>list.forEach((p,i)=>{const att=kt===t;const xs=list.length===1?[att?470:300]:att?[520,260]:[340,190];const x=t===0?xs[i]:W-xs[i];
    Object.assign(p,{x,y:GROUND,py:GROUND,vx:0,vy:0,face:t===0?1:-1,stun:0,inv:0,ang:0,angV:0,slideT:0,kickT:0,celebrate:0,grounded:true,dive:false})}));
}
function resetBalls(kt){const bx=kt==null?W/2:W/2+(kt===0?-70:70);game.balls=[makeBall(bx,260,0,0)];if(R('multibola'))addExtraBalls()}
function addExtraBalls(){game.balls.push(makeBall(W/2-220,120,rand(-80,80),0),makeBall(W/2+220,120,rand(-80,80),0));sfx('pop')}

/* ================= efeitos ================= */
function addFx(p){if(game.fx.length>700)game.fx.shift();game.fx.push(p)}
function dust(x,y,n=5,col='rgba(180,140,100,.7)'){for(let i=0;i<n;i++)addFx({t:'puff',x:x+rand(-10,10),y,vx:rand(-80,80),vy:rand(-80,-20),g:-20,life:rand(.3,.6),max:.6,size:rand(5,10),c:col})}
function burst(x,y,text,col='#ffd23f',size=1){addFx({t:'burst',x,y,text,c:col,life:.75,max:.75,size,rot:rand(-.3,.3)})}
function confetti(x,y,n,cols){for(let i=0;i<n;i++){const a=rand(-Math.PI*.95,-Math.PI*.05),s=rand(300,900);addFx({t:'conf',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:700,drag:1.5,life:rand(1.5,3),max:3,c:pick(cols),rot:rand(0,TAU),vr:rand(-12,12),w:rand(6,12)})}}
function shake(m){game.shake=Math.max(game.shake,m)}
function hitstop(t){game.hitstop=Math.max(game.hitstop,t)}
function narrate(line,force){if(!force&&time-game.lastNarr<1.6)return;game.lastNarr=time;const n=$('narr');$('narrtxt').textContent=line;n.classList.add('show');clearTimeout(narrate.t);narrate.t=setTimeout(()=>n.classList.remove('show'),2600)}

/* ================= entradas ================= */
const keys=new Set();
const KB={k1:{l:['KeyA'],r:['KeyD'],j:['KeyW'],k:['KeyF','Space'],s:['KeyG','KeyS']},k2:{l:['ArrowLeft'],r:['ArrowRight'],j:['ArrowUp'],k:['KeyK','Enter','NumpadEnter','Period','Numpad1'],s:['KeyL','ArrowDown','Comma','Numpad2']}};
const kd=c=>keys.has(c);
let pads=[];function pollPads(){try{pads=navigator.getGamepads?Array.from(navigator.getGamepads()):[]}catch(e){pads=[]}}
const bp=(g,i)=>!!(g.buttons[i]&&g.buttons[i].pressed);
function humanInput(p){
  const c=p.ctrl;let x=0,j=false,k=false,s=false;
  if(KB[c]){const m=KB[c];if(m.l.some(kd))x-=1;if(m.r.some(kd))x+=1;j=m.j.some(kd);k=m.k.some(kd);s=m.s.some(kd)}
  else if(c.startsWith('gp')){const g=pads.filter(Boolean)[+c[2]];if(g){const ax=g.axes[0]||0;if(Math.abs(ax)>.3)x=Math.sign(ax);if(bp(g,14))x=-1;if(bp(g,15))x=1;j=bp(g,0)||bp(g,12);k=bp(g,1)||bp(g,2)||bp(g,7);s=bp(g,3)||bp(g,5)||bp(g,4)||bp(g,6)}}
  if(R('invertido'))x=-x;
  return{x,j,k,s,mul:1};
}
const BOT=[{react:.24,spd:.78,kick:.5,jump:.45,slide:.004},{react:.13,spd:.92,kick:.8,jump:.75,slide:.01},{react:.06,spd:1.02,kick:1,jump:.95,slide:.02}];
function botInput(p,dt){
  const ai=p.ai,lv=BOT[cfg.bot];ai.t-=dt;
  if(ai.t>0)return{x:ai.x,j:ai.j,k:ai.k,s:ai.s,mul:lv.spd,face:p.team===0?1:-1};
  ai.t=lv.react*rand(.7,1.3);
  const dir=p.team===0?1:-1,own=p.team===0?0:W;
  let b=game.balls[0],bd=1e9;for(const o of game.balls){const d=Math.abs(o.x-p.x)+Math.abs(o.y-p.y)*.5;if(d<bd){bd=d;b=o}}
  const bx=b.x+b.vx*.2,by=b.y;
  const mates=game.players.filter(m=>m.team===p.team&&m!==p);
  let role='atk';if(mates.length){const m=mates[0];if(Math.abs(p.x-own)<Math.abs(m.x-own))role='def'}
  const ownHalf=(bx-W/2)*dir<0;
  const behind=(p.x-bx)*dir<0;
  let tx;
  const oppThreat=game.players.some(o=>o.team!==p.team&&o.stun<=0&&Math.abs(o.x-b.x)<Math.abs(p.x-b.x)-30&&(o.x-b.x)*dir>0);
  const danger=(ownHalf&&b.vx*dir<-200)||(oppThreat&&ownHalf)||(!behind&&Math.abs(b.x-own)<760&&!mates.length);
  if(!mates.length){
    const dOwn=Math.abs(b.x-own);
    if(behind&&(dOwn<640||Math.abs(b.vx)<260))tx=bx-dir*26;
    else if(!behind)tx=own+dir*(GD+30);
    else tx=own+dir*380;
  }
  else if(role==='def'&&!ownHalf)tx=own+dir*230;
  else if(danger&&role==='def')tx=own+dir*(GD+28);
  else tx=behind?bx-dir*26:bx-dir*80;
  if(Math.abs((b.x-own))<GD+40&&b.y>K_.CB)tx=b.x+dir*10;
  let x=Math.abs(tx-p.x)>10?Math.sign(tx-p.x):0;
  if(danger&&!behind&&Math.abs(b.x-p.x)<120&&b.y>GROUND-110&&p.grounded&&(b.x-p.x)*x>0){ai.j=true;Object.assign(ai,{x,j:true,k:false,s:false});return{x,j:true,k:false,s:false,mul:lv.spd,face:dir}}
  const hd=headPos(p);let j=false;
  if(Math.abs(b.x-p.x)<95&&by<hd.y-5&&by>hd.y-240&&b.vy>-200&&Math.random()<lv.jump)j=true;
  if(!behind&&Math.abs(bx-p.x)<95&&by>GROUND-90&&p.grounded&&Math.random()<.85)j=true;
  if(Math.abs(tx-p.x)<30&&by<hd.y-200){ai.stuck+=lv.react;if(ai.stuck>1.4&&Math.random()<.4){j=true;ai.stuck=0}}else ai.stuck=0;
  let k=false;const fx=p.x+dir*28,d=Math.hypot(b.x-fx,b.y-(p.y-24));
  const bike=!p.grounded&&b.y<p.y-58*K_.SC;
  if(d<b.r+44&&(b.x-p.x)*dir>-8&&!bike&&Math.random()<lv.kick&&!ai.k){k=true;x=dir}
  else if(bike&&p.face===-dir&&d<b.r+60&&Math.random()<lv.kick*.6){k=true}
  let s=false;
  for(const o of game.players){if(o.team===p.team||o.stun>0)continue;const dx=(o.x-p.x)*dir;if(dx>20&&dx<110&&Math.abs(o.y-p.y)<20&&Math.abs(o.x-b.x)<90&&Math.random()<lv.slide*6){s=true;x=dir}}
  if(R('melancia')&&Math.random()<.3)for(const m of game.hazards){if(Math.abs(m.x-p.x)<50&&m.y<p.y-80)x=Math.sign(p.x-m.x)||1}
  Object.assign(ai,{x,j,k,s});
  return{x,j,k,s,mul:lv.spd,face:dir};
}

/* ================= jogadores ================= */
function startKick(p){p.kickT=.26;p.kickCd=.34;p.kicked=false;p.stats.kicks++;sfx('swing')}
function startSlide(p){
  p.slideCd=1.1;
  if(p.grounded){p.slideT=.5;p.dive=false;p.vx=p.face*760*K_.SC;sfx('slide');dust(p.x,p.y,8)}
  else{p.slideT=.45;p.dive=true;p.vx=p.face*580*K_.SC;p.vy=Math.max(p.vy,120);sfx('swing')}
}
function knockdown(o,vx,vy,why,dur=1.1){
  if(o.stun>0||o.inv>0)return false;
  o.stun=dur;o.vx=vx;o.vy=vy;o.grounded=false;o.angV=(Math.sign(vx)||1)*rand(9,15);o.slideT=0;o.kickT=0;o.dive=false;o.stats.falls++;
  const h=headPos(o);burst(h.x,h.y-20,pick(['POW!','PLOFT!','CATAPIMBA!','TABEFE!','BAM!','CABRUM!']),'#ffd23f');sfx('tumble');shake(6);hitstop(.06);
  if(why)narrate(pick(LINES[why]));return true;
}
function processKick(p){
  if(p.kickT<=0||p.kicked)return;const prog=1-p.kickT/.26;if(prog<.22)return;
  const SC=K_.SC,fx=p.x+p.face*30*SC,fy=p.y-18*SC;
  for(const b of game.balls){const d1=Math.hypot(b.x-fx,b.y-fy),d2=Math.hypot(b.x-(p.x+p.face*8*SC),b.y-(p.y-46*SC));
    if(d1<b.r+30*SC||d2<b.r+24*SC){kickBall(p,b);p.kicked=true;break}}
  if(p.kicked||prog<.45)return;
  for(const o of game.players){if(o===p||o.team===p.team)continue;const dx=(o.x-p.x)*p.face;if(dx>0&&dx<46*SC&&Math.abs(o.y-p.y)<60*SC){if(knockdown(o,p.face*340,-380,'knock',.7))p.kicked=true}}
}
function kickBall(p,b){
  const SC=K_.SC;let dirx=p.face,a,pow=800,bike=false;
  if(!p.grounded&&b.y<p.y-58*SC){bike=true;dirx=-p.face;a=.6;pow=1180}
  else if(b.y<p.y-48*SC)a=.16;
  else a=.58+rand(-.1,.1);
  pow*=R('boliche')?.62:R('praia')?.7:1;
  b.vx=dirx*Math.cos(a)*pow+p.vx*.35;b.vy=-Math.sin(a)*pow+Math.min(0,p.vy)*.25;b.last=p;b.spin=dirx*25;
  burst(b.x,b.y-10,bike?'BICICLETA!':pick(['PÁ!','TUM!','BUM!','PÁ!']),bike?'#ff4f5e':'#fff4dc',bike?1.2:.8);
  shake(bike?8:4);hitstop(bike?.09:.035);sfx('kick');
  if(bike)narrate(pick(LINES.bike));
}
function updatePlayer(p,dt,frozen){
  const k=K_,SC=k.SC;
  let inp=frozen?{x:0,j:false,k:false,s:false,mul:1}:(p.ctrl==='bot'?botInput(p,dt):humanInput(p));
  if(game.phase==='goal'&&p.celebrate>0){p.celebrate-=dt;if(p.ctrl==='bot')inp={x:Math.sin(time*3+p.x)*.6,j:p.grounded&&Math.random()<.08,k:false,s:false,mul:.6}}
  const jE=inp.j&&!p.prev.j,kE=inp.k&&!p.prev.k,sE=inp.s&&!p.prev.s;p.prev={j:inp.j,k:inp.k,s:inp.s};
  p.kickCd-=dt;p.slideCd-=dt;if(p.inv>0)p.inv-=dt;if(p.kickT>0)p.kickT-=dt;if(p.squish>0)p.squish-=dt*3;
  const maxS=k.speed*inp.mul;
  if(p.stun>0){
    p.stun-=dt;p.ang+=p.angV*dt;if(p.stun<=0){p.inv=.7;p.ang=((p.ang+Math.PI)%TAU+TAU)%TAU-Math.PI}
  }else if(p.slideT>0){
    p.slideT-=dt;if(p.grounded){p.vx*=Math.pow(R('sabao')?.7:.18,dt)}
    const tgt=p.dive?p.face*1.25:-p.face*1.15;p.ang+=(tgt-p.ang)*Math.min(1,dt*18);
    if(p.grounded&&!p.dive)for(const o of game.players){if(o.team===p.team||o.stun>0)continue;const dx=(o.x-p.x)*p.face;if(dx>-6&&dx<46*SC&&Math.abs(o.y-p.y)<34*SC)knockdown(o,p.face*260,-520,'slide',.8)}
    if(p.slideT<=0)p.dive=false;
  }else{
    const ix=inp.x;const target=ix*maxS;
    const acc=p.grounded?(R('sabao')?1.3:14):4.5;
    p.vx+=(target-p.vx)*Math.min(1,dt*acc);
    if(p.kickT<=0){if(ix)p.face=Math.sign(ix);else if(inp.face&&Math.abs(p.vx)<60)p.face=inp.face}
    if(jE&&p.grounded){p.vy=-k.jump;p.grounded=false;sfx('jump');dust(p.x,p.y,4)}
    if(kE&&p.kickCd<=0)startKick(p);
    if(sE&&p.slideCd<=0)startSlide(p);
    p.ang+=(clamp(p.vx/k.speed,-1,1)*.13-p.ang)*Math.min(1,dt*10);
  }
  if(R('vento'))p.vx+=game.wind*.42*dt;
  p.vy+=k.grav*dt;
  p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;
  const wasAir=!p.grounded;p.grounded=false;
  if(p.y>=GROUND){p.y=GROUND;
    if(p.stun>0&&p.vy>220){p.vy=-p.vy*.38;p.angV*=.7;dust(p.x,p.y,4)}else{if(wasAir&&p.vy>500){dust(p.x,p.y,6);p.squish=1}p.vy=0;p.grounded=true}
    if(p.stun>0){p.vx*=Math.pow(.15,dt);p.angV*=Math.pow(.05,dt)}}
  const CB=k.CB;
  for(const side of[0,1]){const x0=side?W-GD-6:0,x1=side?W:GD+6;
    if(p.x>x0&&p.x<x1){
      if(p.vy>0&&p.py<=CB-5&&p.y>=CB-5){p.y=CB-5;p.vy=0;p.grounded=true}
      const top=p.y-(64+k.HRL*1.6)*SC,ptop=p.py-(64+k.HRL*1.6)*SC;
      if(p.vy<0&&ptop>=CB+6&&top<CB+6){p.y+=CB+6-top;p.vy=60}
    }}
  if(p.x<14){p.x=14;if(p.stun>0)p.vx=Math.abs(p.vx)*.5;else p.vx=Math.max(0,p.vx)}
  if(p.x>W-14){p.x=W-14;if(p.stun>0)p.vx=-Math.abs(p.vx)*.5;else p.vx=Math.min(0,p.vx)}
  if(p.grounded&&Math.abs(p.vx)>60&&p.stun<=0&&p.slideT<=0){p.run+=Math.abs(p.vx)*dt*.045;if(Math.random()<dt*6)dust(p.x-p.face*8,p.y,1)}
  processKick(p);
  /* molejo: braços e pupilas são molas no espaço local */
  const ax=(p.vx-p.pvx)/Math.max(dt,1e-4),ay=(p.vy-p.pvy)/Math.max(dt,1e-4);p.pvx=p.vx;p.pvy=p.vy;
  const lax=clamp(ax*p.face,-6000,6000),lay=clamp(ay,-6000,6000);
  const cel=game.phase==='goal'&&game.goalTeam===p.team;
  p.arms.forEach((a,i)=>{let tx,ty;const sw=Math.sin(p.run+(i?Math.PI:0))*10*Math.min(1,Math.abs(p.vx)/200);
    if(p.stun>0){tx=Math.sin(time*25+i*2)*18;ty=-14+Math.cos(time*22+i)*12}
    else if(cel){tx=i?-8:10;ty=-30+Math.sin(time*14+i*3)*6}
    else if(!p.grounded){tx=i?-14:16;ty=-12}
    else{tx=(i?-4:6)+sw;ty=22}
    a.vx+=((tx-a.x)*95-a.vx*7-lax*.011)*dt;a.vy+=((ty-a.y)*95-a.vy*7-lay*.011+120)*dt;a.x+=a.vx*dt;a.y+=a.vy*dt;
    const L=Math.hypot(a.x,a.y);if(L>27){a.x*=27/L;a.y*=27/L}});
  let lx=0,ly=0;const hd=headPos(p),b0=game.balls[0];if(b0){const dx=b0.x-hd.x,dy=b0.y-hd.y,d=Math.hypot(dx,dy)||1;lx=dx/d*p.face;ly=dy/d}
  const e=p.eye,mx=k.HRL*.12;e.vx+=((lx*mx-e.x)*160-e.vx*5-lax*.0025)*dt;e.vy+=((ly*mx-e.y)*160-e.vy*5-lay*.0025)*dt;e.x+=e.vx*dt;e.y+=e.vy*dt;
  const el=Math.hypot(e.x,e.y),em=k.HRL*.16;if(el>em){e.x*=em/el;e.y*=em/el}
  p.mood=p.stun>0?'stun':game.phase==='goal'?(game.goalTeam===p.team?'happy':'sad'):!p.grounded?'air':p.kickT>0||p.slideT>0?'grr':'normal';
}
function separatePlayers(){
  const ps=game.players,SC=K_.SC;
  for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j];
    const dx=b.x-a.x,dy=b.y-a.y;
    for(const [top,bot] of [[a,b],[b,a]]){const hb=bot.y-(64+K_.HRL*1.6)*SC;if(top.vy>320&&top.stun<=0&&!(top.stompT>time)&&Math.abs(top.x-bot.x)<26*SC+K_.HRL*.5*SC&&top.y>hb-8&&top.y<hb+26){top.vy=-K_.jump*.75;top.y=hb-8;top.stompT=time+.8;top.vx=(Math.sign(top.x-bot.x)||top.face)*260;bot.squish=1;burst(top.x,hb,'BOING!','#3ad1a0',.8);sfx('boing');narrate(pick(LINES.stomp))}}
    if(Math.abs(dx)<34*SC&&Math.abs(dy)<60*SC){const o=(34*SC-Math.abs(dx))/2,s=dx>=0?1:-1;a.x-=s*o;b.x+=s*o}}
}

/* ================= bola ================= */
function collideBallCircle(b,cx,cy,cr,pvx,pvy,p,part){
  const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),min=b.r+cr;if(d>=min||d<1e-3)return false;
  const nx=dx/d,ny=dy/d;b.x=cx+nx*min;b.y=cy+ny*min;
  const rvx=b.vx-pvx,rvy=b.vy-pvy,vn=rvx*nx+rvy*ny;
  if(vn<0){const e=part==='head'?.78:.42;b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny;if(Math.abs(vn)>220)sfx('bounce',clamp(Math.abs(vn)/900,.2,1))}
  b.vx+=pvx*.12;if(part==='head'&&pvy<-80)b.vy+=pvy*.4;
  if(part==='head'&&p.dive){b.vx+=p.face*620;b.vy-=120;burst(b.x,b.y,'PEIXINHO!','#3ad1a0',.9);narrate(pick(LINES.dive));p.dive=false;shake(5)}
  if(R('boliche')&&Math.hypot(b.vx-pvx,b.vy-pvy)>420&&b.last&&b.last!==p){knockdown(p,Math.sign(b.vx)*300,-380,'knock')}
  if(p.stun<=0&&(part==='head'||p.slideT>0||!b.last))b.last=p;return true;
}
function updateBall(b,dt){
  const k=K_;b.r+=(k.ballR-b.r)*Math.min(1,dt*8);
  b.vy+=k.grav*k.ballG*dt;const dr=Math.exp(-k.ballDrag*dt);b.vx*=dr;b.vy*=R('praia')?dr:1;
  if(R('vento'))b.vx+=game.wind*dt*(R('praia')?2.2:1);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.spin=lerp(b.spin,b.vx/b.r,Math.min(1,dt*4));b.rot=(b.rot||0)+b.spin*dt;
  b.trail.push([b.x,b.y]);if(b.trail.length>7)b.trail.shift();
  if(b.y+b.r>GROUND){b.y=GROUND-b.r;if(b.vy>0){if(b.vy>140)sfx('bounce',clamp(b.vy/1000,.15,1));b.vy=-b.vy*k.ballBounce;if(R('pulapula')&&Math.abs(b.vy)<380)b.vy=-380;b.vx*=.85}if(Math.abs(b.vy)<40){b.vy=0;b.vx*=Math.pow(R('sabao')?.6:.1,dt)}}
  if(b.y-b.r<0){b.y=b.r;b.vy=Math.abs(b.vy)*.7}
  const inNet=b.y>k.CB;
  if(b.x-b.r<0){b.x=b.r;b.vx=Math.abs(b.vx)*(inNet?.2:.65)}
  if(b.x+b.r>W){b.x=W-b.r;b.vx=-Math.abs(b.vx)*(inNet?.2:.65)}
  for(const [x0,x1,cap] of [[0,GD,GD],[W-GD,W,W-GD]]){
    const cx=clamp(b.x,x0,x1),cy=k.CB,dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),min=b.r+7;
    if(d<min&&d>1e-3){const nx=dx/d,ny=dy/d;b.x=cx+nx*min;b.y=cy+ny*min;const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.65*vn*nx;b.vy-=1.65*vn*ny;
      if(Math.abs(vn)>300){sfx('clang');shake(4);if(Math.abs(cx-cap)<2&&game.phase==='play'){narrate(pick(LINES.post));sfx('ooh');burst(cx,cy,'TRAVE!','#fff4dc',.8)}}}}}
  const SC=k.SC;
  for(const p of game.players){
    const hd=headPos(p);collideBallCircle(b,hd.x,hd.y,k.HRL*SC,p.vx,p.vy,p,'head');
    const bc=p.slideT>0&&!p.dive?{x:p.x+p.face*16*SC,y:p.y-14*SC}:toWorld(p,0,-34);
    if(collideBallCircle(b,bc.x,bc.y,20*SC,p.vx*(p.slideT>0?1.3:1),p.vy,p,'body')&&p.slideT>0&&!p.dive){b.vx+=p.face*200}
  }
  const sp=Math.hypot(b.vx,b.vy),cap=R('turbo')?1700:1450;if(sp>cap){b.vx*=cap/sp;b.vy*=cap/sp}
  if(game.phase==='play'){
    if(b.x<GD-b.r*.25&&b.y>k.CB+4)scoreGoal(1,b);
    else if(b.x>W-GD+b.r*.25&&b.y>k.CB+4)scoreGoal(0,b);
  }
}

/* ================= regras ================= */
function rollRules(){
  const count=game.elapsed>cfg.duration/2?2:1;const prev=game.active.slice();
  let pool=RULE_IDS.filter(r=>!prev.includes(r));const pickd=[];
  while(pickd.length<count&&pool.length){const r=pick(pool);pickd.push(r);pool=pool.filter(x=>x!==r&&(!RULES[r].group||RULES[x].group!==RULES[r].group))}
  game.rolling=1.3;game.pending=pickd;$('rulecard').classList.add('rolling');
}
function applyRules(next){
  const had=game.active;const hadMulti=had.includes('multibola');game.active=next;phys();
  if(hadMulti&&!next.includes('multibola')){game.balls.slice(1).forEach(b=>{dust(b.x,b.y,10,'rgba(255,255,255,.8)')});game.balls=game.balls.slice(0,1)}
  if(!hadMulti&&next.includes('multibola'))addExtraBalls();
  if(next.includes('vento')){game.wind=pick([-1,1])*560;game.windT=6}else game.wind=0;
  if(next.includes('pulapula')&&!had.includes('pulapula'))game.balls.forEach(b=>{if(b.y>GROUND-60)b.vy=-600});
  const names=next.map(r=>RULES[r].name);
  $('rlab').textContent=next.length>1?'DOSE DUPLA DE REGRAS':'REGRA ATUAL';
  $('rname').textContent=names.join(' + ');$('rdesc').textContent=next.map(r=>RULES[r].desc).join(' ');
  const rc=$('rulecard');rc.classList.remove('rolling','fresh');void rc.offsetWidth;rc.classList.add('fresh');
  sfx('ding');narrate('NOVA REGRA: '+names.join(' E ').toUpperCase()+'!',true);
}
function updateRules(dt){
  if(cfg.ruleEvery===0)return;
  if(game.rolling>0){game.rolling-=dt;if(Math.floor(game.rolling*12)!==Math.floor((game.rolling+dt)*12)){game.rollShow=RULES[pick(RULE_IDS)].name;$('rname').textContent=game.rollShow;$('rlab').textContent='O JUIZ ESTÁ SORTEANDO…';$('rdesc').textContent='';sfx('tick')}
    if(game.rolling<=0){applyRules(game.pending);game.ruleT=cfg.ruleEvery}return}
  game.ruleT-=dt;if(game.ruleT<=0)rollRules();
  if(R('vento')){game.windT-=dt;if(game.windT<=0){game.wind=-game.wind;game.windT=6;burst(W/2,190,game.wind>0?'VENTO →':'← VENTO','#c2e88a',1)}}
  if(R('melancia')){game.melonT-=dt;if(game.melonT<=0){game.melonT=rand(.45,1.1);game.hazards.push({x:rand(GD+60,W-GD-60),y:-40,vx:rand(-60,60),vy:rand(0,120),rot:rand(0,TAU),vr:rand(-4,4)})}}
}
function updateHazards(dt){
  const SC=K_.SC;
  for(let i=game.hazards.length-1;i>=0;i--){const m=game.hazards[i];m.vy+=K_.grav*.8*dt;m.x+=m.vx*dt;m.y+=m.vy*dt;m.rot+=m.vr*dt;let hit=m.y>GROUND-22;
    for(const p of game.players){const h=headPos(p);if(Math.hypot(h.x-m.x,h.y-m.y)<K_.HRL*SC+24){if(knockdown(p,rand(-200,200),-260,'melon')){p.stats.falls+=0}hit=true}}
    for(const b of game.balls){if(Math.hypot(b.x-m.x,b.y-m.y)<b.r+24){b.vx+=m.vx*.5+rand(-300,300);b.vy+=m.vy*.6;hit=true}}
    if(hit){sfx('splat');for(let k=0;k<14;k++){const a=rand(-Math.PI,0),s=rand(150,520);addFx({t:'chunk',x:m.x,y:m.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:1300,life:rand(.5,1),max:1,c:k%3?'#ff4f5e':'#3fa34d',size:rand(5,10),rot:rand(0,TAU),vr:rand(-12,12),floor:GROUND-2})}
      addFx({t:'splat',x:m.x,y:GROUND-1,life:6,max:6,size:rand(26,40)});game.hazards.splice(i,1)}}
}

/* ================= fluxo da partida ================= */
function buildPlayers(){game.players=[];cfg.slots.forEach((team,t)=>team.forEach(s=>{if(s.ctrl!=='none')game.players.push(makePlayer(t,s))}))}
function startMatch(){
  ensureAudio();buildPlayers();game.score=[0,0];game.clock=cfg.duration;game.sudden=false;game.elapsed=0;game.active=[];phys();
  game.ruleT=Math.min(12,cfg.ruleEvery||12);game.rolling=0;game.hazards=[];game.fx=[];game.keysT=9;game.goalTeam=-1;
  $('rlab').textContent='REGRA ATUAL';$('rname').textContent=cfg.ruleEvery?'Futebol normal… por enquanto':'Regras absurdas desligadas';$('rdesc').textContent=cfg.ruleEvery?'A primeira regra absurda chega já já.':'Só futebol de bonecos molengas.';
  $('rulecard').classList.remove('rolling','fresh');$('rulecard').hidden=false;
  $('sa').textContent='0';$('sb').textContent='0';
  const ks=[];game.players.forEach(p=>{if(p.ctrl==='k1')ks.push('<b>P1</b> A D · W pula · F chuta · G carrinho');if(p.ctrl==='k2')ks.push('<b>P2</b> ← → · ↑ pula · K chuta · L carrinho')});
  $('keys').innerHTML=ks.map(s=>`<div>${s}</div>`).join('');$('keys').style.opacity=1;
  $('touch').classList.toggle('enabled',game.players.some(p=>p.ctrl==='k1'));
  state='playing';show(null);if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();kickoff(true,Math.random()<.5?0:1);
}
function kickoff(first,kt){game.kt=kt;placePlayers(kt);resetBalls(kt);game.phase='countdown';game.phaseT=first?3:1.4;game.cam.tz=1;game.cam.tx=W/2;game.cam.ty=H/2;game.goalTeam=-1;game.bigText=null}
function scoreGoal(team,b){
  const pts=R('vale3')?3:1;game.score[team]+=pts;game.phase='goal';game.phaseT=2.6;game.goalTeam=team;game.slowT=.8;
  const sEl=$(team?'sb':'sa');sEl.textContent=game.score[team];sEl.classList.remove('pop');void sEl.offsetWidth;sEl.classList.add('pop');
  const own=b.last&&b.last.team!==team;if(b.last){if(own)b.last.stats.own++;else b.last.stats.goals++}
  game.players.forEach(p=>{if(p.team===team)p.celebrate=3});
  const gx=team?W-GD/2:GD/2;game.cam.tx=team?W*.62:W*.38;game.cam.ty=H*.62;game.cam.tz=1.28;
  confetti(gx,K_.CB+40,90,[TEAMS[team].color,TEAMS[team].light,'#ffd23f','#ffffff']);shake(12);sfx('cheer');sfx('whistle');
  game.bigText={text:pts>1?'GOOOL! +3':'GOOOOOL!',sub:own?'GOL CONTRA':'TIME '+TEAMS[team].name,c:TEAMS[team].color,t:0};
  const who=b.last?b.last.char.name.toUpperCase():'';narrate((who?who+': ':'')+pick(own?LINES.own:LINES.goal),true);
}
function endMatch(){
  state='end';game.phase='end';sfx('fanfare');sfx('whistle');
  const [a,b]=game.score;$('e-a').textContent=a;$('e-b').textContent=b;
  $('e-title').textContent=a===b?'EMPATE!':`TIME ${TEAMS[a>b?0:1].name} VENCEU!`;
  const ps=game.players;const by=(f)=>ps.slice().sort((x,y)=>f(y)-f(x))[0];
  const best=by(p=>p.stats.goals*10-p.stats.own*5+p.stats.kicks*.1),fall=by(p=>p.stats.falls),own=by(p=>p.stats.own);
  const card=(lab,p,txt)=>`<div class="award sticker"><span>${lab}</span><b style="color:${TEAMS[p.team].dark}">${p.char.name}</b><em>${txt}</em></div>`;
  let html=card('Craque da pelada',best,`${best.stats.goals} ${best.stats.goals===1?'gol':'gols'} · ${best.stats.kicks} chutes`)+card('Saco de pancada',fall,`Caiu ${fall.stats.falls} ${fall.stats.falls===1?'vez':'vezes'}`);
  html+=own.stats.own>0?card('Pé torto',own,`${own.stats.own} gol${own.stats.own>1?'s':''} contra`):card('Fair play?',by(p=>p.stats.kicks),'Ninguém fez gol contra. Milagre.');
  $('awards').innerHTML=html;show('end');
  confetti(W/2,H*.4,140,['#ff8a1f','#8f4dff','#ffd23f','#ffffff','#3ad1a0']);
}
function updateMatch(dt){
  const ph=game.phase;
  if(ph==='countdown'){const before=Math.ceil(game.phaseT);game.phaseT-=dt;const now=Math.ceil(game.phaseT);if(now!==before&&now>0)sfx('tick');if(game.phaseT<=0){game.phase='play';sfx('whistle');burst(W/2,300,'VALENDO!','#ffd23f',1.4)}}
  else if(ph==='play'){game.clock-=dt;game.elapsed+=dt;updateRules(dt);
    if(game.clock<=0){game.clock=0;if(game.score[0]===game.score[1]&&!game.sudden){game.sudden=true;burst(W/2,300,'MORTE SÚBITA!','#ff4f5e',1.4);narrate('EMPATOU! AGORA É MORTE SÚBITA: QUEM FIZER, LEVA!',true);sfx('whistle')}else if(!game.sudden){endMatch();return}}}
  else if(ph==='goal'){game.phaseT-=dt;if(game.phaseT<=0){if(game.sudden||game.clock<=0&&game.score[0]!==game.score[1]){endMatch();return}kickoff(false,1-game.goalTeam)}}
  if(game.keysT>0){game.keysT-=dt;if(game.keysT<=0)$('keys').style.opacity=0}
  const frozen=ph==='countdown';
  game.players.forEach(p=>updatePlayer(p,dt,frozen));separatePlayers();
  if(!frozen)game.balls.forEach(b=>updateBall(b,dt));
  updateHazards(dt);
}

/* ================= desenho ================= */
function drawHead(g,c,r,mood,eye,team){
  const sk=c.skin,dk=shade(sk,-.25);
  if(c.kind==='human'){
    circ(g,-r*.82,r*.05,r*.24);fillInk(g,sk,3);
    if(c.acc==='coque'){circ(g,-r*.55,-r*.82,r*.42);fillInk(g,'#e9e6f0',3)}
    if(c.acc==='rolos'){g.beginPath();g.arc(0,0,r*1.02,Math.PI*1.05,Math.PI*1.95);g.closePath();fillInk(g,'#2a1a12',3)}
    circ(g,0,0,r);fillInk(g,sk,3.5);
    if(c.acc==='coque'){g.beginPath();g.arc(0,-r*.05,r*1.0,Math.PI*1.08,Math.PI*1.75);g.lineTo(-r*.2,-r*.45);g.closePath();fillInk(g,'#e9e6f0',3)}
    if(c.acc==='rolos'){g.beginPath();g.arc(0,-r*.02,r,Math.PI*1.02,Math.PI*1.9);g.quadraticCurveTo(0,-r*.55,-r*.9,-r*.1);g.closePath();fillInk(g,'#2a1a12',3);[[-r*.55,-r*.88],[-r*.05,-r*1.05],[r*.45,-r*.88]].forEach(([x,y])=>{rr(g,x-r*.22,y-r*.15,r*.44,r*.3,r*.15);fillInk(g,'#ff8ad1',2.5)})}
    if(c.acc==='bigode'){g.strokeStyle=INK;g.lineWidth=2.5;for(let i=0;i<3;i++){g.beginPath();g.moveTo(-r*.3+i*r*.2,-r*.92);g.quadraticCurveTo(-r*.2+i*r*.2,-r*1.25,r*.05+i*r*.2,-r*1.1);g.stroke()}}
    if(c.acc==='bone'){g.beginPath();g.arc(0,-r*.05,r*1.03,Math.PI*1.02,Math.PI*1.98);g.closePath();fillInk(g,team.dark,3);rr(g,-r*1.55,-r*.32,r*.75,r*.22,r*.1);fillInk(g,team.dark,3);circ(g,0,-r*1.0,r*.12);fillInk(g,team.light,2)}
    circ(g,r*.9,r*.12,r*.2);fillInk(g,dk,2.5);
    if(c.acc==='coque'){g.fillStyle='rgba(255,110,140,.45)';circ(g,r*.35,r*.42,r*.18);g.fill()}
  }else if(c.kind==='capi'){
    circ(g,-r*.55,-r*.78,r*.18);fillInk(g,dk,3);
    rr(g,-r*.95,-r*.85,r*2.05,r*1.65,r*.6);fillInk(g,sk,3.5);
    rr(g,r*.45,-r*.15,r*.75,r*.85,r*.32);fillInk(g,dk,3);g.fillStyle=INK;circ(g,r*1.0,r*.12,r*.07);g.fill();
    circ(g,-r*.1,-r*1.0,r*.28);fillInk(g,'#ff9a1f',3);g.beginPath();g.moveTo(-r*.1,-r*1.28);g.lineTo(r*.05,-r*1.42);stroke(g,2.5);
  }else if(c.kind==='pombo'){
    rr(g,-r*.55,r*.55,r*1.1,r*.5,r*.2);fillInk(g,'#5c6b7d',3);g.fillStyle='#3ad1a0';g.fillRect(-r*.5,r*.62,r*.5,r*.25);g.fillStyle='#8f4dff';g.fillRect(0,r*.62,r*.5,r*.25);
    circ(g,0,0,r);fillInk(g,sk,3.5);poly(g,[r*.85,-r*.05,r*1.55,r*.12,r*.85,r*.32]);fillInk(g,'#ffb347',3);g.fillStyle='#e9eef5';circ(g,r*.9,-r*.12,r*.12);g.fill();
  }else if(c.kind==='robo'){
    g.beginPath();g.moveTo(0,-r);g.lineTo(0,-r*1.45);stroke(g,3);circ(g,0,-r*1.5,r*.14);fillInk(g,Math.sin(time*6)>0?'#ff4f5e':'#ffd23f',2.5);
    rr(g,-r,-r,r*2,r*1.9,r*.35);fillInk(g,sk,3.5);g.fillStyle=INK;[[-r*.8,-r*.8],[r*.8,-r*.8],[-r*.8,r*.7],[r*.8,r*.7]].forEach(([x,y])=>{circ(g,x,y,r*.06);g.fill()});
    rr(g,r*.05,r*.3,r*.75,r*.3,r*.08);fillInk(g,'#2b2f3a',2.5);g.strokeStyle='#7fd8ff';g.lineWidth=1.5;for(let i=1;i<4;i++){g.beginPath();g.moveTo(r*.05+i*r*.19,r*.32);g.lineTo(r*.05+i*r*.19,r*.58);g.stroke()}
  }else if(c.kind==='bagre'){
    poly(g,[-r*.4,-r*.8,r*.1,-r*1.35,r*.4,-r*.75]);fillInk(g,dk,3);
    g.beginPath();g.ellipse(0,0,r*1.25,r*.92,0,0,TAU);fillInk(g,sk,3.5);g.beginPath();g.ellipse(r*.1,r*.45,r*.95,r*.38,0,0,Math.PI);g.fillStyle=shade(sk,.25);g.fill();
    g.beginPath();g.moveTo(r*1.1,r*.25);g.quadraticCurveTo(r*1.7,r*.4,r*1.6,r*1.1);g.moveTo(r*1.05,r*.38);g.quadraticCurveTo(r*1.4,r*.7,r*1.15,r*1.25);stroke(g,2.5);
  }
  const ey=c.kind==='capi'?-r*.42:c.kind==='bagre'?-r*.22:-r*.15;const ex=c.kind==='capi'?r*.15:r*.18;
  const er=r*(c.kind==='capi'?.22:.28);
  [[ex,ey,er*.9],[ex+er*1.55,ey-er*.1,er]].forEach(([x,y,rad])=>{circ(g,x,y,rad);fillInk(g,'#ffffff',2.5);circ(g,x+eye.x,y+eye.y,rad*.45);g.fillStyle=INK;g.fill();
    if(mood==='stun'){g.strokeStyle=INK;g.lineWidth=2;g.beginPath();g.moveTo(x-rad*.5,y-rad*.5);g.lineTo(x+rad*.5,y+rad*.5);g.moveTo(x+rad*.5,y-rad*.5);g.lineTo(x-rad*.5,y+rad*.5);g.stroke()}});
  if(c.acc==='coque'){g.strokeStyle=INK;g.lineWidth=2;[[ex,ey,er*.9],[ex+er*1.55,ey-er*.1,er]].forEach(([x,y,rad])=>{circ(g,x,y,rad*1.25);g.stroke()});g.beginPath();g.moveTo(ex+er*.95*1.2,ey-er*.1);g.lineTo(ex+er*.55,ey-er*.1);g.stroke()}
  if(mood==='grr'&&c.kind!=='robo'){g.beginPath();g.moveTo(ex-er,ey-er*1.3);g.lineTo(ex+er*.6,ey-er*.9);g.moveTo(ex+er*2.6,ey-er*1.4);g.lineTo(ex+er*1.2,ey-er*.9);stroke(g,3)}
  const mx=c.kind==='capi'?r*.75:c.kind==='bagre'?r*.75:r*.45,my=c.kind==='capi'?r*.55:c.kind==='robo'?r*.45:r*.48;
  if(c.kind==='robo')return;
  if(c.acc==='bigode'){g.beginPath();g.ellipse(mx+r*.1,my-r*.18,r*.4,r*.14,-.1,0,TAU);fillInk(g,'#2a1a12',2.5)}
  g.lineWidth=3;g.strokeStyle=INK;
  if(mood==='happy'){g.beginPath();g.arc(mx,my-r*.05,r*.26,0,Math.PI);g.closePath();fillInk(g,'#7a1f2b',3);g.fillStyle='#ff8aa0';g.beginPath();g.arc(mx,my+r*.12,r*.12,0,Math.PI);g.fill()}
  else if(mood==='air'){circ(g,mx,my,r*.13);fillInk(g,'#7a1f2b',2.5)}
  else if(mood==='stun'){g.beginPath();g.moveTo(mx-r*.25,my);for(let i=1;i<=4;i++)g.lineTo(mx-r*.25+i*r*.125,my+(i%2?-1:1)*r*.07);g.stroke();g.beginPath();g.ellipse(mx+r*.15,my+r*.13,r*.08,r*.14,.2,0,TAU);fillInk(g,'#ff6f91',2)}
  else if(mood==='sad'){g.beginPath();g.arc(mx,my+r*.18,r*.2,Math.PI*1.15,Math.PI*1.85);g.stroke()}
  else if(mood==='grr'){rr(g,mx-r*.22,my-r*.07,r*.44,r*.16,r*.05);fillInk(g,'#fff',2.5)}
  else{g.beginPath();g.arc(mx,my-r*.1,r*.2,Math.PI*.15,Math.PI*.85);g.stroke()}
  if(c.acc==='rolos'&&mood!=='stun'){g.strokeStyle='#e0245e';g.lineWidth=2;g.beginPath();g.arc(mx,my-r*.1,r*.22,Math.PI*.15,Math.PI*.85);g.stroke()}
}
const shadeCache=new Map();
function shade(hex,amt){const key=hex+amt;let v=shadeCache.get(key);if(v)return v;const n=parseInt(hex.slice(1),16);let r=(n>>16)&255,g=(n>>8)&255,b=n&255;
  if(amt<0){r*=1+amt;g*=1+amt;b*=1+amt}else{r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt}v='#'+((1<<24)|(Math.round(r)<<16)|(Math.round(g)<<8)|Math.round(b)).toString(16).slice(1);shadeCache.set(key,v);return v}
function drawPlayer(g,p,num){
  const k=K_,SC=k.SC,team=TEAMS[p.team],c=p.char,HR=k.HRL;
  g.save();g.translate(p.x,p.y);g.scale(SC,SC);
  g.save();g.translate(0,-38);g.rotate(p.ang);g.translate(0,38);g.scale(p.face,1);
  if(p.squish>0){const s=p.squish;g.scale(1+s*.18,1-s*.18)}
  if(p.slideT>0&&!p.dive)g.translate(0,10);
  const L=24;let th1,th2;
  if(p.stun>0){th1=Math.sin(time*20)*.9;th2=-Math.cos(time*18)*.9}
  else if(p.slideT>0){th1=1.3;th2=1.0}
  else if(!p.grounded){th1=.5;th2=-.35}
  else{const m=Math.min(1,Math.abs(p.vx)/200);th1=Math.sin(p.run)*.75*m;th2=-Math.sin(p.run)*.75*m}
  if(p.kickT>0){const pr=1-p.kickT/.26;th1=pr<.3?-.9*(pr/.3):-.9+2.6*Math.min(1,(pr-.3)/.4)}
  const legs=[[th2,-4],[th1,5]];
  legs.forEach(([th,hx],i)=>{const fx=hx+Math.sin(th)*L,fy=-26+Math.cos(th)*L;
    g.lineCap='round';g.strokeStyle=INK;g.lineWidth=12;g.beginPath();g.moveTo(hx,-28);g.lineTo(fx,fy);g.stroke();
    g.strokeStyle=i?'#ffffff':'#e8e2f0';g.lineWidth=7;g.beginPath();g.moveTo(hx,-28);g.lineTo(fx,fy);g.stroke();
    g.save();g.translate(fx,fy);g.rotate(th*.6);rr(g,-5,-4,15,8,4);fillInk(g,team.dark,2.5);g.restore()});
  const back=p.arms[1];const sx2=-6,sy2=-52;g.strokeStyle=INK;g.lineWidth=10;g.beginPath();g.moveTo(sx2,sy2);g.lineTo(sx2+back.x,sy2+back.y);g.stroke();g.strokeStyle=shade(c.skin,-.12);g.lineWidth=6;g.beginPath();g.moveTo(sx2,sy2);g.lineTo(sx2+back.x,sy2+back.y);g.stroke();
  rr(g,-12,-36,24,12,4);fillInk(g,'#ffffff',3);
  rr(g,-14,-62,28,30,8);fillInk(g,team.color,3.5);g.fillStyle=team.dark;g.fillRect(-12,-48,24,4);
  g.save();g.scale(p.face,1);g.font='13px "Titan One", Impact, sans-serif';g.textAlign='center';g.fillStyle='#fff';g.strokeStyle=INK;g.lineWidth=3;g.strokeText(num,0,-38);g.fillText(num,0,-38);g.restore();
  g.save();g.translate(2,-(60+HR*.8));drawHead(g,c,HR,p.mood,p.eye,team);g.restore();
  const fr=p.arms[0];const sx=7,sy=-53;g.strokeStyle=INK;g.lineWidth=10;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+fr.x,sy+fr.y);g.stroke();g.strokeStyle=c.skin;g.lineWidth=6;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+fr.x,sy+fr.y);g.stroke();
  circ(g,sx+fr.x,sy+fr.y,4.5);fillInk(g,c.skin,2.5);
  g.restore();g.restore();
}
function drawPlayerOverlay(p){
  const hd=headPos(p),r=K_.HRL*K_.SC;
  if(p.stun>0){for(let i=0;i<3;i++){const a=time*6+i*TAU/3;const x=hd.x+Math.cos(a)*r*1.1,y=hd.y-r*1.1+Math.sin(a)*r*.3;starPath(ctx,x,y,7);fillInk(ctx,'#ffd23f',2)}}
  if(p.tag&&p.ctrl!=='bot'){const y=hd.y-r-(p.stun>0?36:18);ctx.font='15px "Titan One", Impact, sans-serif';ctx.textAlign='center';const w=ctx.measureText(p.tag).width+12;rr(ctx,hd.x-w/2,y-17,w,20,6);fillInk(ctx,TEAMS[p.team].color,2.5);poly(ctx,[hd.x-5,y+3,hd.x+5,y+3,hd.x,y+9]);fillInk(ctx,TEAMS[p.team].color,2.5);ctx.fillStyle='#fff';ctx.fillText(p.tag,hd.x,y-2)}
}
function starPath(g,x,y,r){g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r;g.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad)}g.closePath()}
function drawGoal(side){
  const CB=K_.CB,x0=side?W-GD:0,x1=side?W:GD;
  ctx.save();ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x0,CB,GD,GROUND-CB);
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();for(let x=x0+10;x<x1;x+=14){ctx.moveTo(x,CB);ctx.lineTo(x,GROUND)}for(let y=CB+12;y<GROUND;y+=14){ctx.moveTo(x0,y);ctx.lineTo(x1,y)}ctx.stroke();
  const px=side?W-GD:GD;rr(ctx,px-5,CB,10,GROUND-CB,4);fillInk(ctx,'#ffffff',3);
  const bx=side?W-6:6;rr(ctx,bx-4,CB,8,GROUND-CB,3);fillInk(ctx,'#e6e0ee',2.5);
  rr(ctx,x0-4,CB-7,GD+8,14,6);fillInk(ctx,'#ffffff',3.5);
  ctx.fillStyle=TEAMS[side?1:0].color;for(let x=x0+6;x<x1-4;x+=18)ctx.fillRect(x,CB-4,8,8);
  ctx.restore();
}
function drawBall(b){
  const r=b.r;let alpha=1;if(R('fantasma'))alpha=Math.sin(time*3.4+b.x*.01)>-.1?.12:1;
  const sh=clamp(1-(GROUND-b.y)/500,.25,1);ctx.fillStyle=`rgba(27,20,48,${.3*sh})`;ctx.beginPath();ctx.ellipse(b.x,GROUND+3,r*sh*1.1,5*sh,0,0,TAU);ctx.fill();
  const sp=Math.hypot(b.vx,b.vy);if(sp>750&&alpha>.5){ctx.save();ctx.globalAlpha=.35;b.trail.forEach(([x,y],i)=>{circ(ctx,x,y,r*(.4+i/14));ctx.fillStyle='#fff4dc';ctx.fill()});ctx.restore()}
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(b.x,b.y);ctx.rotate(b.rot||0);
  if(R('boliche')){circ(ctx,0,0,r);fillInk(ctx,'#2c2f6b',3.5);ctx.fillStyle=INK;[[-r*.25,-r*.35],[r*.15,-r*.45],[0,-r*.05]].forEach(([x,y])=>{circ(ctx,x,y,r*.16);ctx.fill()});ctx.fillStyle='rgba(255,255,255,.35)';circ(ctx,-r*.4,r*.3,r*.2);ctx.fill()}
  else if(R('praia')){const cs=['#ff4f5e','#ffd23f','#4fb4ff','#ffffff','#3ad1a0','#ff8a1f'];cs.forEach((c,i)=>{ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*TAU/6,(i+1)*TAU/6);ctx.closePath();ctx.fillStyle=c;ctx.fill()});circ(ctx,0,0,r);stroke(ctx,3.5);circ(ctx,0,0,r*.18);fillInk(ctx,'#fff',2.5)}
  else{circ(ctx,0,0,r);fillInk(ctx,R('pulapula')?'#c6ff6b':'#ffffff',3.5);ctx.fillStyle=INK;starPath(ctx,0,0,r*.38);ctx.fill();for(let i=0;i<5;i++){const a=i*TAU/5-Math.PI/2;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,-r*.5);ctx.lineTo(0,-r*.95);stroke(ctx,2.5);ctx.restore()}}
  ctx.restore();
}
function drawFx(p){
  const k=clamp(p.life/p.max,0,1);
  switch(p.t){
    case'puff':ctx.globalAlpha=k*.8;circ(ctx,p.x,p.y,p.size*(1.6-k*.6));ctx.fillStyle=p.c;ctx.fill();break;
    case'conf':ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,k*3);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.w/4,p.w,p.w/2);ctx.restore();break;
    case'chunk':ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(1,k*3);rr(ctx,-p.size/2,-p.size/3,p.size,p.size*.66,2);fillInk(ctx,p.c,1.5);ctx.restore();break;
    case'splat':ctx.globalAlpha=Math.min(1,k*2)*.85;ctx.fillStyle='#ff4f5e';ctx.beginPath();ctx.ellipse(p.x,p.y,p.size,p.size*.22,0,0,TAU);ctx.fill();ctx.fillStyle=INK;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(p.x-p.size*.5+i*p.size*.32,p.y,2,1.2,0,0,TAU);ctx.fill()}break;
    case'burst':{const s=p.size*(k>.8?lerp(1.4,1,(1-k)/.2):1);ctx.save();ctx.translate(p.x,p.y-(1-k)*30);ctx.rotate(p.rot);ctx.scale(s,s);ctx.globalAlpha=Math.min(1,k*3);
      ctx.font='28px "Titan One", Impact, sans-serif';const w=ctx.measureText(p.text).width;ctx.beginPath();const n=14;for(let i=0;i<n*2;i++){const a=i*Math.PI/n,rx=(w/2+26)*(i%2?.78:1),ry=34*(i%2?.7:1);ctx.lineTo(Math.cos(a)*rx,Math.sin(a)*ry)}ctx.closePath();fillInk(ctx,p.c,3);
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=INK;ctx.fillText(p.text,0,2);ctx.restore();break}
  }
  ctx.globalAlpha=1;
}
function updateFx(dt){
  const f=game.fx;for(let i=f.length-1;i>=0;i--){const p=f[i];p.life-=dt;if(p.life<=0){f.splice(i,1);continue}
    if(p.vx!==undefined){if(p.drag){const d=Math.exp(-p.drag*dt);p.vx*=d;p.vy*=d}p.vy+=(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.vr)p.rot+=p.vr*dt;if(p.floor&&p.y>p.floor){p.y=p.floor;p.vy*=-.3;p.vx*=.5;p.vr*=.5}}}
}
function render(){
  const cam=game.cam;let sx=0,sy=0;if(game.shake>0){sx=rand(-game.shake,game.shake);sy=rand(-game.shake,game.shake)}
  ctx.setTransform(1,0,0,1,0,0);
  const z=cam.z,cx=clamp(cam.x,W/2/z,W-W/2/z),cy=clamp(cam.y,H/2/z,H-H/2/z);
  ctx.setTransform(K*z,0,0,K*z,(W/2-cx*z+sx)*K,(H/2-cy*z+sy)*K);
  ctx.drawImage(bg,0,0,W,H);
  const inGame=state==='playing'||state==='paused'||state==='end';
  for(const p of game.fx)if(p.t==='splat')drawFx(p);
  if(R('vento')){ctx.save();ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=3;ctx.lineCap='round';for(let i=0;i<14;i++){const y=(i*53)%(GROUND-40)+20,x=((time*game.wind*.9+i*397)%(W+300)+W+300)%(W+300)-150;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.sign(game.wind)*60,y);ctx.stroke()}ctx.restore()}
  drawGoal(0);drawGoal(1);
  for(const m of game.hazards){ctx.fillStyle='rgba(27,20,48,.25)';const s=clamp(1-(GROUND-m.y)/700,.2,1);ctx.beginPath();ctx.ellipse(m.x,GROUND+2,26*s,5*s,0,0,TAU);ctx.fill()}
  if(inGame||state==='menu'||state==='lobby'){
    for(const p of game.players){ctx.fillStyle='rgba(27,20,48,.28)';ctx.beginPath();ctx.ellipse(p.x,GROUND+3,26*K_.SC,6*K_.SC,0,0,TAU);ctx.fill()}
    const order=game.players.slice().sort((a,b)=>(a.stun>0)-(b.stun>0));
    order.forEach((p,i)=>drawPlayer(ctx,p,String(game.players.indexOf(p)%2?10:7)));
    game.players.forEach(drawPlayerOverlay);
    game.balls.forEach(drawBall);
  }
  for(const m of game.hazards){ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.rot);ctx.beginPath();ctx.ellipse(0,0,26,20,0,0,TAU);fillInk(ctx,'#3fa34d',3);ctx.strokeStyle='#2a7a34';ctx.lineWidth=3;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.ellipse(i*9,0,3,18,0,0,TAU);ctx.stroke()}ctx.restore()}
  for(const p of game.fx)if(p.t!=='splat')drawFx(p);
  ctx.setTransform(K,0,0,K,0,0);
  if(state==='playing'&&game.phase==='countdown'){const n=Math.ceil(game.phaseT);bigWord(n>0?String(n):'',W/2,H*.42,140,'#ffd23f',1-(game.phaseT%1))}
  if(game.bigText&&game.phase==='goal'){const b=game.bigText;b.t+=1/60;const s=Math.min(1,b.t*5);bigWord(b.text,W/2,H*.4,lerp(220,120,s),b.c,1,-.06);ctx.font='34px "Titan One", Impact, sans-serif';ctx.textAlign='center';ctx.lineWidth=8;ctx.strokeStyle=INK;ctx.strokeText(b.sub,W/2,H*.4+80);ctx.fillStyle='#fff4dc';ctx.fillText(b.sub,W/2,H*.4+80)}
}
function bigWord(t,x,y,size,col,a=1,rot=0){if(!t)return;ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=clamp(a+.3,0,1);ctx.font=`${size}px "Titan One", Impact, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=size*.12;ctx.strokeStyle=INK;ctx.strokeText(t,size*.05,size*.06);ctx.strokeText(t,0,0);ctx.fillStyle=col;ctx.fillText(t,0,0);ctx.restore()}

/* ================= HUD ================= */
let hudClock='';
function updateHud(){
  if(state!=='playing'&&state!=='paused')return;
  const c=Math.ceil(game.clock),t=game.sudden?'MORTE':`${Math.floor(c/60)}:${String(c%60).padStart(2,'0')}`;
  if(t!==hudClock){hudClock=t;$('clock').firstChild.nodeValue=t;$('clocklab').textContent=game.sudden?'SÚBITA':'TEMPO'}
  $('rbar').style.width=(cfg.ruleEvery&&game.rolling<=0?clamp(game.ruleT/cfg.ruleEvery,0,1)*100:0)+'%';
}

/* ================= telas ================= */
const SCREENS=['menu','lobby','how','pause','end'];
function show(name){SCREENS.forEach(s=>$('scr-'+s).hidden=s!==name);$('hud').hidden=!(state==='playing'||state==='paused')}
function toMenu(){state='menu';demoScene();show('menu')}
function toLobby(){state='lobby';demoScene();renderLobby();show('lobby')}
function pause(){if(state!=='playing')return;state='paused';show('pause')}
function resume(){if(state!=='paused')return;state='playing';show(null)}
function demoScene(){game.active=[];phys();game.hazards=[];game.fx=[];game.phase='demo';game.goalTeam=-1;game.cam={x:W/2,y:H/2,z:1,tx:W/2,ty:H/2,tz:1};
  game.players=[makePlayer(0,{ctrl:'bot',char:cfg.slots[0][0].char}),makePlayer(1,{ctrl:'bot',char:cfg.slots[1][0].char})];game.players.forEach(p=>p.tag='');
  game.players[0].x=330;game.players[1].x=950;game.balls=[makeBall(W/2,300)]}
function updateDemo(dt){
  game.players.forEach(p=>updatePlayer(p,dt,false));separatePlayers();game.balls.forEach(b=>updateBall(b,dt));
  const b=game.balls[0];if(b&&(b.x<GD||b.x>W-GD)&&b.y>K_.CB){b.x=W/2;b.y=200;b.vx=rand(-200,200);b.vy=0}
}
function renderLobby(){
  [0,1].forEach(t=>{const col=$('team'+t);col.querySelectorAll('.slot').forEach(e=>e.remove());
    cfg.slots[t].forEach((s,i)=>{const el=document.createElement('div');el.className='slot sticker'+(s.ctrl==='none'?' off':'');
      el.innerHTML=`<canvas width="230" height="230"></canvas><div class="nm"><button class="arrow" data-a="-1" aria-label="Personagem anterior">◀</button><span>${CHARS[s.char].name}</span><button class="arrow" data-a="1" aria-label="Próximo personagem">▶</button></div><button class="ctrl" aria-label="Quem controla"><span>${CTRL_LABEL[s.ctrl]}</span><i>trocar</i></button><div class="hint">${CTRL_HINT[s.ctrl]}</div>`;
      const cv=el.querySelector('canvas'),g=cv.getContext('2d');g.setTransform(230/200,0,0,230/200,0,0);
      const fake=makePlayer(t,s);fake.x=100;fake.y=192;fake.face=t?-1:1;fake.mood=s.ctrl==='none'?'sad':'happy';fake.arms.forEach((a,j)=>{a.x=j?-6:8;a.y=20});
      const savedA=game.active;game.active=[];phys();drawPlayer(g,fake,i?'10':'7');game.active=savedA;phys();
      el.querySelectorAll('.arrow').forEach(b=>b.onclick=()=>{ensureAudio();sfx('click');s.char=(s.char+(+b.dataset.a)+CHARS.length)%CHARS.length;persist();renderLobby();if(i===0)demoScene()});
      el.querySelector('.ctrl').onclick=()=>{ensureAudio();sfx('click');const used=new Set();cfg.slots.flat().forEach(o=>{if(o!==s&&o.ctrl!=='none'&&o.ctrl!=='bot')used.add(o.ctrl)});
        let idx=CTRLS.indexOf(s.ctrl);for(let n=0;n<CTRLS.length;n++){idx=(idx+1)%CTRLS.length;if(!used.has(CTRLS[idx]))break}s.ctrl=CTRLS[idx];persist();renderLobby()};
      col.appendChild(el)})});
  const st=STADIUMS[cfg.stadium];$('stadname').textContent=st.name;$('stadesc').textContent=st.desc;
  const sg=$('stadprev').getContext('2d');sg.setTransform(224/W,0,0,224/W,0,0);paintStadium(sg,cfg.stadium);
  seg('seg-dur',[[120,'2 min'],[180,'3 min'],[300,'5 min']],'duration');
  seg('seg-rule',[[15,'15 s'],[25,'25 s'],[40,'40 s'],[0,'Nunca']],'ruleEvery');
  seg('seg-bot',[[0,'Perna de pau'],[1,'Boleiro'],[2,'Craque']],'bot');
  const t0=cfg.slots[0].some(s=>s.ctrl!=='none'),t1=cfg.slots[1].some(s=>s.ctrl!=='none');const pads0=pads.filter(Boolean).length;
  const usesPad=cfg.slots.flat().filter(s=>s.ctrl.startsWith('gp')).map(s=>+s.ctrl[2]);const missing=usesPad.filter(i=>i>=pads0);
  const m=$('lmsg');m.classList.toggle('err',!t0||!t1||missing.length>0);
  m.textContent=!t0||!t1?'Cada time precisa de pelo menos um jogador.':missing.length?`Controle ${missing[0]+1} não detectado. Conecte e aperte um botão dele.`:`${pads0?pads0+' controle(s) detectado(s). ':''}Clique no controle de cada vaga para trocar entre teclado, controle, bot ou ninguém.`;
}
function seg(id,opts,key){const el=$(id);el.innerHTML='';opts.forEach(([v,l])=>{const b=document.createElement('button');b.textContent=l;b.setAttribute('aria-pressed',cfg[key]===v);b.onclick=()=>{ensureAudio();sfx('click');cfg[key]=v;persist();renderLobby()};el.appendChild(b)})}

/* ================= eventos ================= */
window.addEventListener('keydown',e=>{
  if(state==='playing'&&(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Enter'||e.code==='NumpadEnter'))e.preventDefault();
  if(e.repeat)return;keys.add(e.code);ensureAudio();
  if(e.code==='KeyP'||e.code==='Escape'){if(state==='playing')pause();else if(state==='paused')resume()}
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(state==='playing')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
window.addEventListener('gamepadconnected',()=>{pollPads();if(state==='lobby')renderLobby()});
document.querySelectorAll('#touch button').forEach(b=>{const code=b.dataset.k;const on=e=>{e.preventDefault();keys.add(code);b.classList.add('on');ensureAudio()},off=e=>{keys.delete(code);b.classList.remove('on')};
  b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)});
const click=(id,f)=>$(id).addEventListener('click',()=>{ensureAudio();sfx('click');f()});
click('b-play',toLobby);click('b-how',()=>{state='how';show('how')});click('b-howback',toMenu);click('b-lback',toMenu);
click('st-prev',()=>{cfg.stadium=(cfg.stadium+STADIUMS.length-1)%STADIUMS.length;persist();buildBg();renderLobby()});
click('st-next',()=>{cfg.stadium=(cfg.stadium+1)%STADIUMS.length;persist();buildBg();renderLobby()});
click('b-kickoff',()=>{const ok=cfg.slots.every(t=>t.some(s=>s.ctrl!=='none'));if(!ok){renderLobby();return}startMatch()});
click('b-pause',pause);click('b-resume',resume);click('b-restart',startMatch);click('b-quit',toLobby);
click('b-again',startMatch);click('b-elobby',toLobby);click('b-emenu',toMenu);
const SND_ON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SND_OFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const MUS_ON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 17V5l11-2v12" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/></svg>';
const MUS_OFF='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 17V5l11-2v12" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="6.5" cy="17.5" r="3"/><circle cx="17.5" cy="15.5" r="3"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.4"/></svg>';
function syncAudioUi(){$('b-mute').innerHTML=cfg.muted?SND_OFF:SND_ON;$('b-music').innerHTML=cfg.music?MUS_ON:MUS_OFF;if(master)master.gain.value=cfg.muted?0:.55;if(musBus)musBus.gain.value=cfg.music?.32:0}
$('b-mute').addEventListener('click',()=>{ensureAudio();cfg.muted=!cfg.muted;persist();syncAudioUi()});
$('b-music').addEventListener('click',()=>{ensureAudio();cfg.music=!cfg.music;persist();syncAudioUi()});

/* ================= loop ================= */
let lastT=performance.now();
function frame(now){
  let dt=Math.min(.05,(now-lastT)/1000);lastT=now;pollPads();
  const st=pads.some(g=>g&&bp(g,9));if(st&&!frame.st){if(state==='playing')pause();else if(state==='paused')resume()}frame.st=st;
  if(state!=='paused'){
    time+=dt;
    if(game.hitstop>0){game.hitstop-=dt;dt=0}
    let slow=1;if(game.slowT>0){game.slowT-=dt;slow=.3}
    const gdt=dt*slow*K_.ts;
    if(state==='playing')updateMatch(gdt);
    else if(state==='menu'||state==='lobby'||state==='how')updateDemo(gdt);
    else if(state==='end'){game.players.forEach(p=>{p.celebrate=1;updatePlayer(p,gdt,false)});game.balls.forEach(b=>updateBall(b,gdt))}
    updateFx(gdt);
    const c=game.cam;c.x=lerp(c.x,c.tx,Math.min(1,dt*5));c.y=lerp(c.y,c.ty,Math.min(1,dt*5));c.z=lerp(c.z,c.tz,Math.min(1,dt*5));
    if(game.phase!=='goal'){c.tx=W/2;c.ty=H/2;c.tz=1}
    game.shake=Math.max(0,game.shake-dt*40);
  }
  musicTick();render();updateHud();
  requestAnimationFrame(frame);
}
syncAudioUi();resize();toMenu();requestAnimationFrame(frame);
})();
