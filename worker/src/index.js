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
 const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=zh-TW'+(c?'&countrycodes='+c:'')+'&q='+encodeURIComponent(q),{headers:{'user-agent':'igbuttons-personal/1.0 (securitycode2501@gmail.com)'}});
 if(!r.ok)return null;const a=await r.json();return a[0]?{lat:+a[0].lat,lng:+a[0].lon,display:a[0].display_name}:null;}
async function geo(name,addr){let g=null;const c=cc((addr||'')+' '+(name||''));
 if(addr&&addr!==U){const a=addr.replace(/^日本\s*/,'').replace(/^〒?\d{3}-?\d{4}\s*/,'').replace(/^\d{3,6}/,'').replace(/([區区])[^\s路街道巷段]{1,3}里/,'$1');
  g=await nomi(a,c);if(!g){const b=a.replace(/(\d+)[之-]\d+號.*/,'$1號').replace(/[0-9０-９]+[樓F階].*$/,'');if(b!==a)g=await nomi(b,c);}
  if(!g){const st=a.replace(/[0-9０-９]+([之-][0-9]+)?[號号].*$/,'').replace(/[0-9０-９]+巷.*$/,'');if(st&&st!==a){g=await nomi(st,c);if(g)g.approx=true;}}}
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
  if(al||(am&&!lab)){const a=al?al[1]:am[0];if(pend&&!pend.address){pend.address=a;}else out.push(pend={name:'',address:a});continue;}
  if(lab){const v=lab[1].replace(/[#＃].*$/,'').trim();const am2=v.match(ADDR);
   if(am2&&am2.index===0){if(pend&&!pend.address)pend.address=am2[0];else out.push(pend={name:'',address:am2[0]});}
   else{out.push(pend={name:am2?v.slice(0,am2.index).trim():v,address:am2?am2[0]:''});}}}
 if(!out.length){const seen=new Set();for(const m of text.matchAll(/([^\s、，,。:：「」#＃\n]{1,10}?(?:寺|神社|神宮|稲荷|稻荷神社|大社|天満宮|八幡宮|公園|城))(?=[、，,。\s」]|$)/g)){let n=m[1].replace(/^(?:東京|大阪|京都)?\d*間?(?:很有特色)?/,'');if(n.length>=2&&!/^(?:寺|神社|神宮|稲荷|稻荷神社|大社|天満宮|八幡宮|公園|城)$/.test(n)&&!seen.has(n)&&!/御守|御朱印/.test(n)){seen.add(n);out.push({name:n,address:''});}}}
 return out.filter(p=>p.name||p.address).slice(0,20);}
async function fromText(text,meta){const found=extractText(text);const places=[];
 const reg=/東京/.test(text)?'東京 ':/大阪/.test(text)?'大阪 ':/京都/.test(text)?'京都 ':'';
 for(const f of found){const g=await geo(f.address?f.name:(reg+f.name),f.address);places.push({name:f.name||f.address,address:f.address||U,lat:g?g.lat:null,lng:g?g.lng:null,category:guessCat(f.name+' '+text.slice(0,300)),...blank(),note:g?(g.approx?'座標為街道概略位置':''):'座標未確認',link:'',sourceTitle:meta.title||'',author:meta.author||''});}
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
export async function resolve(raw){const m=String(raw||'').match(/https?:\/\/[^\s"'<>]+/);if(!m)throw new Error('沒有找到網址');let u=m[0];
 if(/instagram\.com/.test(u))return ig(u);
 if(/(maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps|maps\.google\.)/.test(u)){const e=/maps\.app\.goo\.gl|goo\.gl/.test(u)?(await expand(u)).url:u;
  const lm=e.match(/placelists\/list\/([A-Za-z0-9_-]+)/);let out=lm?await gList(lm[1]):await gPlace(e,u);out.expanded=e;return out;}
 return page(u);}
async function handle(req){if(req.method==='OPTIONS')return new Response('',{headers:{...H,'access-control-allow-headers':'content-type'}});
 const u=new URL(req.url).searchParams.get('url')||(req.method==='POST'?((await req.json().catch(()=>({}))).url):'');
 try{const out=await resolve(u);(out.places||[]).forEach(p=>{p.sourceUrl=p.sourceUrl||(m=>m?m[0]:'')(String(u).match(/https?:\/\/[^\s]+/));});return j({ok:true,...out});}
 catch(e){return j({ok:false,error:String(e.message||e),places:[]},200);}}
const ALLOW=['https://sc2501.github.io'];
export default{async fetch(req){const o=req.headers.get('origin')||'';const r=await handle(req);const h=new Headers(r.headers);
 h.set('access-control-allow-origin',ALLOW.includes(o)?o:ALLOW[0]);h.set('vary','Origin');h.set('access-control-allow-methods','GET,POST,OPTIONS');
 return new Response(r.body,{status:r.status,headers:h});}};
