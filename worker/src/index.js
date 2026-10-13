const UA_M='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const UA_D='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
const U='未確認';
const H={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*'};
const j=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:H});
export function guessCat(t){t=t||'';
 if(/咖啡|カフェ|coffee|cafe|café|喫茶|珈琲/i.test(t))return'咖啡廳';
 if(/手搖|飲料|茶飲|奶茶|果汁|tea|bubble|ドリンク|タピオカ|再睡5分鐘|50嵐|清心|可不可|迷客夏/i.test(t))return'飲料店';
 if(/寺|神社|神宮|稲荷|稻荷|宮$|廟|公園|景點|展望|博物館|美術館|城$|古蹟|老街|步道|tower|museum|park|shrine|temple|夜景|觀光|観光/i.test(t))return'觀光景點';
 return'餐廳';}
const blank=()=>({hours:U,closed:U,service:U});
function cidFromHex(h){try{return BigInt(h).toString();}catch(e){return'';}}
function cidSigned(s){try{let b=BigInt(s);if(b<0n)b+=1n<<64n;return b.toString();}catch(e){return'';}}
function cc(t){t=t||'';if(/[臺台]北|新北|[臺台]中|[臺台]南|高雄|桃園|新竹|基隆|宜蘭|花蓮|[臺台]東|屏東|嘉義|彰化|雲林|南投|苗栗|澎湖|金門|[區鄉鎮][^\s]{0,12}[路街]/.test(t))return'tw';if(/[都道府県]|丁目|〒|[ぁ-んァ-ン]/.test(t))return'jp';return'';}
async function nomi(q,c){if(!q)return null;
 const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=zh-TW'+(c?'&countrycodes='+c:'')+'&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(10000),headers:{'user-agent':'igbuttons-personal/1.0 (securitycode2501@gmail.com)'}}).catch(()=>null);
 if(!r||!r.ok)return null;const a=await r.json();return a[0]?{lat:+a[0].lat,lng:+a[0].lon,display:a[0].display_name}:null;}
async function geo(name,addr){let g=null;const c=cc((addr||'')+' '+(name||''));
 if(addr&&addr!==U){const a=addr.replace(/^日本\s*/,'').replace(/^〒?\d{3}-?\d{4}\s*/,'').replace(/^\d{3,6}/,'').replace(/([區区])[^\s路街道巷段]{1,3}里/,'$1');
  g=await nomi(a,c);if(!g){const b=a.replace(/(\d+)[之-]\d+號.*/,'$1號').replace(/[0-9０-９]+[樓F階].*$/,'');if(b!==a)g=await nomi(b,c);}
  if(!g){const st=a.replace(/[0-9０-９]+([之-][0-9]+)?[號号].*$/,'').replace(/[0-9０-９]+巷.*$/,'');if(st&&st!==a){g=await nomi(st,c);if(g)g.approx=true;}}}
 if(!g&&addr&&c==='jp'){const j=addr.replace(/^日本\s*/,'').replace(/^〒?\d{3}-?\d{4}\s*/,'').replace(/[0-9０-９\-－−丁目番地号の]+.*$/,'');if(j&&j!==addr){g=await nomi(j,c);if(g)g.approx=true;}}
 if(!g&&name)g=await nomi(name,c);return g;}
async function expand(u){let cur=u;for(let i=0;i<6;i++){if(/placelists\/list\//.test(cur))return{url:cur};const r=await fetch(cur,{redirect:'manual',headers:{'user-agent':UA_D}});const l=r.headers.get('location');if(r.status>=300&&r.status<400&&l){cur=new URL(l,cur).href;continue;}
 if(/consent\.google/.test(cur)){const c=new URL(cur).searchParams.get('continue');if(c){cur=c;continue;}}return {url:cur,res:r};}return {url:cur};}
async function gList(id){const pb='!1m4!1s'+id+'!2e2!3m1!1e1!2e2!3e2!4i500!16b1';
 const GH={'user-agent':UA_D,'accept-language':'zh-TW,zh;q=0.9,en;q=0.5','cookie':'CONSENT=YES+cb; SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg'};
 let r=await fetch('https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=zh-TW&gl=tw&pb='+pb,{headers:GH});let t=await r.text();
 if(!/^\)\]\}'/.test(t)){r=await fetch('https://maps.google.com/maps/preview/entitylist/getlist?authuser=0&hl=zh-TW&gl=tw&pb='+pb,{headers:GH});t=await r.text();}
 if(!/^\)\]\}'/.test(t))throw new Error('Google 清單暫時讀不到（HTTP '+r.status+'，'+(t.match(/<title>([^<]*)/)||[,''])[1].slice(0,60)+'）');
 t=t.replace(/^\)\]\}'\s*/,'');const d=JSON.parse(t)[0];
 const title=d[4]||'Google 地圖清單',author=(d[3]&&d[3][0])||'';
 const places=(d[8]||[]).map(e=>{const p=e[1]||[],c=p[5]||[],name=e[2]||'';const addr=(p[4]||'').replace(/^\d{3,6}/,'');const cid=p[6]?cidSigned(p[6][1]):'';
  return{name,address:addr,lat:c[2]??null,lng:c[3]??null,category:guessCat(name+' '+title),...blank(),note:e[3]||'',link:cid?'https://maps.google.com/?cid='+cid:'',sourceTitle:title+'（Google 地圖清單）',author};});
 return{kind:'google-list',title,author,places};}
function dec(s){try{return decodeURIComponent(s.replace(/\+/g,' '));}catch(e){return s;}}
async function gPlace(u,orig){const x=new URL(u);let name='',addr='',lat=null,lng=null,cid='';
 const m3=u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/),ma=u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
 if(m3){lat=+m3[1];lng=+m3[2];}else if(ma){lat=+ma[1];lng=+ma[2];}
 const mp=x.pathname.match(/\/maps\/place\/([^/]+)/);if(mp)name=dec(mp[1]);
 const ft=x.searchParams.get('ftid')||(u.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/)||[])[1];if(ft)cid=cidFromHex(ft.split(':')[1]);
 if(x.searchParams.get('cid'))cid=x.searchParams.get('cid');
 const q=x.searchParams.get('q')||x.searchParams.get('query')||'';
 if(q&&!name){const mq=q.match(/^(?:\d{3,6})?(.+?[號号](?:\d+樓|[0-9]+F|之\d+)*)(.+)$/);
  if(mq){addr=mq[1].trim();name=mq[2].trim();}else{const ll=q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);if(ll){lat=+ll[1];lng=+ll[2];}else name=q;}}
 if(name&&!addr&&mp){const parts=name.split(',');if(parts.length>1){name=parts[0].trim();addr=parts.slice(1).join(',').trim();}}
 let note='';if(lat==null){const g=await geo(name,addr);if(g){lat=g.lat;lng=g.lng;if(g.approx)note='座標為街道概略位置';}else note='座標未確認';}
 return{kind:'google-place',title:name,places:name||lat!=null?[{name:name||'Google 地圖地點',address:addr||U,lat,lng,category:guessCat(name),...blank(),note,link:cid?'https://maps.google.com/?cid='+cid:orig,sourceTitle:'Google 地圖分享',author:''}]:[]};}
function strip(h){return h.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x([0-9a-f]+);/gi,(a,b)=>String.fromCodePoint(parseInt(b,16))).replace(/&#(\d+);/g,(a,b)=>String.fromCodePoint(+b));}
const ADDR=/((?:東京都|北海道|(?:大阪|京都)府|[^\s、，,。]{2,3}県)[^\s、，,。]{2,40}?[0-9０-９\-－−丁目番地号]+[^\s、，,。]{0,20})|((?:臺|台)?[^\s、，,。]{1,3}[市縣][^\s、，,。]{1,4}[區鄉鎮市][^\s、，,。]{1,30}?[0-9０-９]+[號号])/;
function extractText(text){const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);const out=[];let pend=null;
 for(const l of lines){const lab=l.match(/^(?:📍|🏠|🏮|📌|⛩️?|🍴|店名|名稱|地點|店舗|店|Shop|Place)\s*[:：]?\s*(.+)$/i);const am=l.match(ADDR);const al=l.match(/^((?:日本)?\s*〒\s*\d{3}-?\d{4}.*)$/)?[0,l]:l.match(/^(?:地址|住所|Address|🗺️?)\s*[:：]?\s*(.+)$/i);
  if(al||(am&&!lab)){const a=al?al[1]:am[0];if(pend&&!pend.address){pend.address=a;}else{const ix=lines.indexOf(l),pv=ix>0?lines[ix-1]:'';const nm=(pv&&pv.length<=30&&!ADDR.test(pv)&&!/[:：]/.test(pv))?pv.replace(/^[📍🏠📌]\s*/u,''):'';out.push(pend={name:nm,address:a});}continue;}
  if(lab){const v=lab[1].replace(/[#＃].*$/,'').trim();const am2=v.match(ADDR);
   if(am2&&am2.index===0){if(pend&&!pend.address)pend.address=am2[0];else out.push(pend={name:'',address:am2[0]});}
   else{out.push(pend={name:am2?v.slice(0,am2.index).trim():v,address:am2?am2[0]:''});}}}
 if(!out.length){const seen=new Set();for(const m of text.matchAll(/([^\s、，,。:：「」#＃\n]{1,10}?(?:寺|神社|神宮|稲荷|稻荷神社|大社|天満宮|八幡宮|公園|城))(?=[、，,。\s」]|$)/g)){let n=m[1].replace(/^(?:東京|大阪|京都)?\d*間?(?:很有特色)?/,'');if(n.length>=2&&!/^(?:寺|神社|神宮|稲荷|稻荷神社|大社|天満宮|八幡宮|公園|城)$/.test(n)&&!seen.has(n)&&!/御守|御朱印/.test(n)){seen.add(n);out.push({name:n,address:''});}}}
 return out.filter(p=>p.name||p.address).slice(0,20);}
async function fromText(text,meta){const found=extractText(text);const places=[];
 const reg=/東京/.test(text)?'東京 ':/大阪/.test(text)?'大阪 ':/京都/.test(text)?'京都 ':'';
 for(const f of found){const g=await geo(f.address?f.name:(reg+f.name),f.address);places.push({name:f.name||f.address,address:f.address||U,lat:g?g.lat:null,lng:g?g.lng:null,category:guessCat(f.name||''),...blank(),note:g?(g.approx?'座標為街道概略位置':''):'座標未確認',link:'',sourceTitle:meta.title||'',author:meta.author||''});}
 return places;}
async function ig(u){const m=u.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/);if(!m)throw new Error('無法辨識 IG 網址');
 const code=m[2],kind=m[1]==='p'?'p':'reel';const r=await fetch('https://www.instagram.com/'+kind+'/'+code+'/embed/captioned/',{headers:{'user-agent':UA_M}});const h=await r.text();
 const cm=h.match(/class="Caption">([\s\S]*?)<div class="CaptionComments"/);let author='',cap='';
 if(cm){const au=cm[1].match(/class="CaptionUsername"[^>]*>([^<]+)<\/a>/);author=au?'@'+au[1]:'';cap=strip(cm[1].replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/,'')).trim();}
 const title=(cap.split('\n').find(s=>s.trim())||'IG 貼文').slice(0,60);
 const places=await fromText(cap,{title,author});places.forEach(p=>p.sourceUrl='https://www.instagram.com/'+kind+'/'+code+'/');
 return{kind:'instagram',title,author,caption:cap,places};}
async function page(u){const r=await fetch(u,{headers:{'user-agent':UA_D,'accept-language':'zh-TW,ja;q=0.8,en;q=0.6'}});const h=(await r.text()).slice(0,800000);
 const title=strip((h.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/i)||h.match(/<title[^>]*>([^<]*)<\/title>/i)||[])[1]||'').trim();
 const places=[];for(const s of h.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi)||[]){try{let o=JSON.parse(s.replace(/^<script[^>]*>|<\/script>$/gi,''));const arr=[].concat(o['@graph']||o);
  for(const e of arr){if(!e||!e.address||!e.name)continue;const a=e.address,ad=typeof a==='string'?a:[a.addressRegion,a.addressLocality,a.streetAddress].filter(Boolean).join('');
   const lat=e.geo?+e.geo.latitude:null,lng=e.geo?+e.geo.longitude:null;const g=lat?null:await geo(e.name,ad);
   places.push({name:e.name,address:ad||U,lat:lat||(g&&g.lat)||null,lng:lng||(g&&g.lng)||null,category:guessCat(e.name+' '+[].concat(e['@type']).join(' ')+' '+(e.servesCuisine||'')),hours:[].concat(e.openingHours||[]).join('、')||U,closed:U,service:U,note:'',link:'',sourceTitle:title,author:''});}}catch(e){}}
 if(!places.length)places.push(...await fromText(strip(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi,'')),{title}));
 return{kind:'web',title,places};}

const DAY={Mo:'週一',Tu:'週二',We:'週三',Th:'週四',Fr:'週五',Sa:'週六',Su:'週日',PH:'國定假日'};
function ohZh(oh){if(!oh)return null;if(/^24\/7$/.test(oh.trim()))return{hours:'24 小時營業',closed:'無公休'};
 const hrs=[],off=[];
 for(let r of oh.split(/\s*;\s*/)){r=r.trim();if(!r)continue;
  const m=r.match(/^((?:(?:Mo|Tu|We|Th|Fr|Sa|Su|PH)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?\s*,?\s*)+)?\s*(.*)$/);if(!m)return{hours:oh,closed:null};
  const ds=(m[1]||'').trim().replace(/,$/,''),rest=m[2].trim();
  const dz=ds?ds.split(/\s*,\s*/).map(x=>x.replace(/(\w\w)\s*-\s*(\w\w)/,(a,b,c)=>DAY[b]+'至'+DAY[c]).replace(/^(Mo|Tu|We|Th|Fr|Sa|Su|PH)$/,a=>DAY[a])).join('、'):'每日';
  if(/^(off|closed)$/i.test(rest)){off.push(dz);continue;}
  if(!/^\d{1,2}:\d\d/.test(rest))return{hours:oh,closed:null};
  hrs.push(dz+' '+rest.replace(/-/g,'–').replace(/,\s*/g,'、'));}
 return{hours:hrs.join('；').replace(/週一至週日/g,'每日')||null,closed:off.length?off.join('、'):null};}
function nrm(s){return String(s||'').toLowerCase().replace(/[\s・·\-－()（）「」『』|｜,.。、]/g,'').replace(/[店舗]$/,'');}
function simName(a,b){a=nrm(a);b=nrm(b);if(!a||!b)return false;if(a.includes(b)||b.includes(a))return true;
 let c=0;for(const ch of new Set(b))if(a.includes(ch))c++;return false;}
async function overpass(q){for(const u of['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
 try{const r=await fetch(u,{signal:AbortSignal.timeout(12000),method:'POST',body:'data='+encodeURIComponent(q),headers:{'content-type':'application/x-www-form-urlencoded','user-agent':'igbuttons-personal/1.0 (securitycode2501@gmail.com)'}});if(r.ok){const t=await r.text();if(t.startsWith('{'))return JSON.parse(t);}}catch(e){}}return null;}
function svcZh(g){const parts=[];const y=v=>v==='yes'||v==='only';
 if(g.takeaway==='only')return'只外帶';
 if(g.takeaway)parts.push(y(g.takeaway)?'可外帶':'不可外帶');if(g.delivery)parts.push(y(g.delivery)?'可外送':'不外送');
 if(g.indoor_seating||g.outdoor_seating)parts.push(g.indoor_seating==='no'&&g.outdoor_seating!=='yes'?'無內用座位':'可內用');
 return parts.join('・')||null;}
function extraZh(g){const x=[];
 if(g['payment:cash']==='only'||(g['payment:cash']==='yes'&&g['payment:credit_cards']==='no'))x.push('只收現金');
 else if(g['payment:credit_cards']==='yes')x.push('可刷卡');
 if(g.reservation)x.push({yes:'可訂位',no:'不接受訂位',required:'需要訂位',recommended:'建議訂位',only:'只接受預約'}[g.reservation]||('訂位：'+g.reservation));
 if(g.website||g['contact:website'])x.push('網站 '+(g.website||g['contact:website']));
 if(g.phone||g['contact:phone'])x.push('電話 '+(g.phone||g['contact:phone']));
 if(g.wheelchair==='yes')x.push('無障礙可');return x;}

const WD=['週一','週二','週三','週四','週五','週六','週日'];
function hoursFromG(h){if(!Array.isArray(h)||!h.length)return null;const by={};
 for(const d of h){const n=({'星期一':0,'星期二':1,'星期三':2,'星期四':3,'星期五':4,'星期六':5,'星期日':6})[d[0]];if(n==null)continue;by[n]=(d[3]||[]).map(x=>x[0]).join('、')||'';}
 if(Object.keys(by).length<7)return null;
 const off=[],seg=[];let i=0;while(i<7){let j=i;while(j<6&&by[j+1]===by[i])j++;const lab=i===j?WD[i]:WD[i]+'至'+WD[j];if(/休息/.test(by[i]))off.push(lab);else seg.push((i===0&&j===6?'每日':lab)+' '+by[i]);i=j+1;}
 return{hours:seg.join('；')||'未確認',closed:off.length?off.join('、'):'無公休'};}
const ATTR={has_takeout:['takeout','可外帶','不可外帶'],has_delivery:['delivery','可外送','不外送'],has_seating:['dinein','可內用','無內用'],serves_dine_in:['dinein','可內用','無內用'],accepts_reservations:['res','可訂位','不接受訂位'],requires_cash_only:['cash','只收現金',null],pay_credit_card:['card','可刷卡','不能刷卡'],pay_mobile_nfc:['nfc','可行動支付',null]};
function attrsFromG(a){const out={};const st=JSON.stringify(a||[]);for(const m of st.matchAll(/"\/geo\/type\/[a-z_]+\/([a-z_]+)","[^"]*",\[(\d)/g)){const k=m[1],v=+m[2];const d=ATTR[k];if(!d)continue;const t=v===1?d[1]:d[2];if(t)out[d[0]]=t;}return out;}
async function gmap(p){const ad=p.address&&p.address!==U?p.address.replace(/^日本\s*/,'').replace(/^〒?\d{3}-?\d{4}\s*/,''):'';const coarse=(ad.match(/^.*?[區区]|^.*?[市町村]/)||[''])[0];
 const qs=[...new Set([(p.name+' '+coarse).trim(),p.name,(p.name+' '+ad).trim()])];let last={err:'no match'};
 for(const q of qs){const g=await gmap1(p,q);if(!g.err)return g;last=g;if(/^HTTP/.test(g.err))break;}return last;}
async function gmap1(p,q){
 const r=await fetch('https://www.google.com/search?tbm=map&hl=zh-TW&gl=tw&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(8000),headers:{'user-agent':UA_D,'accept-language':'zh-TW,zh;q=0.9'}}).catch(()=>null);
 if(!r)return{err:'timeout'};const t=await r.text();if(!t.startsWith(")]}'"))return{err:'HTTP '+r.status};
 let d;try{d=JSON.parse(t.slice(4).trim());}catch(e){return{err:'parse'};}
 const ents=((d[0]&&d[0][1])||[]).filter(e=>Array.isArray(e)&&e[14]);
 for(const e of ents){const x=e[14];const nm=x[11]||'';
  const c=x[9]||[];const dist=typeof p.lat==='number'&&c[2]?Math.hypot((c[2]-p.lat)*111000,(c[3]-p.lng)*91000):0;
  const nameOk=simName(p.name,nm)||simName(nm,p.name)||(Array.isArray(x[101])&&x[101].some(n=>typeof n==='string'&&simName(p.name,n)));
  if(!(nameOk&&dist<=3000)&&!(ents.length===1&&typeof p.lat==='number'&&dist<=150))continue;
  const ft=x[10]||'';const cid=ft.includes(':')?cidFromHex(ft.split(':')[1]):'';
  return{name:nm,address:x[39]||'',lat:c[2],lng:c[3],cid,types:x[13]||[],hours:hoursFromG(x[203]&&x[203][0]),phone:x[178]&&x[178][0]&&x[178][0][0],web:x[7]&&x[7][1],attrs:attrsFromG(x[100])};}
 return{err:'no match'};}
async function gEnrich(p){const g=await gmap(p);if(g.err){p.gErr=g.err;return;}const src='Google 地圖';p.gName=g.name;if(g.name&&!(simName(p.name,g.name)||simName(g.name,p.name)))p.note=[p.note,'Google 地圖名稱：'+g.name+'（依位置比對，請確認）'].filter(Boolean).join('・');
 if(g.cid)p.link='https://maps.google.com/?cid='+g.cid;
 if(typeof p.lat!=='number'||/概略/.test(p.note||'')){if(g.lat){p.lat=g.lat;p.lng=g.lng;p.note=(p.note||'').replace(/・?座標(為街道概略位置|未確認)/,'');}}
 if((!p.address||p.address===U)&&g.address)p.address=g.address;
 if(g.hours){if(!p.hours||p.hours===U){p.hours=g.hours.hours;p.hoursSrc=src;}if(!p.closed||p.closed===U){p.closed=g.hours.closed;p.closedSrc=src;}}
 const a=g.attrs,sv=[a.dinein,a.takeout,a.delivery].filter(Boolean);if(sv.length&&(!p.service||p.service===U)){p.service=a.takeout==='可外帶'&&a.dinein==='無內用'?'只外帶':sv.join('・');p.serviceSrc=src;}
 const ex=[a.cash,a.card,a.res,g.phone&&'電話 '+g.phone,g.web&&'網站 '+g.web].filter(Boolean);if(ex.length){p.extra=[p.extra,...ex.filter(z=>!(p.extra||'').includes(z))].filter(Boolean).join('・');p.extraSrc=[p.extraSrc,src].filter(Boolean).join('、');}
 if(g.types.length)p.gType=g.types.join('、');
 if(g.types.length){const c=guessCat(g.types.join(' ')+' '+p.name);if(c!=='餐廳'||/餐|食|麵|飯|壽司|咖哩|燒肉|料理|restaurant/i.test(g.types.join('')))p.category=c;}}
async function enrich(places,limit){const todo=()=>places.filter(p=>typeof p.lat==='number'&&(!p.hoursSrc||!p.serviceSrc)).slice(0,limit);
 for(const p of places){if(!p.link)p.link='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((p.name+' '+(p.address&&p.address!==U?p.address:'')).trim());}
 const gl=places.slice(0,limit);for(let i=0;i<gl.length;i+=4)await Promise.all(gl.slice(i,i+4).map(gEnrich));
 const T=todo();if(!T.length)return finish(places);
 const left=[];
 for(const p of T){const qq=p.name+(p.address&&p.address!==U?' '+p.address.replace(/^日本\s*/,''):'');
  let hit=null;for(const q of [p.name,qq]){const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&extratags=1&namedetails=1&accept-language=zh-TW&viewbox='+(p.lng-.003)+','+(p.lat+.003)+','+(p.lng+.003)+','+(p.lat-.003)+'&bounded=1&q='+encodeURIComponent(q),{signal:AbortSignal.timeout(8000),headers:{'user-agent':'igbuttons-personal/1.0 (securitycode2501@gmail.com)'}}).catch(()=>null);
   const a=r&&r.ok?await r.json().catch(()=>[]):[];hit=a.find(x=>x.extratags&&Object.values(x.namedetails||{name:x.name}).some(n=>simName(p.name,n)||simName(n,p.name)));if(hit)break;}
  if(hit)apply(p,{name:hit.name,...hit.extratags});else left.push(p);}
 if(!left.length)return finish(places);
 const q='[out:json][timeout:10];('+left.map(p=>'nwr(around:150,'+p.lat+','+p.lng+')[name];').join('')+');out center tags;';
 const d=await overpass(q);if(!d)return finish(places);
 for(const p of left){let best=null,bd=1e9;
  for(const e of d.elements){const g=e.tags||{},la=e.lat??e.center?.lat,lo=e.lon??e.center?.lon;if(la==null)continue;
   const dist=Math.hypot((la-p.lat)*111000,(lo-p.lng)*91000);if(dist>150)continue;
   const names=[g.name,g['name:ja'],g['name:zh'],g['name:zh-Hant'],g['name:en'],g.brand].filter(Boolean);
   if(!names.some(n=>simName(p.name,n)||simName(n,p.name)))continue;if(dist<bd){bd=dist;best=g;}}
  if(best)apply(p,best);}finish(places);}
function finish(places){for(const p of places){const f=[['營業時間',p.hoursSrc],['公休',p.closedSrc],['內用外帶',p.serviceSrc],['其他',p.extraSrc]];const ok=f.filter(x=>x[1]);
 if(ok.length)p.verified=new Date().toISOString().slice(0,10)+' '+ok.map(x=>x[0]+'：'+x[1]).join('；')+(ok.length<4?'；其餘未確認':'');}}
function apply(p,best){const src='OpenStreetMap';p.osm=best.name;
  const o=ohZh(best.opening_hours);if(o&&o.hours&&(!p.hours||p.hours===U)){p.hours=o.hours;p.hoursSrc=src;}
  if(o&&o.closed&&(!p.closed||p.closed===U)){p.closed=o.closed;p.closedSrc=src;}
  const sv=svcZh(best);if(sv&&(!p.service||p.service===U)){p.service=sv;p.serviceSrc=src;}
  const ex=extraZh(best).filter(z=>!(p.extra||'').includes(z));if(ex.length){p.extra=[p.extra,...ex].filter(Boolean).join('・');p.extraSrc=[p.extraSrc,src].filter(Boolean).join('、');}
  if(best['addr:full']&&(!p.address||p.address===U)){p.address=best['addr:full'];}
}
export async function resolve(raw){const o=await resolve0(raw);await enrich(o.places||[],o.kind==='google-list'?10:6);return o;}
async function resolve0(raw){const m=String(raw||'').match(/https?:\/\/[^\s"'<>]+/);if(!m)throw new Error('沒有找到網址');let u=m[0];
 if(/instagram\.com/.test(u))return ig(u);
 if(/(maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps|maps\.google\.)/.test(u)){const e=/maps\.app\.goo\.gl|goo\.gl/.test(u)?(await expand(u)).url:u;
  const lm=e.match(/placelists\/list\/([A-Za-z0-9_-]+)/);let out=lm?await gList(lm[1]):await gPlace(e,u);out.expanded=e;return out;}
 return page(u);}
async function fromImageText(text){const o=await fromImageText0(text);await enrich(o.places,6);return o;}
async function fromImageText0(text){text=String(text||'').slice(0,4000);let places=await fromText(text,{title:'圖片匯入'});
 if(!places.length){const lines=[...new Set(text.split(/\n+/).map(l=>l.replace(/[|｜_~^*<>\[\]{}]/g,' ').replace(/\s+/g,' ').trim()).filter(l=>l.length>=2&&l.length<=30&&/[\u3040-\u30ff\u4e00-\u9fffA-Za-z]{2}/.test(l)&&!/^[#@]|http|追蹤|留言|按讚|分享|讚|則留言|views|likes/i.test(l)))].slice(0,6);
  const c=cc(text);
  for(const l of lines){const g=await nomi(l,c);if(!g)continue;const nm=(g.display.split(',')[0]||'').trim();const a=nm.replace(/\s/g,''),b=l.replace(/\s/g,'');
   if(!(a&&(a.includes(b)||b.includes(a))))continue;places.push({name:nm,address:g.display.split(',').slice(1,5).join(',').trim()||U,lat:g.lat,lng:g.lng,category:guessCat(nm+' '+text.slice(0,300)),...blank(),note:'由圖片文字比對，請確認',link:'',sourceTitle:'圖片匯入',author:''});if(places.length>=5)break;}}
 return{kind:'image-text',title:'圖片匯入',places};}
async function handle(req){if(req.method==='POST'){const b=await req.clone().json().catch(()=>({}));if(b&&b.text){try{return j({ok:true,...await fromImageText(b.text)});}catch(e){return j({ok:false,error:String(e.message||e),places:[]});}}}
 {const t=new URL(req.url).searchParams.get('text');if(t){try{return j({ok:true,...await fromImageText(t)});}catch(e){return j({ok:false,error:String(e.message||e),places:[]});}}}
 return handle0(req);}
async function handle0(req){if(req.method==='OPTIONS')return new Response('',{headers:{...H,'access-control-allow-headers':'content-type,x-admin-key'}});
 const u=new URL(req.url).searchParams.get('url')||(req.method==='POST'?((await req.json().catch(()=>({}))).url):'');
 try{const out=await resolve(u);(out.places||[]).forEach(p=>{p.sourceUrl=p.sourceUrl||(m=>m?m[0]:'')(String(u).match(/https?:\/\/[^\s]+/));});return j({ok:true,...out});}
 catch(e){return j({ok:false,error:String(e.message||e),places:[]},200);}}
const ALLOW=['https://sc2501.github.io'];
const okId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(id);
const cut=(v,n)=>typeof v==='string'?v.slice(0,n):'';
async function route(req,env){const u=new URL(req.url),P=u.pathname,K=env.PLACES;
 const admin=()=>env.ADMIN_KEY&&(req.headers.get('x-admin-key')===env.ADMIN_KEY);
 if(P==='/queue'&&req.method==='POST'){const b=await req.json().catch(()=>null);const arr=Array.isArray(b)?b:b&&b.places?b.places:[b];let n=0;
  for(const p of arr.slice(0,20)){if(!p||!okId(p.id)||!p.name)continue;
   const rec={id:p.id,name:cut(p.name,120),address:cut(p.address,200),link:cut(p.link,400),lat:typeof p.lat==='number'?p.lat:null,lng:typeof p.lng==='number'?p.lng:null,category:cut(p.category,20),sourceUrl:cut(p.sourceUrl,400),sourceTitle:cut(p.sourceTitle,120),queuedAt:new Date().toISOString()};
   if(await K.get('e:'+p.id))continue;await K.put('q:'+p.id,JSON.stringify(rec),{expirationTtl:60*60*24*30});n++;}
  return j({ok:true,queued:n});}
 if(P==='/queue'&&req.method==='GET'){if(!admin())return j({ok:false,error:'forbidden'},403);
  const l=await K.list({prefix:'q:',limit:100});const out=[];for(const k of l.keys){const v=await K.get(k.name);if(v)out.push(JSON.parse(v));}return j({ok:true,pending:out});}
 if(P==='/enrich'&&req.method==='POST'){if(!admin())return j({ok:false,error:'forbidden'},403);
  const b=await req.json().catch(()=>null);const arr=Array.isArray(b)?b:[b];let n=0;
  for(const e of arr){if(!e||!okId(e.id))continue;const rec={id:e.id,enrichedAt:new Date().toISOString()};
   for(const f of['hours','closed','service','goshuin','extra','reviews','note','verified','hoursSrc','closedSrc','serviceSrc','extraSrc','reviewsSrc','address','link'])if(typeof e[f]==='string'&&e[f])rec[f]=e[f].slice(0,1500);
   for(const f of['lat','lng'])if(typeof e[f]==='number')rec[f]=e[f];
   await K.put('e:'+e.id,JSON.stringify(rec));await K.delete('q:'+e.id);n++;}
  return j({ok:true,saved:n});}
 if(P==='/enrich'&&req.method==='GET'){const ids=(u.searchParams.get('ids')||'').split(',').filter(okId).slice(0,50);const out={};
  await Promise.all(ids.map(async id=>{const v=await K.get('e:'+id);if(v)out[id]=JSON.parse(v);}));return j({ok:true,enrich:out});}
 return null;}
export default{async fetch(req,env){const o=req.headers.get('origin')||'';if(req.method==='OPTIONS')return new Response('',{headers:{'access-control-allow-origin':ALLOW.includes(o)?o:ALLOW[0],'access-control-allow-headers':'content-type','access-control-allow-methods':'GET,POST,OPTIONS','vary':'Origin'}});const r=(await route(req,env))||await handle(req);const h=new Headers(r.headers);
 h.set('access-control-allow-origin',ALLOW.includes(o)?o:ALLOW[0]);h.set('vary','Origin');h.set('access-control-allow-methods','GET,POST,OPTIONS');
 return new Response(r.body,{status:r.status,headers:h});}};
