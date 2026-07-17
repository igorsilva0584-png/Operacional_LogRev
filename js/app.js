"use strict";

const CONFIG = {
  reloadMs: 2 * 60 * 60 * 1000,
  rotateSeconds: 30,
  maxBars: 14,
  files: {
    baixados: "data/baixados.csv",
    estoque: "data/estoque.csv",
    internalizados: "data/internalizados.csv"
  },
  colors: { involuntaria: "#ef5350", voluntaria: "#2f80ed", "Sem.Info": "#73849b" }
};

const state = { baixados: [], estoque: [], internalizados: [], view: "baixados", rotateLeft: CONFIG.rotateSeconds };
const views = ["baixados", "estoque-terceiras", "estoque-lojas", "internalizados", "tecnologia"];
const fmt = new Intl.NumberFormat("pt-BR");

function normalize(v){ return String(v ?? "").trim(); }
function num(v){ const n = Number(String(v ?? "0").replace(",", ".")); return Number.isFinite(n) ? n : 0; }
function dateBR(v){
  const m = normalize(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(Number(m[3]), Number(m[2])-1, Number(m[1])) : null;
}
function csvParse(text){
  text = text.replace(/^\uFEFF/, "");
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], n=text[i+1];
    if(c==='"' && quoted && n==='"'){ field+='"'; i++; }
    else if(c==='"'){ quoted=!quoted; }
    else if(c===';' && !quoted){ row.push(field); field=""; }
    else if((c==='\n'||c==='\r') && !quoted){
      if(c==='\r'&&n==='\n') i++;
      row.push(field); if(row.some(x=>x!=="")) rows.push(row); row=[]; field="";
    } else field+=c;
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  const headers=(rows.shift()||[]).map(normalize);
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,normalize(r[i])] )));
}
async function loadCsv(url){
  const res=await fetch(`${url}?v=${Date.now()}`, {cache:"no-store"});
  if(!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return csvParse(await res.text());
}
function sum(rows){ return rows.reduce((a,r)=>a+num(r.Volume),0); }
function latestDate(rows, field){ return rows.map(r=>dateBR(r[field])).filter(Boolean).sort((a,b)=>b-a)[0]||null; }
function sameDate(v,d){ const x=dateBR(v); return x&&d&&x.getTime()===d.getTime(); }
function monthKey(d){ return d ? `${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}` : ""; }
function sameMonth(v,d){ const x=dateBR(v); return x&&d&&x.getMonth()===d.getMonth()&&x.getFullYear()===d.getFullYear(); }
function showDate(d){ return d ? d.toLocaleDateString("pt-BR") : "Sem dados"; }
function group(rows, labelField, typeField="Tipo_Desconexao"){
  const map=new Map();
  rows.forEach(r=>{
    const label=normalize(r[labelField])||"Sem.Info";
    const typRaw=normalize(r[typeField]);
    const typ=typRaw.toLowerCase()==="voluntaria"?"voluntaria":typRaw.toLowerCase()==="involuntaria"?"involuntaria":"Sem.Info";
    if(!map.has(label)) map.set(label,{label,voluntaria:0,involuntaria:0,"Sem.Info":0,total:0});
    const o=map.get(label), v=num(r.Volume); o[typ]+=v; o.total+=v;
  });
  return [...map.values()].sort((a,b)=>b.total-a.total);
}
function groupSimple(rows,labelField){
  const map=new Map(); rows.forEach(r=>{const k=normalize(r[labelField])||"Sem.Info";map.set(k,(map.get(k)||0)+num(r.Volume));});
  return [...map].map(([label,total])=>({label,total,voluntaria:total,involuntaria:0,"Sem.Info":0})).sort((a,b)=>b.total-a.total);
}
function setText(id,v){document.getElementById(id).textContent=v;}
function updateKpis(){
  const db=latestDate(state.baixados,"Data_Baixa"), di=latestDate(state.internalizados,"Data_Internalizacao");
  setText("kpiBaixadosHoje",fmt.format(sum(state.baixados.filter(r=>sameDate(r.Data_Baixa,db)))));
  setText("kpiBaixadosMes",fmt.format(sum(state.baixados.filter(r=>sameMonth(r.Data_Baixa,db)))));
  setText("subBaixadosHoje",showDate(db)); setText("subBaixadosMes",db?`Competência ${monthKey(db)}`:"Sem dados");
  setText("kpiEstoque",fmt.format(sum(state.estoque)));
  setText("kpiInternalizadosHoje",fmt.format(sum(state.internalizados.filter(r=>sameDate(r.Data_Internalizacao,di)))));
  setText("kpiInternalizadosMes",fmt.format(sum(state.internalizados.filter(r=>sameMonth(r.Data_Internalizacao,di)))));
  setText("subInternalizadosHoje",showDate(di)); setText("subInternalizadosMes",di?`Competência ${monthKey(di)}`:"Sem dados");
  const dates=[db,di].filter(Boolean).sort((a,b)=>b-a); setText("dataBase",dates[0]?showDate(dates[0]):"Sem dados");
}
function viewData(view){
  if(view==="baixados"){
    const d=latestDate(state.baixados,"Data_Baixa"); return {tag:"BAIXADOS",title:`Volume por agente — ${showDate(d)}`,rows:group(state.baixados.filter(r=>sameDate(r.Data_Baixa,d)),"Armazem_Agrupado"),comp:"Tipo de desconexão"};
  }
  if(view==="estoque-terceiras") return {tag:"ESTOQUE D-1",title:"Estoque por terceira",rows:group(state.estoque.filter(r=>r.Tipo_Armazem==="TERCEIROS COLETA"),"Armazem_Exibicao"),comp:"Tipo de desconexão"};
  if(view==="estoque-lojas") return {tag:"ESTOQUE D-1",title:"Top lojas por estoque",rows:group(state.estoque.filter(r=>r.Tipo_Armazem==="ALARES LOJA"),"Armazem_Exibicao"),comp:"Tipo de desconexão"};
  if(view==="internalizados"){
    const d=latestDate(state.internalizados,"Data_Internalizacao"); return {tag:"INTERNALIZADOS",title:`Volume por origem — ${showDate(d)}`,rows:group(state.internalizados.filter(r=>sameDate(r.Data_Internalizacao,d)),"Armazem_Agrupado_Origem"),comp:"Tipo de desconexão"};
  }
  const d=latestDate(state.internalizados,"Data_Internalizacao"); return {tag:"TECNOLOGIA",title:"Internalizados no mês por tecnologia",rows:groupSimple(state.internalizados.filter(r=>sameMonth(r.Data_Internalizacao,d)),"Tecnologia"),comp:"Participação por tecnologia",simple:true};
}
function render(){
  const v=viewData(state.view), rows=v.rows.slice(0,CONFIG.maxBars), max=Math.max(...rows.map(r=>r.total),1);
  setText("rotuloGrafico",v.tag); setText("tituloGrafico",v.title); setText("tituloComposicao",v.comp); setText("nomeVisao",v.title);
  document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b.dataset.view===state.view));
  const legend=document.getElementById("legendaGrafico");
  legend.innerHTML=v.simple?'<span class="legend-item"><i class="legend-dot" style="background:#9b6cf6"></i>Volume</span>':Object.entries(CONFIG.colors).map(([k,c])=>`<span class="legend-item"><i class="legend-dot" style="background:${c}"></i>${k}</span>`).join("");
  const chart=document.getElementById("graficoPrincipal");
  if(!rows.length) chart.innerHTML='<div class="empty">Nenhum dado disponível para esta visão.</div>';
  else chart.innerHTML=rows.map(r=>{
    const segs=v.simple?`<span class="bar-segment" style="width:${r.total/max*100}%;background:#9b6cf6"></span>`:["involuntaria","voluntaria","Sem.Info"].map(k=>`<span class="bar-segment" title="${k}: ${fmt.format(r[k])}" style="width:${r[k]/max*100}%;background:${CONFIG.colors[k]}"></span>`).join("");
    return `<div class="bar-row"><span class="bar-label" title="${r.label}">${r.label}</span><div class="bar-track">${segs}</div><span class="bar-value">${fmt.format(r.total)}</span></div>`;
  }).join("");
  const totals=v.simple?rows.reduce((a,r)=>(a.total+=r.total,a),{total:0}):rows.reduce((a,r)=>{a.voluntaria+=r.voluntaria;a.involuntaria+=r.involuntaria;a["Sem.Info"]+=r["Sem.Info"];a.total+=r.total;return a;},{voluntaria:0,involuntaria:0,"Sem.Info":0,total:0});
  const comp=document.getElementById("composicao");
  if(v.simple){
    comp.innerHTML=rows.slice(0,5).map((r,i)=>`<div class="comp-row"><div class="comp-head"><span class="comp-name">${r.label}</span><span class="comp-number">${fmt.format(r.total)}</span></div><div class="comp-bar"><div class="comp-fill" style="width:${totals.total?r.total/totals.total*100:0}%;background:#9b6cf6"></div></div></div>`).join("");
  } else {
    comp.innerHTML=["involuntaria","voluntaria","Sem.Info"].map(k=>`<div class="comp-row"><div class="comp-head"><span class="comp-name">${k}</span><span class="comp-number">${fmt.format(totals[k])}</span></div><div class="comp-bar"><div class="comp-fill" style="width:${totals.total?totals[k]/totals.total*100:0}%;background:${CONFIG.colors[k]}"></div></div></div>`).join("");
  }
  setText("totalVisao",fmt.format(totals.total)); setText("maiorAgente",rows[0]?.label||"—"); setText("maiorAgenteValor",`${fmt.format(rows[0]?.total||0)} equipamentos`);
  document.getElementById("ticker").innerHTML=rows.slice(0,10).map((r,i)=>`<span><b>${i+1}º ${r.label}</b> | Volume: ${fmt.format(r.total)}</span>`).join("");
}
function setView(view){state.view=view;state.rotateLeft=CONFIG.rotateSeconds;render();}
function startTimers(){
  setInterval(()=>setText("relogio",new Date().toLocaleString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"})),1000);
  let reloadLeft=Math.floor(CONFIG.reloadMs/1000);
  setInterval(()=>{reloadLeft--;const h=String(Math.floor(reloadLeft/3600)).padStart(2,"0"),m=String(Math.floor(reloadLeft%3600/60)).padStart(2,"0"),s=String(reloadLeft%60).padStart(2,"0");setText("contadorRefresh",`${h}:${m}:${s}`);if(reloadLeft<=0)location.reload();},1000);
  setInterval(()=>{state.rotateLeft--;setText("contadorVisao",`${state.rotateLeft}s`);if(state.rotateLeft<=0){setView(views[(views.indexOf(state.view)+1)%views.length]);}},1000);
}
async function init(){
  startTimers(); document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  try{
    [state.baixados,state.estoque,state.internalizados]=await Promise.all([loadCsv(CONFIG.files.baixados),loadCsv(CONFIG.files.estoque),loadCsv(CONFIG.files.internalizados)]);
    updateKpis();render(); const s=document.getElementById("statusBase");s.className="status status-ok";s.textContent="ATUALIZADO";
  }catch(e){
    console.error(e);const s=document.getElementById("statusBase");s.className="status status-error";s.textContent="ERRO NA BASE";
    const banner=document.getElementById("erroGlobal");banner.hidden=false;banner.textContent=`Não foi possível carregar os CSVs. Verifique os arquivos na pasta data. Detalhe: ${e.message}`;
  }
}
init();
