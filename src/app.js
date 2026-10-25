/* __SB_URL__ / __SB_KEY__ diisi saat build dari environment variable Vercel */
const sb = supabase.createClient(__SB_URL__, __SB_KEY__);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"}) : "";
const SIZE = 8;
let user = null, page = "dashboard", pg = 0, q = "", people = [], editing = null, timer, personFilter = "", stats = {}, origMeds = [], statusFilter = "";

/* ---------- konfigurasi tabel ---------- */
const GENDER = ["Laki-laki","Perempuan"];
const REL = ["Kepala keluarga","Istri / Suami","Anak","Orang tua","Saudara","Lainnya"];
const age = d => { if (!d) return ""; const b = new Date(d), n = new Date(); let a = n.getFullYear() - b.getFullYear();
 if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a + " th"; };
const BLOOD = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const MEAL = ["Sebelum makan","Sesudah makan","Bersama makan","Tidak tergantung makan"];
const TPD = ["1","2","3","4","5","6"];
const STATUS = ["Sedang sakit","Sembuh","Kronis"];
const APPT = ["Terjadwal","Selesai","Dibatalkan"];
const TITLES = { dashboard:"Dashboard Keluarga", schedule:"Jadwal Minum Obat" };
const pad = n => String(n).padStart(2, "0");
const localISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return localISO(d); };
// Jam minum otomatis: jam pertama + kelipatan (24 jam / jumlah per hari), atau jarak manual
const doseTimes = (first, n, iv) => {
 n = Number(n); if (!first || !n) return [];
 const [h, m] = first.slice(0, 5).split(":").map(Number), step = (Number(iv) > 0 ? Number(iv) : 24 / n) * 60;
 return Array.from({ length:n }, (_, i) => { const t = Math.round(h * 60 + m + i * step) % 1440; return pad(Math.floor(t / 60)) + ":" + pad(t % 60); });
};
const schedText = r => r.times_per_day ? [r.times_per_day + "x sehari", doseTimes(r.first_dose, r.times_per_day, r.interval_hours).join(", "), r.meal_timing].filter(Boolean).join(" · ") : (r.frequency || "");

const CFG = {
 people: { title:"Anggota Keluarga", table:"people", sel:"*", order:["created_at",true], search:["name","relationship","birth_place"],
  cols:[["Nama","name"],["Hubungan","relationship"],["Lahir",r=>[r.birth_place,fmtDate(r.birth_date)].filter(Boolean).join(", ") + (r.birth_date ? " (" + age(r.birth_date) + ")" : "")],
   ["Data fisik",r=>[r.gender, r.blood_type && "Gol. " + r.blood_type, r.height_cm && r.height_cm + " cm", r.weight_kg && r.weight_kg + " kg"].filter(Boolean).join(" · ")],
   ["Riwayat",r=>stats[r.id] ? stats[r.id].n + " catatan" : "Belum ada"],["Terakhir berobat",r=>stats[r.id] ? fmtDate(stats[r.id].last.visit_date) + " · " + stats[r.id].last.condition : ""]],
  fields:[["name","Nama","text",1],["relationship","Hubungan keluarga","select",1,REL],["birth_place","Tempat lahir","text"],["birth_date","Tanggal lahir","date"],["gender","Jenis kelamin","select",0,GENDER],
   ["blood_type","Golongan darah","select",0,BLOOD],["height_cm","Tinggi badan (cm)","number"],["weight_kg","Berat badan (kg)","number"],["notes","Catatan (alergi, dll.)","textarea"]] },
 records: { title:"Riwayat Kesehatan", table:"records", statusOpts:STATUS, newStatus:"Sedang sakit", quick:{ label:"Tandai sembuh", when:r=>r.status==="Sedang sakit", set:{status:"Sembuh"} }, sel:"*, people(name), medicines(name,for_condition)", order:["visit_date",false], search:["condition","facility_name"],
  cols:[["Tanggal",r=>fmtDate(r.visit_date)],["Nama",r=>r.people?.name],["Sakit / keluhan","condition"],["Status","status"],["Dirawat di",r=>[r.facility_type,r.facility_name].filter(Boolean).join(" · ")],
   ["Obat",r=>(r.medicines || []).map(m => m.name + (m.for_condition ? " (" + m.for_condition + ")" : "")).join(", ") || [r.medication, r.frequency].filter(Boolean).join(" · ")]],
  fields:[["person_id","Nama","person",1],["visit_date","Tanggal","date",1],["condition","Sakit / keluhan (mis. mata minus, tekanan darah tinggi)","text",1],["status","Status","select",1,STATUS],["facility_type","Dirawat di","select",0,["Rumah","Klinik","Rumah Sakit","Puskesmas"]],["facility_name","Nama klinik / RS","text"],["notes","Catatan","textarea"]] },
 appointments: { title:"Jadwal Kontrol", table:"appointments", sel:"*, people(name)", order:["appt_date",true], search:["title","doctor","facility"], statusOpts:APPT, defStatus:"Terjadwal", newStatus:"Terjadwal",
  quick:{ label:"Selesai", when:r=>r.status==="Terjadwal", set:{status:"Selesai"} },
  cols:[["Tanggal",r=>fmtDate(r.appt_date) + (r.appt_time ? ", " + r.appt_time.slice(0,5) : "")],["Nama",r=>r.people?.name],["Keperluan","title"],["Dokter / tempat",r=>[r.doctor,r.facility].filter(Boolean).join(" · ")],["Status","status"]],
  fields:[["person_id","Nama","person",1],["appt_date","Tanggal kontrol","date",1],["appt_time","Jam","time"],["title","Keperluan (mis. kontrol tekanan darah, ambil hasil lab)","text",1],["doctor","Dokter","text"],["facility","Klinik / RS","text"],["status","Status","select",1,APPT],["notes","Catatan","textarea"]] },
 medicines: { title:"Obat", table:"medicines", sel:"*, people(name)", order:["name",true], search:["name","for_condition"],
  cols:[["Obat","name"],["Untuk apa","for_condition"],["Jadwal",schedText],["Dosis","dosage"],["Pengguna",r=>r.people?.name]],
  fields:[["name","Nama obat","text",1],["person_id","Pengguna","person",1],["for_condition","Untuk apa (mis. batuk, demam)","text",1],["dosage","Dosis (mis. 1 tablet / 500 mg)","text"],["times_per_day","Berapa kali sehari","select",1,TPD],["first_dose","Jam minum pertama","time",1],
   ["interval_hours","Jarak antar dosis, jam (kosong = dibagi rata 24 jam)","number"],["meal_timing","Waktu minum","select",1,MEAL],["start_date","Mulai tanggal","date",1],["end_date","Sampai tanggal (kosong = rutin tanpa batas)","date"],["notes","Catatan","textarea"]] }
};

/* ---------- auth ---------- */
let mode = "login";
function setMode(m){
 mode = m; $("aMsg").textContent = ""; $("aMsg").className = "msg";
 const t = {login:["Masuk","Masuk"], register:["Daftar akun","Daftar"], reset:["Reset password","Kirim link reset"], newpass:["Password baru","Simpan password"]}[m];
 $("aTitle").textContent = t[0]; $("aBtn").textContent = t[1];
 $("fName").classList.toggle("hidden", m !== "register");
 $("fEmail").classList.toggle("hidden", m === "newpass");
 $("fPass").classList.toggle("hidden", m === "reset");
 $("aE").required = m !== "newpass"; $("aP").required = m === "login" || m === "register" || m === "newpass";
 $("lReg").textContent = m === "login" ? "Daftar akun" : "Kembali ke login";
 $("lReg").onclick = () => setMode(m === "login" ? "register" : "login");
 $("lReset").classList.toggle("hidden", m !== "login");
}
$("lReset").onclick = () => setMode("reset");
const say = (t, ok) => { $("aMsg").textContent = t; $("aMsg").className = "msg " + (ok ? "ok" : "err"); };
const authErr = e => /Invalid login/i.test(e.message) ? "Email atau password salah, atau akun belum terdaftar."
  : /not confirmed/i.test(e.message) ? "Email belum diverifikasi. Cek inbox Anda." : e.message;

$("authForm").onsubmit = async ev => {
 ev.preventDefault(); $("aBtn").disabled = true; say("");
 const email = $("aE").value.trim(), pw = $("aP").value;
 try {
  if (mode === "login") {
   const { error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error;
  } else if (mode === "register") {
   const { data, error } = await sb.auth.signUp({ email, password: pw, options:{ data:{ full_name: $("aN").value.trim() }, emailRedirectTo: location.origin } });
   if (error) throw error;
   if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error("Email ini sudah terdaftar. Silakan masuk.");
   say("Pendaftaran berhasil. Kami mengirim email verifikasi ke " + email + ". Klik link di email, lalu masuk.", true);
  } else if (mode === "reset") {
   const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin }); if (error) throw error;
   say("Link reset password sudah dikirim ke " + email + ".", true);
  } else {
   const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error;
   say("Password berhasil diganti.", true);
  }
 } catch (e) { say(authErr(e)); }
 $("aBtn").disabled = false;
};

sb.auth.onAuthStateChange((ev, session) => {
 if (ev === "PASSWORD_RECOVERY") { show("auth"); setMode("newpass"); return; }
 user = session?.user ?? null;
 if (user && mode !== "newpass") enter(); else if (!user) { show("auth"); setMode("login"); }
});
$("logout").onclick = () => sb.auth.signOut();

const show = v => {
 $("boot").classList.add("hidden"); $("auth").classList.toggle("hidden", v !== "auth"); $("app").classList.toggle("hidden", v !== "app"); };

/* ---------- shell ---------- */
async function enter(){
 show("app");
 const name = user.user_metadata?.full_name || user.email.split("@")[0];
 $("meName").textContent = name; $("meMail").textContent = user.email; $("meAva").textContent = name[0].toUpperCase();
 if (matchMedia("(max-width:800px)").matches) $("app").classList.add("collapsed");
 $("nav").innerHTML = [["dashboard","Dashboard"],["people","Anggota Keluarga"],["schedule","Jadwal Minum Obat"],["appointments","Jadwal Kontrol"],["records","Riwayat Kesehatan"],["medicines","Obat"]].map(([k,t]) => `<button data-p="${k}">${t}</button>`).join("");
 $("nav").onclick = e => { const b = e.target.closest("button"); if (b) go(b.dataset.p); };
 go(page);
}
$("burger").onclick = () => $("app").classList.toggle("collapsed");
$("scrim").onclick = () => $("app").classList.add("collapsed");

async function go(p, person = ""){
 page = p; pg = 0; q = ""; $("q").value = ""; personFilter = person;
 document.querySelectorAll("nav button").forEach(b => b.classList.toggle("on", b.dataset.p === p));
 const isS = p === "schedule", isD = p === "dashboard", isL = !isS && !isD;
 $("lsec").classList.toggle("hidden", !isL); $("sched").classList.toggle("hidden", !isS); $("dash").classList.toggle("hidden", !isD);
 $("ptitle").textContent = TITLES[p] || CFG[p].title;
 const c0 = CFG[p]; statusFilter = c0?.defStatus ?? ""; $("sf").classList.toggle("hidden", !c0?.statusOpts);
 if (c0?.statusOpts) { $("sf").innerHTML = '<option value="">Semua status</option>' + c0.statusOpts.map(o => `<option>${o}</option>`).join(""); $("sf").value = statusFilter; }
 $("pf").classList.toggle("hidden", p === "people");
 if (isL) $("q").placeholder = "Cari " + CFG[p].title.toLowerCase() + "…";
 if (matchMedia("(max-width:800px)").matches) $("app").classList.add("collapsed");
 await loadPeople(); isS ? renderSchedule() : isD ? renderDash() : load();
}
async function loadPeople(){
 const [{ data }, { data: rs }] = await Promise.all([
  sb.from("people").select("id,name,relationship,birth_date").order("created_at"),
  sb.from("records").select("person_id,visit_date,condition").order("visit_date", { ascending:false }).limit(3000)]);
 people = data || []; stats = {};
 (rs || []).forEach(r => { (stats[r.person_id] ||= { n:0, last:r }).n++; });
 $("pf").innerHTML = '<option value="">Semua anggota</option>' + people.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
 $("pf").value = personFilter;
}
$("sf").onchange = e => { statusFilter = e.target.value; pg = 0; load(); };
$("pf").onchange = e => { personFilter = e.target.value; pg = 0; load(); };

/* ---------- daftar + search + paging ---------- */
async function load(){
 const c = CFG[page], from = pg * SIZE;
 let qb = sb.from(c.table).select(c.sel, { count:"exact" });
 if (q) { const s = q.replace(/[,()%*]/g, " "); qb = qb.or(c.search.map(f => `${f}.ilike.%${s}%`).join(",")); }
 if (personFilter && page !== "people") qb = qb.eq("person_id", personFilter);
 if (statusFilter && c.statusOpts) qb = qb.eq("status", statusFilter);
 const { data, count, error } = await qb.order(c.order[0], { ascending: page === "appointments" && statusFilter !== "Terjadwal" ? false : c.order[1] }).range(from, from + SIZE - 1);
 if (error) { $("list").innerHTML = `<div class="empty">Gagal memuat data: ${esc(error.message)}</div>`; return; }
 const total = count || 0, pages = Math.max(1, Math.ceil(total / SIZE));
 if (!data.length) {
  const needPerson = page !== "people" && !people.length && !q;
  $("list").innerHTML = `<div class="empty">${q ? "Tidak ada hasil untuk “" + esc(q) + "”." : needPerson ? "Tambahkan dulu anggota keluarga di menu Anggota Keluarga." : page === "people" ? "Belum ada anggota. Mulai dengan menambahkan diri Anda, lalu istri dan anak-anak." : "Belum ada data. Klik Tambah untuk mulai mencatat."}</div>`;
 } else {
  $("list").innerHTML = `<table><thead><tr>${c.cols.map(x => `<th>${x[0]}</th>`).join("")}<th></th></tr></thead><tbody>` +
   data.map(r => `<tr>${c.cols.map(x => `<td data-l="${x[0]}">${esc(typeof x[1] === "function" ? x[1](r) : r[x[1]])}</td>`).join("")}
   <td class="act">${page === "people" ? `<button class="btn ghost sm" data-v="${r.id}">Riwayat</button> ` : ""}${c.quick && c.quick.when(r) ? `<button class="btn ghost sm" data-q="${r.id}">${c.quick.label}</button> ` : ""}<button class="btn ghost sm" data-e="${r.id}">Ubah</button> <button class="btn danger sm" data-d="${r.id}">Hapus</button></td></tr>`).join("") + "</tbody></table>";
  $("list").dataset.rows = JSON.stringify(Object.fromEntries(data.map(r => [r.id, r])));
 }
 $("count").textContent = total + " data";
 $("pg").textContent = pg + 1 + " / " + pages;
 $("prev").disabled = pg === 0; $("next").disabled = pg + 1 >= pages;
}
$("prev").onclick = () => { pg--; load(); };
$("next").onclick = () => { pg++; load(); };
$("q").oninput = e => { clearTimeout(timer); timer = setTimeout(() => { q = e.target.value.trim(); pg = 0; load(); }, 300); };
$("list").onclick = async e => {
 const rows = JSON.parse($("list").dataset.rows || "{}");
 if (e.target.dataset.q) { const { error } = await sb.from(CFG[page].table).update(CFG[page].quick.set).eq("id", e.target.dataset.q); if (error) alert(error.message); else load(); }
 if (e.target.dataset.v) go("records", e.target.dataset.v);
 if (e.target.dataset.e) openForm(rows[e.target.dataset.e]);
 if (e.target.dataset.d && confirm(page === "people" ? "Hapus anggota ini beserta seluruh riwayat kesehatan dan obatnya? Tidak bisa dibatalkan." : "Hapus data ini? Tindakan ini tidak bisa dibatalkan.")) {
  const { error } = await sb.from(CFG[page].table).delete().eq("id", e.target.dataset.d);
  if (error) alert(error.message); else { if (page === "people") await loadPeople(); load(); }
 }
};

/* ---------- form tambah / ubah ---------- */
$("add").onclick = () => openForm(null);
$("dCancel").onclick = () => $("dlg").close();
async function openForm(row){
 const c = CFG[page];
 if (page !== "people" && page === "records" && !people.length) { alert("Tambahkan dulu anggota keluarga di menu Anggota Keluarga."); return; }
 if (page === "records") origMeds = row ? ((await sb.from("medicines").select("*").eq("record_id", row.id).order("created_at")).data || []) : [];
 editing = row; $("dMsg").textContent = "";
 $("dTitle").textContent = (row ? "Ubah " : "Tambah ") + c.title.toLowerCase();
 $("dFields").innerHTML = c.fields.map(([k,l,t,req,opts]) => {
  const v = row?.[k] ?? "", id = "f_" + k, r = req ? " required" : "";
  let el;
  if (t === "textarea") el = `<textarea id="${id}" rows="2">${esc(v)}</textarea>`;
  else if (t === "select") el = `<select id="${id}" name="${k}"${r}><option value="">${req ? "Pilih" : "—"}</option>${opts.map(o => `<option${String(o) === String(v) ? " selected" : ""}>${o}</option>`).join("")}</select>`;
  else if (t === "person") el = `<select id="${id}" name="${k}"${r}><option value="">${req ? "Pilih orang" : "—"}</option>${people.map(p => `<option value="${p.id}"${p.id === v ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`;
  else el = `<input id="${id}" name="${k}" type="${t}" value="${esc(v)}"${r}${t === "number" ? ' step="any" min="0"' : ""}>`;
  return `<label for="${id}">${l}${req ? " *" : ""}</label>${el}`;
 }).join("");
 if (!row && page === "records") $("f_visit_date").value = localISO(new Date());
 if (!row && personFilter && $("f_person_id")) $("f_person_id").value = personFilter;
 if (!row && CFG[page].newStatus) $("f_status").value = CFG[page].newStatus;
 if (!row && page === "medicines") $("f_start_date").value = localISO(new Date());
 if (page === "medicines") { $("f_interval_hours").insertAdjacentHTML("afterend", '<div class="pv"></div>'); bindPreview($("dFields"), $("f_interval_hours").nextElementSibling); }
 if (page === "records") {
  $("dFields").insertAdjacentHTML("beforeend", '<div class="medsec"><h4>Obat yang diberikan</h4><div id="meds"></div><button type="button" class="btn ghost sm" id="addMed">+ Tambah obat</button></div>');
  const addRow = m => { $("meds").insertAdjacentHTML("beforeend", medRow(m)); const r = $("meds").lastElementChild; bindPreview(r, r.querySelector(".pv")); };
  origMeds.forEach(addRow); $("addMed").onclick = () => addRow({});
  $("meds").onclick = e => { if (e.target.classList.contains("rm")) e.target.closest(".mrow").remove(); };
  $("dFields").insertAdjacentHTML("beforeend", '<label for="f_nextctl">Kontrol berikutnya (opsional, otomatis masuk Jadwal Kontrol)</label><input id="f_nextctl" type="date">');
 }
 $("dlg").showModal();
}
$("dform").onsubmit = async ev => {
 ev.preventDefault(); $("dSave").disabled = true;
 const c = CFG[page], body = {};
 c.fields.forEach(([k]) => { body[k] = $("f_" + k).value.trim() || null; });
 const res = editing ? await sb.from(c.table).update(body).eq("id", editing.id).select("id").single() : await sb.from(c.table).insert(body).select("id").single();
 let error = res.error;
 if (!error && !editing) editing = { id: res.data.id };   // jika simpan obat gagal, klik Simpan lagi tidak membuat duplikat
 if (!error && page === "records") error = await saveMeds(res.data.id, body);
 const nc = page === "records" && $("f_nextctl") ? $("f_nextctl").value : "";
 if (!error && nc) { const r2 = await sb.from("appointments").insert({ person_id:body.person_id, record_id:res.data.id, appt_date:nc, title:"Kontrol: " + body.condition, status:"Terjadwal" }); error = r2.error; }
 $("dSave").disabled = false;
 if (error) { $("dMsg").textContent = error.message; return; }
 $("dlg").close(); if (page === "people") await loadPeople(); load();
};

/* ---------- obat di dalam riwayat ---------- */
function bindPreview(scope, out){
 const g = k => scope.querySelector(`[name=${k}]`);
 const u = () => { if (!g("first_dose")) return; const t = doseTimes(g("first_dose").value, g("times_per_day").value, g("interval_hours").value);
  out.innerHTML = t.length ? "Jam minum: " + t.map(x => `<b>${x}</b>`).join(" ") : "Isi jumlah per hari dan jam pertama, jam berikutnya muncul otomatis."; };
 scope.oninput = u; u();
}
const medRow = (m = {}) => {
 const days = m.end_date && m.start_date ? Math.round((new Date(m.end_date) - new Date(m.start_date)) / 864e5) + 1 : "";
 const o = (arr, v, ph) => `<option value="">${ph}</option>` + arr.map(x => `<option${String(x) === String(v ?? "") ? " selected" : ""}>${x}</option>`).join("");
 return `<div class="mrow" data-id="${m.id || ""}"><button type="button" class="rm" aria-label="Hapus obat">✕</button>
 <label>Nama obat *</label><input name="name" value="${esc(m.name)}" required>
 <label>Untuk apa * (mis. batuk, demam)</label><input name="for_condition" value="${esc(m.for_condition)}" placeholder="batuk" required>
 <div class="g2"><div><label>Dosis</label><input name="dosage" value="${esc(m.dosage)}" placeholder="1 tablet"></div>
 <div><label>Berapa kali sehari *</label><select name="times_per_day" required>${o(TPD, m.times_per_day, "Pilih")}</select></div>
 <div><label>Jam minum pertama *</label><input name="first_dose" type="time" value="${esc((m.first_dose || "").slice(0, 5))}" required></div>
 <div><label>Jarak antar dosis (jam)</label><input name="interval_hours" type="number" step="any" min="0" value="${esc(m.interval_hours)}" placeholder="otomatis"></div>
 <div><label>Waktu minum *</label><select name="meal_timing" required>${o(MEAL, m.meal_timing, "Pilih")}</select></div>
 <div><label>Lama minum (hari)</label><input name="days" type="number" min="1" value="${days}" placeholder="kosong = rutin"></div></div><div class="pv"></div></div>`;
};
async function saveMeds(rid, rec){
 const rows = [...document.querySelectorAll("#meds .mrow")], keep = new Set(rows.map(r => r.dataset.id).filter(Boolean));
 const gone = origMeds.filter(m => !keep.has(m.id)).map(m => m.id);
 if (gone.length) { const { error } = await sb.from("medicines").delete().in("id", gone); if (error) return error; }
 const adds = [];
 for (const r of rows) {
  const g = k => r.querySelector(`[name=${k}]`).value.trim() || null, d = Number(g("days"));
  const m = { record_id:rid, person_id:rec.person_id, for_condition:g("for_condition"), name:g("name"), dosage:g("dosage"), times_per_day:Number(g("times_per_day")),
   first_dose:g("first_dose"), interval_hours:g("interval_hours"), meal_timing:g("meal_timing"), start_date:rec.visit_date, end_date:d > 0 ? addDays(rec.visit_date, d - 1) : null };
  if (r.dataset.id) { const { error } = await sb.from("medicines").update(m).eq("id", r.dataset.id); if (error) return error; } else adds.push(m);
 }
 if (adds.length) { const { error } = await sb.from("medicines").insert(adds); if (error) return error; }
 return null;
}

/* ---------- jadwal & checklist minum obat ---------- */
let schedDate = localISO(new Date());
async function dosesFor(date, person = ""){
 let mq = sb.from("medicines").select("*, people(name)").not("times_per_day", "is", null).not("first_dose", "is", null).lte("start_date", date).or(`end_date.is.null,end_date.gte.${date}`);
 if (person) mq = mq.eq("person_id", person);
 const [{ data: ms, error }, { data: lg }] = await Promise.all([mq, sb.from("dose_logs").select("*").eq("log_date", date)]);
 const taken = new Map((lg || []).map(l => [l.medicine_id + "|" + l.dose_time, l])), by = {};
 (ms || []).forEach(m => doseTimes(m.first_dose, m.times_per_day, m.interval_hours).forEach(t => {
  const g = (by[m.person_id || "_"] ||= { name: m.people?.name || "Tanpa nama", items: [] }); g.items.push({ m, t, log: taken.get(m.id + "|" + t) }); }));
 return { by, error };
}
async function renderSchedule(){
 const nowD = new Date(), today = localISO(nowD), now = pad(nowD.getHours()) + ":" + pad(nowD.getMinutes());
 const { by, error } = await dosesFor(schedDate, personFilter);
 const cards = Object.values(by).map(g => {
  g.items.sort((a, b) => a.t.localeCompare(b.t) || a.m.name.localeCompare(b.m.name));
  const done = g.items.filter(i => i.log).length, nxt = schedDate === today ? g.items.find(i => !i.log && i.t >= now) : null;
  return `<div class="card sc"><div class="schd"><b>${esc(g.name)}</b><span>${done}/${g.items.length} dosis</span></div><div class="prog"><i style="width:${done / g.items.length * 100}%"></i></div>` +
   g.items.map(i => {
    const late = !i.log && (schedDate < today || (schedDate === today && i.t < now));
    return `<button class="dose${i.log ? " done" : ""}" data-m="${i.m.id}" data-p="${i.m.person_id || ""}" data-t="${i.t}" data-l="${i.log?.id || ""}"><span class="chk">${i.log ? "✓" : ""}</span><span class="dt">${i.t}</span>` +
    `<span class="di"><b>${esc(i.m.name)}</b>${i.m.dosage ? " · " + esc(i.m.dosage) : ""}<small>${esc([i.m.meal_timing, i.m.for_condition && "untuk " + i.m.for_condition].filter(Boolean).join(" · "))}</small></span>` +
    `<span class="st${late ? " late" : ""}">${i.log ? "Diminum " + new Date(i.log.taken_at).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" }) : late ? "Terlewat" : i === nxt ? "Berikutnya" : ""}</span></button>`; }).join("") + "</div>";
 }).join("");
 $("sched").innerHTML = `<div class="bar sbar"><button class="btn ghost sm" data-s="-1" aria-label="Hari sebelumnya">‹</button><input type="date" id="sd" value="${schedDate}"><button class="btn ghost sm" data-s="1" aria-label="Hari berikutnya">›</button>
  <button class="btn ghost sm" data-s="0">Hari ini</button><select id="sp" aria-label="Filter anggota keluarga"><option value="">Semua anggota</option>${people.map(x => `<option value="${x.id}"${x.id === personFilter ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>` +
  (error ? `<div class="card"><div class="empty">Gagal memuat jadwal: ${esc(error.message)}</div></div>` : cards || `<div class="card"><div class="empty">Tidak ada jadwal obat pada tanggal ini.<br>Tambahkan obat saat mencatat Riwayat Kesehatan, atau lewat menu Obat.</div></div>`);
}
$("sched").onclick = async e => {
 const s = e.target.closest("[data-s]"), d = e.target.closest(".dose");
 if (s) { schedDate = s.dataset.s === "0" ? localISO(new Date()) : addDays(schedDate, +s.dataset.s); return renderSchedule(); }
 if (d) { d.disabled = true;
  const { error } = d.dataset.l ? await sb.from("dose_logs").delete().eq("id", d.dataset.l)
   : await sb.from("dose_logs").insert({ medicine_id:d.dataset.m, person_id:d.dataset.p || null, log_date:schedDate, dose_time:d.dataset.t });
  if (error) alert(error.message); renderSchedule(); }
};
$("sched").onchange = e => { if (e.target.id === "sd") { schedDate = e.target.value || schedDate; renderSchedule(); } if (e.target.id === "sp") { personFilter = e.target.value; renderSchedule(); } };
setInterval(() => { if ($("dlg").open || document.hidden) return; if (page === "schedule") renderSchedule(); if (page === "dashboard") renderDash(); }, 60000);   // perbarui status "Terlewat"

/* ---------- dashboard: kondisi keluarga saat ini ---------- */
async function renderDash(){
 const nowD = new Date(), today = localISO(nowD), now = pad(nowD.getHours()) + ":" + pad(nowD.getMinutes());
 const [{ by }, rs, ap] = await Promise.all([dosesFor(today),
  sb.from("records").select("id,person_id,condition,visit_date,status").in("status", ["Sedang sakit", "Kronis"]).order("visit_date", { ascending:false }),
  sb.from("appointments").select("*").eq("status", "Terjadwal").order("appt_date").order("appt_time").limit(200)]);
 const recs = rs.data || [], aps = ap.data || [], nm = id => people.find(p => p.id === id)?.name || "";
 if (!people.length) { $("dash").innerHTML = '<div class="card"><div class="empty">Belum ada anggota keluarga.<br>Mulai dari menu Anggota Keluarga.</div></div>'; return; }
 const sick = people.filter(p => recs.some(r => r.person_id === p.id && r.status === "Sedang sakit"));
 const ban = sick.length ? `<div class="ban sick"><b>${sick.length} dari ${people.length} anggota sedang sakit</b><span>${esc(sick.map(p => p.name).join(", "))}</span></div>`
  : '<div class="ban ok"><b>Semua anggota sehat</b><span>Tidak ada yang sedang sakit saat ini.</span></div>';
 const cards = people.map(p => {
  const mine = recs.filter(r => r.person_id === p.id), sk = mine.filter(r => r.status === "Sedang sakit"), kr = mine.filter(r => r.status === "Kronis");
  const d = by[p.id]?.items || [], done = d.filter(i => i.log).length, late = d.filter(i => !i.log && i.t < now).length, nx = aps.find(a => a.person_id === p.id);
  const st = sk.length ? ["Sakit", "sick"] : kr.length ? ["Dipantau", "watch"] : ["Sehat", "ok"];
  return `<div class="card pc ${st[1]}" data-p="${p.id}"><div class="pch"><b>${esc(p.name)}</b><span class="badge ${st[1]}">${st[0]}</span></div>
  <div class="mu">${esc([p.relationship, p.birth_date && age(p.birth_date)].filter(Boolean).join(" · "))}</div>
  ${sk.map(r => `<div class="cond">${esc(r.condition)}<small>sedang sakit sejak ${fmtDate(r.visit_date)}</small></div>`).join("")}
  ${kr.map(r => `<div class="cond">${esc(r.condition)}<small>kondisi kronis, dipantau rutin</small></div>`).join("")}
  <div class="dl">Obat hari ini: <b>${d.length ? done + "/" + d.length + " dosis" : "tidak ada"}</b>${late ? ` · <span class="late">${late} terlewat</span>` : ""}</div>
  <div class="dl">Kontrol berikutnya: <b>${nx ? fmtDate(nx.appt_date) + (nx.appt_time ? ", " + nx.appt_time.slice(0, 5) : "") + " · " + esc(nx.title) : "belum dijadwalkan"}</b></div></div>`;
 }).join("");
 const ctl = aps.filter(a => a.appt_date <= addDays(today, 30)).slice(0, 6).map(a => {
  const n = Math.round((new Date(a.appt_date) - new Date(today)) / 864e5), tg = n < 0 ? ["Terlewat " + -n + " hari", "late"] : n === 0 ? ["Hari ini", "today"] : n === 1 ? ["Besok", "today"] : ["H-" + n, ""];
  return `<div class="ctl" data-go="appointments"><div><b>${esc(a.title)}</b><small>${esc(nm(a.person_id))} · ${fmtDate(a.appt_date)}${a.appt_time ? ", " + a.appt_time.slice(0, 5) : ""}${a.doctor || a.facility ? " · " + esc([a.doctor, a.facility].filter(Boolean).join(", ")) : ""}</small></div><span class="tg ${tg[1]}">${tg[0]}</span></div>`; }).join("");
 $("dash").innerHTML = ban + `<div class="cards">${cards}</div><h3 class="sec">Kontrol 30 hari ke depan</h3><div class="card ctls">${ctl || '<div class="empty">Tidak ada jadwal kontrol dalam 30 hari ke depan.</div>'}</div>`;
}
$("dash").onclick = e => { const c = e.target.closest("[data-p]"), l = e.target.closest("[data-go]"); if (c) go("records", c.dataset.p); else if (l) go(l.dataset.go); };

/* ---------- start ---------- */
sb.auth.getSession().then(({ data }) => { if (!data.session) { show("auth"); setMode("login"); } });
