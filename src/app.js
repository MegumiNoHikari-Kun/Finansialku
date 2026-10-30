/* __SB_URL__ / __SB_KEY__ diisi saat build dari environment variable Vercel */
let REC=/type=recovery/.test(location.hash); // dibaca sebelum Supabase menghapus hash URL
const sb=supabase.createClient(__SB_URL__,__SB_KEY__);
const $=s=>document.querySelector(s), rp=n=>'Rp '+Math.round(Number(n||0)).toLocaleString('id-ID');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nn=v=>v===''||v==null?null:v, TZ='Asia/Jakarta', today=()=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`};
const sum=a=>a.reduce((s,x)=>s+Number(x.amount),0), cats=['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#ec4899','#84cc16'];
let SB=innerWidth>800,U=null,S={a:[],c:[],t:[],d:[],b:[],g:[],gs:[],gl:[],gr:[],gb:[],gbr:[]},F={q:'',acc:'',type:'',cat:'',p:0,all:0},D={q:'',s:'aktif'}, view='dash', month=today().slice(0,7), charts=[];
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',3000)};
const closeM=()=>$('#modal').classList.remove('on');

/* ---------- AUTH ---------- */
function authView(mode='in'){
 const t={in:['Masuk','Belum punya akun? ','Daftar','up'],up:['Daftar','Sudah punya akun? ','Masuk','in'],fp:['Kirim link reset','Ingat password? ','Masuk','in']}[mode];
 $('#root').innerHTML=`<div id=auth><div class=logo style="font-size:26px">Fin<i>Track</i></div><p class=mu>${mode=='fp'?'Masukkan email, kami kirim link untuk membuat password baru.':'Catatan keuangan pribadi yang rapi.'}</p>
 <form class=card id=af><label>Email<input name=email type=email required></label>${mode=='fp'?'':'<label>Password<input name=password type=password minlength=6 required></label>'}
 ${mode=='in'?'<div style="text-align:right;margin:-6px 0 14px"><a href=# id=fp style="color:var(--pr);font-size:12px;font-weight:600">Lupa password?</a></div>':''}
 <button class=btn style="width:100%">${t[0]}</button><p class=mu style="text-align:center;margin:14px 0 0">${t[1]}<a href=# id=sw style="color:var(--pr)">${t[2]}</a></p></form></div>`;
 $('#sw').onclick=e=>{e.preventDefault();authView(t[3])};
 if($('#fp'))$('#fp').onclick=e=>{e.preventDefault();authView('fp')};
 $('#af').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target)),b=e.submitter;if(b)b.disabled=true;
  try{if(mode=='fp'){const {error}=await sb.auth.resetPasswordForEmail(d.email,{redirectTo:location.origin});if(error)throw error;toast('Jika email terdaftar, link reset sudah dikirim.');authView('in');return}
   const {error,data}=mode=='up'?await sb.auth.signUp(d):await sb.auth.signInWithPassword(d);if(error)throw error;if(mode=='up'&&!data.session)toast('Cek email untuk konfirmasi.')}
  catch(x){toast(x.message)}if(b)b.disabled=false}
}
function recView(){
 $('#root').innerHTML=`<div id=auth><div class=logo style="font-size:26px">Fin<i>Track</i></div><p class=mu>Buat password baru untuk akunmu.</p>
 <form class=card id=rf><label>Password baru<input name=p1 type=password minlength=6 required></label><label>Ulangi password<input name=p2 type=password minlength=6 required></label><button class=btn style="width:100%">Simpan password</button></form></div>`;
 $('#rf').onsubmit=async e=>{e.preventDefault();const {p1,p2}=Object.fromEntries(new FormData(e.target));if(p1!==p2)return toast('Password tidak sama');
  const {error}=await sb.auth.updateUser({password:p1});if(error)return toast(error.message);
  REC=false;history.replaceState(null,'',location.pathname);toast('Password diperbarui ✓');uid=U.id;load()}
}
let uid=null;
sb.auth.onAuthStateChange((ev,s)=>setTimeout(()=>{if(ev=='PASSWORD_RECOVERY')REC=true;if(!s){uid=null;authView();return}U=s.user;if(REC){recView();return}if(s.user.id!==uid){uid=s.user.id;load()}},0));
addEventListener('click',e=>{if(!e.target.closest('.prof'))document.querySelectorAll('.menu.on').forEach(m=>m.classList.remove('on'))});
addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(e.reason?.message||'Terjadi kesalahan')});

/* ---------- DATA ---------- */
async function load(){
 const all=async(t,o,asc)=>{let r=[],i=0;for(;;){const {data,error}=await sb.from(t).select('*').order(o,{ascending:asc}).order('id').range(i,i+999);if(error)return{error};r=r.concat(data);if(data.length<1000)break;i+=1000}return{data:r}};
 const q=(t,o)=>all(t,o,t!='transactions'&&t!='debts');
 const [a,c,t,d,b,g,gs,gl,gr,gb,gbr]=await Promise.all([q('accounts','created_at'),q('categories','name'),q('transactions','date'),q('debts','date'),q('budgets','created_at'),q('gold_lots','buy_date'),q('gold_sales','sell_date'),q('gold_loans','loan_date'),q('gold_loan_returns','return_date'),q('gold_borrows','borrow_date'),q('gold_borrow_returns','return_date')]);
 const err=[a,c,t,d,b,g,gs,gl,gr,gb,gbr].find(r=>r.error); if(err)toast(err.error.message);
 S={a:a.data||[],c:c.data||[],t:t.data||[],d:d.data||[],b:b.data||[],g:g.data||[],gs:gs.data||[],gl:gl.data||[],gr:gr.data||[],gb:gb.data||[],gbr:gbr.data||[]}; try{render()}catch(e){console.error(e);toast('Gagal menampilkan: '+e.message)}
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
/* ringkasan di atas tabel Transaksi: saldo rekening + total pemasukan/pengeluaran sesuai filter (transfer antar rekening tidak dihitung) */
const txSum=()=>{const l=fl().filter(t=>t.kind!='transfer'),
 ex=sum(l.filter(t=>t.type=='expense')),inc=sum(l.filter(t=>t.type=='income')),
 a=F.acc&&acc(F.acc),sal=a?bal(a):S.a.reduce((s,x)=>s+bal(x),0);
 const c='style="min-width:0;padding:clamp(10px,2.5vw,16px)"',v='style="font-size:clamp(12px,3.4vw,20px);word-break:break-word"';
 return `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(8px,2vw,14px);margin:0 0 16px">
 <div class=card ${c}><div class=k>Saldo ${a?esc(a.name):'semua rekening'}</div><div class=v ${v}>${rp(sal)}</div></div>
 <div class=card ${c}><div class=k>Total pemasukan</div><div class="v in" ${v}>${rp(inc)}</div></div>
 <div class=card ${c}><div class=k>Total pengeluaran</div><div class="v ex" ${v}>${rp(ex)}</div></div></div>`};
const txTable=()=>{const l=fl(),n=l.length,pg=F.p=Math.min(F.p,Math.max(0,Math.ceil(n/PS)-1));
 return txSum()+`<table>${txRows(l.slice(pg*PS,pg*PS+PS))}</table>`+(n>PS?`<div class=row style="justify-content:space-between;margin-top:14px"><span class=mu>${pg*PS+1}–${Math.min(n,pg*PS+PS)} dari ${n}</span><span><button class=ghost ${pg?'':'disabled'} onclick="F.p--;$('#txl').innerHTML=txTable()">‹ Prev</button> <button class=ghost ${(pg+1)*PS<n?'':'disabled'} onclick="F.p++;$('#txl').innerHTML=txTable()">Next ›</button></span></div>`:`<div class=mu style="margin-top:10px;font-size:12px">${n} transaksi</div>`)};
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
async function delTx(id){const t=S.t.find(x=>x.id==id);if(t.gold_lot_id)return delGold('gold_lots',t.gold_lot_id);if(t.gold_sale_id)return delGold('gold_sales',t.gold_sale_id);if(!confirm(t.group_id?'Hapus transfer ini (kedua sisi)?':'Hapus transaksi ini?'))return;
 const q=sb.from('transactions').delete();const {error}=await(t.group_id?q.eq('group_id',t.group_id):q.eq('id',id));error?toast(error.message):load()}
async function del(tb,id){if(!confirm('Hapus data ini? Transaksi terkait ikut terhapus bila ada.'))return;const {error}=await sb.from(tb).delete().eq('id',id);error?toast(error.message):load()}

/* ---------- FORM ---------- */
function form(title,fields,onOk){
 const m=$('#modal');
 m.innerHTML=`<form class=card onsubmit="return false"><h3>${title}</h3><div class=fg>${fields.map(f=>`<label${['date','number'].includes(f.t)?' class=h':''}>${f.l}${f.o?`<select name=${f.k}>${f.o.map(o=>`<option value="${o[0]}" ${o[0]==f.v?'selected':''} ${o[2]?`data-t=${o[2]}`:''}>${esc(o[1])}</option>`).join('')}</select>`
 :`<input name=${f.k} type=${f.t||'text'} value="${esc(f.v??'')}" ${f.r===false?'':'required'} ${f.t=='number'?'step=any min=0':''}>`}</label>`).join('')}</div>
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
 m.innerHTML=`<div class=card style="width:100%;max-width:540px;max-height:82vh;overflow:auto"><h3>Import transaksi dari CSV</h3>
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

const fDebtEdit=d=>{const h=d.kind=='hutang',pr=S.t.find(t=>t.debt_id==d.id&&t.kind=='debt'),p=paid(d);
 form(`Edit ${h?'Hutang':'Piutang'}`,[{k:'person',l:'Nama orang',v:d.person},{k:'amount',l:`Nominal (sudah dibayar ${rp(p)})`,t:'number',v:d.amount},{k:'date',l:'Tanggal',t:'date',v:d.date},
  {k:'account_id',l:'Dicatat di rekening',o:[['','Tidak dicatat ke rekening'],...accOpts()],v:pr?.account_id},{k:'note',l:'Catatan',r:false,v:d.note}],
 async x=>{const a=Number(x.amount);if(!(a>0))throw new Error('Nominal harus lebih dari 0');if(a<p)throw new Error('Nominal tidak boleh kurang dari yang sudah dibayar ('+rp(p)+')');
  await upd('debts',d.id,{person:x.person,amount:a,date:x.date,note:nn(x.note)});
  const nt=(h?'Hutang dari ':'Pinjamkan ke ')+x.person;
  if(pr&&x.account_id)await upd('transactions',pr.id,{account_id:x.account_id,amount:a,date:x.date,note:nt});
  else if(pr){const {error}=await sb.from('transactions').delete().eq('id',pr.id);if(error)throw error}
  else if(x.account_id)await ins('transactions',{account_id:x.account_id,debt_id:d.id,kind:'debt',type:h?'income':'expense',amount:a,date:x.date,note:nt});
  if(x.person!=d.person){const {error}=await sb.from('transactions').update({note:(h?'Bayar hutang ke ':'Piutang dari ')+x.person}).eq('debt_id',d.id).eq('kind','payment');if(error)throw error}})};
const gf=n=>Number(n).toLocaleString('id-ID',{maximumFractionDigits:4})+' g';
const ret=x=>S.gr.filter(r=>r.loan_id==x.id).reduce((s,r)=>s+Number(r.grams),0);
const out=l=>S.gl.filter(x=>x.lot_id==l.id).reduce((s,x)=>s+Number(x.grams)-ret(x),0);
const bret=b=>S.gbr.filter(r=>r.borrow_id==b.id).reduce((s,r)=>s+Number(r.grams),0);
const gave=l=>S.gbr.filter(r=>r.from_lot_id==l.id).reduce((s,r)=>s+Number(r.grams),0);
const owedTotal=()=>S.gb.reduce((s,b)=>s+Number(b.grams)-bret(b),0);
const lentTotal=()=>S.gl.reduce((s,x)=>s+Number(x.grams)-ret(x),0);
const rem=l=>+(Number(l.grams)-S.gs.filter(x=>x.lot_id==l.id).reduce((s,x)=>s+Number(x.grams),0)-out(l)-gave(l)).toFixed(4);
const gprev=(fm,els,fn)=>{const d=document.createElement('div');d.style.cssText='margin:-4px 0 14px;font-size:13px';fm.querySelector('.row').before(d);const u=()=>{d.innerHTML=fn()};els.forEach(e=>{e.addEventListener('input',u);e.addEventListener('change',u)});u()};
async function delGold(tb,id){if(!confirm(tb=='gold_lots'?'Hapus emas ini beserta penjualan dan pinjamannya? Saldo rekening ikut disesuaikan.':tb=='gold_sales'?'Hapus penjualan ini? Saldo rekening ikut disesuaikan.':tb=='gold_loans'?'Hapus catatan pinjaman ini beserta pengembaliannya? Emas kembali ke stok.':'Hapus catatan pengembalian ini?'))return;const {error}=await sb.from(tb).delete().eq('id',id);error?toast(error.message):load()}
const fGoldPrice=()=>form('Harga emas hari ini',[{k:'price',l:'Harga jual (buyback) per gram (Rp)',t:'number',v:U?.user_metadata?.gold_price}],
 async x=>{const {data,error}=await sb.auth.updateUser({data:{gold_price:Number(x.price)}});if(error)throw error;U=data.user});
const fGoldBuy=()=>{if(needAcc())return;form('Beli Emas',[{k:'code',l:'Kode emas (unik, mis. ANTAM-5G-A12345)'},{k:'brand',l:'Merek / keterangan',r:false},{k:'account_id',l:'Dibayar dari rekening',o:accOpts()},{k:'buy_date',l:'Tanggal beli',t:'date',v:today()},{k:'grams',l:'Berat (gram)',t:'number'},{k:'total',l:'Total harga beli (Rp)',t:'number'}],
 async x=>{const g=Number(x.grams),tot=Math.round(Number(x.total)),code=x.code.trim();if(!(g>0&&tot>0))throw new Error('Berat dan total harga harus lebih dari 0');if(S.g.some(l=>norm(l.code)==norm(code)))throw new Error('Kode emas sudah dipakai');
  const lot=await ins('gold_lots',{code,brand:nn(x.brand),buy_date:x.buy_date,grams:g,price_per_gram:Math.round(tot/g*100)/100});
  const {error}=await sb.from('transactions').insert({account_id:x.account_id,kind:'gold',type:'expense',amount:tot,date:x.buy_date,note:`Beli emas ${code} ${gf(g)}`,gold_lot_id:lot.id});
  if(error){await sb.from('gold_lots').delete().eq('id',lot.id);throw error}});
 const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.grams,e.total],()=>{const g=Number(e.grams.value)||0,t=Number(e.total.value)||0;return `Harga beli per gram: <b>${g&&t?rp(t/g):'—'}</b>`})};
const fGoldSell=id=>{const ls=S.g.filter(l=>rem(l)>0);if(!ls.length){toast('Tidak ada emas tersisa untuk dijual.');return}if(needAcc())return;id=typeof id=='string'?id:ls[0].id;
  form('Jual Emas',[{k:'lot_id',l:'Pilih emas (kode)',o:ls.map(l=>[l.id,`${l.code} · sisa ${gf(rem(l))}`]),v:id},{k:'account_id',l:'Masuk ke rekening',o:accOpts()},{k:'sell_date',l:'Tanggal jual',t:'date',v:today()},{k:'grams',l:'Berat dijual (gram)',t:'number'},{k:'total',l:'Total harga jual (Rp)',t:'number'}],
  async x=>{const l=S.g.find(l=>l.id==x.lot_id),g=Number(x.grams),tot=Math.round(Number(x.total));if(!(g>0&&tot>0))throw new Error('Berat dan total harga harus lebih dari 0');if(g>rem(l)+1e-9)throw new Error('Melebihi sisa '+gf(rem(l)));
   const sale=await ins('gold_sales',{lot_id:l.id,sell_date:x.sell_date,grams:g,price_per_gram:Math.round(tot/g*100)/100});
   const {error}=await sb.from('transactions').insert({account_id:x.account_id,kind:'gold',type:'income',amount:tot,date:x.sell_date,note:`Jual emas ${l.code} ${gf(g)}`,gold_sale_id:sale.id});
   if(error){await sb.from('gold_sales').delete().eq('id',sale.id);throw error}});
  const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.lot_id,e.grams,e.total],()=>{const l=S.g.find(l=>l.id==e.lot_id.value),g=Number(e.grams.value)||0,t=Number(e.total.value)||0,d=t-g*l.price_per_gram;
   return `Sisa lot <b>${gf(rem(l))}</b> · harga beli <b>${rp(l.price_per_gram)}</b>/g<br>Harga jual per gram <b>${g&&t?rp(t/g):'—'}</b> · selisih <b class="${d>=0?'in':'ex'}">${d>=0?'+':'−'}${rp(Math.abs(d))}</b>`})};
const GF={q:'',s:'ada',p:0,sq:'',sp:0,lq:'',ls:'open',lp:0},GP=8;
const pl=n=>`<b class="${n>=0?'in':'ex'}">${n>=0?'+':'−'}${rp(Math.abs(n))}</b>`;
const pager=(n,pg,fn)=>n>GP?`<div class=row style="justify-content:space-between;margin-top:12px"><span class=mu>${pg*GP+1}–${Math.min(n,pg*GP+GP)} dari ${n}</span><span><button class=ghost ${pg?'':'disabled'} onclick="${fn}(-1)">‹ Prev</button> <button class=ghost ${(pg+1)*GP<n?'':'disabled'} onclick="${fn}(1)">Next ›</button></span></div>`:`<div class=mu style="margin-top:10px;font-size:12px">${n} data</div>`;
const lotRow=l=>{const r=rem(l);return `<div class=gl style="${r?'':'opacity:.55'}"><div><b>${esc(l.code)}</b>${l.brand?` <span class=mu>· ${esc(l.brand)}</span>`:''}<div class=mu style="font-size:12px">Beli ${l.buy_date} · ${rp(l.price_per_gram)}/g</div></div><div class=gq><b>${gf(r)}</b><div class=mu style="font-size:12px">dari ${gf(l.grams)}${out(l)>0?` · dipinjam ${gf(out(l))}`:''}${gave(l)>0?` · diserahkan ${gf(gave(l))}`:''}</div></div><div class=ga>${r?`<button class=ghost style="padding:6px 12px" onclick="fGoldSell('${l.id}')">Jual</button>`:`<span class=pill>${out(l)>0?'Dipinjam':'Habis'}</span>`}<button class=x onclick="fGoldEdit(S.g.find(x=>x.id=='${l.id}'))">Edit</button><button class=x onclick="delGold('gold_lots','${l.id}')">✕</button></div></div>`};
const saleRow=x=>{const l=S.g.find(l=>l.id==x.lot_id);return `<div class=gl><div><b>${esc(l?.code||'-')}</b><div class=mu style="font-size:12px">${x.sell_date} · ${gf(x.grams)} @ ${rp(x.price_per_gram)}</div></div><div class=gq>${pl(x.grams*(x.price_per_gram-(l?.price_per_gram||0)))}<div class=mu style="font-size:12px">untung/rugi</div></div><div class=ga><button class=x onclick="fGoldSaleEdit(S.gs.find(z=>z.id=='${x.id}'))">Edit</button><button class=x onclick="delGold('gold_sales','${x.id}')">✕</button></div></div>`};
const lotList=()=>{const q=norm(GF.q),a=[...S.g].sort((a,b)=>b.buy_date.localeCompare(a.buy_date)).filter(l=>(GF.s=='all'||(GF.s=='ada')==(rem(l)>0||out(l)>0))&&(!q||norm(l.code+' '+(l.brand||'')).includes(q))),pg=GF.p=Math.min(GF.p,Math.max(0,Math.ceil(a.length/GP)-1));
 return (a.slice(pg*GP,pg*GP+GP).map(lotRow).join('')||'<p class=mu style="text-align:center;padding:24px 0">Tidak ada emas.</p>')+pager(a.length,pg,'gPg1')};
const saleList=()=>{const q=norm(GF.sq),a=[...S.gs].sort((a,b)=>b.sell_date.localeCompare(a.sell_date)).filter(x=>!q||norm((S.g.find(l=>l.id==x.lot_id)?.code||'')+' '+x.sell_date).includes(q)),pg=GF.sp=Math.min(GF.sp,Math.max(0,Math.ceil(a.length/GP)-1));
 return (a.slice(pg*GP,pg*GP+GP).map(saleRow).join('')||'<p class=mu style="text-align:center;padding:24px 0">Tidak ada penjualan.</p>')+pager(a.length,pg,'gPg2')};
const gPg1=d=>{GF.p+=d;$('#gl1').innerHTML=lotList()};
const gPg2=d=>{GF.sp+=d;$('#gl2').innerHTML=saleList()};
const loanRow=x=>{const l=S.g.find(l=>l.id==x.lot_id),r=+(Number(x.grams)-ret(x)).toFixed(4),rs=S.gr.filter(z=>z.loan_id==x.id).sort((a,b)=>b.return_date.localeCompare(a.return_date));
 return `<div class=gl style="${r>0?'':'opacity:.6'};align-items:start"><div><b>${esc(x.person)}</b> <span class=mu>· ${esc(l?.code||'-')}</span><div class=mu style="font-size:12px">${x.loan_date} · pinjam ${gf(x.grams)}${x.note?' · '+esc(x.note):''}</div>
 <div class=bar style="max-width:240px;margin-top:8px"><i style="width:${Math.min(100,(x.grams-r)/x.grams*100)}%;background:var(--in)"></i></div>
 ${rs.map(z=>`<div class=mu style="font-size:12px;margin-top:4px">↩ ${z.return_date} · ${gf(z.grams)} <button class=x style="padding:0 6px" onclick="delGold('gold_loan_returns','${z.id}')">✕</button></div>`).join('')}</div>
 <div class=gq><b>${gf(r)}</b><div class=mu style="font-size:12px">${r>0?'belum kembali':'sudah kembali'}</div></div>
 <div class=ga>${r>0?`<button class=ghost style="padding:6px 12px" onclick="fGoldReturn('${x.id}')">Terima</button>`:'<span class=pill>Lunas</span>'}<button class=x onclick="fGoldLoanEdit(S.gl.find(z=>z.id=='${x.id}'))">Edit</button><button class=x onclick="delGold('gold_loans','${x.id}')">✕</button></div></div>`};
const loanList=()=>{const q=norm(GF.lq),a=[...S.gl].sort((a,b)=>b.loan_date.localeCompare(a.loan_date)).filter(x=>(GF.ls=='all'||Number(x.grams)-ret(x)>1e-9)&&(!q||norm(x.person+' '+(S.g.find(l=>l.id==x.lot_id)?.code||'')).includes(q))),pg=GF.lp=Math.min(GF.lp,Math.max(0,Math.ceil(a.length/GP)-1));
 return (a.slice(pg*GP,pg*GP+GP).map(loanRow).join('')||'<p class=mu style="text-align:center;padding:24px 0">Tidak ada piutang emas.</p>')+pager(a.length,pg,'gPg3')};
const gPg3=d=>{GF.lp+=d;$('#gl3').innerHTML=loanList()};
const fGoldLend=id=>{const ls=S.g.filter(l=>rem(l)>0);if(!ls.length){toast('Tidak ada emas tersisa untuk dipinjamkan.');return}id=typeof id=='string'?id:ls[0].id;
 form('Pinjamkan Emas',[{k:'lot_id',l:'Emas yang dipinjamkan (kode)',o:ls.map(l=>[l.id,`${l.code} · sisa ${gf(rem(l))}`]),v:id},{k:'person',l:'Dipinjam oleh'},{k:'loan_date',l:'Tanggal',t:'date',v:today()},{k:'grams',l:'Berat dipinjamkan (gram)',t:'number'},{k:'note',l:'Catatan',r:false}],
 async x=>{const l=S.g.find(l=>l.id==x.lot_id),g=Number(x.grams);if(!(g>0))throw new Error('Berat harus lebih dari 0');if(g>rem(l)+1e-9)throw new Error('Melebihi sisa '+gf(rem(l)));
  await ins('gold_loans',{lot_id:l.id,person:x.person.trim(),grams:g,loan_date:x.loan_date,note:nn(x.note)})});
 const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.lot_id,e.grams],()=>{const l=S.g.find(l=>l.id==e.lot_id.value),g=Number(e.grams.value)||0;return `Sisa emas ini <b>${gf(rem(l))}</b> → setelah dipinjamkan <b>${gf(rem(l)-g)}</b>. Saldo rekening tidak berubah.`})};
const fGoldReturn=id=>{const x=S.gl.find(z=>z.id==id),l=S.g.find(l=>l.id==x.lot_id),sisa=+(Number(x.grams)-ret(x)).toFixed(4);
 form('Terima Emas dari '+esc(x.person),[{k:'return_date',l:'Tanggal diterima',t:'date',v:today()},{k:'grams',l:`Berat dikembalikan (sisa ${gf(sisa)})`,t:'number'},{k:'note',l:'Catatan',r:false}],
 async d=>{const g=Number(d.grams);if(!(g>0))throw new Error('Berat harus lebih dari 0');if(g>sisa+1e-9)throw new Error('Melebihi sisa '+gf(sisa));await ins('gold_loan_returns',{loan_id:x.id,return_date:d.return_date,grams:g,note:nn(d.note)})});
 const fm=$('#modal form'),e=fm.elements;e.grams.max=sisa;gprev(fm,[e.grams],()=>{const r=sisa-(Number(e.grams.value)||0);return r<0?'<span class=ex>Melebihi sisa</span>':`Sisa belum kembali <b>${gf(r)}</b>${r==0?' · Lunas ✓':''}<br>Emas kembali ke stok <b>${esc(l?.code||'')}</b>`})};
const fGoldLoanEdit=x=>{const l=S.g.find(l=>l.id==x.lot_id),r=ret(x),max=+(rem(l)+Number(x.grams)).toFixed(4);
 form('Edit Pinjaman · '+esc(l.code),[{k:'person',l:'Dipinjam oleh',v:x.person},{k:'loan_date',l:'Tanggal',t:'date',v:x.loan_date},{k:'grams',l:`Berat dipinjamkan (sudah kembali ${gf(r)}, maks ${gf(max)})`,t:'number',v:x.grams},{k:'note',l:'Catatan',r:false,v:x.note}],
 async d=>{const g=Number(d.grams);if(!(g>0))throw new Error('Berat harus lebih dari 0');if(g<r-1e-9)throw new Error('Tidak boleh kurang dari yang sudah dikembalikan ('+gf(r)+')');if(g>max+1e-9)throw new Error('Melebihi sisa '+gf(max));
  await upd('gold_loans',x.id,{person:d.person.trim(),loan_date:d.loan_date,grams:g,note:nn(d.note)})})};
const glCard=x=>{const l=S.g.find(l=>l.id==x.lot_id),r=+(Number(x.grams)-ret(x)).toFixed(4);
 return `<div class=card><div class=row style="justify-content:space-between"><span class="pill p">Piutang emas</span><span><button class=x onclick="fGoldLoanEdit(S.gl.find(z=>z.id=='${x.id}'))">Edit</button><button class=x onclick="delGold('gold_loans','${x.id}')">✕</button></span></div>
 <h3 style="margin:10px 0 2px">${esc(x.person)}</h3><div class=mu>${x.loan_date} · ${esc(l?.code||'-')}${x.note?' · '+esc(x.note):''}</div><div class="v in">${gf(r)}</div><div class=mu>dari ${gf(x.grams)} · kembali ${gf(x.grams-r)}</div>
 <div class=bar><i style="width:${Math.min(100,(x.grams-r)/x.grams*100)}%;background:var(--in)"></i></div><div class=row style="margin-top:12px">${r>0?`<button class=ghost onclick="fGoldReturn('${x.id}')">Terima</button>`:'<span class=in>Lunas ✓</span>'}</div></div>`};
const gbCard=b=>{const l=S.g.find(l=>l.id==b.lot_id),r=+(Number(b.grams)-bret(b)).toFixed(4),rs=S.gbr.filter(z=>z.borrow_id==b.id).sort((a,c)=>c.return_date.localeCompare(a.return_date));
 return `<div class=card><div class=row style="justify-content:space-between"><span class="pill h">Hutang emas</span><span><button class=x onclick="fGoldBorrowEdit(S.gb.find(z=>z.id=='${b.id}'))">Edit</button><button class=x onclick="delBorrow('${b.id}')">✕</button></span></div>
 <h3 style="margin:10px 0 2px">${esc(b.person)}</h3><div class=mu>${b.borrow_date} · ${esc(l?.code||'-')}${b.note?' · '+esc(b.note):''}</div><div class="v ex">${gf(r)}</div><div class=mu>dari ${gf(b.grams)} · dikembalikan ${gf(b.grams-r)}</div>
 <div class=bar><i style="width:${Math.min(100,(b.grams-r)/b.grams*100)}%;background:var(--ex)"></i></div>
 ${rs.map(z=>`<div class=mu style="font-size:12px;margin-top:6px">↩ ${z.return_date} · ${gf(z.grams)} dari ${esc(S.g.find(l=>l.id==z.from_lot_id)?.code||'-')} <button class=x style="padding:0 6px" onclick="delGold('gold_borrow_returns','${z.id}')">✕</button></div>`).join('')}
 <div class=row style="margin-top:12px">${r>0?`<button class=ghost onclick="fGoldPayBack('${b.id}')">Bayar</button>`:'<span class=in>Lunas ✓</span>'}</div></div>`};
async function delBorrow(id){const b=S.gb.find(z=>z.id==id);if(!confirm('Hapus hutang emas ini? Emas pinjaman keluar dari stok beserta riwayat pengembaliannya.'))return;const {error}=await sb.from('gold_lots').delete().eq('id',b.lot_id);error?toast(error.message):load()}
const goldLoanSection=()=>{if(!S.gl.length&&!S.gb.length)return '';const q=norm(D.q),ok=(txt,r)=>(!q||norm(txt).includes(q))&&(D.s=='all'||(D.s=='aktif')==(r>1e-9)),code=id=>S.g.find(l=>l.id==id)?.code||'';
 const a=[...S.gl.filter(x=>ok(x.person+' '+code(x.lot_id)+' '+(x.note||''),Number(x.grams)-ret(x))).map(x=>({d:x.loan_date,h:glCard(x)})),...S.gb.filter(b=>ok(b.person+' '+code(b.lot_id)+' '+(b.note||''),Number(b.grams)-bret(b))).map(b=>({d:b.borrow_date,h:gbCard(b)}))].sort((a,c)=>c.d.localeCompare(a.d));
 return `<h3 style="margin:24px 0 12px">Emas</h3><div class=grid>${a.map(z=>z.h).join('')||'<p class=mu>Tidak ada hutang/piutang emas.</p>'}</div>`};
const fGoldBorrow=()=>{const gp=Number(U?.user_metadata?.gold_price)||'';
 form('Pinjam Emas dari Orang Lain',[{k:'person',l:'Dipinjam dari'},{k:'code',l:'Kode emas pinjaman (unik, jadi stok baru)'},{k:'borrow_date',l:'Tanggal',t:'date',v:today()},{k:'grams',l:'Berat (gram)',t:'number'},{k:'price',l:'Nilai acuan per gram (Rp)',t:'number',v:gp},{k:'note',l:'Catatan',r:false}],
 async x=>{const g=Number(x.grams),p=Number(x.price),code=x.code.trim(),person=x.person.trim();if(!(g>0&&p>0))throw new Error('Berat dan nilai acuan harus lebih dari 0');if(S.g.some(l=>norm(l.code)==norm(code)))throw new Error('Kode emas sudah dipakai');
  const lot=await ins('gold_lots',{code,brand:'Pinjaman dari '+person,buy_date:x.borrow_date,grams:g,price_per_gram:p});
  const {error}=await sb.from('gold_borrows').insert({lot_id:lot.id,person,grams:g,borrow_date:x.borrow_date,note:nn(x.note)});
  if(error){await sb.from('gold_lots').delete().eq('id',lot.id);throw error}});
 const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.grams,e.price],()=>`Masuk ke stok sebagai emas baru, nilai acuan <b>${rp((Number(e.grams.value)||0)*(Number(e.price.value)||0))}</b>. Saldo rekening tidak berubah.`)};
const fGoldPayBack=id=>{const b=S.gb.find(z=>z.id==id),sisa=+(Number(b.grams)-bret(b)).toFixed(4),ls=S.g.filter(l=>rem(l)>0);if(!ls.length){toast('Tidak ada stok emas untuk diserahkan.');return}
 form('Kembalikan Emas ke '+esc(b.person),[{k:'from_lot_id',l:'Emas yang diserahkan (kode)',o:ls.map(l=>[l.id,`${l.code} · sisa ${gf(rem(l))}`]),v:b.lot_id},{k:'return_date',l:'Tanggal',t:'date',v:today()},{k:'grams',l:`Berat dikembalikan (sisa hutang ${gf(sisa)})`,t:'number'},{k:'note',l:'Catatan',r:false}],
 async d=>{const l=S.g.find(l=>l.id==d.from_lot_id),g=Number(d.grams);if(!(g>0))throw new Error('Berat harus lebih dari 0');if(g>sisa+1e-9)throw new Error('Melebihi sisa hutang '+gf(sisa));if(g>rem(l)+1e-9)throw new Error('Melebihi stok '+l.code+' ('+gf(rem(l))+')');
  await ins('gold_borrow_returns',{borrow_id:b.id,from_lot_id:l.id,return_date:d.return_date,grams:g,note:nn(d.note)})});
 const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.from_lot_id,e.grams],()=>{const l=S.g.find(l=>l.id==e.from_lot_id.value),g=Number(e.grams.value)||0,r=sisa-g;return `Sisa hutang <b>${gf(r)}</b>${r==0?' · Lunas ✓':''}<br>Stok ${esc(l.code)} jadi <b>${gf(rem(l)-g)}</b>`})};
const fGoldBorrowEdit=b=>{const l=S.g.find(l=>l.id==b.lot_id),min=+Math.max(bret(b),Number(b.grams)-rem(l)).toFixed(4);
 form('Edit Hutang Emas · '+esc(l.code),[{k:'person',l:'Dipinjam dari',v:b.person},{k:'borrow_date',l:'Tanggal',t:'date',v:b.borrow_date},{k:'grams',l:`Berat (gram) — minimal ${gf(min)}`,t:'number',v:b.grams},{k:'price',l:'Nilai acuan per gram (Rp)',t:'number',v:l.price_per_gram},{k:'note',l:'Catatan',r:false,v:b.note}],
 async d=>{const g=Number(d.grams),p=Number(d.price),person=d.person.trim();if(!(g>0&&p>0))throw new Error('Berat dan nilai acuan harus lebih dari 0');if(g<min-1e-9)throw new Error('Berat tidak boleh kurang dari '+gf(min));
  await upd('gold_lots',l.id,{grams:g,price_per_gram:p,buy_date:d.borrow_date,brand:'Pinjaman dari '+person});await upd('gold_borrows',b.id,{person,grams:g,borrow_date:d.borrow_date,note:nn(d.note)})})};
const goldView=()=>{
 const lots=[...S.g].sort((a,b)=>b.buy_date.localeCompare(a.buy_date)),price=Number(U?.user_metadata?.gold_price)||0,own=lots.filter(l=>rem(l)>0);
 const grams=own.reduce((s,l)=>s+rem(l),0),cost=own.reduce((s,l)=>s+rem(l)*l.price_per_gram,0),val=grams*price;
 const real=S.gs.reduce((s,x)=>s+x.grams*(x.price_per_gram-(S.g.find(l=>l.id==x.lot_id)?.price_per_gram||0)),0);
 const pl=n=>`<b class="${n>=0?'in':'ex'}">${n>=0?'+':'−'}${rp(Math.abs(n))}</b>`;
 const body=`<div class=grid><div class="card hero"><div class=k>Emas dimiliki</div><div class=v>${gf(grams)}</div></div>
 <div class=card><div class=k>Modal (sisa emas)</div><div class=v>${rp(cost)}</div></div>
 <div class=card><div class=k>Nilai sekarang ${price?`@ ${rp(price)}/g`:''}</div><div class=v>${price?rp(val):'—'}</div>${price?`<div>${pl(val-cost)} <span class=mu>belum terealisasi</span></div>`:'<div class=mu>Isi lewat tombol "Harga hari ini"</div>'}</div>
 <div class=card><div class=k>Untung/rugi terealisasi</div><div class=v style="font-size:20px">${pl(real)}</div></div><div class=card><div class=k>Sedang dipinjamkan</div><div class=v style="font-size:20px">${gf(lentTotal())}</div><div class=mu style="font-size:12px">${S.gl.filter(x=>Number(x.grams)-ret(x)>1e-9).length} pinjaman aktif</div></div><div class=card><div class=k>Hutang emas</div><div class="v ex" style="font-size:20px">${gf(owedTotal())}</div><div class=mu style="font-size:12px">${S.gb.filter(b=>Number(b.grams)-bret(b)>1e-9).length} hutang aktif</div></div></div>
  <div class=card style="margin-bottom:16px"><h3>Daftar emas</h3><div class=fl style="grid-template-columns:2fr 1fr"><input placeholder="Cari kode / merek…" value="${esc(GF.q)}" oninput="GF.q=this.value;GF.p=0;$('#gl1').innerHTML=lotList()"><select onchange="GF.s=this.value;GF.p=0;$('#gl1').innerHTML=lotList()"><option value=ada ${GF.s=='ada'?'selected':''}>Masih ada</option><option value=habis ${GF.s=='habis'?'selected':''}>Habis</option><option value=all ${GF.s=='all'?'selected':''}>Semua</option></select></div><div id=gl1>${lotList()}</div></div>
  ${S.gb.length?`<h3 style="margin:8px 0 12px">Hutang emas</h3><div class=grid>${S.gb.filter(b=>Number(b.grams)-bret(b)>1e-9).map(gbCard).join('')||'<p class=mu>Semua hutang emas sudah lunas.</p>'}</div>`:''}
  <div class=card style="margin-bottom:16px"><h3>Piutang emas</h3><div class=fl style="grid-template-columns:2fr 1fr"><input placeholder="Cari nama / kode emas…" value="${esc(GF.lq)}" oninput="GF.lq=this.value;GF.lp=0;$('#gl3').innerHTML=loanList()"><select onchange="GF.ls=this.value;GF.lp=0;$('#gl3').innerHTML=loanList()"><option value=open ${GF.ls=='open'?'selected':''}>Belum kembali</option><option value=all ${GF.ls=='all'?'selected':''}>Semua</option></select></div><div id=gl3>${loanList()}</div></div>
  <div class=card><h3>Riwayat penjualan</h3><div class=fl style="grid-template-columns:1fr"><input placeholder="Cari kode emas / tanggal (mis. 2025-03)…" value="${esc(GF.sq)}" oninput="GF.sq=this.value;GF.sp=0;$('#gl2').innerHTML=saleList()"></div><div id=gl2>${saleList()}</div></div>`;
 return {body,act:`<button class=ghost onclick=fGoldPrice()>Harga hari ini</button><button class=ghost onclick="fGoldSell()">Jual</button><button class=ghost onclick="fGoldLend()">Pinjamkan</button><button class=ghost onclick="fGoldBorrow()">Pinjam emas</button><button class=btn onclick=fGoldBuy()>+ Beli emas</button>`}};
const goldEditTx=id=>{const t=S.t.find(x=>x.id==id);t.gold_lot_id?fGoldEdit(S.g.find(l=>l.id==t.gold_lot_id)):fGoldSaleEdit(S.gs.find(x=>x.id==t.gold_sale_id))};
const fGoldEdit=l=>{if(S.gb.some(b=>b.lot_id==l.id)){toast('Emas pinjaman diedit lewat menu Hutang Piutang.');return}const pr=S.t.find(t=>t.gold_lot_id==l.id),sold=+(Number(l.grams)-rem(l)).toFixed(4);
 form('Edit Pembelian Emas',[{k:'code',l:'Kode emas',v:l.code},{k:'brand',l:'Merek / keterangan',r:false,v:l.brand},{k:'account_id',l:'Dibayar dari rekening',o:accOpts(),v:pr?.account_id},{k:'buy_date',l:'Tanggal beli',t:'date',v:l.buy_date},{k:'grams',l:`Berat (gram) — terjual/dipinjam ${gf(sold)}`,t:'number',v:l.grams},{k:'total',l:'Total harga beli (Rp)',t:'number',v:Math.round(l.grams*l.price_per_gram)}],
 async x=>{const g=Number(x.grams),tot=Math.round(Number(x.total)),code=x.code.trim();if(!(g>0&&tot>0))throw new Error('Berat dan total harga harus lebih dari 0');
  if(g<sold-1e-9)throw new Error('Berat tidak boleh kurang dari yang sudah terjual ('+gf(sold)+')');if(S.g.some(o=>o.id!=l.id&&norm(o.code)==norm(code)))throw new Error('Kode emas sudah dipakai');
  await upd('gold_lots',l.id,{code,brand:nn(x.brand),buy_date:x.buy_date,grams:g,price_per_gram:Math.round(tot/g*100)/100});
  const row={account_id:x.account_id,amount:tot,date:x.buy_date,note:`Beli emas ${code} ${gf(g)}`};
  if(pr)await upd('transactions',pr.id,row);else{const {error}=await sb.from('transactions').insert({...row,kind:'gold',type:'expense',gold_lot_id:l.id});if(error)throw error}
  if(code!=l.code)for(const sl of S.gs.filter(z=>z.lot_id==l.id)){const t=S.t.find(t=>t.gold_sale_id==sl.id);if(t)await upd('transactions',t.id,{note:`Jual emas ${code} ${gf(sl.grams)}`})}});
 const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.grams,e.total],()=>{const g=Number(e.grams.value)||0,t=Number(e.total.value)||0;return `Harga beli per gram: <b>${g&&t?rp(t/g):'—'}</b>`})};
const fGoldSaleEdit=sl=>{const l=S.g.find(l=>l.id==sl.lot_id),tx=S.t.find(t=>t.gold_sale_id==sl.id),max=+(rem(l)+Number(sl.grams)).toFixed(4);
  form('Edit Penjualan · '+esc(l.code),[{k:'account_id',l:'Masuk ke rekening',o:accOpts(),v:tx?.account_id},{k:'sell_date',l:'Tanggal jual',t:'date',v:sl.sell_date},{k:'grams',l:`Berat dijual (maks ${gf(max)})`,t:'number',v:sl.grams},{k:'total',l:'Total harga jual (Rp)',t:'number',v:Math.round(sl.grams*sl.price_per_gram)}],
  async x=>{const g=Number(x.grams),tot=Math.round(Number(x.total));if(!(g>0&&tot>0))throw new Error('Berat dan total harga harus lebih dari 0');if(g>max+1e-9)throw new Error('Melebihi sisa '+gf(max));
   await upd('gold_sales',sl.id,{sell_date:x.sell_date,grams:g,price_per_gram:Math.round(tot/g*100)/100});
   const row={account_id:x.account_id,amount:tot,date:x.sell_date,note:`Jual emas ${l.code} ${gf(g)}`};
   if(tx)await upd('transactions',tx.id,row);else{const {error}=await sb.from('transactions').insert({...row,kind:'gold',type:'income',gold_sale_id:sl.id});if(error)throw error}});
  const fm=$('#modal form'),e=fm.elements;gprev(fm,[e.grams,e.total],()=>{const g=Number(e.grams.value)||0,t=Number(e.total.value)||0,d=t-g*l.price_per_gram;
   return `Harga beli <b>${rp(l.price_per_gram)}</b>/g · harga jual per gram <b>${g&&t?rp(t/g):'—'}</b> · selisih <b class="${d>=0?'in':'ex'}">${d>=0?'+':'−'}${rp(Math.abs(d))}</b>`})};
const goldCard=()=>{const own=S.g.filter(l=>rem(l)>0),grams=own.reduce((s,l)=>s+rem(l),0),cost=own.reduce((s,l)=>s+rem(l)*l.price_per_gram,0),price=Number(U?.user_metadata?.gold_price)||0,val=grams*price,d=val-cost;
 return `<div class=card style="cursor:pointer" onclick="view='gold';render()"><div class=k>Tabungan emas</div><div class=v>${gf(grams)}</div>${lentTotal()>1e-9?`<div class=mu style="font-size:11px">+${gf(lentTotal())} dipinjamkan</div>`:''}${owedTotal()>1e-9?`<div class=mu style="font-size:11px">hutang ${gf(owedTotal())}</div>`:''}${!S.g.length?'<div class=mu style="font-size:12px">Belum ada emas</div>':price?`<div style="font-weight:700;font-size:13px">${rp(val)}</div><div class=mu style="font-size:11px"><span class="${d>=0?'in':'ex'}">${d>=0?'+':'−'}${rp(Math.abs(d))}</span> vs modal<br>@ ${rp(price)}/g</div>`:`<div class=mu style="font-size:12px">Modal ${rp(cost)} · isi "Harga hari ini" untuk nilai sekarang</div>`}</div>`};
const togSB=()=>{SB=!SB;render()};
const fProfile=()=>form('Edit Profil',[{k:'full_name',l:'Nama lengkap',v:U?.user_metadata?.full_name,r:false},{k:'password',l:'Password baru (kosongkan jika tidak diubah)',t:'password',r:false}],
 async d=>{if(d.password&&d.password.length<6)throw new Error('Password minimal 6 karakter');const p={data:{full_name:d.full_name.trim()}};if(d.password)p.password=d.password;
  const {data,error}=await sb.auth.updateUser(p);if(error)throw error;U=data.user});
const hd=()=>{const nm=U?.user_metadata?.full_name||'',em=U?.email||'',ini=(nm||em)[0]?.toUpperCase()||'?';
 return `<header class=hd><button class=ib onclick="togSB()" aria-label="Menu">☰</button><div class=sp></div><div class=prof><button class=pb onclick="this.nextElementSibling.classList.toggle('on')"><span class=av>${esc(ini)}</span><span class=pn>${esc(nm||em)}</span><span class=mu>▾</span></button>
 <div class=menu><div class=mh><b>${esc(nm||'Pengguna')}</b><div class=mu style="font-size:12px;word-break:break-all">${esc(em)}</div></div><button onclick="fProfile()">✎ Edit profil</button><button class=lo onclick="sb.auth.signOut()">⎋ Keluar</button></div></div></header>`};
const nav=[['dash','Dashboard'],['tx','Transaksi'],['debt','Hutang Piutang'],['gold','Emas'],['acc','Rekening'],['cat','Kategori']];
const title={dash:'Dashboard',tx:'Mutasi Transaksi',debt:'Hutang Piutang',gold:'Tabungan Emas',acc:'Rekening',cat:'Kategori'};
const mt=()=>S.t.filter(t=>t.date.startsWith(month));
function txRows(list){return list.length?list.map(t=>`<tr><td style="width:46px"><span class="ic ${t.type}">${t.type=='income'?'↓':'↑'}</span></td><td>${esc(t.note||cat(t.category_id)?.name||'-')}<div class=mu style="font-size:12px">${esc(cat(t.category_id)?.name||(t.kind=='normal'?'Tanpa kategori':t.kind=='transfer'?'Transfer':t.kind=='gold'?'Emas':'Hutang/Piutang'))} · ${esc(acc(t.account_id)?.name||'')} · ${t.date}</div></td>
 <td class="${t.type=='income'?'in':'ex'}" style="font-weight:700;text-align:right;white-space:nowrap">${t.type=='income'?'+':'−'}${rp(t.amount)}</td><td style="white-space:nowrap">${t.kind=='transfer'?'':t.kind=='gold'?`<button class=x onclick="goldEditTx('${t.id}')">Edit</button>`:`<button class=x onclick="fTx(S.t.find(x=>x.id=='${t.id}'))">Edit</button>`}<button class=x onclick="delTx('${t.id}')">✕</button></td></tr>`).join(''):`<tr><td colspan=4 class=mu style="text-align:center;padding:28px">Belum ada transaksi.</td></tr>`}
function render(){
 charts.forEach(c=>c.destroy());charts=[];
 const m=mt(), N=m.filter(t=>t.kind=='normal'), inc=sum(N.filter(t=>t.type=='income')), exp=sum(N.filter(t=>t.type=='expense'));
 let body='',act='';
 if(view=='dash'){
  const hut=S.d.filter(d=>d.kind=='hutang').reduce((s,d)=>s+d.amount-paid(d),0), pi=S.d.filter(d=>d.kind=='piutang').reduce((s,d)=>s+d.amount-paid(d),0);
  body=alerts().map(a=>`<div class="al ${a.p>=1?'over':''}">${a.p>=1?'⚠️ Budget':'🔔 Budget'} ${esc(a.c.name)} ${a.p>=1?'terlampaui':'hampir habis'} — ${rp(a.s)} dari ${rp(a.b.amount)} (${Math.round(a.p*100)}%)</div>`).join('')+`<div class="grid stats"><div class="card hero"><div class=k>Total saldo</div><div class=v>${rp(S.a.reduce((s,a)=>s+bal(a),0))}</div></div>
  <div class=card><div class=k>Pemasukan bulan ini</div><div class="v in">${rp(inc)}</div></div><div class=card><div class=k>Pengeluaran bulan ini</div><div class="v ex">${rp(exp)}</div></div>
  <div class=card><div class=k>Hutang · Piutang</div><div class="v sm ex">${rp(hut)} <small>hutang</small></div><div class="v sm in" style="margin-top:2px">${rp(pi)} <small>piutang</small></div></div>${goldCard()}</div>
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
 if(view=='gold'){const g=goldView();body=g.body;act=g.act}
 if(view=='debt'){act=`<button class=ghost onclick="fGoldBorrow()">+ Hutang emas</button><button class=ghost onclick="fGoldLend()">+ Piutang emas</button><button class=btn onclick=fDebt()>+ Hutang / Piutang</button>`;
  body=`<div class=fl style="grid-template-columns:2fr 1fr"><input placeholder="Cari nama / catatan…" value="${esc(D.q)}" onchange="D.q=this.value;render()"><select onchange="D.s=this.value;render()"><option value=aktif ${D.s=='aktif'?'selected':''}>Belum lunas</option><option value=lunas ${D.s=='lunas'?'selected':''}>Lunas</option><option value=all ${D.s=='all'?'selected':''}>Semua</option></select></div>${S.gl.length||S.gb.length?'<h3 style="margin:4px 0 12px">Rupiah</h3>':''}<div class=grid>${dl().map(d=>{const p=paid(d),r=d.amount-p;return `<div class=card><div class=row style="justify-content:space-between"><span class="pill ${d.kind=='hutang'?'h':'p'}">${d.kind=='hutang'?'Hutang':'Piutang'}</span><span><button class=x onclick="fDebtEdit(S.d.find(x=>x.id=='${d.id}'))">Edit</button><button class=x onclick="del('debts','${d.id}')">✕</button></span></div>
  <h3 style="margin:10px 0 2px">${esc(d.person)}</h3><div class=mu>${d.date} ${esc(d.note||'')}</div><div class="v ${d.kind=='hutang'?'ex':'in'}">${rp(r)}</div><div class=mu>dari ${rp(d.amount)} · dibayar ${rp(p)}</div>
  <div class=bar><i style="width:${p/d.amount*100}%;background:${d.kind=='hutang'?'var(--ex)':'var(--in)'}"></i></div><div class=row style="margin-top:12px">${r>0?`<button class=ghost onclick="fPay('${d.id}')">${d.kind=='hutang'?'Bayar':'Terima'}</button>`:'<span class=in>Lunas ✓</span>'}</div></div>`}).join('')||'<p class=mu>Tidak ada hutang piutang rupiah.</p>'}</div>${goldLoanSection()}`}
 $('#root').innerHTML=`<div class="app ${SB?'open':'collapsed'}"><aside><div class=logo>Fin<i>Track</i></div>${nav.map(n=>`<a class="${view==n[0]?'on':''}" onclick="view='${n[0]}';if(innerWidth<=800)SB=false;render()">${n[1]}</a>`).join('')}<div class=sp></div><div class=sdiv>Aplikasi lain</div><a class=ml href="https://medicalrecorded.vercel.app" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg><span>Medical Record</span><span class=ext>↗</span></a><a class=cf href="https://lynk.id/slowistency" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/></svg>Traktir Kopi</a></aside><div class=ov onclick="togSB()"></div><div class=shell>${hd()}<main><div class=top><h1>${title[view]}</h1><div class=row>${view=='dash'||view=='tx'?`<input type=month value="${month}" onchange="month=this.value||month;render()" style="width:auto;margin:0">`:''}${act}</div></div>${body}</main></div></div>`;
 if(view=='dash')drawCharts(N);
}
function drawCharts(N){
 const css=getComputedStyle(document.body), mu=css.getPropertyValue('--mu'), bd=css.getPropertyValue('--bd');
 const by={};N.filter(t=>t.type=='expense').forEach(t=>{const n=cat(t.category_id)?.name||'Lainnya';by[n]=(by[n]||0)+Number(t.amount)});
 charts.push(new Chart($('#c1'),{type:'doughnut',data:{labels:Object.keys(by),datasets:[{data:Object.values(by),backgroundColor:cats,borderWidth:0}]},options:{cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:mu}}}}}));
 const [y0,m0]=today().split('-').map(Number),ms=[...Array(6)].map((_,i)=>{const k=y0*12+m0-1-5+i;return `${Math.floor(k/12)}-${String(k%12+1).padStart(2,'0')}`});
 const tot=ty=>ms.map(k=>sum(S.t.filter(t=>t.kind=='normal'&&t.type==ty&&t.date.startsWith(k))));
 charts.push(new Chart($('#c2'),{type:'bar',data:{labels:ms,datasets:[{label:'Pemasukan',data:tot('income'),backgroundColor:'#10b981',borderRadius:8,borderSkipped:false},{label:'Pengeluaran',data:tot('expense'),backgroundColor:'#f43f5e',borderRadius:8,borderSkipped:false}]},
  options:{scales:{x:{ticks:{color:mu},grid:{display:false}},y:{ticks:{color:mu},grid:{color:bd}}},plugins:{legend:{labels:{color:mu}}}}}));
}

/* ---------- ikon & varian tombol (otomatis dari teks tombol) ---------- */
const SV=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS={plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
 swap:'<path d="M17 3l4 4-4 4"/><path d="M3 7h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 17H3"/>',upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',sheet:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h2M14 13h2M8 17h2M14 17h2"/>',
 coins:'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',trend:'<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
 out:'<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',inn:'<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',tag:'<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
 bank:'<path d="M3 22h18"/><path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="M12 2 3 7h18Z"/>',wallet:'<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',login:'<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
 user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',lock:'<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'};
// teks tombol -> [ikon, kelas varian]
const BMAP={'Transaksi':['plus',''],'Rekening':['bank',''],'Kategori':['tag',''],'Hutang / Piutang':['wallet',''],'Hutang emas':['inn','b-rose'],'Piutang emas':['out','b-green'],'Transfer':['swap','b-vio'],'Import':['upload','b-teal'],'CSV':['sheet','b-xl'],
 'Beli emas':['coins','b-gold'],'Jual':['trend','b-green'],'Pinjamkan':['out','b-sky'],'Pinjam emas':['inn','b-vio'],'Harga hari ini':['tag','b-neutral'],'Terima':['inn','b-green'],'Bayar':['out','b-rose'],'Edit':['edit','x-edit'],'✕':['trash','x-del'],
 'Simpan':['check',''],'Batal':['x',''],'Tutup':['x',''],'Unduh template':['download','b-xl'],'Prev':['left',''],'Next':['right',''],'☰':['menu',''],'Edit profil':['user',''],'Keluar':['logout',''],'Masuk':['login',''],'Daftar':['user',''],'Kirim link reset':['mail',''],'Simpan password':['lock','']};
function decorate(){document.querySelectorAll('button').forEach(b=>{if(b.querySelector('svg'))return;const t=b.textContent.trim(),k=t==='✕'||t==='☰'?t:t.replace(/^[+⇄⬆⬇✎⎋‹]\s*/,'').replace(/\s*›$/,''),m=BMAP[k]||(/^Import \d+/.test(k)?BMAP['Import']:null);if(!m)return;
 b.textContent='';b.insertAdjacentHTML('afterbegin',SV(ICONS[m[0]]));
 if(k==='✕'||k==='☰'){b.title=k==='✕'?'Hapus':'Menu';b.setAttribute('aria-label',b.title)}else{const sp=document.createElement('span');sp.textContent=t.startsWith('+')&&m[0]!=='plus'?'+ '+k:k;b.append(sp)}
 if(m[1])b.classList.add(m[1])})}
if(typeof MutationObserver!='undefined'){let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;decorate()})}).observe(document.body,{childList:true,subtree:true})}
