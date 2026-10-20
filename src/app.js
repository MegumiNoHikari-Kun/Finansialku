/* __SB_URL__ / __SB_KEY__ diisi saat build dari environment variable Vercel */
const sb=supabase.createClient(__SB_URL__,__SB_KEY__);
const $=s=>document.querySelector(s), rp=n=>'Rp '+Math.round(Number(n||0)).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nn=v=>v===''||v==null?null:v, today=()=>new Date().toISOString().slice(0,10);
const sum=a=>a.reduce((s,x)=>s+Number(x.amount),0), cats=['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#84cc16'];
let SB=innerWidth>800,U=null,S={a:[],c:[],t:[],d:[],b:[]},F={q:'',acc:'',type:'',cat:'',p:0,all:0},D={q:'',s:'aktif'}, view='dash', month=today().slice(0,7), charts=[];
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',3000)};
const closeM=()=>$('#modal').classList.remove('on');

/* ---------- AUTH ---------- */
function authView(){
 $('#root').innerHTML=`<div id=auth><div class=logo style="font-size:26px">Fin<i>Track</i></div><p class=mu>Catatan keuangan pribadi yang rapi.</p>
 <form class=card id=af><label>Email<input name=email type=email required autocomplete=email></label><label>Password<input name=password type=password minlength=6 required autocomplete=current-password></label>
 <button class=btn style="width:100%">Masuk</button>
 <p class=mu style="text-align:center;margin:14px 0 0"><a href=# id=forgot style="color:var(--pr)">Lupa password?</a></p>
 <p class=mu style="text-align:center;margin:10px 0 0">Belum punya akun? <a href=# id=sw style="color:var(--pr)">Daftar</a></p></form></div>`;
 let reg=false;
 $('#sw').onclick=e=>{e.preventDefault();reg=!reg;$('#af .btn').textContent=reg?'Daftar':'Masuk';$('#sw').textContent=reg?'Masuk':'Daftar';$('#forgot').parentElement.style.display=reg?'none':'';$('#af').elements.password.autocomplete=reg?'new-password':'current-password'};
 $('#forgot').onclick=e=>{e.preventDefault();authForgotView()};
 $('#af').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  const {error,data}=reg?await sb.auth.signUp(d):await sb.auth.signInWithPassword(d);
  if(error)return toast(error.message); if(reg&&!data.session)toast('Cek email untuk konfirmasi.')}
}
function authForgotView(){
 $('#root').innerHTML=`<div id=auth><div class=logo style="font-size:26px">Fin<i>Track</i></div><p class=mu>Reset password akun FinTrack.</p>
 <form class=card id=rf><label>Email terdaftar<input name=email type=email required autocomplete=email></label>
 <button class=btn style="width:100%">Kirim link reset password</button>
 <p class=mu style="text-align:center;margin:14px 0 0"><a href=# id=backlogin style="color:var(--pr)">Kembali ke login</a></p></form></div>`;
 $('#backlogin').onclick=e=>{e.preventDefault();authView()};
 $('#rf').onsubmit=async e=>{e.preventDefault();const email=new FormData(e.target).get('email');
  const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  if(error)return toast(error.message);
  toast('Jika email terdaftar, link reset password akan dikirim.');e.target.reset()};
}
function authResetView(){
 $('#root').innerHTML=`<div id=auth><div class=logo style="font-size:26px">Fin<i>Track</i></div><p class=mu>Buat password baru untuk akunmu.</p>
 <form class=card id=pf><label>Password baru<input name=password type=password minlength=6 required autocomplete=new-password></label>
 <label>Ulangi password baru<input name=confirm type=password minlength=6 required autocomplete=new-password></label>
 <button class=btn style="width:100%">Simpan password baru</button></form></div>`;
 $('#pf').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
  if(d.password!==d.confirm)return toast('Konfirmasi password tidak cocok.');
  const {error}=await sb.auth.updateUser({password:d.password});
  if(error)return toast(error.message);
  toast('Password berhasil diperbarui.');history.replaceState({},document.title,location.pathname);await sb.auth.getSession()};
}
let uid=null;
sb.auth.onAuthStateChange((ev,s)=>setTimeout(()=>{if(ev==='PASSWORD_RECOVERY'){authResetView();return}if(!s){uid=null;U=null;authView();return}U=s.user;if(s.user.id!==uid){uid=s.user.id;load()}},0));
addEventListener('click',e=>{if(!e.target.closest('.prof'))document.querySelectorAll('.menu.on').forEach(m=>m.classList.remove('on'))});
addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(e.reason?.message||'Terjadi kesalahan')});

/* ---------- DATA ---------- */
async function load(){
 const all=async(t,o,asc)=>{let r=[],i=0;for(;;){const {data,error}=await sb.from(t).select('*').order(o,{ascending:asc}).order('id').range(i,i+999);if(error)return{error};r=r.concat(data);if(data.length<1000)break;i+=1000}return{data:r}};
 const q=(t,o)=>all(t,o,t!='transactions'&&t!='debts');
 const [a,c,t,d,b]=await Promise.all([q('accounts','created_at'),q('categories','name'),q('transactions','date'),q('debts','date'),q('budgets','created_at')]);
 const err=[a,c,t,d,b].find(r=>r.error); if(err)toast(err.error.message);
 S={a:a.data||[],c:c.data||[],t:t.data||[],d:d.data||[],b:b.data||[]}; try{render()}catch(e){console.error(e);toast('Gagal menampilkan: '+e.message)}
}
const bal=a=>Number(a.initial_balance)+S.t.filter(t=>t.account_id==a.id).reduce((s,t)=>s+(t.type=='income'?1:-1)*t.amount,0);
const acc=id=>S.a.find(a=>a.id==id), cat=id=>S.c.find(c=>c.id==id);
const paid=d=>sum(S.t.filter(t=>t.debt_id==d.id&&t.kind=='payment'));
const accOpts=()=>S.a.map(a=>[a.id,`${a.name}${a.number?' · '+a.number:''}`]);
const spent=cid=>sum(S.t.filter(t=>t.kind=='normal'&&t.type=='expense'&&t.category_id==cid&&t.date.startsWith(month)));
const bud=cid=>S.b.find(b=>b.category_id==cid);
const alerts=()=>S.b.map(b=>({c:cat(b.category_id),b,s:spent(b.category_id),p:spent(b.category_id)/b.amount})).filter(x=>x.c&&x.p>=.8).sort((a,b)=>b.p-a.p);
const budCell=c=>{const b=bud(c.id);if(!b)return '<div class=mu style="font-size:12px">Belum ada budget</div>';const s=spent(c.id),p=s/b.amount;
 return `<div class=mu style="font-size:12px">${rp(s)} / ${rp(b.amount)} bulan ini</div><div class=bar style="margin-top:6px"><i style="width:${Math.min(100,p*100)}%;${p>=1?'background:var(--ex)':p>=.8?'background:#f59e0b':''}"></i></div>`};
const fl=()=>(F.all?S.t:mt()).filter(t=>(!F.cat||(F.cat=='_'?!t.category_id&&t.kind=='normal':t.category_id==F.cat))&&(!F.acc||t.account_id==F.acc)&&(!F.type||t.type==F.type)&&(!F.q||[t.note,cat(t.category_id)?.name,acc(t.account_id)?.name].join(' ').toLowerCase().includes(F.q.toLowerCase())));
const PS=20;
const txTable=()=>{const l=fl(),n=l.length,pg=F.p=Math.min(F.p,Math.max(0,Math.ceil(n/PS)-1));
 return `<table>${txRows(l.slice(pg*PS,pg*PS+PS))}</table>`+(n>PS?`<div class=row style="justify-content:space-between;margin-top:14px"><span class=mu>${pg*PS+1}–${Math.min(n,pg*PS+PS)} dari ${n}</span><span><button class=ghost ${pg?'':'disabled'} onclick="F.p--;$('#txl').innerHTML=txTable()">‹ Prev</button> <button class=ghost ${(pg+1)*PS<n?'':'disabled'} onclick="F.p++;$('#txl').innerHTML=txTable()">Next ›</button></span></div>`:`<div class=mu style="margin-top:10px;font-size:12px">${n} transaksi</div>`)};
const dl=()=>S.d.filter(d=>(!D.q||(d.person+' '+(d.note||'')).toLowerCase().includes(D.q.toLowerCase()))&&(D.s=='all'||(D.s=='aktif')==(d.amount-paid(d)>0)));
const brk=(N,ty)=>{const by={};N.filter(t=>t.type==ty).forEach(t=>{const k=t.category_id||'_';by[k]=by[k]||{s:0,n:0};by[k].s+=Number(t.amount);by[k].n++});
 const tot=Object.values(by).reduce((a,b)=>a+b.s,0),cl=ty=='income'?'var(--in)':'var(--ex)';
 const rows=Object.entries(by).sort((a,b)=>b[1].s-a[1].s).map(([k,v])=>{const c=cat(k),b=ty=='expense'&&c&&bud(k);
  return `<div style="padding:10px 0;cursor:pointer" onclick="F.cat='${k}';F.q=F.acc=F.type='';F.p=0;F.all=0;view='tx';render()"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(c?.name||'Tanpa kategori')} <span class=mu style="font-weight:500">· ${v.n}x</span></b><b>${rp(v.s)}</b></div>
  <div class=bar style="margin-top:6px"><i style="width:${v.s/tot*100}%;background:${cl}"></i></div><div class=mu style="font-size:12px;margin-top:4px">${Math.round(v.s/tot*100)}% dari total${b?` · budget terpakai ${Math.round(v.s/b.amount*100)}%`:''}</div></div>`}).join('');
 return `<div class=card><h3>${ty=='income'?'Pemasukan':'Pengeluaran'} per kategori <span class=mu style="font-weight:500">· ${rp(tot)}</span></h3>${rows||'<p class=mu>Belum ada data bulan ini.</p>'}</div>`};
const exportCsv=()=>{const rows=[['Tanggal','Jenis','Rekening','Kategori','Nominal','Catatan'],...fl().map(t=>[t.date,t.type=='income'?'Pemasukan':'Pengeluaran',acc(t.account_id)?.name,cat(t.category_id)?.name||'',t.amount,t.note||''])];
 const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`mutasi-${month}.csv`;a.click()};
async function delTx(id){const t=S.t.find(x=>x.id==id);if(!confirm(t.group_id?'Hapus transfer ini (kedua sisi)?':'Hapus transaksi ini?'))return;
 const q=sb.from('transactions').delete();const {error}=await(t.group_id?q.eq('group_id',t.group_id):q.eq('id',id));error?toast(error.message):load()}
async function del(tb,id){if(!confirm('Hapus data ini? Transaksi terkait ikut terhapus bila ada.'))return;const {error}=await sb.from(tb).delete().eq('id',id);error?toast(error.message):load()}

/* ---------- FORM ---------- */
function form(title,fields,onOk){
 const m=$('#modal');
 m.innerHTML=`<form class=card onsubmit="return false"><h3>${title}</h3>${fields.map(f=>`<label>${f.l}${f.o?`<select name=${f.k}>${f.o.map(o=>`<option value="${o[0]}" ${o[0]==f.v?'selected':''} ${o[2]?`data-t=${o[2]}`:''}>${esc(o[1])}</option>`).join('')}</select>`
 :`<input name=${f.k} type=${f.t||'text'} value="${esc(f.v??'')}" ${f.r===false?'':'required'} ${f.t=='number'?'step=any min=0':''}>`}</label>`).join('')}
 <div class=row><button type=button class=ghost onclick="closeM()">Batal</button><button class=btn>Simpan</button></div></form>`;
 m.classList.add('on'); const fm=m.querySelector('form'), ty=fm.elements.type, ct=fm.elements.category_id, sub=fm.querySelector('.btn');
 fm.addEventListener('submit',async e=>{e.preventDefault();if(sub.disabled)return;sub.disabled=true;sub.textContent='Menyimpan…';
  try{await Promise.race([onOk(Object.fromEntries(new FormData(fm))),new Promise((_,r)=>setTimeout(()=>r(new Error('Koneksi lambat, coba lagi.')),15000))]);closeM();toast('Tersimpan ✓');await load()}
  catch(x){console.error(x);toast(x.message||'Gagal menyimpan');sub.disabled=false;sub.textContent='Simpan'}});
 if(ty&&ct){const f=()=>{[...ct.options].forEach(o=>o.hidden=o.disabled=!!o.dataset.t&&o.dataset.t!=ty.value);if(ct.selectedOptions[0]?.disabled)ct.value=''};ty.onchange=f;f()}
}
const ins=async(t,r)=>{const {data,error}=await sb.from(t).insert(r).select().single();if(error)throw error;return data};
const upd=async(t,id,r)=>{const {error}=await sb.from(t).update(r).eq('id',id);if(error)throw error};
function needAcc(){if(!S.a.length){toast('Buat rekening dulu.');view='acc';render();return true}}

const fAcc=(a={})=>form(a.id?'Edit Rekening':'Rekening Baru',[{k:'name',l:'Nama rekening',v:a.name},{k:'bank',l:'Bank',v:a.bank,r:false},{k:'number',l:'No. rekening',v:a.number,r:false},{k:'initial_balance',l:'Saldo awal',t:'number',v:a.initial_balance||0}],
 d=>a.id?upd('accounts',a.id,d):ins('accounts',d));
const fCat=(c={})=>form(c.id?'Edit Kategori':'Kategori Baru',[{k:'name',l:'Nama',v:c.name},{k:'type',l:'Jenis',o:[['income','Pemasukan'],['expense','Pengeluaran']],v:c.type}],d=>c.id?upd('categories',c.id,d):ins('categories',d));
const fTx=t=>{if(needAcc())return;t=t&&t.id?t:null;form(t?'Edit Transaksi':'Transaksi Baru',[{k:'type',l:'Jenis',o:[['expense','Pengeluaran'],['income','Pemasukan']],v:t?.type},{k:'account_id',l:'Rekening',o:accOpts(),v:t?.account_id},
 {k:'category_id',l:'Kategori',o:[['','— Tanpa kategori —'],...S.c.map(c=>[c.id,c.name,c.type])],v:t?.category_id},{k:'amount',l:'Nominal (Rp)',t:'number',v:t?.amount},{k:'date',l:'Tanggal',t:'date',v:t?.date||today()},{k:'note',l:'Catatan',r:false,v:t?.note}],
 async d=>{d.category_id=nn(d.category_id);if(t)return upd('transactions',t.id,d);await ins('transactions',d);
  const b=d.type=='expense'&&bud(d.category_id);if(b&&d.date.startsWith(month)){const p0=spent(d.category_id),p1=p0+Number(d.amount),m=b.amount,nm=cat(d.category_id).name;
   if(p0<m&&p1>=m)setTimeout(()=>toast(`⚠️ Budget ${nm} terlampaui!`),400);else if(p0<m*.8&&p1>=m*.8)setTimeout(()=>toast(`Budget ${nm} sudah ${Math.round(p1/m*100)}%`),400)}})};
const fTransfer=()=>{if(S.a.length<2){toast('Butuh minimal 2 rekening.');return}
 form('Transfer Antar Rekening',[{k:'from',l:'Dari rekening',o:accOpts()},{k:'to',l:'Ke rekening',o:accOpts(),v:S.a[1].id},{k:'amount',l:'Nominal (Rp)',t:'number'},{k:'date',l:'Tanggal',t:'date',v:today()},{k:'note',l:'Catatan',r:false}],
 async d=>{if(d.from==d.to)throw new Error('Rekening asal dan tujuan harus berbeda');const b={kind:'transfer',amount:d.amount,date:d.date,group_id:crypto.randomUUID()};
  const {error}=await sb.from('transactions').insert([{...b,account_id:d.from,type:'expense',note:d.note||'Transfer ke '+acc(d.to).name},{...b,account_id:d.to,type:'income',note:d.note||'Transfer dari '+acc(d.from).name}]);if(error)throw error})};
const fBudget=c=>{const b=bud(c.id);form('Budget bulanan: '+esc(c.name),[{k:'amount',l:'Batas per bulan (Rp) — isi 0 untuk hapus',t:'number',v:b?.amount||0}],
 async d=>{if(!(d.amount>0)){if(b){const {error}=await sb.from('budgets').delete().eq('id',b.id);if(error)throw error}return}
  const {error}=await sb.from('budgets').upsert({category_id:c.id,amount:d.amount},{onConflict:'category_id'});if(error)throw error})};
const fDebt=()=>{if(needAcc())return;form('Hutang / Piutang Baru',[{k:'kind',l:'Jenis',o:[['hutang','Hutang (saya berhutang)'],['piutang','Piutang (orang berhutang ke saya)']]},{k:'person',l:'Nama orang'},{k:'amount',l:'Nominal (Rp)',t:'number'},{k:'date',l:'Tanggal',t:'date',v:today()},
 {k:'account_id',l:'Catat ke rekening',o:[['','Tidak dicatat ke rekening'],...accOpts()]},{k:'note',l:'Catatan',r:false}],
 async d=>{const {account_id,...r}=d;const debt=await ins('debts',r);
  if(account_id)await ins('transactions',{account_id,debt_id:debt.id,kind:'debt',type:d.kind=='hutang'?'income':'expense',amount:d.amount,date:d.date,note:(d.kind=='hutang'?'Hutang dari ':'Pinjamkan ke ')+d.person})});const sl=$('#modal form').elements.kind,c=()=>{const h=sl.value=='hutang';sl.style.color=h?'var(--ex)':'var(--in)';sl.style.background=h?'var(--exs)':'var(--ins)';sl.style.fontWeight=700};sl.onchange=c;c()};
const fPay=id=>{const d=S.d.find(x=>x.id==id),sisa=d.amount-paid(d),h=d.kind=='hutang';
 form(`${h?'Bayar hutang ke':'Terima pembayaran dari'} ${esc(d.person)}`,[{k:'account_id',l:h?'Dibayar dari rekening':'Masuk ke rekening',o:accOpts()},{k:'amount',l:h?'Jumlah bayar (Rp)':'Jumlah diterima (Rp)',t:'number'},{k:'date',l:'Tanggal',t:'date',v:today()}],
 async x=>{const a=Number(x.amount);if(!(a>0))throw new Error('Nominal harus lebih dari 0');if(a>sisa)throw new Error('Melebihi sisa '+rp(sisa));
  await ins('transactions',{...x,debt_id:id,kind:'payment',type:h?'expense':'income',note:(h?'Bayar hutang ke ':'Piutang dari ')+d.person})});
 const fm=$('#modal form'),am=fm.elements.amount,line=(a,b,c='')=>`<div style="display:flex;justify-content:space-between;padding:2px 0"><span class=mu>${a}</span><b class="${c}">${b}</b></div>`;
 fm.querySelector('h3').insertAdjacentHTML('afterend',`<div style="background:var(--bg);border-radius:14px;padding:12px 14px;margin-bottom:14px">${line('Total',rp(d.amount))}${line('Sudah dibayar',rp(d.amount-sisa))}${line('Sisa '+(h?'hutang':'piutang'),rp(sisa),h?'ex':'in')}</div>`);
 am.insertAdjacentHTML('afterend','<div id=pv style="margin-top:8px;font-size:13px"></div>');
 const pv=()=>{const r=sisa-(Number(am.value)||0);$('#pv').innerHTML=(r<0?'<span class=ex>Melebihi sisa</span>':`Sisa setelah ${h?'bayar':'diterima'}: <b>${rp(r)}</b>${r==0?' · Lunas ✓':''}`)+` <a href=# id=full style="color:var(--pr);margin-left:6px">Penuh</a>`;
  $('#full').onclick=e=>{e.preventDefault();am.value=sisa;pv()}};
 am.max=sisa;am.oninput=pv;pv()};

/* ---------- VIEWS ---------- */
const norm=s=>String(s??'').toLowerCase().replace(/\s+/g,' ').trim();
const ymd=(y,m,d)=>{const t=new Date(Date.UTC(+y,m-1,+d));return t.getUTCMonth()==m-1&&t.getUTCDate()==+d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null};
const pdate=v=>{v=String(v).trim();let m=v.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);if(m)return ymd(m[1],+m[2],+m[3]);m=v.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);return m?ymd(m[3],+m[2],+m[1]):null};
const num=v=>{let x=String(v).replace(/[^\d.,-]/g,'');if(!x)return NaN;const d=x.lastIndexOf('.'),c=x.lastIndexOf(',');
 if(d>=0&&c>=0){const dec=d>c?'.':',';x=x.split(dec=='.'?',':'.').join('').replace(dec,'.')}
 else if(d>=0||c>=0){const p=x.split(d>=0?'.':',');x=p.length>2||p[1].length==3?p.join(''):p.join('.')}
 return Number(x)};
const ptype=v=>{v=norm(v);return ['pemasukan','income','masuk','in'].includes(v)?'income':['pengeluaran','expense','keluar','out'].includes(v)?'expense':null};
const dlCsv=(rows,name)=>{const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name;a.click()};
const parseCsv=t=>{t=t.replace(/^\ufeff/,'');const f=t.split(/\r?\n/)[0],dl=[';','\t',','].map(d=>[d,f.split(d).length]).sort((a,b)=>b[1]-a[1])[0][0];
 const rows=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch=='"'){if(t[i+1]=='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch=='"')q=true;else if(ch==dl){r.push(c);c=''}
  else if(ch=='\n'||ch=='\r'){if(ch=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}
 r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows};
function analyze(rows){
 const H={tanggal:'d',date:'d',jenis:'t',tipe:'t',type:'t',rekening:'a',akun:'a',account:'a',kategori:'c',category:'c',nominal:'n',jumlah:'n',amount:'n',catatan:'o',keterangan:'o',note:'o',notes:'o'},ix={};
 rows[0].forEach((h,i)=>{const k=H[norm(h)];if(k&&!(k in ix))ix[k]=i});
 if(['d','t','a','n'].some(k=>!(k in ix)))return {fatal:'Kolom wajib tidak ditemukan: Tanggal, Jenis, Rekening, Nominal. Cek baris pertama (header).'};
 const am={};S.a.forEach(a=>[a.name,a.number,a.name+' '+a.number,a.name+' · '+a.number,(a.bank||'')+' '+a.number].forEach(k=>{if(norm(k)&&!am[norm(k)])am[norm(k)]=a}));
 const ex=new Set(S.t.filter(t=>t.kind=='normal').map(t=>[t.date,t.type,t.account_id,Number(t.amount),norm(t.note)].join('|')));
 const ok=[],bad=[],nc={};
 rows.slice(1).forEach((r,i)=>{const g=k=>k in ix?String(r[ix[k]]??'').trim():'',line=i+2,e=[];
  const date=pdate(g('d')),type=ptype(g('t')),a=am[norm(g('a'))],amt=Math.abs(num(g('n')));
  if(!date)e.push('tanggal tidak valid');if(!type)e.push('jenis harus Pemasukan/Pengeluaran');if(!a)e.push(`rekening "${g('a')}" tidak ditemukan`);if(!(amt>0))e.push('nominal tidak valid');
  if(e.length){bad.push({line,msg:e.join(', ')});return}
  const cn=g('c'),note=g('o');let cid=null;
  if(cn){const c=S.c.find(c=>c.type==type&&norm(c.name)==norm(cn));if(c)cid=c.id;else nc[type+'|'+norm(cn)]={name:cn,type}}
  ok.push({line,date,type,account_id:a.id,an:a.name,cn,amount:amt,note,cid,dup:ex.has([date,type,a.id,amt,norm(note)].join('|'))})});
 return {ok,bad,nc:Object.values(nc)}}
function fImport(){
 const m=$('#modal');let P=null,skip=true;
 m.innerHTML=`<div class=card style="width:100%;max-width:680px;max-height:88vh;overflow:auto"><h3>Import transaksi dari CSV</h3>
 <p class=mu style="margin-top:-6px">Kolom: <b>Tanggal, Jenis, Rekening, Kategori, Nominal, Catatan</b>. Dari Excel: Save As → <b>CSV UTF-8</b>.</p>
 <div class=row style="justify-content:flex-start;margin-bottom:12px"><button class=ghost id=tpl>⬇ Unduh template</button></div>
 <input type=file id=imf accept=".csv,text/csv"><div id=imp style="margin-top:14px"></div>
 <div class=row style="margin-top:16px"><button class=ghost onclick="closeM()">Tutup</button><button class=btn id=imgo style="display:none"></button></div></div>`;
 m.classList.add('on');
 $('#tpl').onclick=()=>{const an=S.a[0]?.name||'BCA',ci=S.c.find(c=>c.type=='income')?.name||'Gaji',ce=S.c.find(c=>c.type=='expense')?.name||'Makan & Minum';
  dlCsv([['Tanggal','Jenis','Rekening','Kategori','Nominal','Catatan'],['2025-01-25','Pemasukan',an,ci,15000000,'Gaji Januari'],['2025-01-26','Pengeluaran',an,ce,35000,'Warteg'],['2025-01-27','Pengeluaran',an,'Transport',20000,'Ojek, ke kantor']],'template-import.csv')};
 const run=async(use,ncs)=>{const go=$('#imgo');go.disabled=true;let n=0;
  try{const cm={};
   if(ncs.length){const {data,error}=await sb.from('categories').insert(ncs.map(c=>({name:c.name,type:c.type}))).select();if(error)throw error;data.forEach(c=>cm[c.type+'|'+norm(c.name)]=c.id)}
   const rows=use.map(r=>({account_id:r.account_id,category_id:r.cid||(r.cn?cm[r.type+'|'+norm(r.cn)]:null)||null,type:r.type,kind:'normal',amount:r.amount,date:r.date,note:r.note||null}));
   for(let i=0;i<rows.length;i+=500){go.textContent=`Mengimpor ${Math.min(i+500,rows.length)}/${rows.length}…`;const {error}=await sb.from('transactions').insert(rows.slice(i,i+500));if(error)throw error;n=Math.min(i+500,rows.length)}
   closeM();toast(`${n} transaksi diimpor ✓`)}
  catch(x){console.error(x);toast(`Gagal setelah ${n} baris: ${x.message}`);$('#imf').value='';$('#imp').innerHTML='<p class=mu>Pilih ulang file untuk melanjutkan (duplikat otomatis dilewati).</p>';go.style.display='none'}
  await load()};
 const show=()=>{if(P.fatal){$('#imp').innerHTML=`<div class="al over">${esc(P.fatal)}</div>`;$('#imgo').style.display='none';return}
  const use=P.ok.filter(r=>!(skip&&r.dup)),dups=P.ok.filter(r=>r.dup).length,inc=sum(use.filter(r=>r.type=='income')),exp=sum(use.filter(r=>r.type=='expense'));
  const ncs=P.nc.filter(c=>use.some(r=>r.type==c.type&&norm(r.cn)==norm(c.name)));
  $('#imp').innerHTML=`<div class=grid style="grid-template-columns:repeat(3,1fr);margin:0 0 12px"><div><div class=k>Siap diimpor</div><div class=v style="font-size:20px">${use.length}</div></div><div><div class=k>Pemasukan</div><div class="v in" style="font-size:16px">${rp(inc)}</div></div><div><div class=k>Pengeluaran</div><div class="v ex" style="font-size:16px">${rp(exp)}</div></div></div>
  ${dups?`<label style="display:flex;gap:8px;align-items:center;color:var(--tx)"><input type=checkbox id=skd ${skip?'checked':''} style="width:auto;margin:0"> Lewati ${dups} baris yang kemungkinan sudah ada (duplikat)</label>`:''}
  ${ncs.length?`<p class=mu>Kategori baru akan dibuat: <b>${ncs.map(c=>esc(c.name)).join(', ')}</b></p>`:''}
  ${P.bad.length?`<div class="al over" style="display:block"><b>${P.bad.length} baris dilewati karena error:</b><br>${P.bad.slice(0,8).map(b=>`Baris ${b.line}: ${esc(b.msg)}`).join('<br>')}${P.bad.length>8?'<br>…':''}</div>`:''}
  <table>${use.slice(0,5).map(r=>`<tr><td>${r.date}</td><td>${esc(r.an)} · ${esc(r.cn||'-')}</td><td class="${r.type=='income'?'in':'ex'}">${rp(r.amount)}</td></tr>`).join('')}</table>${use.length>5?`<div class=mu style="font-size:12px">…dan ${use.length-5} baris lainnya</div>`:''}`;
  const sk=$('#skd');if(sk)sk.onchange=()=>{skip=sk.checked;show()};
  const go=$('#imgo');go.style.display=use.length?'':'none';go.textContent=`Import ${use.length} transaksi`;go.disabled=false;go.onclick=()=>run(use,ncs)};
 $('#imf').onchange=async e=>{const f=e.target.files[0];if(!f)return;skip=true;const buf=await f.arrayBuffer();let t;
  try{t=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch{t=new TextDecoder('windows-1252').decode(buf)}
  const rows=parseCsv(t);P=rows.length<2?{fatal:'File kosong atau hanya berisi header.'}:rows.length>5001?{fatal:'Maksimal 5.000 baris per file.'}:analyze(rows);show()}}

const togSB=()=>{SB=!SB;render()};
const fProfile=()=>form('Edit Profil',[{k:'full_name',l:'Nama lengkap',v:U?.user_metadata?.full_name,r:false},{k:'password',l:'Password baru (kosongkan jika tidak diubah)',t:'password',r:false}],
 async d=>{if(d.password&&d.password.length<6)throw new Error('Password minimal 6 karakter');const p={data:{full_name:d.full_name.trim()}};if(d.password)p.password=d.password;
  const {data,error}=await sb.auth.updateUser(p);if(error)throw error;U=data.user});
const hd=()=>{const nm=U?.user_metadata?.full_name||'',em=U?.email||'',ini=(nm||em)[0]?.toUpperCase()||'?';
 return `<header class=hd><button class=ib onclick="togSB()" aria-label="Menu">☰</button><div class=sp></div><div class=prof><button class=pb onclick="this.nextElementSibling.classList.toggle('on')"><span class=av>${esc(ini)}</span><span class=pn>${esc(nm||em)}</span><span class=mu>▾</span></button>
 <div class=menu><div class=mh><b>${esc(nm||'Pengguna')}</b><div class=mu style="font-size:12px;word-break:break-all">${esc(em)}</div></div><button onclick="fProfile()">✎ Edit profil</button><button class=lo onclick="sb.auth.signOut()">⎋ Keluar</button></div></div></header>`};
const nav=[['dash','Dashboard'],['tx','Transaksi'],['debt','Hutang Piutang'],['acc','Rekening'],['cat','Kategori']];
const title={dash:'Dashboard',tx:'Mutasi Transaksi',debt:'Hutang Piutang',acc:'Rekening',cat:'Kategori'};
const mt=()=>S.t.filter(t=>t.date.startsWith(month));
function txRows(list){return list.length?list.map(t=>`<tr><td style="width:46px"><span class="ic ${t.type}">${t.type=='income'?'↓':'↑'}</span></td><td>${esc(t.note||cat(t.category_id)?.name||'-')}<div class=mu style="font-size:12px">${esc(cat(t.category_id)?.name||(t.kind=='normal'?'Tanpa kategori':t.kind=='transfer'?'Transfer':'Hutang/Piutang'))} · ${esc(acc(t.account_id)?.name||'')} · ${t.date}</div></td>
 <td class="${t.type=='income'?'in':'ex'}" style="font-weight:700;text-align:right;white-space:nowrap">${t.type=='income'?'+':'−'}${rp(t.amount)}</td><td style="white-space:nowrap">${t.kind=='transfer'?'':`<button class=x onclick="fTx(S.t.find(x=>x.id=='${t.id}'))">Edit</button>`}<button class=x onclick="delTx('${t.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan=4 class=mu style="text-align:center;padding:28px">Belum ada transaksi.</td></tr>`}
function render(){
 charts.forEach(c=>c.destroy());charts=[];
 const m=mt(), N=m.filter(t=>t.kind=='normal'), inc=sum(N.filter(t=>t.type=='income')), exp=sum(N.filter(t=>t.type=='expense'));
 let body='',act='';
 if(view=='dash'){
  const hut=S.d.filter(d=>d.kind=='hutang').reduce((s,d)=>s+d.amount-paid(d),0), pi=S.d.filter(d=>d.kind=='piutang').reduce((s,d)=>s+d.amount-paid(d),0);
  body=alerts().map(a=>`<div class="al ${a.p>=1?'over':''}">${a.p>=1?'⚠️ Budget':'🔔 Budget'} ${esc(a.c.name)} ${a.p>=1?'terlampaui':'hampir habis'} — ${rp(a.s)} dari ${rp(a.b.amount)} (${Math.round(a.p*100)}%)</div>`).join('')+`<div class=grid><div class="card hero"><div class=k>Total saldo</div><div class=v>${rp(S.a.reduce((s,a)=>s+bal(a),0))}</div></div>
  <div class=card><div class=k>Pemasukan bulan ini</div><div class="v in">${rp(inc)}</div></div><div class=card><div class=k>Pengeluaran bulan ini</div><div class="v ex">${rp(exp)}</div></div>
  <div class=card><div class=k>Hutang · Piutang</div><div class=v style="font-size:17px"><span class=ex>${rp(hut)}</span> · <span class=in>${rp(pi)}</span></div></div></div>
  <div class=two><div class=card><h3>Pengeluaran per kategori</h3><canvas id=c1 height=220></canvas></div><div class=card><h3>6 bulan terakhir</h3><canvas id=c2 height=220></canvas></div></div>
  <div class=grid style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin:16px 0">${brk(N,'expense')}${brk(N,'income')}</div><div class=card><h3>Mutasi terbaru</h3><table>${txRows(S.t.slice(0,6))}</table></div>`;
 }
 if(view=='tx'){act=`<button class=ghost onclick=fTransfer()>⇄ Transfer</button><button class=ghost onclick=fImport()>⬆ Import</button><button class=ghost onclick=exportCsv()>⬇ CSV</button><button class=btn onclick=fTx()>+ Transaksi</button>`;
  const re="F.p=0;$('#txl').innerHTML=txTable()";
  body=(F.cat?`<div class=al style="background:var(--prs);color:var(--pr)">Kategori: ${esc(F.cat=='_'?'Tanpa kategori':cat(F.cat)?.name||'')} <button class=x onclick="F.cat='';render()">✕ hapus filter</button></div>`:'')+`<div class=fl><input placeholder="Cari catatan, kategori, rekening…" value="${esc(F.q)}" oninput="F.q=this.value;${re}"><select onchange="F.acc=this.value;${re}"><option value="">Semua rekening</option>${S.a.map(a=>`<option value="${a.id}" ${F.acc==a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select>
  <select onchange="F.type=this.value;${re}"><option value="">Semua jenis</option><option value=income ${F.type=='income'?'selected':''}>Pemasukan</option><option value=expense ${F.type=='expense'?'selected':''}>Pengeluaran</option></select><select onchange="F.all=+this.value;${re}"><option value=0>Bulan terpilih</option><option value=1 ${F.all?'selected':''}>Semua waktu</option></select></div><div class=card id=txl>${txTable()}</div>`}
 if(view=='acc'){act=`<button class=btn onclick=fAcc()>+ Rekening</button>`;
  body=`<div class=grid>${S.a.map(a=>`<div class=card><div class=row style="justify-content:space-between"><b>${esc(a.name)}</b><span><button class=x onclick="fAcc(S.a.find(x=>x.id=='${a.id}'))">Edit</button><button class=x onclick="del('accounts','${a.id}')">✕</button></span></div>
  <div class=mu>${esc(a.bank||'')} ${esc(a.number||'')}</div><div class=v>${rp(bal(a))}</div></div>`).join('')||'<p class=mu>Belum ada rekening.</p>'}</div>`}
 if(view=='cat'){act=`<button class=btn onclick=fCat()>+ Kategori</button>`;
  body=`<div class=grid>${[['income','Pemasukan','in'],['expense','Pengeluaran','ex']].map(([ty,l,cl])=>`<div class=card><h3 class=${cl}>${l}</h3><table>${S.c.filter(c=>c.type==ty).map(c=>`<tr><td>${esc(c.name)}${ty=='expense'?budCell(c):''}</td><td style="white-space:nowrap">${ty=='expense'?`<button class=x onclick="fBudget(S.c.find(x=>x.id=='${c.id}'))">Budget</button>`:''}<button class=x onclick="fCat(S.c.find(x=>x.id=='${c.id}'))">Edit</button><button class=x onclick="del('categories','${c.id}')">✕</button></td></tr>`).join('')}</table></div>`).join('')}</div>`}
 if(view=='debt'){act=`<button class=btn onclick=fDebt()>+ Hutang / Piutang</button>`;
  body=`<div class=fl style="grid-template-columns:2fr 1fr"><input placeholder="Cari nama / catatan…" value="${esc(D.q)}" onchange="D.q=this.value;render()"><select onchange="D.s=this.value;render()"><option value=aktif ${D.s=='aktif'?'selected':''}>Belum lunas</option><option value=lunas ${D.s=='lunas'?'selected':''}>Lunas</option><option value=all ${D.s=='all'?'selected':''}>Semua</option></select></div><div class=grid>${dl().map(d=>{const p=paid(d),r=d.amount-p;return `<div class=card><div class=row style="justify-content:space-between"><span class="pill ${d.kind=='hutang'?'h':'p'}">${d.kind=='hutang'?'Hutang':'Piutang'}</span><button class=x onclick="del('debts','${d.id}')">✕</button></div>
  <h3 style="margin:10px 0 2px">${esc(d.person)}</h3><div class=mu>${d.date} ${esc(d.note||'')}</div><div class="v ${d.kind=='hutang'?'ex':'in'}">${rp(r)}</div><div class=mu>dari ${rp(d.amount)} · dibayar ${rp(p)}</div>
  <div class=bar><i style="width:${p/d.amount*100}%;background:${d.kind=='hutang'?'var(--ex)':'var(--in)'}"></i></div><div class=row style="margin-top:12px">${r>0?`<button class=ghost onclick="fPay('${d.id}')">${d.kind=='hutang'?'Bayar':'Terima'}</button>`:'<span class=in>Lunas ✓</span>'}</div></div>`}).join('')||'<p class=mu>Tidak ada hutang piutang.</p>'}</div>`}
 $('#root').innerHTML=`<div class="app ${SB?'open':'collapsed'}"><aside><div class=logo>Fin<i>Track</i></div>${nav.map(n=>`<a class="${view==n[0]?'on':''}" onclick="view='${n[0]}';if(innerWidth<=800)SB=false;render()">${n[1]}</a>`).join('')}</aside><div class=ov onclick="togSB()"></div><div class=shell>${hd()}<main><div class=top><h1>${title[view]}</h1><div class=row>${view=='dash'||view=='tx'?`<input type=month value="${month}" onchange="month=this.value||month;render()" style="width:auto;margin:0">`:''}${act}</div></div>${body}</main></div></div>`;
 if(view=='dash')drawCharts(N);
}
function drawCharts(N){
 const css=getComputedStyle(document.body), mu=css.getPropertyValue('--mu'), bd=css.getPropertyValue('--bd');
 const by={};N.filter(t=>t.type=='expense').forEach(t=>{const n=cat(t.category_id)?.name||'Lainnya';by[n]=(by[n]||0)+Number(t.amount)});
 charts.push(new Chart($('#c1'),{type:'doughnut',data:{labels:Object.keys(by),datasets:[{data:Object.values(by),backgroundColor:cats,borderWidth:0}]},options:{cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:mu}}}}}));
 const ms=[...Array(6)].map((_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-5+i);return d.toISOString().slice(0,7)});
 const tot=ty=>ms.map(k=>sum(S.t.filter(t=>t.kind=='normal'&&t.type==ty&&t.date.startsWith(k))));
 charts.push(new Chart($('#c2'),{type:'bar',data:{labels:ms,datasets:[{label:'Pemasukan',data:tot('income'),backgroundColor:'#10b981',borderRadius:8,borderSkipped:false},{label:'Pengeluaran',data:tot('expense'),backgroundColor:'#f43f5e',borderRadius:8,borderSkipped:false}]},
  options:{scales:{x:{ticks:{color:mu},grid:{display:false}},y:{ticks:{color:mu},grid:{color:bd}}},plugins:{legend:{labels:{color:mu}}}}}));
}
