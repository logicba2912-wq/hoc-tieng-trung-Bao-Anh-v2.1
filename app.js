'use strict';
{
const SYLS=new Set(SYL.split(' '));
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const main=$('#main');
const IC={
play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
lip:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c3-4 6-5 9-3 3-2 6-1 9 3-3 4-6 6-9 6s-6-2-9-6z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M3 12h18" stroke="currentColor" stroke-width="1.5"/></svg>',
pen:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>',
check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'};

const img=(c,cls)=>c?'<img class="'+(cls||'emo')+'" src="img/'+c+'.svg" alt="" loading="lazy" decoding="async">':'';
const pic=hz=>img(PIC[hz],'wpic');
// ---------- lưu trữ ----------
const KEY='hoctq_v1';
function defState(){return{set:{prov:'none',akey:'',okey:'',amodel:'claude-haiku-5-5',omodel:'',stt:'auto',tmodel:'gpt-transcribe',rate:.8,voice:''},srs:{},done:{},days:{},cur:1}}
let ST=defState();
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s){ST=Object.assign(defState(),s);ST.set=Object.assign(defState().set,s.set||{})}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
const dkey=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function day(){const k=dkey();return ST.days[k]||(ST.days[k]={rv:0,sp:0,ai:0})}
function mark(k,v=true){day()[k]=v;save()}
function ldone(n,k){(ST.done[n]||(ST.done[n]={}))[k]=true;save()}
const WORDS={};LESSONS.forEach(L=>L.w.forEach(w=>{if(!WORDS[w[0]])WORDS[w[0]]={hz:w[0],py:w[1],vi:w[2],l:L.n}}));

// ---------- tiện ích ----------
let toastT;function toast(s){const t=$('#toast');t.textContent=s;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2800)}
function sheet(html,onClose){const o=$('#sheet');o.innerHTML='<div class="sh-in" role="dialog" aria-modal="true"><button class="x" data-close aria-label="Đóng">✕</button>'+html+'</div>';o.hidden=false;o._close=onClose;document.body.style.overflow='hidden';return $('.sh-in',o)}
function closeSheet(){const o=$('#sheet');if(o.hidden)return;o.hidden=true;o.innerHTML='';document.body.style.overflow='';stopRec();if(o._close)o._close();o._close=null}
$('#sheet').addEventListener('click',e=>{if(e.target.id==='sheet'||e.target.closest('[data-close]'))closeSheet()});

// ---------- đọc mẫu (TTS) ----------
let VOICES=[];
function loadVoices(){try{VOICES=speechSynthesis.getVoices().filter(v=>/^(zh|cmn)/i.test(v.lang))}catch(e){VOICES=[]}}
if('speechSynthesis' in window){loadVoices();speechSynthesis.onvoiceschanged=loadVoices}
function pickVoice(){return VOICES.find(v=>v.voiceURI===ST.set.voice)||VOICES.find(v=>/zh[-_]CN/i.test(v.lang)&&/Ting|Tingting|Li-mu|Yu-shu|Xiaoxiao/i.test(v.name))||VOICES.find(v=>/zh[-_]CN/i.test(v.lang))||VOICES[0]}
function speak(t,rate){return new Promise(res=>{if(!('speechSynthesis' in window)){toast('Máy không hỗ trợ đọc mẫu');return res()}
 try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';const v=pickVoice();if(v)u.voice=v;u.rate=rate||ST.set.rate;u.onend=res;u.onerror=res;speechSynthesis.speak(u);setTimeout(res,Math.max(4000,t.length*900))}catch(e){res()}})}
function stopSpeak(){try{speechSynthesis.cancel()}catch(e){}}

// ---------- pinyin ----------
const TM={};'āáǎà|a,ēéěè|e,īíǐì|i,ōóǒò|o,ūúǔù|u,ǖǘǚǜ|v'.split(',').forEach(g=>{const[a,b]=g.split('|');[...a].forEach((c,i)=>TM[c]=[b,i+1])});TM['ü']=['v',0];
function segment(base){const n=base.length,best=new Array(n+1).fill(null);best[0]=[];
 for(let i=0;i<n;i++){if(!best[i])continue;for(let L=1;L<=6&&i+L<=n;L++){if(SYLS.has(base.slice(i,i+L))){const c=[...best[i],[i,i+L]];if(!best[i+L]||best[i+L].length>c.length)best[i+L]=c}}}
 return best[n]}
function parsePy(py){const o=String(py),lo=o.toLowerCase(),ok=/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/;let k='';if(lo.length===o.length){for(let i=0;i<o.length;i++)k+=ok.test(lo[i])?o[i]:' '}else k=lo.replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g,' ');const words=k.split(/\s+/).filter(Boolean);const out=[];
 for(const W of words){const w=W.toLowerCase();let base='',tone=[];for(const ch of w){const m=TM[ch];if(m){base+=m[0];tone.push(m[1])}else{base+=ch;tone.push(0)}}
  let seg=segment(base),er=false;if(!seg&&base.endsWith('r')){seg=segment(base.slice(0,-1));er=!!seg}
  const wi=out.length?out[out.length-1].wi+1:0;if(!seg){out.push({s:W,b:base,t:Math.max(0,...tone),ini:'',fin:base,wi});continue}
  seg.forEach(([a,b],k)=>{const last=k===seg.length-1&&er;const sb=base.slice(a,b);const t=tone.slice(a,b).find(x=>x>0)||0;const m=sb.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(.*)$/);out.push({s:W.slice(a,last?b+1:b),b:sb,t,ini:m[1]||'',fin:m[2],er:last,wi})})}
 return out}
function normFin(ini,fin){fin=fin.replace(/v/g,'ü');
 if(ini==='y'){const m={i:'i',a:'ia',e:'ie',ao:'iao',ou:'iu',an:'ian',in:'in',ang:'iang',ing:'ing',ong:'iong',u:'ü',ue:'üe',uan:'üan',un:'ün'};return m[fin]||fin}
 if(ini==='w'){const m={u:'u',a:'ua',o:'uo',ai:'uai',ei:'ui',an:'uan',en:'un',ang:'uang',eng:'ueng'};return m[fin]||fin}
 if('jqx'.includes(ini)&&ini&&fin[0]==='u')return 'ü'+fin.slice(1);
 if(fin==='i'&&['z','c','s'].includes(ini))return 'i1';
 if(fin==='i'&&['zh','ch','sh','r'].includes(ini))return 'i2';
 return fin}
function pyHtml(py){return parsePy(py).map((s,i,a)=>(i&&a[i-1].wi!==s.wi?' ':'')+'<span class="t'+s.t+'">'+esc(s.s)+'</span>').join('')}
const hanzi=s=>[...String(s)].filter(c=>/[\u4e00-\u9fff]/.test(c));

// ---------- hình miệng ----------
const TONG={rest:[92,120,70,85,72,55,74,36,84,40,92,60,100],loi:[92,120,72,90,74,55,70,42,57,52,74,62,98],rang:[92,120,72,85,74,50,72,34,66,42,80,60,98],uon:[94,122,74,95,78,64,74,57,47,72,70,70,98],mat:[88,125,58,80,40,50,48,35,84,42,92,60,100],cuong:[74,140,46,118,50,72,70,36,84,40,92,60,100]};
const POSN={moi:'Hai môi',moirang:'Răng trên – môi dưới',loi:'Đầu lưỡi – lợi trên',rang:'Đầu lưỡi – mặt sau răng',uon:'Uốn lưỡi (cong đầu lưỡi)',mat:'Mặt lưỡi – ngạc cứng',cuong:'Cuống lưỡi – ngạc mềm',none:'Không có phụ âm đầu'};
const CONTACT={loi:[44,58],rang:[34,66],uon:[57,47],mat:[78,42],cuong:[124,51]};
function mouth(pos,asp){const tk=TONG[pos]||TONG.rest;const[r,c1x,c1y,mx,my,c2x,c2y,tx,ty,ux,uy,fx,fy]=pos==='moi'||pos==='moirang'||pos==='none'?TONG.rest:tk;
 const lipLo=pos==='moi'?'M8,64 Q14,60 22,64 L22,72 Q14,76 8,72Z':pos==='moirang'?'M10,66 Q18,62 28,68 L26,76 Q16,78 10,74Z':'M8,76 Q14,72 22,76 L22,84 Q14,88 8,84Z';
 const ct=CONTACT[pos];
 return '<svg class="mouth" viewBox="0 0 160 130" role="img" aria-label="'+esc(POSN[pos]||'')+'"><rect width="160" height="130" rx="12" class="mbg"/>'+
 '<path d="M24,52 L32,55 Q42,50 46,54 Q75,30 112,40 Q132,44 140,62 L147,70 L147,130" class="mpal"/><path d="M24,90 Q60,124 147,126" class="mpal"/>'+
 '<text x="40" y="20" class="mlab">ngạc cứng</text><text x="112" y="30" class="mlab">ngạc mềm</text><text x="4" y="122" class="mlab">môi</text>'+
 '<path d="M28,56 L33,56 L33,70 L29,70Z" class="mteeth"/><path d="M28,82 L32,82 L32,94 L28,94Z" class="mteeth"/>'+
 '<path d="M8,50 Q14,46 24,52 L24,62 Q14,64 8,60Z" class="mlip"/><path d="'+lipLo+'" class="mlip"/>'+
 '<path d="M142,118 L142,'+r+' Q'+c1x+','+c1y+' '+mx+','+my+' Q'+c2x+','+c2y+' '+tx+','+ty+' Q'+ux+','+uy+' '+fx+','+fy+' Q90,112 142,118Z" class="mtong"/>'+
 (ct?'<circle cx="'+ct[0]+'" cy="'+ct[1]+'" r="5" class="mdot"/>':'')+
 (asp?'<path d="M7,62 L1,58 M7,67 L0,67 M7,72 L1,76" class="mair"/>':'')+'</svg>'}
function contour(t){const Y=l=>34-(l-1)*7;const pts={1:[[6,5],[54,5]],2:[[6,3],[54,5]],3:[[6,2],[30,1],[54,4]],4:[[6,5],[54,1]],0:[[26,3],[34,3]]}[t]||[];return '<svg class="contour" viewBox="0 0 60 40" aria-hidden="true">'+[1,2,3,4,5].map(l=>'<line x1="2" x2="58" y1="'+Y(l)+'" y2="'+Y(l)+'" class="cl"/>').join('')+'<polyline points="'+pts.map(p=>p[0]+','+Y(p[1])).join(' ')+'" class="cp t'+t+'s"/></svg>'}

// ---------- nhận giọng nói + chấm điểm ----------
const webSR=()=>window.SpeechRecognition||window.webkitSpeechRecognition;
const standalone=()=>!!(navigator.standalone||matchMedia('(display-mode: standalone)').matches);
function sttMode(){const s=ST.set.stt;if(s==='openai')return ST.set.okey?'openai':'none';if(s==='web')return webSR()?'web':'none';if(ST.set.okey)return 'openai';return webSR()?'web':'none'}
let REC=null;function stopRec(){if(REC){try{REC.stop()}catch(e){}}}
function listen(onState){const m=sttMode();if(m==='none')return Promise.reject(new Error('nosr'));stopSpeak();return m==='web'?listenWeb(onState):listenOA(onState)}
function listenWeb(onState){return new Promise((res,rej)=>{const R=webSR();const r=new R();r.lang='zh-CN';r.interimResults=true;r.continuous=true;r.maxAlternatives=5;
 let finals=[],interim='',alts=[],done=false,err=null,heard=false,silT=null,maxT=null;
 const finish=()=>{if(done)return;done=true;clearTimeout(silT);clearTimeout(maxT);try{r.stop()}catch(e){}};
 r.onresult=e=>{heard=true;interim='';for(let i=e.resultIndex;i<e.results.length;i++){const x=e.results[i];if(x.isFinal){finals.push(x[0].transcript);alts=[...x].map(a=>a.transcript)}else interim+=x[0].transcript}
  clearTimeout(silT);silT=setTimeout(finish,2500)};
 r.onspeechstart=()=>{heard=true};
 r.onerror=e=>{if(e.error!=='no-speech'&&e.error!=='aborted')err=e.error};
 r.onend=()=>{REC=null;clearTimeout(silT);clearTimeout(maxT);const txt=(finals.join('')+interim).trim();
  if(txt){const out=[txt];alts.forEach(a=>{const v=(finals.slice(0,-1).join('')+a).trim();if(v&&!out.includes(v))out.push(v)});res(out)}
  else rej(new Error(err||(heard?'no-text':'no-speech')))};
 REC={stop:()=>finish()};maxT=setTimeout(finish,20000);
 try{r.start();onState&&onState('rec')}catch(e){REC=null;rej(e)}})}
let MIC=null;async function getMic(){if(MIC&&MIC.getAudioTracks().some(t=>t.readyState==='live'))return MIC;try{MIC=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch(e){throw new Error('denied')}return MIC}
function releaseMic(){if(MIC){MIC.getTracks().forEach(t=>t.stop());MIC=null}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseMic()});addEventListener('pagehide',releaseMic);
async function listenOA(onState){const stream=await getMic();
 const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported(t))||'';
 const mr=new MediaRecorder(stream,mt?{mimeType:mt}:undefined);const ch=[];mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
 let ac=null,peak=0;
 const blob=await new Promise(res=>{let stopped=false,spoke=false,quietSince=0,raf=0;
  const stop=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(raf);clearTimeout(to);try{if(mr.state!=='inactive'){mr.requestData&&mr.requestData();mr.stop()}}catch(e){}};
  mr.onstop=()=>{try{ac&&ac.close()}catch(e){}setTimeout(()=>res(new Blob(ch,{type:mr.mimeType||mt||'audio/mp4'})),50)};
  mr.start(250);onState&&onState('rec');const to=setTimeout(stop,20000);REC={stop};
  try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();const src=ac.createMediaStreamSource(stream),an=ac.createAnalyser();an.fftSize=1024;src.connect(an);const buf=new Uint8Array(an.fftSize);
   const t0=performance.now();const tick=()=>{an.getByteTimeDomainData(buf);let m=0;for(const v of buf)m=Math.max(m,Math.abs(v-128));peak=Math.max(peak,m);const now=performance.now();
    if(m>18){spoke=true;quietSince=0}else if(spoke){quietSince=quietSince||now;if(now-quietSince>2500){stop();return}}
    if(!spoke&&now-t0>7000){stop();return}raf=requestAnimationFrame(tick)};tick()}catch(e){}});
 REC=null;onState&&onState('wait');
 if(blob.size<300)throw new Error('empty-audio');
 const fd=new FormData();fd.append('file',blob,'noi.'+(/webm/.test(blob.type)?'webm':'m4a'));fd.append('model',ST.set.tmodel||'gpt-transcribe');fd.append('language','zh');fd.append('prompt','以下是普通话，可能只有一个字或一个短句。');
 const r=await fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+ST.set.okey},body:fd});const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error((j.error&&j.error.message)||('Lỗi '+r.status));const t=(j.text||'').trim();if(!t)throw new Error(peak<12?'quiet':'no-text');return [t]}
function recErr(e){const m=String(e&&e.message||e);
 if(m==='nosr')return standalone()?'Khi mở từ icon trên màn hình chính, iPhone có thể không cho nhận giọng nói. Hãy mở app bằng Safari để luyện nói, hoặc nhập OpenAI key trong Cài đặt.':'Trình duyệt này chưa hỗ trợ nhận giọng nói. Trên iPhone hãy mở bằng Safari, hoặc nhập OpenAI key trong Cài đặt.';
 if(/not-allowed|denied|Permission/i.test(m))return 'Chưa có quyền dùng micro. Vào Cài đặt iPhone → Safari → Micro để cho phép, rồi thử lại.';
 if(m==='empty-audio')return 'iPhone không ghi được âm thanh. Đóng hẳn app rồi mở lại; nếu vẫn lỗi, kiểm tra Cài đặt → Safari → Micro → Cho phép.';
 if(m==='quiet')return 'Tiếng quá nhỏ, máy không nghe rõ. Nói to hơn, cầm máy gần miệng hơn.';
 if(m==='denied')return 'Chưa có quyền dùng micro. Vào Cài đặt iPhone → Safari → Micro để cho phép, rồi thử lại.';
 if(/no-speech|aborted|no-text/i.test(m))return 'Máy chưa nghe được. Hãy: (1) bấm micro, đợi nửa giây rồi mới nói; (2) bật Siri hoặc Đọc chính tả trong Cài đặt iPhone → Bàn phím → Bật Đọc chính tả; (3) nếu đang mở từ icon màn hình chính, thử mở bằng Safari; (4) tắt chế độ im lặng/Bluetooth tai nghe nếu có.';
 if(/service-not-allowed|language/i.test(m))return 'iPhone chưa cho nhận giọng tiếng Trung. Bật Đọc chính tả (Cài đặt → Bàn phím) và thêm bàn phím Tiếng Trung giản thể, rồi thử lại trong Safari.';
 if(/network/i.test(m))return 'Cần có mạng để chấm phát âm.';return 'Lỗi nhận giọng: '+m}
const T2S={'們':'们','個':'个','這':'这','嗎':'吗','謝':'谢','對':'对','認':'认','識':'识','興':'兴','國':'国','師':'师','歲':'岁','兒':'儿','媽':'妈','東':'东','買':'买','賣':'卖','號':'号','電':'电','話':'话','機':'机','錢':'钱','點':'点','麵':'面','飯':'饭','間':'间','見':'见','書':'书','學':'学','習':'习','車':'车','開':'开','熱':'热','氣':'气','時':'时','鐘':'钟','說':'说','讀':'读','聽':'听','寫':'写','漢':'汉','場':'场','飛':'飞','歡':'欢','雞':'鸡','貴':'贵','條':'条','餃':'饺','後':'后','裡':'里','裏':'里','來':'来','會':'会','樣':'样','幾':'几','邊':'边','請':'请','問':'问','題':'题','務':'务','員':'员','還':'还','誰':'谁','麼':'么','沒':'没','關':'关','係':'系','長':'长','門':'门','醫':'医','視':'视','單':'单','貨':'货','發':'发','給':'给','亲':'亲','親':'亲','愛':'爱','嗎':'吗','腦':'脑','覺':'觉','雲':'云','葉':'叶','藥':'药','喫':'吃','現':'现','種':'种','妳':'你','歌':'歌','唱':'唱','狗':'狗','貓':'猫','漂':'漂','亮':'亮','桌':'桌','見':'见','啊':'啊','優':'优','惠':'惠','郵':'邮','遞':'递','實':'实','圖':'图','網':'网','購':'购','級':'级','難':'难','鐵':'铁','銀':'银','園':'园','節':'节','業':'业','區':'区','線':'线','樂':'乐','風':'风','魚':'鱼','鳥':'鸟','馬':'马','媽':'妈','罵':'骂','麼':'么'};
const t2s=s=>[...String(s)].map(c=>T2S[c]||c).join('');
const DIG='零一二三四五六七八九';
function numZh(n){n=+n;if(n<10)return DIG[n];if(n<100){const t=Math.floor(n/10),u=n%10;return(t===1?'':DIG[t])+'十'+(u?DIG[u]:'')}if(n<1000){const h=Math.floor(n/100),r=n%100;return DIG[h]+'百'+(r===0?'':r<10?'零'+DIG[r]:(r<20?'一':'')+numZh(r))}return String(n).split('').map(d=>DIG[d]).join('')}
const cleanZh=s=>t2s(s).replace(/幺/g,'一').replace(/[^\u4e00-\u9fff]/g,'');
function variants(s){return[...new Set([s.replace(/\d+/g,m=>numZh(m)),s.replace(/\d/g,d=>DIG[d])].map(cleanZh))]}
function align(a,b){const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Array(m+1).fill(0));for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
 const ok=new Array(n).fill(false);let i=0,j=0;while(i<n&&j<m){if(a[i]===b[j]){ok[i]=true;i++;j++}else if(dp[i+1][j]>=dp[i][j+1])i++;else j++}return ok}
function scoreIt(ref,alts){const R=[...cleanZh(ref)];let best=null;for(const alt of alts)for(const v of variants(alt)){const H=[...v];const ok=align(R,H);const c=ok.filter(Boolean).length;let sc=R.length?Math.round(100*c/R.length):0;sc=Math.max(0,sc-Math.min(20,Math.max(0,H.length-c)*5));if(!best||sc>best.sc)best={sc,ok,hyp:alt,R}}return best||{sc:0,ok:[],hyp:'',R}}
function charPy(zh,py){const hz=hanzi(zh),sy=parsePy(py);return hz.length===sy.length?hz.map((c,i)=>sy[i]):null}

// Bảng luyện nói dùng chung
function openSpeak(zh,py,vi){const box=sheet('<h3>Luyện nói</h3><div class="ref"><div class="zh big" data-say="'+esc(zh)+'">'+esc(zh)+'</div><div class="py">'+esc(py||'')+'</div><div class="vi">'+esc(vi||'')+'</div></div>'+
 '<div class="row"><button class="btn ghost" data-say="'+esc(zh)+'">'+IC.play+'Nghe mẫu</button><button class="btn ghost" data-say="'+esc(zh)+'" data-rate=".55">'+IC.play+'Nghe chậm</button></div>'+
 '<button class="micbig" id="micGo">'+IC.mic+'<span>Bấm rồi đọc to</span></button><div id="res" class="res" aria-live="polite"></div><p class="note">'+modeNote()+'</p>');
 $('#micGo',box).onclick=()=>runSpeak(zh,py,box)}
function modeNote(){const m=sttMode();return m==='openai'?'Đang chấm bằng OpenAI (cần mạng).':m==='web'?'Đang chấm bằng nhận giọng nói của trình duyệt (cần mạng).':'Chưa có cách nhận giọng nói. Xem Cài đặt.'}
async function runSpeak(zh,py,box){const btn=$('#micGo',box),res=$('#res',box);
 if(REC){stopRec();return}
 btn.classList.add('on');$('span',btn).textContent='Đang nghe… nói xong bấm để dừng';res.innerHTML='';
 try{const alts=await listen(s=>{if(s==='wait'){btn.classList.remove('on');$('span',btn).textContent='Đang chấm…'}});
  const r=scoreIt(zh,alts);showScore(res,r,zh,py);day().sp++;save()}
 catch(e){res.innerHTML='<p class="warn">'+esc(recErr(e))+'</p>'}
 btn.classList.remove('on');$('span',btn).textContent='Bấm để đọc lại'}
function showScore(res,r,zh,py){const cp=charPy(zh,py)||[];let k=0;
 const chars=[...zh].map(c=>{if(!/[\u4e00-\u9fff]/.test(c))return esc(c);const i=k++;return '<span class="'+(r.ok[i]?'ok':'bad')+'">'+esc(c)+'</span>'}).join('');
 const bad=r.R.map((c,i)=>!r.ok[i]&&cp[i]?'<button class="chip" data-py="'+esc(cp[i].s)+'" data-hz="'+esc(c)+'">'+esc(c)+' '+esc(cp[i].s)+'</button>':'').join('');
 const lvl=r.sc>=90?'Rất tốt!':r.sc>=70?'Khá tốt, thử lại chữ đỏ nhé.':r.sc>=40?'Chưa rõ lắm, nghe mẫu rồi đọc chậm lại.':'Máy chưa nghe ra, thử lại nhé.';
 res.innerHTML='<div class="score s'+(r.sc>=90?3:r.sc>=70?2:1)+'">'+r.sc+'<small>điểm</small></div><div class="zh mid">'+chars+'</div><p>'+lvl+'</p><p class="muted">Máy nghe được: '+esc(r.hyp||'(trống)')+'</p>'+(bad?'<p class="muted">Xem cách đọc chữ sai:</p><div class="chips">'+bad+'</div>':'')}

// Bảng "Cách đọc"
function openHow(py,hz){const sy=parsePy(py),hs=hanzi(hz||'');
 const html=sy.map((s,i)=>{const fin=normFin(s.ini,s.fin),I=INI[s.ini]||INI[''],T=TONES.find(x=>x.n===s.t)||TONES[0],ch=hs.length===sy.length?hs[i]:'';
  return '<section class="syl"><div class="sylh"><span class="big t'+s.t+'">'+esc(s.s)+'</span>'+(ch?'<button class="zh hz" data-say="'+esc(ch)+'">'+esc(ch)+'</button>':'')+'</div>'+
  '<div class="how"><div>'+mouth(I.pos,I.asp)+'<p class="cap">'+esc(POSN[I.pos]||'')+'</p></div><div>'+
  (s.ini?'<p><b>Phụ âm '+esc(s.ini)+'</b>'+(I.asp?' <span class="tag">bật hơi</span>':'')+'<br>'+esc(I.t)+'</p>':'<p><b>Không có phụ âm đầu</b></p>')+
  '<p><b>Vần '+esc(fin.replace(/^i[12]$/,'i'))+'</b><br>'+esc(FIN[fin]||'Ghép các âm lại, đọc lướt thành một âm.')+(s.er?' Cuối âm cong đầu lưỡi lên (er hóa).':'')+'</p>'+
  '<p><b>'+esc(T.name)+'</b> '+contour(s.t)+'<br>'+esc(T.t)+'</p></div></div></section>'}).join('');
 sheet('<h3>Cách đọc '+esc(hz||py)+'</h3>'+html+(hz?'<div class="row"><button class="btn ghost" data-say="'+esc(hz)+'" data-rate=".55">'+IC.play+'Nghe chậm</button><button class="btn" data-rec="'+esc(hz)+'" data-recpy="'+esc(py)+'">'+IC.mic+'Thử đọc</button></div>':''))}

// Viết chữ (Hanzi Writer)
let HWP=null;
function loadHW(){if(window.HanziWriter)return Promise.resolve();if(HWP)return HWP;HWP=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hanzi-writer@3/dist/hanzi-writer.min.js';s.onload=res;s.onerror=()=>{HWP=null;rej(new Error('load'))};document.head.appendChild(s)});return HWP}
const HWURL=c=>'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/'+encodeURIComponent(c)+'.json';
function openWrite(hz){const cs=hanzi(hz);let cur=0,wr=null;
 const box=sheet('<h3>Viết chữ '+esc(hz)+'</h3><div class="chips" id="wc">'+cs.map((c,i)=>'<button class="chip'+(i?'':' cur')+'" data-i="'+i+'">'+esc(c)+'</button>').join('')+'</div><div id="wtarget" class="wtarget"></div><div class="row"><button class="btn ghost" id="wAnim">Xem cách viết</button><button class="btn" id="wQuiz">'+IC.pen+'Tự viết</button></div><p id="wmsg" class="muted" aria-live="polite">Xem thứ tự nét trước, rồi bấm "Tự viết" và vẽ bằng ngón tay.</p>');
 const msg=t=>{$('#wmsg',box).textContent=t};
 function make(){const el=$('#wtarget',box);el.innerHTML='';const W=Math.min(280,el.clientWidth||280);
  wr=window.HanziWriter.create(el,cs[cur],{width:W,height:W,padding:12,showOutline:true,strokeColor:'#c8102e',outlineColor:'#d8d2ca',drawingColor:'#1d1b1a',highlightColor:'#0f7b5f',delayBetweenStrokes:180,showHintAfterMisses:2,
   charDataLoader:(c,ok,bad)=>{fetch(HWURL(c)).then(r=>{if(!r.ok)throw 0;return r.json()}).then(ok).catch(()=>{msg('Chưa tải được dữ liệu nét chữ. Cần mạng lần đầu, hoặc bản xem trước không hỗ trợ.');bad&&bad()})}})}
 loadHW().then(make).catch(()=>msg('Không tải được bộ viết chữ. Cần mạng lần đầu (sau đó dùng offline được).'));
 $('#wc',box).onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;cur=+b.dataset.i;$$('#wc .chip',box).forEach(x=>x.classList.toggle('cur',x===b));if(window.HanziWriter)make()};
 $('#wAnim',box).onclick=()=>wr&&wr.animateCharacter();
 $('#wQuiz',box).onclick=()=>{if(!wr)return;msg('Viết từng nét theo đúng thứ tự…');wr.quiz({onComplete:s=>msg(s.totalMistakes?'Xong! Sai '+s.totalMistakes+' lần, viết lại cho nhớ nhé.':'Tuyệt vời, viết đúng hết!')})}}

// Bấm chung
document.addEventListener('click',e=>{const t=e.target.closest('[data-say],[data-py],[data-rec],[data-write]');if(!t)return;
 if(t.dataset.py!==undefined&&t.dataset.say===undefined){openHow(t.dataset.py,t.dataset.hz);return}
 if(t.dataset.rec!==undefined){openSpeak(t.dataset.rec,t.dataset.recpy||'',t.dataset.recvi||'');return}
 if(t.dataset.write!==undefined){openWrite(t.dataset.write);return}
 if(t.dataset.say!==undefined){speak(t.dataset.say,t.dataset.rate?+t.dataset.rate:0)}});

// ---------- AI ----------
async function aiCall(system,msgs){const s=ST.set;
 if(s.prov==='claude'){if(!s.akey)throw new Error('Chưa nhập Claude API key trong Cài đặt');
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':s.akey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:s.amodel||'claude-haiku-5-5',max_tokens:800,system,messages:msgs})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('Lỗi '+r.status));return(j.content||[]).map(c=>c.text||'').join('')}
 if(s.prov==='openai'){if(!s.okey)throw new Error('Chưa nhập OpenAI API key trong Cài đặt');if(!s.omodel)throw new Error('Chưa chọn model GPT trong Cài đặt (bấm "Kiểm tra key")');
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json',Authorization:'Bearer '+s.okey},body:JSON.stringify({model:s.omodel,messages:[{role:'system',content:system},...msgs]})});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('Lỗi '+r.status));return j.choices&&j.choices[0]&&j.choices[0].message.content||''}
 throw new Error('Chưa chọn AI (Claude hoặc GPT) trong Cài đặt')}
async function listModels(p){const s=ST.set;const r=p==='claude'?await fetch('https://api.anthropic.com/v1/models?limit=100',{headers:{'x-api-key':s.akey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}}):await fetch('https://api.openai.com/v1/models',{headers:{Authorization:'Bearer '+s.okey}});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('Lỗi '+r.status));return(j.data||[]).map(m=>m.id).sort()}
function parseAI(t){const m=String(t).match(/\{[\s\S]*\}/);if(m){try{const o=JSON.parse(m[0]);if(o.zh)return o}catch(e){}}return{zh:String(t).trim(),py:'',vi:'',sua:'',goiy:''}}
function sysPrompt(role,L){const vocab=LESSONS.slice(0,L).flatMap(x=>x.w.map(w=>w[0])).join('、');
 return 'Bạn là người luyện nói tiếng Trung phổ thông (chữ giản thể) với một người Việt mới học, đang ở bài '+L+'/'+LESSONS.length+' (bài 1–15 là HSK1, 16–25 là HSK2).\nVai và tình huống của bạn: '+role+'\nQuy tắc:\n- Mỗi lượt chỉ nói 1–2 câu ngắn (tối đa khoảng 15 chữ Hán), chủ yếu dùng các từ người học đã biết: '+vocab+'. Nếu cần từ mới thì tối đa 1 từ.\n- Người học có thể nói qua nhận giọng nói nên câu có thể sai chữ đồng âm; hãy đoán ý hợp lý và nhắc nhẹ.\n- Nếu câu của người học sai từ, sai ngữ pháp hoặc không tự nhiên: nhận xét ngắn bằng tiếng Việt và đưa câu đúng (chữ Hán + pinyin). Nếu người học viết tiếng Việt, dạy cách nói câu đó bằng tiếng Trung.\n- Luôn giữ hội thoại tiếp diễn bằng một câu hỏi hoặc lời mời đáp.\nChỉ trả lời bằng MỘT đối tượng JSON hợp lệ, không thêm chữ nào khác:\n{"zh":"câu tiếng Trung của bạn","py":"pinyin có dấu thanh","vi":"nghĩa tiếng Việt","sua":"nhận xét lỗi của người học bằng tiếng Việt, chuỗi rỗng nếu không có lỗi","goiy":"một câu tiếng Trung gợi ý để người học đáp lại, kèm pinyin trong ngoặc"}'}
const CHAT={role:null,L:1,msgs:[],items:[],busy:false};

// ---------- SRS ----------
const IV=[0,1,2,4,7,15,30,60];
const dueList=()=>{const now=Date.now();return Object.keys(ST.srs).filter(k=>ST.srs[k].d<=now).sort((a,b)=>ST.srs[a].d-ST.srs[b].d)};
function addWords(L){let n=0;L.w.forEach(w=>{if(!ST.srs[w[0]]){ST.srs[w[0]]={b:0,d:Date.now()};n++}});save();return n}
function rate(hz,g){const c=ST.srs[hz];if(!c)return;const DAY=864e5;
 if(g===0){c.b=0;c.d=Date.now()+10*6e4}else if(g===1){c.d=Date.now()+Math.max(.5,IV[c.b]/2)*DAY}else{c.b=Math.min(IV.length-1,c.b+g-1);c.d=Date.now()+IV[c.b]*DAY}
 day().rv++;save()}

// ---------- giao diện ----------
const NL=LESSONS.length;const curL=()=>LESSONS[Math.min(NL,Math.max(1,ST.cur))-1];
function setNav(h){$$('#nav a').forEach(a=>a.classList.toggle('cur',a.dataset.r===h))}
function head(t,sub){return '<header class="ph"><h1>'+t+'</h1>'+(sub?'<p>'+sub+'</p>':'')+'</header>'}
function streak(){let n=0;const d=new Date();for(;;){const x=ST.days[dkey(d)];const c=x?['tu','ng','nghe','noi','rvd','pa'].filter(k=>x[k]).length:0;if(c>=3)n++;else if(n||dkey(d)!==dkey())break;d.setDate(d.getDate()-1);if(n>400)break}return n}

function ring(p){const r=26,c=2*Math.PI*r;return '<svg class="ring" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="'+r+'" class="rb"/><circle cx="32" cy="32" r="'+r+'" class="rf" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+(c*(1-p)).toFixed(1)+'"/></svg>'}
function vToday(){const L=curL(),d=day(),due=dueList().length,dn=ST.done[L.n]||{};
 if(due===0&&d.rv>0)d.rvd=true;if(d.sp>=5||d.ai>=3)d.noi=true;save();
 const steps=[
  ['rvd',8,'Ôn thẻ từ',due?due+' từ đến hạn ôn':'Không có từ cần ôn','#on','cards'],
  ['pa',5,'Luyện phát âm',L.pf.map(id=>(PAIRS.find(p=>p.id===id)||{}).t).filter(Boolean).join(' · '),'#phatam','lips'],
  ['tu',8,'Từ mới bài '+L.n,L.w.length+' từ · nghe, cách đọc, viết','#bai-'+L.n,'book'],
  ['ng',8,'Ngữ pháp và hội thoại',L.g.length+' điểm ngữ pháp · '+L.d.length+' hội thoại','#bai-'+L.n+'-ngu','pencil'],
  ['nghe',5,'Nghe hiểu',L.q.length+' câu hỏi nghe','#bai-'+L.n+'-nghe','ear'],
  ['lt',6,'Luyện tập 10 câu','Chọn nghĩa, điền từ, xếp câu, nói','#bai-'+L.n+'-luyen','target'],
  ['noi',5,'Nói: câu mẫu hoặc chat AI','Chấm 5 câu hoặc chat 3 lượt','#bai-'+L.n+'-thuc','mic']];
 const nDone=steps.filter(s=>d[s[0]]).length,lessonOk=dn.tu&&dn.ng&&dn.nghe,next=steps.find(s=>!d[s[0]]);
 const doneL=Object.values(ST.done).filter(x=>x.tu&&x.ng&&x.nghe).length,h=new Date().getHours();
 main.innerHTML='<header class="top"><div><p class="hi">'+(h<11?'Chào buổi sáng':h<18?'Chào buổi chiều':'Chào buổi tối')+'</p><h1>Hôm nay học gì?</h1></div></header>'+
 (standalone()?'':'<div class="card tip">'+img(AVI.star)+'<p><b>Cài app lên iPhone:</b> mở bằng Safari → nút Chia sẻ → "Thêm vào Màn hình chính".</p></div>')+
 '<section class="hero"><div class="hl"><span class="pill2">Bài '+L.n+'/'+NL+' · HSK'+L.lv+'</span> <span class="pill2 fire">'+img(AVI.fire)+streak()+' ngày</span><div class="zh huge">'+esc(L.zh)+'</div><p class="hv">'+esc(L.vi)+'</p><a class="btn light" href="'+(next?next[4]:'#bai-'+L.n)+'">'+(nDone?'Học tiếp':'Bắt đầu')+' →</a></div>'+
 '<div class="hr"><div class="ringw">'+ring(nDone/steps.length)+'<span><b>'+nDone+'</b>/'+steps.length+'</span></div>'+img(LIC[L.n-1],'hero-ico')+'</div></section>'+
 '<div class="stats"><div><b>'+Object.keys(ST.srs).length+'</b><span>từ đã học</span></div><div><b>'+doneL+'/'+NL+'</b><span>bài xong</span></div><div><b>'+due+'</b><span>cần ôn</span></div></div>'+
 '<h2>Lịch 45 phút hôm nay</h2><ol class="steps">'+steps.map((s,i)=>'<li class="'+(d[s[0]]?'done':'')+'" style="--i:'+i+'"><a href="'+s[4]+'"><span class="sic">'+img(AVI[s[5]])+'</span><span class="st2"><b>'+s[2]+'</b><span>'+esc(s[3])+'</span></span><em>'+s[1]+'′</em></a><button class="ck" data-ck="'+s[0]+'" aria-label="Đánh dấu xong">'+IC.check+'</button></li>').join('')+'</ol>'+
 (lessonOk&&L.n<NL?'<div class="card cele">'+img(AVI.trophy)+'<div><p><b>Xong bài '+L.n+'!</b> Ôn kỹ rồi sang bài mới nhé.</p><button class="btn" id="nextL">Sang bài '+(L.n+1)+'</button></div></div>':'')+
 '<p class="muted small center">Mỗi bài học trong khoảng 2 ngày: ngày 1 từ mới, ngữ pháp, hội thoại; ngày 2 nghe, luyện tập, nói.</p>';
 $$('[data-ck]').forEach(b=>b.onclick=()=>{const k=b.dataset.ck;mark(k,!d[k]);vToday()});
 const nb=$('#nextL');if(nb)nb.onclick=()=>{ST.cur=L.n+1;save();vToday();toast('Bắt đầu bài '+ST.cur)}}

function vLessons(){main.innerHTML='<header class="top"><div><p class="hi">'+NL+' bài · HSK1 và HSK2</p><h1>Bài học</h1></div></header>'+[1,2].map(lv=>'<h2>HSK'+lv+' <span class="muted">'+(lv===1?'bài 1–15 · theo giáo trình':'bài 16–25 · theo chủ đề')+'</span></h2><div class="lgrid">'+LESSONS.filter(L=>L.lv===lv).map(L=>{const dn=ST.done[L.n]||{},k=['tu','ng','nghe'].filter(x=>dn[x]).length,ok=k===3;
 return '<a class="lcard'+(L.n===ST.cur?' cur':'')+(ok?' ok':'')+'" href="#bai-'+L.n+'"><span class="lic">'+img(LIC[L.n-1])+'</span><span class="lt"><small>Bài '+L.n+(L.n===ST.cur?' · đang học':'')+'</small><span class="zh">'+esc(L.zh)+'</span><span class="lvi">'+esc(L.vi)+'</span><span class="mini"><i style="width:'+(k*100/3)+'%"></i></span></span>'+(ok?'<span class="okb">'+IC.check+'</span>':'')+'</a>'}).join('')+'</div>').join('')+'<div class="card tip">'+img(AVI.book)+'<p><b>HSK3</b> (khoảng 500 từ mới, bài 26 trở đi) sẽ có ở bản sau.</p></div>'}

const TABS=[['tu','Từ vựng'],['ngu','Ngữ pháp'],['hoi','Hội thoại'],['nghe','Nghe'],['luyen','Luyện tập'],['thuc','Câu mẫu'],['ai','Nhập vai AI']];
function vLesson(n,tab){const L=LESSONS[n-1];if(!L)return vLessons();if(tab==='ngu'||tab==='hoi')ldone(n,'ngv');
 main.innerHTML='<header class="banner"><a href="#bai" class="back" aria-label="Về danh sách bài">‹</a><div class="bt"><span class="pill2">HSK'+L.lv+' · Bài '+n+'</span><h1 class="zh">'+esc(L.zh)+'</h1><p class="bpy">'+pyHtml(L.py)+'</p><p class="bvi">'+esc(L.vi)+' · '+esc(L.goal)+'</p></div>'+img(LIC[n-1],'bic')+'</header>'+
 '<nav class="tabs" aria-label="Phần của bài">'+TABS.map(t=>'<a href="#bai-'+n+'-'+t[0]+'" class="'+(t[0]===tab?'cur':'')+'">'+t[1]+'</a>').join('')+'</nav><div id="tab"></div>';
 const el=$('#tab');({tu:tWords,ngu:tGram,hoi:tDlg,nghe:tListen,luyen:tPractice,thuc:tReal,ai:tAI}[tab]||tWords)(L,el);
 const c=$('.tabs .cur');if(c)c.scrollIntoView({inline:'center',block:'nearest'})}
const actBtns=(zh,py,vi,w)=>'<span class="acts"><button class="ib" data-say="'+esc(zh)+'" aria-label="Nghe">'+IC.play+'</button><button class="ib" data-py="'+esc(py)+'" data-hz="'+esc(zh)+'" aria-label="Cách đọc">'+IC.lip+'</button><button class="ib" data-rec="'+esc(zh)+'" data-recpy="'+esc(py)+'" data-recvi="'+esc(vi)+'" aria-label="Luyện nói">'+IC.mic+'</button>'+(w?'<button class="ib" data-write="'+esc(zh)+'" aria-label="Viết">'+IC.pen+'</button>':'')+'</span>';
function tWords(L,el){let hide=false;
 const draw=()=>{el.innerHTML='<div class="bar"><button class="btn ghost" id="pAll">'+IC.play+'Nghe cả bài</button><label class="sw"><input type="checkbox" id="hide" '+(hide?'checked':'')+'> Che nghĩa để tự kiểm tra</label></div>'+
 '<ul class="words">'+L.w.map(w=>'<li><button class="zh hz" data-say="'+esc(w[0])+'">'+(PIC[w[0]]?pic(w[0]):'<span class="wpic nop"></span>')+'<span>'+esc(w[0])+'</span></button><div class="wm"><div class="py">'+pyHtml(w[1])+'</div><div class="vi'+(hide?' blur':'')+'">'+esc(w[2])+'</div></div>'+actBtns(w[0],w[1],w[2],1)+'</li>').join('')+'</ul>'+
 '<div class="card"><p>Nghe, xem cách đọc và đọc thử từng từ. Khi đã quen, đưa cả bài vào thẻ ôn tập để app tự nhắc ôn.</p><button class="btn" id="addW">'+((ST.done[L.n]||{}).tu?'Đã đưa vào ôn tập ✓':'Thuộc rồi – đưa vào ôn tập')+'</button></div>';
  $('#hide',el).onchange=e=>{hide=e.target.checked;draw()};
  $('#pAll',el).onclick=async()=>{for(const w of L.w){if(location.hash.indexOf('bai-'+L.n)<0&&location.hash!=='')break;await speak(w[0]);await new Promise(r=>setTimeout(r,350))}};
  $('#addW',el).onclick=()=>{const k=addWords(L);ldone(L.n,'tu');mark('tu');toast(k?'Đã thêm '+k+' từ vào ôn tập':'Các từ đã có trong ôn tập');draw()};
  $$('.vi.blur',el).forEach(v=>v.onclick=()=>v.classList.remove('blur'))};draw()}
function exRow(x){return '<li><div><div class="zh">'+esc(x[0])+'</div><div class="py">'+esc(x[1])+'</div><div class="vi">'+esc(x[2])+'</div></div>'+actBtns(x[0],x[1],x[2],0)+'</li>'}
function tGram(L,el){el.innerHTML=L.g.map((g,i)=>'<section class="card gram"><h3><span class="no">'+(i+1)+'</span>'+esc(g.t)+'</h3>'+(g.c?'<div class="struct"><span>Cấu trúc</span><b class="zh">'+esc(g.c)+'</b></div>':'')+'<p>'+esc(g.d)+'</p><ul class="ex">'+g.ex.map(exRow).join('')+'</ul>'+(g.s?g.s.map(x=>'<div class="wrong"><span class="tag">Hay sai</span><div><s class="zh">'+esc(x[0])+'</s> → <b class="zh">'+esc(x[1])+'</b><br><small>'+esc(x[2])+'</small></div></div>').join(''):'')+'</section>').join('')+'<p class="muted small">Xong ngữ pháp thì sang phần Hội thoại để nghe và nhập vai.</p>'}
function tDlg(L,el){const opt={py:true,vi:true,hid:false};
 const draw=()=>{el.innerHTML='<div class="bar"><label class="sw"><input type="checkbox" data-o="py" '+(opt.py?'checked':'')+'> Pinyin</label><label class="sw"><input type="checkbox" data-o="vi" '+(opt.vi?'checked':'')+'> Nghĩa</label><label class="sw"><input type="checkbox" data-o="hid" '+(opt.hid?'checked':'')+'> Che chữ (luyện nghe)</label></div>'+
  L.d.map((d,i)=>{const sp=[...new Set(d.l.map(x=>x[0]))];return '<section class="card dlg" data-d="'+i+'"><h3>'+esc(d.t)+'</h3><div class="row"><button class="btn ghost" data-play="'+i+'">'+IC.play+'Nghe cả đoạn</button>'+sp.map(s=>'<button class="btn ghost" data-role="'+i+'" data-me="'+esc(s)+'">'+IC.mic+'Đóng vai '+esc(s)+'</button>').join('')+'</div>'+
  '<ol class="lines">'+d.l.map((x,j)=>'<li data-j="'+j+'" class="'+(x[0]===sp[0]?'l':'r')+'"><span class="who">'+img(x[0]===sp[0]?AVI.A:AVI.B,'av')+'<small>'+esc(x[0])+'</small></span><div class="bub"><div class="zh'+(opt.hid?' blur':'')+'">'+esc(x[1])+'</div>'+(opt.py?'<div class="py">'+esc(x[2])+'</div>':'')+(opt.vi?'<div class="vi">'+esc(x[3])+'</div>':'')+'<div class="slot"></div>'+actBtns(x[1],x[2],x[3],0)+'</div></li>').join('')+'</ol></section>'}).join('')+
  '<div class="card"><button class="btn" id="dDone">'+((ST.done[L.n]||{}).ng?'Đã học xong hội thoại ✓':'Đã học xong ngữ pháp và hội thoại')+'</button></div>';
  $$('[data-o]',el).forEach(c=>c.onchange=()=>{opt[c.dataset.o]=c.checked;draw()});
  $$('.zh.blur',el).forEach(v=>v.onclick=()=>v.classList.remove('blur'));
  $$('[data-play]',el).forEach(b=>b.onclick=async()=>{const d=L.d[+b.dataset.play],box=b.closest('.dlg');for(let j=0;j<d.l.length;j++){hl(box,j);await speak(d.l[j][1]);await new Promise(r=>setTimeout(r,300))}hl(box,-1)});
  $$('[data-role]',el).forEach(b=>b.onclick=()=>roleplay(L,+b.dataset.role,b.dataset.me,b.closest('.dlg')));
  $('#dDone',el).onclick=()=>{ldone(L.n,'ng');mark('ng');toast('Tốt lắm! Tiếp theo: phần Nghe.');draw()}};draw()}
function hl(box,j){$$('.lines li',box).forEach((li,k)=>li.classList.toggle('now',k===j))}
async function roleplay(L,i,me,box){const d=L.d[i];let total=0,cnt=0;
 for(let j=0;j<d.l.length;j++){const x=d.l[j];hl(box,j);const li=$$('.lines li',box)[j];
  if(x[0]!==me){await speak(x[1]);await new Promise(r=>setTimeout(r,250));continue}
  const slot=$('.slot',li);slot.innerHTML='<button class="btn small">'+IC.mic+'Đến lượt bạn – bấm rồi nói</button><span class="sr"></span>';
  await new Promise(res=>{const b=$('button',slot);b.onclick=async()=>{if(REC){stopRec();return}b.classList.add('on');b.lastChild.textContent='Đang nghe… bấm để dừng';
   try{const alts=await listen(s=>{if(s==='wait')b.lastChild.textContent='Đang chấm…'});const r=scoreIt(x[1],alts);total+=r.sc;cnt++;day().sp++;save();slot.innerHTML='<span class="pill s'+(r.sc>=90?3:r.sc>=70?2:1)+'">'+r.sc+' điểm</span> <span class="muted">Máy nghe: '+esc(r.hyp)+'</span>';res()}
   catch(e){b.classList.remove('on');b.lastChild.textContent='Thử lại';$('.sr',slot).textContent=' '+recErr(e);if(!$('.skip',slot)){const k=document.createElement('button');k.className='btn ghost small skip';k.textContent='Bỏ qua câu này';k.onclick=()=>{stopRec();slot.innerHTML='';res()};slot.appendChild(k)}}}})}
 hl(box,-1);if(cnt)toast('Xong vai '+me+': trung bình '+Math.round(total/cnt)+' điểm');ldone(L.n,'ng')}
function tListen(L,el){let ans=0,right=0;
 el.innerHTML='<p class="muted">Bấm nghe (không nhìn chữ), rồi chọn đáp án. Có thể nghe lại nhiều lần.</p>'+L.q.map((q,i)=>'<section class="card qz" data-i="'+i+'"><div class="row"><span class="no">'+(i+1)+'</span><button class="btn ghost" data-say="'+esc(q.a)+'">'+IC.play+'Nghe</button><button class="btn ghost" data-say="'+esc(q.a)+'" data-rate=".55">Nghe chậm</button></div><p><b>'+esc(q.q)+'</b></p><div class="opts">'+q.o.map((o,k)=>'<button class="opt" data-k="'+k+'">'+esc(o)+'</button>').join('')+'</div><div class="fb" aria-live="polite"></div></section>').join('')+'<div id="qsum"></div>';
 $$('.qz',el).forEach(box=>{const q=L.q[+box.dataset.i];$$('.opt',box).forEach(b=>b.onclick=()=>{if(box.dataset.done)return;box.dataset.done=1;const k=+b.dataset.k,ok=k===q.c;ans++;if(ok)right++;
  $$('.opt',box).forEach((x,kk)=>{x.disabled=true;if(kk===q.c)x.classList.add('right');else if(kk===k)x.classList.add('wrong')});
  const cp=LESSONS.flatMap(x=>[...x.d.flatMap(d=>d.l.map(l=>[l[1],l[2]])),...x.r.map(r=>[r[0],r[1]])]).find(p=>p[0]===q.a);
  $('.fb',box).innerHTML=(ok?'<p class="good">Đúng rồi!</p>':'<p class="bad">Chưa đúng.</p>')+'<div class="zh">'+esc(q.a)+'</div>'+(cp?'<div class="py">'+esc(cp[1])+'</div>':'')+'<button class="btn ghost small" data-rec="'+esc(q.a)+'" data-recpy="'+esc(cp?cp[1]:'')+'">'+IC.mic+'Đọc theo</button>';
  if(ans===L.q.length){ldone(L.n,'nghe');mark('nghe');$('#qsum',el).innerHTML='<div class="card"><p><b>Kết quả: '+right+'/'+L.q.length+'</b>. '+(right===L.q.length?'Xuất sắc!':'Nghe lại câu sai vài lần nhé.')+'</p></div>'}})})}
function tReal(L,el){el.innerHTML=(L.s.length?'<h3>Câu mẫu</h3><ul class="ex big">'+L.s.map(exRow).join('')+'</ul>':'')+'<h3 style="margin-top:18px">Dùng ngay: Taobao và giao tiếp</h3><p class="muted">Bấm micro để luyện nói và chấm điểm.</p><ul class="ex big">'+L.r.map(exRow).join('')+'</ul><div class="card"><p>Muốn luyện phản xạ? Nhập vai với AI theo chủ đề bài này.</p><a class="btn" href="#bai-'+L.n+'-ai">Nhập vai AI</a></div>'}
const shuf=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function pool(L){const m=new Map();const add=(zh,py,vi)=>{if(zh&&vi&&!m.has(zh)&&typeof TOK!=='undefined'&&TOK[zh])m.set(zh,{zh,py,vi,t:TOK[zh].split('|')})};
 L.d.forEach(d=>d.l.forEach(l=>add(l[1],l[2],l[3])));L.s.forEach(x=>add(x[0],x[1],x[2]));L.r.forEach(x=>add(x[0],x[1],x[2]));L.g.forEach(g=>g.ex.forEach(x=>{if(!/→/.test(x[1]))add(x[0],x[1],x[2])}));return[...m.values()]}
const EXN={nghia:'Nghe và chọn nghĩa đúng',dien:'Chọn từ điền vào chỗ trống',xep:'Sắp xếp thành câu đúng',chep:'Nghe rồi xếp lại câu',noi:'Nói câu này bằng tiếng Trung'};
function makeEx(L){const P=shuf(pool(L)),words=L.w.map(w=>w[0]),types=['nghia','dien','xep','chep','noi'],out=[];let k=0;
 for(const x of P){if(out.length>=10)break;let t=types[k%5];k++;
  if((t==='xep'||t==='chep')&&(x.t.length<3||x.t.length>9))t='nghia';
  if(t==='dien'){const idx=x.t.map((w,i)=>words.includes(w)?i:-1).filter(i=>i>=0);if(idx.length){const i=idx[Math.floor(Math.random()*idx.length)],ans=x.t[i];const opts=shuf([ans,...shuf(words.filter(w=>w!==ans&&!x.t.includes(w))).slice(0,3)]);out.push({t,x,i,ans,opts});continue}t='nghia'}
  if(t==='nghia'){const o=shuf(P.filter(p=>p!==x&&p.vi!==x.vi)).slice(0,3).map(p=>p.vi);out.push({t,x,opts:shuf([x.vi,...o]),ans:x.vi});continue}
  out.push({t,x})}
 return out}
function tPractice(L,el){let Q=makeEx(L),i=0,ok=0;
 const fbk=(good,x)=>'<div class="fbk"><p class="'+(good?'good':'bad')+'">'+(good?'Đúng rồi!':'Chưa đúng. Đáp án:')+'</p><div class="zh mid">'+esc(x.zh)+'</div><div class="py">'+esc(x.py)+'</div><div class="vi">'+esc(x.vi)+'</div>'+actBtns(x.zh,x.py,x.vi,0)+'</div><button class="btn wide" id="exNext">'+(i+1<Q.length?'Câu tiếp':'Xem kết quả')+'</button>';
 function finish(good,box){if(good)ok++;$('#exNext',box).onclick=()=>{i++;draw()}}
 function draw(){if(!Q.length){el.innerHTML='<p class="muted">Chưa có câu để luyện.</p>';return}
  if(i>=Q.length){ldone(L.n,'lt');mark('lt');el.innerHTML='<section class="card"><h3>Kết quả: '+ok+'/'+Q.length+'</h3><p>'+(ok>=8?'Rất tốt! Bạn nắm chắc bài này.':ok>=5?'Khá ổn, làm thêm một lượt nữa nhé.':'Nên xem lại hội thoại và câu mẫu rồi làm lại.')+'</p><button class="btn" id="exAgain">Làm lượt mới</button></section>';$('#exAgain',el).onclick=()=>{Q=makeEx(L);i=0;ok=0;draw()};return}
  const q=Q[i],x=q.x;let h='<section class="card ex1"><div class="exhd"><span class="muted">Câu '+(i+1)+'/'+Q.length+'</span><div class="prog"><i style="width:'+Math.round(100*i/Q.length)+'%"></i></div></div><h3>'+EXN[q.t]+'</h3>';
  if(q.t==='nghia')h+='<button class="btn ghost" data-say="'+esc(x.zh)+'">'+IC.play+'Nghe</button> <button class="btn ghost" data-say="'+esc(x.zh)+'" data-rate=".55">Nghe chậm</button><div class="opts">'+q.opts.map((o,k)=>'<button class="opt" data-k="'+k+'">'+esc(o)+'</button>').join('')+'</div>';
  if(q.t==='dien')h+='<div class="zh mid">'+x.t.map((w,k)=>k===q.i?'<span class="blank">＿＿</span>':esc(w)).join('')+'</div><p class="vi">'+esc(x.vi)+'</p><div class="opts">'+q.opts.map((o,k)=>'<button class="opt zh" data-k="'+k+'">'+esc(o)+'</button>').join('')+'</div>';
  if(q.t==='xep'||q.t==='chep')h+=(q.t==='chep'?'<button class="btn ghost" data-say="'+esc(x.zh)+'">'+IC.play+'Nghe</button> <button class="btn ghost" data-say="'+esc(x.zh)+'" data-rate=".55">Nghe chậm</button>':'<p class="vi big2">'+esc(x.vi)+'</p>')+'<div class="ans" id="ans" aria-live="polite"></div><div class="tiles" id="tiles">'+shuf(x.t.map((w,k)=>({w,k}))).map(o=>'<button class="tile zh" data-k="'+o.k+'">'+esc(o.w)+'</button>').join('')+'</div><div class="row"><button class="btn ghost small" id="clr">Xóa</button><button class="btn" id="chk">Kiểm tra</button></div>';
  if(q.t==='noi')h+='<p class="vi big2">'+esc(x.vi)+'</p><div class="row"><button class="btn" id="exMic">'+IC.mic+'Bấm rồi nói</button><button class="btn ghost" id="exShow">Xem đáp án</button></div><div id="exRes" aria-live="polite"></div>';
  el.innerHTML=h+'<div id="exFb"></div></section>';const box=$('.ex1',el),fb=$('#exFb',box);
  if(q.t==='nghia'||q.t==='chep')speak(x.zh);
  if(q.t==='nghia'||q.t==='dien')$$('.opt',box).forEach(b=>b.onclick=()=>{if(box.dataset.done)return;box.dataset.done=1;const v=q.opts[+b.dataset.k],good=v===q.ans;$$('.opt',box).forEach(o=>{o.disabled=true;if(q.opts[+o.dataset.k]===q.ans)o.classList.add('right');else if(o===b)o.classList.add('wrong')});fb.innerHTML=fbk(good,x);finish(good,box)});
  if(q.t==='xep'||q.t==='chep'){const pick=[];const ans=$('#ans',box),tl=$('#tiles',box);
   const upd=()=>{ans.innerHTML=pick.map((k,j)=>'<button class="tile zh on" data-j="'+j+'">'+esc(x.t[k])+'</button>').join('')||'<span class="muted">Bấm các ô chữ bên dưới theo đúng thứ tự</span>';$$('.tile',tl).forEach(t=>t.disabled=pick.includes(+t.dataset.k))};
   tl.onclick=e=>{const t=e.target.closest('.tile');if(!t||t.disabled||box.dataset.done)return;pick.push(+t.dataset.k);upd()};
   ans.onclick=e=>{const t=e.target.closest('.tile');if(!t||box.dataset.done)return;pick.splice(+t.dataset.j,1);upd()};
   $('#clr',box).onclick=()=>{if(box.dataset.done)return;pick.length=0;upd()};
   $('#chk',box).onclick=()=>{if(box.dataset.done)return;if(pick.length<x.t.length){toast('Hãy xếp hết các ô chữ');return}box.dataset.done=1;const good=pick.map(k=>x.t[k]).join('')===x.t.join('');fb.innerHTML=fbk(good,x);finish(good,box)};upd()}
  if(q.t==='noi'){const show=good=>{if(box.dataset.done)return;box.dataset.done=1;fb.innerHTML=fbk(good,x);finish(good,box)};
   $('#exShow',box).onclick=()=>{fb.innerHTML='<div class="fbk"><div class="zh mid">'+esc(x.zh)+'</div><div class="py">'+esc(x.py)+'</div></div><p>Bạn nói đúng không?</p><div class="row"><button class="btn" id="selfY">Đúng</button><button class="btn ghost" id="selfN">Chưa đúng</button></div>';$('#selfY',box).onclick=()=>show(true);$('#selfN',box).onclick=()=>show(false)};
   $('#exMic',box).onclick=async()=>{const b=$('#exMic',box);if(REC){stopRec();return}b.classList.add('on');try{const a=await listen(st=>{if(st==='wait')b.classList.remove('on')});const r=scoreIt(x.zh,a);day().sp++;save();$('#exRes',box).innerHTML='<p><span class="pill s'+(r.sc>=90?3:r.sc>=70?2:1)+'">'+r.sc+' điểm</span> <span class="muted">Máy nghe: '+esc(r.hyp)+'</span></p>';show(r.sc>=70)}catch(e){$('#exRes',box).innerHTML='<p class="warn">'+esc(recErr(e))+'</p>'}b.classList.remove('on')}}}
 draw()}
function tAI(L,el){el.innerHTML='<section class="card"><h3>Tình huống</h3><p>'+esc(L.role)+'</p><p class="muted">AI chỉ dùng từ bạn đã học đến bài '+L.n+', sửa lỗi bằng tiếng Việt và gợi ý câu trả lời.</p><button class="btn" id="goAI">Bắt đầu nhập vai</button></section>';
 $('#goAI',el).onclick=()=>{CHAT.role={id:'bai'+L.n,n:'Bài '+L.n,p:L.role};CHAT.L=L.n;CHAT.msgs=[];CHAT.items=[];location.hash='#ai'}}

// Phát âm
function vPron(){const L=curL();const groups=[['moi',['b','p','m']],['moirang',['f']],['loi',['d','t','n','l']],['cuong',['g','k','h']],['mat',['j','q','x']],['rang',['z','c','s']],['uon',['zh','ch','sh','r']]];
 main.innerHTML=head('Phát âm','Thanh điệu, cách đặt lưỡi, cặp âm dễ nhầm')+
 '<nav class="tabs"><button data-go="pt">Thanh điệu</button><button data-go="pi">Phụ âm</button><button data-go="pv">Vần</button><button data-go="pp">Cặp dễ nhầm</button><button data-go="pm">Lỗi hay gặp</button></nav>'+
 '<div class="card tip"><b>Bài '+L.n+' luyện:</b> '+L.pf.map(id=>{const p=PAIRS.find(x=>x.id===id);return p?'<button class="chip" data-pair="'+id+'">'+esc(p.t)+'</button>':''}).join(' ')+'</div>'+
 '<h2 id="pt">Thanh điệu</h2><div class="tones">'+TONES.slice(1).concat(TONES[0]).map(t=>'<section class="card tone"><div class="tn t'+t.n+'">'+esc(t.name)+'</div>'+contour(t.n)+'<p>'+esc(t.t)+'</p><div class="chips">'+t.ex.map(x=>'<button class="chip" data-say="'+esc(x[0])+'"><span class="zh">'+esc(x[0])+'</span> '+esc(x[1])+'</button>').join('')+'</div></section>').join('')+'</div>'+
 '<section class="card"><h3>Quy tắc biến điệu</h3><ul class="plain">'+RULES.map(r=>'<li><b>'+esc(r.t)+':</b> '+esc(r.d)+'<div class="chips">'+r.ex.map(x=>'<button class="chip" data-say="'+esc(x[0])+'"><span class="zh">'+esc(x[0])+'</span> '+esc(x[1])+'</button>').join('')+'</div></li>').join('')+'</ul></section>'+
 '<h2 id="pi">Phụ âm đầu – đặt lưỡi thế nào</h2><div class="inis">'+groups.map(g=>'<section class="card ig">'+mouth(g[0])+'<div><h3>'+esc(POSN[g[0]])+'</h3><div class="chips">'+g[1].map(i=>'<button class="chip big" data-ini="'+i+'">'+i+(INI[i].asp?'<sup>h</sup>':'')+'</button>').join('')+'</div></div></section>').join('')+'</div><p class="muted small">Chữ <sup>h</sup> = âm bật hơi. Bấm từng âm để xem hướng dẫn chi tiết.</p>'+
 '<h2 id="pv">Vần</h2><section class="card"><dl class="fins">'+Object.keys(FIN).filter(k=>!/^i[12]$/.test(k)).map(k=>'<dt>'+esc(k)+'</dt><dd>'+esc(FIN[k])+'</dd>').join('')+'<dt>zi ci si</dt><dd>'+esc(FIN.i1)+'</dd><dt>zhi chi shi ri</dt><dd>'+esc(FIN.i2)+'</dd></dl></section>'+
 '<h2 id="pp">Cặp dễ nhầm</h2><p class="muted">Nghe từng âm, rồi bấm "Đoán" để app đọc ngẫu nhiên một âm cho bạn chọn.</p><div class="pairs">'+PAIRS.map(p=>pairCard(p)).join('')+'</div>'+
 '<h2 id="pm">Lỗi người Việt hay gặp</h2><section class="card"><ul class="plain">'+MISTAKES.map(m=>'<li><b>'+esc(m[0])+'</b><br>'+esc(m[1])+'</li>').join('')+'</ul></section>';
 $$('[data-go]').forEach(b=>b.onclick=()=>{const t=document.getElementById(b.dataset.go);if(t)t.scrollIntoView({behavior:'smooth'})});
 $$('[data-pair]').forEach(b=>b.onclick=()=>{const t=document.getElementById('pair-'+b.dataset.pair);if(t){t.scrollIntoView({behavior:'smooth',block:'center'});t.classList.add('flash');setTimeout(()=>t.classList.remove('flash'),1600)}mark('pa')});
 $$('[data-ini]').forEach(b=>b.onclick=()=>{const k=b.dataset.ini,I=INI[k];sheet('<h3>Phụ âm '+esc(k)+(I.asp?' <span class="tag">bật hơi</span>':'')+'</h3>'+mouth(I.pos,I.asp)+'<p class="cap">'+esc(POSN[I.pos])+'</p><p>'+esc(I.t)+'</p><ul class="ex">'+I.ex.map(x=>exRow([x[0],x[1],(WORDS[x[0]]||{}).vi||''])).join('')+'</ul>');mark('pa')});
 $$('.pair').forEach(c=>{const p=PAIRS.find(x=>x.id===c.dataset.id);$('[data-guess]',c).onclick=()=>{const k=Math.floor(Math.random()*p.a.length);c.dataset.ans=k;speak(p.a[k][0]);$('.fb',c).textContent='Âm vừa đọc là chữ nào?';mark('pa')};
  $$('[data-pk]',c).forEach(b=>b.onclick=()=>{if(c.dataset.ans===undefined){speak(p.a[+b.dataset.pk][0]);return}const ok=c.dataset.ans===b.dataset.pk;$('.fb',c).textContent=ok?'Đúng! '+p.a[+c.dataset.ans][0]+' '+p.a[+c.dataset.ans][1]:'Chưa đúng, đó là '+p.a[+c.dataset.ans][0]+' '+p.a[+c.dataset.ans][1];delete c.dataset.ans})})}
function pairCard(p){return '<section class="card pair" id="pair-'+esc(p.id)+'" data-id="'+esc(p.id)+'"><h3>'+esc(p.t)+'</h3><div class="chips">'+p.a.map((x,k)=>'<button class="chip big" data-pk="'+k+'"><span class="zh">'+esc(x[0])+'</span> <span class="t'+(parsePy(x[1])[0]||{t:0}).t+'">'+esc(x[1])+'</span></button>').join('')+'</div><div class="row"><button class="btn ghost small" data-guess>Đoán</button>'+p.a.map(x=>'<button class="ib" data-rec="'+esc(x[0])+'" data-recpy="'+esc(x[1])+'" aria-label="Thử nói '+esc(x[0])+'">'+IC.mic+'</button>').join('')+'</div><p class="fb muted" aria-live="polite"></p></section>'}

// Ôn tập
let RV={mode:'nhin',q:[],i:0,flip:false};
function vReview(){const due=dueList();RV.q=due;RV.i=0;RV.flip=false;
 if(!Object.keys(ST.srs).length){main.innerHTML=head('Ôn tập','Thẻ từ lặp lại ngắt quãng')+'<div class="card"><p>Chưa có từ nào. Vào một bài học, phần Từ vựng, bấm "Thuộc rồi – đưa vào ôn tập".</p><a class="btn" href="#bai-'+ST.cur+'">Mở bài '+ST.cur+'</a></div>';return}
 drawRV()}
function drawRV(){const q=RV.q,total=Object.keys(ST.srs).length;
 if(RV.i>=q.length){main.innerHTML=head('Ôn tập',total+' từ trong bộ thẻ')+'<div class="card"><p><b>'+(q.length?'Xong lượt ôn hôm nay!':'Không có từ nào đến hạn.')+'</b> Hôm nay đã ôn '+day().rv+' lượt.</p><button class="btn ghost" id="more">Ôn thêm 10 từ bất kỳ</button></div>'+boxes();
  if(q.length){mark('rvd')}$('#more').onclick=()=>{RV.q=Object.keys(ST.srs).sort(()=>Math.random()-.5).slice(0,10);RV.i=0;RV.flip=false;drawRV()};return}
 const hz=q[RV.i],w=WORDS[hz]||{hz,py:'',vi:''};const m=RV.mode;
 main.innerHTML=head('Ôn tập',(q.length-RV.i)+' thẻ còn lại')+'<nav class="tabs seg">'+[['nhin','Nhìn chữ'],['nghe','Nghe'],['noi','Nói']].map(x=>'<button data-m="'+x[0]+'" class="'+(m===x[0]?'cur':'')+'">'+x[1]+'</button>').join('')+'</nav>'+
 '<section class="card flash-card"><div class="front">'+(m==='nhin'?'<div class="zh giant">'+esc(hz)+'</div>':m==='nghe'?'<button class="btn ghost" data-say="'+esc(hz)+'">'+IC.play+'Nghe lại</button><p class="muted">Nghe và nhớ nghĩa</p>':'<div class="vi big">'+esc(w.vi)+'</div><button class="btn" data-rec="'+esc(hz)+'" data-recpy="'+esc(w.py)+'">'+IC.mic+'Nói bằng tiếng Trung</button>')+'</div>'+
 (RV.flip?'<div class="bk2">'+pic(hz)+(m==='nhin'?'':'<div class="zh giant">'+esc(hz)+'</div>')+'<div class="py big">'+pyHtml(w.py)+'</div><div class="vi">'+esc(w.vi)+'</div>'+actBtns(hz,w.py,w.vi,1)+'</div><div class="rate">'+[['Quên',0],['Khó',1],['Nhớ',2],['Dễ',3]].map(x=>'<button class="btn r'+x[1]+'" data-g="'+x[1]+'">'+x[0]+'</button>').join('')+'</div>':'<button class="btn wide" id="flip">Lật thẻ</button>')+'</section>';
 if(m==='nghe'&&!RV.flip)speak(hz);
 $$('[data-m]').forEach(b=>b.onclick=()=>{RV.mode=b.dataset.m;RV.flip=false;drawRV()});
 const f=$('#flip');if(f)f.onclick=()=>{RV.flip=true;drawRV();if(m!=='nghe')speak(hz)};
 $$('[data-g]').forEach(b=>b.onclick=()=>{rate(hz,+b.dataset.g);RV.i++;RV.flip=false;drawRV()})}
function boxes(){const c=new Array(IV.length).fill(0);Object.values(ST.srs).forEach(v=>c[v.b]++);return '<section class="card"><h3>Mức nhớ</h3><div class="boxes">'+c.map((n,i)=>'<div><b>'+n+'</b><span>'+(i===0?'mới':'mức '+i)+'</span></div>').join('')+'</div></section>'}

// Chat AI
function vChat(){const s=ST.set;const ready=(s.prov==='claude'&&s.akey)||(s.prov==='openai'&&s.okey&&s.omodel);
 if(!CHAT.role)CHAT.role={id:'bai'+ST.cur,n:'Bài '+ST.cur,p:curL().role},CHAT.L=ST.cur;
 main.innerHTML=head('Nhập vai AI',ready?'Đang dùng '+(s.prov==='claude'?'Claude':'GPT')+' · cần mạng':'Cần cài đặt API key')+
 (ready?'':'<div class="card tip"><p>Phần này cần mạng và API key của Claude hoặc OpenAI.</p><a class="btn" href="#caidat">Mở Cài đặt</a></div>')+
 '<div class="chips roles">'+[CHAT.role.id.startsWith('bai')?CHAT.role:{id:'bai'+ST.cur,n:'Bài '+ST.cur,p:curL().role}].concat(ROLES).map(r=>'<button class="chip'+(CHAT.role.id===r.id?' cur':'')+'" data-rid="'+esc(r.id)+'">'+esc(r.n)+'</button>').join('')+'</div>'+
 '<div class="bar"><label>Mức từ vựng: <select id="lv">'+LESSONS.map(L=>'<option value="'+L.n+'"'+(L.n===CHAT.L?' selected':'')+'>đến bài '+L.n+'</option>').join('')+'</select></label><button class="btn ghost small" id="reset">Làm lại</button></div>'+
 '<div id="log" class="log" aria-live="polite"></div><form id="cf" class="composer"><button type="button" class="ib big" id="cmic" aria-label="Nói">'+IC.mic+'</button><textarea id="ct" rows="1" placeholder="Nói hoặc gõ tiếng Trung (gõ tiếng Việt cũng được)"></textarea><button class="btn" id="send">Gửi</button></form>';
 $$('[data-rid]').forEach(b=>b.onclick=()=>{const r=b.dataset.rid.startsWith('bai')?(CHAT.role.id===b.dataset.rid?CHAT.role:{id:'bai'+ST.cur,n:'Bài '+ST.cur,p:curL().role}):ROLES.find(x=>x.id===b.dataset.rid);CHAT.role=r;CHAT.msgs=[];CHAT.items=[];vChat()});
 $('#lv').onchange=e=>{CHAT.L=+e.target.value;CHAT.msgs=[];CHAT.items=[];vChat()};
 $('#reset').onclick=()=>{CHAT.msgs=[];CHAT.items=[];vChat()};
 const ct=$('#ct');ct.oninput=()=>{ct.style.height='auto';ct.style.height=Math.min(120,ct.scrollHeight)+'px'};
 $('#cf').onsubmit=e=>{e.preventDefault();const v=ct.value.trim();if(!v||CHAT.busy)return;ct.value='';sendChat(v)};
 $('#cmic').onclick=async()=>{const b=$('#cmic');if(REC){stopRec();return}b.classList.add('on');try{const a=await listen(s=>{if(s==='wait')b.classList.remove('on')});ct.value=(a[0]||'').trim();ct.oninput()}catch(e){toast(recErr(e))}b.classList.remove('on')};
 drawLog();if(ready&&!CHAT.items.length)sendChat(null)}
function drawLog(){const log=$('#log');if(!log)return;
 log.innerHTML=CHAT.items.map(it=>it.me?'<div class="msg me">'+esc(it.t)+'</div>':it.err?'<div class="msg err">'+esc(it.err)+'</div>':
  '<div class="msg ai">'+img(AVI[CHAT.role.id]||AVI.ai,'av')+'<div class="zh mid">'+esc(it.zh)+' <button class="ib" data-say="'+esc(it.zh)+'" aria-label="Nghe">'+IC.play+'</button></div>'+(it.py?'<div class="py">'+esc(it.py)+'</div>':'')+(it.vi?'<details><summary>Nghĩa</summary><div class="vi">'+esc(it.vi)+'</div></details>':'')+
  (it.sua?'<div class="fix"><b>Sửa:</b> '+esc(it.sua)+'</div>':'')+(it.goiy?'<button class="sug" data-sug="'+esc(it.goiy)+'">Gợi ý: '+esc(it.goiy)+'</button>':'')+'</div>').join('')+(CHAT.busy?'<div class="msg ai typing">…</div>':'');
 $$('[data-sug]',log).forEach(b=>b.onclick=()=>{const t=b.dataset.sug.replace(/[（(][^）)]*[）)]/g,'').trim();$('#ct').value=t;speak(t)});
 log.scrollTop=log.scrollHeight;const last=log.lastElementChild;if(last)last.scrollIntoView({block:'nearest'})}
async function sendChat(text){const sys=sysPrompt(CHAT.role.p,CHAT.L);
 if(text){CHAT.items.push({me:1,t:text});CHAT.msgs.push({role:'user',content:text});day().ai++;save()}
 else CHAT.msgs.push({role:'user',content:'(Bắt đầu. Hãy chào và mở đầu tình huống bằng một câu ngắn.)'});
 CHAT.busy=true;drawLog();
 try{const raw=await aiCall(sys,CHAT.msgs);CHAT.msgs.push({role:'assistant',content:raw});const o=parseAI(raw);CHAT.items.push(o);CHAT.busy=false;drawLog();speak(o.zh)}
 catch(e){CHAT.msgs.pop();CHAT.busy=false;CHAT.items.push({err:'Không gọi được AI: '+(e.message||e)+(navigator.onLine?'':' (đang offline)')});drawLog()}}

// Cài đặt
function vSettings(){const s=ST.set;
 main.innerHTML=head('Cài đặt')+
 '<section class="card"><h3>Giọng đọc mẫu</h3>'+(VOICES.length?'<label>Giọng <select id="voice">'+VOICES.map(v=>'<option value="'+esc(v.voiceURI)+'"'+(v.voiceURI===s.voice?' selected':'')+'>'+esc(v.name+' ('+v.lang+')')+'</option>').join('')+'</select></label>':'<p class="warn">Chưa thấy giọng tiếng Trung. Trên iPhone vào Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Trung (Trung Quốc đại lục) để tải về, rồi mở lại app.</p>')+
 '<label>Tốc độ đọc: <b id="rv">'+s.rate+'</b><input type="range" id="rate" min=".5" max="1.1" step=".05" value="'+s.rate+'"></label><button class="btn ghost" data-say="你好，我是越南人。">'+IC.play+'Nghe thử</button></section>'+
 '<section class="card"><h3>Chấm phát âm (nhận giọng nói)</h3><label><select id="stt"><option value="auto">Tự động (OpenAI nếu có key, không thì trình duyệt)</option><option value="web">Nhận giọng của trình duyệt / Safari</option><option value="openai">OpenAI (chạy được cả khi mở từ icon)</option></select></label><p class="muted small">Hiện tại: '+esc(modeNote())+'</p></section>'+
 '<section class="card"><h3>Nhập vai AI</h3><label>Dùng AI <select id="prov"><option value="none">Không dùng</option><option value="claude">Claude (Anthropic)</option><option value="openai">GPT (OpenAI)</option></select></label>'+
 '<div class="kv"><label>Claude API key<input id="akey" type="password" autocomplete="off" value="'+esc(s.akey)+'" placeholder="sk-ant-…"></label><label>Model Claude<input id="amodel" list="aml" value="'+esc(s.amodel)+'"><datalist id="aml"></datalist></label><button class="btn ghost small" id="testA">Kiểm tra key Claude</button></div>'+
 '<div class="kv"><label>OpenAI API key<input id="okey" type="password" autocomplete="off" value="'+esc(s.okey)+'" placeholder="sk-…"></label><label>Model GPT (chat)<input id="omodel" list="oml" value="'+esc(s.omodel)+'"><datalist id="oml"></datalist></label><label>Model nhận giọng<input id="tmodel" list="tml" value="'+esc(s.tmodel)+'"><datalist id="tml"></datalist></label><button class="btn ghost small" id="testO">Kiểm tra key OpenAI</button></div>'+
 '<p id="kmsg" class="muted small" aria-live="polite"></p><p class="muted small">Lấy key tại console.anthropic.com hoặc platform.openai.com, nạp ít tiền và đặt giới hạn chi tiêu. Key chỉ lưu trên máy này, không gửi đi đâu khác ngoài Anthropic/OpenAI. Đừng chia sẻ máy đã lưu key.</p></section>'+
 '<section class="card"><h3>Dùng offline</h3><p>Bài học, đọc mẫu, ôn tập chạy offline. Viết chữ cần tải dữ liệu nét chữ một lần.</p><button class="btn ghost" id="pre">Tải trước dữ liệu viết chữ</button><p id="pmsg" class="muted small"></p></section>'+
 '<section class="card"><h3>Sao lưu tiến độ</h3><div class="row"><button class="btn ghost" id="exp">Xuất</button><button class="btn ghost" id="imp">Nhập</button><button class="btn ghost danger" id="wipe">Xóa tiến độ</button></div><textarea id="bk" rows="3" placeholder="Dán dữ liệu sao lưu vào đây rồi bấm Nhập"></textarea><p id="bmsg" class="muted small"></p></section>'+
 '<section class="card"><h3>Ghi công</h3><p class="small muted">Hình minh họa: Twemoji (giấy phép CC-BY 4.0). Dữ liệu nét chữ: Hanzi Writer / Make Me a Hanzi.</p></section><section class="card"><h3>Cài lên iPhone</h3><ol class="plain"><li>Mở trang app bằng Safari.</li><li>Bấm nút Chia sẻ (ô vuông có mũi tên).</li><li>Chọn "Thêm vào Màn hình chính" → Thêm.</li><li>Mở app một lần khi có mạng để tải toàn bộ bài học.</li></ol></section>';
 $('#stt').value=s.stt;$('#prov').value=s.prov;
 const up=(k,v)=>{s[k]=v;save()};
 if($('#voice'))$('#voice').onchange=e=>up('voice',e.target.value);
 $('#rate').oninput=e=>{up('rate',+e.target.value);$('#rv').textContent=e.target.value};
 $('#stt').onchange=e=>up('stt',e.target.value);$('#prov').onchange=e=>up('prov',e.target.value);
 ['akey','amodel','okey','omodel','tmodel'].forEach(k=>$('#'+k).onchange=e=>up(k,e.target.value.trim()));
 const km=t=>$('#kmsg').textContent=t;
 $('#testA').onclick=async()=>{up('akey',$('#akey').value.trim());km('Đang kiểm tra…');try{const ids=await listModels('claude');$('#aml').innerHTML=ids.map(i=>'<option value="'+esc(i)+'">').join('');if(!ids.includes(s.amodel)){const h=ids.find(i=>/haiku/.test(i))||ids[0];if(h){up('amodel',h);$('#amodel').value=h}}if(s.prov==='none')up('prov','claude'),$('#prov').value='claude';km('Key Claude dùng được. Model: '+s.amodel)}catch(e){km('Lỗi: '+e.message)}};
 $('#testO').onclick=async()=>{up('okey',$('#okey').value.trim());km('Đang kiểm tra…');try{const ids=await listModels('openai');const chat=ids.filter(i=>/^(gpt|chatgpt|o\d)/.test(i)&&!/audio|realtime|transcribe|tts|image|search|embed|codex|moderation|instruct|diarize|live/.test(i));const tr=ids.filter(i=>/transcribe|whisper/.test(i)&&!/diarize|live|realtime/.test(i));
  $('#oml').innerHTML=chat.map(i=>'<option value="'+esc(i)+'">').join('');$('#tml').innerHTML=tr.map(i=>'<option value="'+esc(i)+'">').join('');
  if(!chat.includes(s.omodel)){const m=chat.find(i=>/mini|luna|nano/.test(i))||chat[chat.length-1];if(m){up('omodel',m);$('#omodel').value=m}}
  if(!tr.includes(s.tmodel)){const m=['gpt-transcribe','gpt-4o-mini-transcribe','gpt-4o-transcribe','whisper-1'].find(x=>tr.includes(x))||tr[0];if(m){up('tmodel',m);$('#tmodel').value=m}}
  if(s.prov==='none')up('prov','openai'),$('#prov').value='openai';km('Key OpenAI dùng được. Chat: '+(s.omodel||'?')+' · Nhận giọng: '+(s.tmodel||'?'))}catch(e){km('Lỗi: '+e.message)}};
 $('#pre').onclick=async()=>{const cs=[...new Set(LESSONS.flatMap(L=>L.w.flatMap(w=>hanzi(w[0]))))];let ok=0,i=0;for(const c of cs){i++;try{const r=await fetch(HWURL(c));if(r.ok)ok++}catch(e){}if(i%10===0)$('#pmsg').textContent='Đã tải '+i+'/'+cs.length+'…'}loadHW().catch(()=>{});$('#pmsg').textContent='Xong: '+ok+'/'+cs.length+' chữ.'+(ok<cs.length?' Một số chữ chưa tải được, thử lại khi mạng tốt.':'')};
 $('#exp').onclick=()=>{const t=JSON.stringify(Object.assign({},ST,{set:Object.assign({},ST.set,{akey:'',okey:''})}));$('#bk').value=t;try{navigator.clipboard.writeText(t).then(()=>$('#bmsg').textContent='Đã chép (không kèm API key).',()=>$('#bmsg').textContent='Hãy tự chép đoạn chữ ở trên.')}catch(e){$('#bmsg').textContent='Hãy tự chép đoạn chữ ở trên.'}};
 $('#imp').onclick=()=>{try{const o=JSON.parse($('#bk').value);if(!o.srs)throw 0;const keep=ST.set;ST=Object.assign(defState(),o);ST.set=Object.assign(defState().set,o.set||{},{akey:keep.akey,okey:keep.okey});save();$('#bmsg').textContent='Đã nhập tiến độ.'}catch(e){$('#bmsg').textContent='Dữ liệu không hợp lệ.'}};
 $('#wipe').onclick=()=>{const b=$('#wipe');if(!b.dataset.sure){b.dataset.sure=1;b.textContent='Bấm lần nữa để xóa';return}const keep=ST.set;ST=defState();ST.set=keep;save();$('#bmsg').textContent='Đã xóa tiến độ học.';b.textContent='Xóa tiến độ';delete b.dataset.sure}}

// ---------- điều hướng ----------
function route(){closeSheet();stopSpeak();const h=(location.hash||'#today').slice(1);document.body.dataset.page=/^bai-\d/.test(h)?'lesson':'main';const m=h.match(/^bai-(\d+)(?:-(\w+))?$/);
 if(m){vLesson(+m[1],m[2]||'tu');setNav('bai')}else{({today:vToday,bai:vLessons,phatam:vPron,on:vReview,ai:vChat,caidat:vSettings}[h]||vToday)();setNav(h==='caidat'?'':h||'today')}
 window.scrollTo(0,0);main.classList.remove('enter');void main.offsetWidth;main.classList.add('enter')}
addEventListener('hashchange',route);
route();
if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
}
