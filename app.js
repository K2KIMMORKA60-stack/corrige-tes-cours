/* Corrige tes cours — qui monte et qui descend avec le pétrole (et les autres marchés). */
(function(){
"use strict";
const MOTEURS = [
  ["CL=F","Pétrole WTI","le pétrole"],["BZ=F","Pétrole Brent","le Brent"],["GC=F","Or","l'or"],
  ["NG=F","Gaz naturel","le gaz"],["HG=F","Cuivre","le cuivre"],["DX-Y.NYB","Dollar","le dollar"],
  ["^GSPC","S&P 500","le S&P 500"],["^IXIC","Nasdaq","le Nasdaq"],["BTC-USD","Bitcoin","le bitcoin"],["^TNX","Taux US","les taux US"]
];
const PERIODES = [[21,"1 mois"],[63,"3 mois"],[126,"6 mois"],[250,"1 an"]];
const TYPES = [["tout","Tout"],["action","Actions"],["indice","Indices"],["secteur","Secteurs"],["matiere","Matières premières"],["devise","Devises"],["crypto","Crypto"]];
const REGIONS = ["Monde","USA","Europe","Asie","Amériques","Moyen-Orient"];
const COULEURS = {"Pétrole":"#D9822B","Services pétroliers":"#C4622A","Raffinage":"#A9502F","Énergie":"#E8A33A",
  "Indice":"#3D7BD9","Taux":"#5B5FC7","Dollar":"#2E9E6B","Devises":"#22A39A","Devises pétrole":"#4DB6AC",
  "Tech":"#8E5BD6","Banque":"#2F8FC4","Industrie":"#7D8C99","Chimie":"#B8A42E","Services publics":"#6FA84B",
  "Santé":"#E0607E","Conso":"#F08A5D","Conso de base":"#A97A55","Aérien":"#29A3D6","Croisières":"#1C7AA6",
  "Transport":"#5B86B8","Auto":"#D64545","Mines d'or":"#D4AF37","Métaux précieux":"#E2C04A","Mines":"#9C6B3A",
  "Métaux":"#C77B3F","Luxe":"#B5487A","Crypto":"#F2A900","Agriculture":"#8DB33A"};
const couleur = s => COULEURS[s] || "#7D8C99";
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const pct = (x, d=1) => (x>0?"+":"") + (x*100).toFixed(d).replace(".", ",") + " %";
const cls = x => x>0.0005 ? "up" : x<-0.0005 ? "down" : "";
function lire(k, def){ try{ const v = localStorage.getItem("ctc-"+k); return v==null?def:JSON.parse(v);}catch(e){return def;} }
function garder(k, v){ try{ localStorage.setItem("ctc-"+k, JSON.stringify(v)); }catch(e){} }

let D = null, R = {}, byT = {};
const st = { drv: lire("drv","CL=F"), win: lire("win",63), type: lire("type","tout"), reg: lire("reg","Monde"), tab: lire("tab","groupes"), q: "" };

function rendements(c){ const r = new Array(c.length-1); for(let i=1;i<c.length;i++) r[i-1] = Math.log(c[i]/c[i-1]); return r; }
function stats(x, y){ // corrélation et sensibilité de y par rapport à x
  const n = x.length; let mx=0,my=0; for(let i=0;i<n;i++){mx+=x[i];my+=y[i];} mx/=n; my/=n;
  let sxx=0,syy=0,sxy=0; for(let i=0;i<n;i++){const a=x[i]-mx,b=y[i]-my; sxx+=a*a; syy+=b*b; sxy+=a*b;}
  return { r: sxx&&syy ? sxy/Math.sqrt(sxx*syy) : 0, beta: sxx ? sxy/sxx : 0 };
}
const fin = (a, w) => a.slice(Math.max(0, a.length-w));
function variation(a, j){ const c=a.c, n=c.length; return n>j ? c[n-1]/c[n-1-j]-1 : 0; }
function nomMoteur(t){ const m = MOTEURS.find(x=>x[0]===t); return m ? m[1] : (byT[t]?byT[t].n:t); }
function leMoteur(t){ const m = MOTEURS.find(x=>x[0]===t); return m ? m[2] : (byT[t]?byT[t].n:t); }

function filtre(a){
  if(a.t===st.drv) return false;
  if(st.type!=="tout" && a.k!==st.type) return false;
  if(st.reg!=="Monde" && a.r!==st.reg) return false;
  if(st.q){ const q=st.q.toLowerCase(); if(!(a.n.toLowerCase().includes(q)||a.t.toLowerCase().includes(q)||a.s.toLowerCase().includes(q))) return false; }
  return true;
}

/* ---------- En-tête : le moteur ---------- */
function rendreMoteur(){
  const a = byT[st.drv]; if(!a){ $("#moteur").innerHTML = '<p class="vide">Ce marché n\'a pas de données.</p>'; return; }
  const c = a.c, n=c.length, j1=variation(a,1), j5=variation(a,5);
  const ma20 = c.slice(-20).reduce((s,v)=>s+v,0)/Math.min(20,n);
  const sens = j1>0.003 ? "up" : j1<-0.003 ? "down" : "flat";
  const mot = {up:"Monte",down:"Baisse",flat:"Stable"}[sens];
  const au = c[n-1] >= ma20 ? "au-dessus" : "en dessous";
  const le = leMoteur(st.drv);
  const liste = lignes();
  const avec = liste.filter(x=>x.r>=0.5).sort((x,y)=>y.r-x.r).slice(0,4).map(x=>x.a.n);
  const contre = liste.filter(x=>x.r<=-0.25).sort((x,y)=>x.r-y.r).slice(0,3).map(x=>x.a.n);
  let conseil;
  if(sens==="up") conseil = `Aujourd'hui ${le} monte. D'habitude, ${avec.length?"<b>"+esc(avec.join(", "))+"</b> montent aussi":"peu de marchés le suivent fort"}${contre.length?". À l'inverse, <b>"+esc(contre.join(", "))+"</b> baissent souvent":""}.`;
  else if(sens==="down") conseil = `Aujourd'hui ${le} baisse. D'habitude, ${avec.length?"<b>"+esc(avec.join(", "))+"</b> baissent aussi":"peu de marchés le suivent fort"}${contre.length?". À l'inverse, <b>"+esc(contre.join(", "))+"</b> montent souvent":""}.`;
  else conseil = `Aujourd'hui ${le} bouge peu. Regardez les groupes ci-dessous pour savoir qui le suit.`;
  $("#moteur").innerHTML = `
    <div class="row"><div><div class="label">Référence</div><h2>${esc(nomMoteur(st.drv))}</h2></div>
      <span class="verdict ${sens}">${mot}</span></div>
    <div class="row"><span class="prix num">${fmtPrix(c[n-1])}</span>
      <span class="num ${cls(j1)}" style="font-size:18px;font-weight:600">${pct(j1,2)} aujourd'hui</span></div>
    <div class="stats"><span>5 jours <b class="num ${cls(j5)}">${pct(j5)}</b></span>
      <span>1 mois <b class="num ${cls(variation(a,21))}">${pct(variation(a,21))}</b></span>
      <span>Prix ${au} de sa moyenne 20 jours</span></div>
    <div class="conseil">${conseil}</div>`;
}
function fmtPrix(v){ const d = v>=1000?0: v>=10?2: 4; return v.toLocaleString("fr-FR",{minimumFractionDigits:d,maximumFractionDigits:d}); }

/* ---------- Calcul des liens ---------- */
function lignes(){
  const x = fin(R[st.drv]||[], st.win);
  return D.assets.filter(filtre).map(a => { const s = stats(x, fin(R[a.t], st.win)); return { a, r:s.r, beta:s.beta, j1:variation(a,1) }; });
}

function jauge(r){
  const w = Math.abs(r)*50, left = r>=0 ? 50 : 50-w, col = r>=0 ? "var(--up)" : "var(--down)";
  return `<div><div class="jauge"><i style="left:${left}%;width:${w}%;background:${col}"></i></div><div class="jauge-l num">${(r*100).toFixed(0)} %</div></div>`;
}
function item(x){
  const sensi = `+1 % → ${x.beta>=0?"+":""}${x.beta.toFixed(2).replace(".",",")} %`;
  return `<button class="item" style="--c:${couleur(x.a.s)}" data-t="${esc(x.a.t)}"><div style="min-width:0"><div class="nom">${esc(x.a.n)}</div>
    <div class="meta"><span class="sect">${esc(x.a.s)}</span> · ${esc(x.a.r)} · ${sensi}</div></div>${jauge(x.r)}
    <div class="jour num ${cls(x.j1)}">${pct(x.j1)}</div></button>`;
}

function rendreGroupes(){
  const L = lignes(), le = leMoteur(st.drv);
  const G = [
    {id:"fort", col:"var(--up)", titre:`Montent fort avec ${le}`, desc:`Quand ${le} monte, ils montent aussi. Quand il baisse, ils baissent.`, f:x=>x.r>=0.5, tri:(a,b)=>b.r-a.r, open:true},
    {id:"un-peu", col:"color-mix(in srgb, var(--up) 45%, var(--surface))", titre:`Suivent un peu ${le}`, desc:"Même sens, mais lien plus faible.", f:x=>x.r>=0.25&&x.r<0.5, tri:(a,b)=>b.r-a.r, open:true},
    {id:"inverse", col:"var(--down)", titre:`Vont à l'inverse de ${le}`, desc:`Quand ${le} monte, ils baissent souvent. Quand il baisse, ils montent.`, f:x=>x.r<=-0.25, tri:(a,b)=>a.r-b.r, open:true},
    {id:"libre", col:"var(--muted)", titre:"Pas vraiment liés", desc:"Ils bougent pour d'autres raisons.", f:x=>x.r>-0.25&&x.r<0.25, tri:(a,b)=>b.r-a.r, open:false},
  ];
  $("#contenu").innerHTML = G.map(g => {
    const m = L.filter(g.f).sort(g.tri);
    return `<details class="groupe" ${g.open?"open":""}><summary><span class="tag" style="background:${g.col}"></span>
      <div style="flex:1;min-width:0"><h3>${esc(g.titre)}</h3><div class="desc">${esc(g.desc)}</div></div>
      <span class="compte">${m.length}</span></summary>
      <div class="liste">${m.length? m.map(item).join("") : '<div class="vide">Aucun marché dans ce groupe avec ces filtres.</div>'}</div></details>`;
  }).join("") + `<p class="label" style="text-align:center">Jauge = force du lien sur ${PERIODES.find(p=>p[0]===st.win)[1]} · « +1 % → » = mouvement moyen quand la référence fait +1 %</p>`;
}

/* ---------- Familles : marchés qui bougent ensemble ---------- */
function rendreFamilles(){
  const A = D.assets.filter(a => (st.type==="tout"||a.k===st.type) && (st.reg==="Monde"||a.r===st.reg));
  const X = A.map(a => fin(R[a.t], st.win)), n = A.length;
  const C = []; for(let i=0;i<n;i++){ C[i]=[]; for(let j=0;j<n;j++) C[i][j] = i===j?1 : j<i ? C[j][i] : stats(X[i],X[j]).r; }
  let cl = A.map((_,i)=>[i]);
  const lien = (p,q) => { let s=0; for(const i of p) for(const j of q) s+=C[i][j]; return s/(p.length*q.length); };
  for(;;){ let best=-2,bi=-1,bj=-1;
    for(let i=0;i<cl.length;i++) for(let j=i+1;j<cl.length;j++){ const v=lien(cl[i],cl[j]); if(v>best){best=v;bi=i;bj=j;} }
    if(best<0.55) break; cl[bi]=cl[bi].concat(cl[bj]); cl.splice(bj,1); }
  const fam = cl.filter(c=>c.length>1).sort((a,b)=>b.length-a.length), seuls = cl.filter(c=>c.length===1).map(c=>c[0]);
  const nomFam = c => { const k={}; c.forEach(i=>{k[A[i].s]=(k[A[i].s]||0)+1;}); return Object.entries(k).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>e[0]).join(" + "); };
  const chip = i => { const j=variation(A[i],1); return `<button class="membre" style="--c:${couleur(A[i].s)}" data-t="${esc(A[i].t)}">${esc(A[i].n)}<span class="num ${cls(j)}">${pct(j)}</span></button>`; };
  $("#contenu").innerHTML = `<p class="label" style="margin:0">Marchés qui montent et descendent ensemble (${PERIODES.find(p=>p[0]===st.win)[1]})</p>` +
    fam.map(c => { const moy = c.reduce((s,i)=>s+variation(A[i],1),0)/c.length, force = lien(c,c);
      const sx = (moy*100).toFixed(1).replace(".",",");
      return `<section class="groupe famille"><div style="padding:14px 16px;display:flex;justify-content:space-between;gap:10px;align-items:center">
        <div style="min-width:0"><h3>Famille ${esc(nomFam(c))}</h3><div class="desc">${c.length} marchés · lien moyen ${(force*100).toFixed(0)} % · aujourd'hui <span class="num ${cls(moy)}">${moy>0?"+":""}${sx} %</span></div></div>
        <span class="compte">${c.length}</span></div><div class="membres">${c.map(chip).join("")}</div></section>`; }).join("") +
    (seuls.length? `<details class="groupe famille"><summary><div><h3>Seuls dans leur coin</h3><div class="desc">Ils ne suivent aucune famille.</div></div><span class="compte">${seuls.length}</span></summary><div class="membres">${seuls.map(chip).join("")}</div></details>` : "");
}

/* ---------- Fiche détaillée ---------- */
function ouvrirFiche(t){
  const a = byT[t], m = byT[st.drv]; if(!a||!m) return;
  const w = Math.min(st.win, a.c.length-1), s = stats(fin(R[st.drv],w), fin(R[t],w));
  const ca = a.c.slice(-w-1), cm = m.c.slice(-w-1);
  const na = ca.map(v=>v/ca[0]*100), nm = cm.map(v=>v/cm[0]*100);
  const all = na.concat(nm), lo=Math.min(...all), hi=Math.max(...all), W=600, H=240, P=34;
  const X = i => P + i*(W-P-8)/(na.length-1), Y = v => 10 + (hi-v)*(H-40)/((hi-lo)||1);
  const path = arr => arr.map((v,i)=>(i?"L":"M")+X(i).toFixed(1)+" "+Y(v).toFixed(1)).join("");
  const ticks = [lo,(lo+hi)/2,hi].map(v=>`<text x="${P-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v.toFixed(0)}</text><line x1="${P}" x2="${W-8}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/>`).join("");
  const d0 = D.dates[D.dates.length-1-w]||"", d1 = D.dates[D.dates.length-1]||"";
  const txt = s.r>=0.5 ? "suit fort" : s.r>=0.25 ? "suit un peu" : s.r<=-0.25 ? "va à l'inverse de" : "n'est pas vraiment lié à";
  $("#fiche").innerHTML = `<div role="dialog" aria-modal="true" aria-label="${esc(a.n)}"><button class="ferme" aria-label="Fermer">✕</button>
    <div><div class="label">${esc(a.s)} · ${esc(a.r)} · ${esc(a.t)}</div><h3>${esc(a.n)}</h3></div>
    <p style="margin:0">${esc(a.n)} <b>${txt}</b> ${esc(leMoteur(st.drv))} sur ${PERIODES.find(p=>p[0]===st.win)[1]}.
      Lien ${(s.r*100).toFixed(0)} %. Quand la référence fait +1 %, ${esc(a.n)} fait en moyenne ${s.beta>=0?"+":""}${s.beta.toFixed(2).replace(".",",")} %.</p>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbes comparées">${ticks}
      <path d="${path(nm)}" fill="none" stroke="var(--drv)" stroke-width="2" stroke-dasharray="5 4"/>
      <path d="${path(na)}" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
      <circle cx="${X(na.length-1)}" cy="${Y(na[na.length-1])}" r="4" fill="var(--accent)"/>
      <text x="${P}" y="${H-6}" font-size="11" fill="var(--muted)">${d0}</text><text x="${W-8}" y="${H-6}" font-size="11" text-anchor="end" fill="var(--muted)">${d1}</text></svg>
    <div class="legende"><span style="color:var(--accent)">${esc(a.n)}</span><span style="color:var(--drv)">${esc(nomMoteur(st.drv))}</span><span style="color:var(--muted)">base 100</span></div>
    <div class="stats"><span>Prix <b class="num">${fmtPrix(a.c[a.c.length-1])}</b></span><span>Aujourd'hui <b class="num ${cls(variation(a,1))}">${pct(variation(a,1),2)}</b></span><span>5 jours <b class="num ${cls(variation(a,5))}">${pct(variation(a,5))}</b></span></div>
    <button class="btn" data-ref="${esc(t)}">Voir qui bouge avec ${esc(a.n)}</button></div>`;
  $("#fiche").hidden = false;
}

/* ---------- Contrôles ---------- */
function chips(el, items, cur, key){
  el.innerHTML = items.map(([v,l]) => `<button class="chip" data-k="${key}" data-v="${esc(v)}" aria-pressed="${String(v)===String(cur)}">${esc(l)}</button>`).join("");
}
function rendreCtrl(){
  const mot = MOTEURS.filter(m=>byT[m[0]]).map(m=>[m[0],m[1]]);
  if(!mot.find(m=>m[0]===st.drv) && byT[st.drv]) mot.unshift([st.drv, byT[st.drv].n]);
  chips($("#c-drv"), mot, st.drv, "drv");
  chips($("#c-win"), PERIODES, st.win, "win");
  chips($("#c-type"), TYPES, st.type, "type");
  chips($("#c-reg"), REGIONS.map(r=>[r, r==="Monde"?"Toutes régions":r]), st.reg, "reg");
  document.querySelectorAll(".tab").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab===st.tab)));
  $("#q").hidden = st.tab!=="groupes";
}
function rendreMosaique(){
  const A = D.assets.slice().sort((a,b)=>a.s.localeCompare(b.s,"fr")||a.n.localeCompare(b.n,"fr"));
  $("#mosaique").innerHTML = A.map(a => { const j=variation(a,1);
    return `<button class="tuile${a.t===st.drv?" ref":""}" style="--c:${couleur(a.s)}" data-t="${esc(a.t)}" title="${esc(a.n)} · ${esc(a.s)} · ${pct(j)}" aria-label="${esc(a.n)}"><span class="${j>0.0005?"fl-up":j<-0.0005?"fl-down":""}"></span></button>`; }).join("");
  const fam = [...new Set(A.map(a=>a.s))];
  $("#legende-couleurs").innerHTML = fam.map(f=>`<span style="--c:${couleur(f)}">${esc(f)}</span>`).join("");
}
function tout(){ rendreCtrl(); rendreMosaique(); rendreMoteur(); (st.tab==="groupes"?rendreGroupes:rendreFamilles)(); }

document.addEventListener("click", e => {
  const c = e.target.closest(".chip");
  if(c){ const k=c.dataset.k; st[k] = k==="win" ? +c.dataset.v : c.dataset.v; garder(k, st[k]); tout(); return; }
  const t = e.target.closest(".tab");
  if(t){ st.tab=t.dataset.tab; garder("tab",st.tab); tout(); return; }
  const r = e.target.closest("[data-ref]");
  if(r){ st.drv=r.dataset.ref; garder("drv",st.drv); $("#fiche").hidden=true; tout(); window.scrollTo({top:0,behavior:"smooth"}); return; }
  const it = e.target.closest(".item,.membre,.tuile");
  if(it){ ouvrirFiche(it.dataset.t); return; }
  if(e.target.closest(".ferme") || e.target.id==="fiche") $("#fiche").hidden = true;
});
document.addEventListener("keydown", e => { if(e.key==="Escape") $("#fiche").hidden = true; });
$("#q").addEventListener("input", e => { st.q = e.target.value.trim(); rendreGroupes(); });

fetch("data/marche.json", {cache:"no-cache"}).then(r => { if(!r.ok) throw new Error(r.status); return r.json(); }).then(j => {
  D = j; D.assets.forEach(a => { byT[a.t]=a; R[a.t]=rendements(a.c); });
  if(!byT[st.drv]) st.drv = "CL=F";
  $("#demo").hidden = !D.demo;
  const dt = new Date(D.maj); $("#maj").textContent = "Mis à jour le " + (isNaN(dt)? D.maj : dt.toLocaleString("fr-FR",{dateStyle:"medium",timeStyle:"short"})) + " · " + D.source;
  tout();
}).catch(() => { $("#moteur").innerHTML = '<p class="vide">Impossible de charger les cours. Vérifiez la connexion puis rouvrez l\'application.</p>'; });

if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
