"use strict";
const C={reload:7200,rotate:30,max:14,files:{b:"data/baixados.csv",e:"data/estoque.csv",i:"data/internalizados.csv"},colors:{involuntaria:"#f15357",voluntaria:"#347fe4","Sem.Info":"#73869f"}};
const S={b:[],e:[],i:[],view:"baixados",left:C.rotate};const views=["baixados","estoque-terceiras","estoque-lojas","internalizados","tecnologia"],F=new Intl.NumberFormat("pt-BR");
const $=id=>document.getElementById(id),norm=v=>String(v??"").trim(),n=v=>Number(String(v??0).replace(",","."))||0;
function dt(v){const m=norm(v).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);return m?new Date(+m[3],+m[2]-1,+m[1]):null}function show(d){return d?d.toLocaleDateString("pt-BR"):"Sem dados"}function latest(a,f){return a.map(x=>dt(x[f])).filter(Boolean).sort((x,y)=>y-x)[0]||null}function same(v,d){const x=dt(v);return x&&d&&+x===+d}function sameMonth(v,d){const x=dt(v);return x&&d&&x.getMonth()===d.getMonth()&&x.getFullYear()===d.getFullYear()}function sum(a){return a.reduce((t,x)=>t+n(x.Volume),0)}
function parse(text){text=text.replace(/^\uFEFF/,"");let rows=[],row=[],field="",q=false;for(let i=0;i<text.length;i++){let c=text[i],nx=text[i+1];if(c==='"'&&q&&nx==='"'){field+='"';i++}else if(c==='"')q=!q;else if(c===';'&&!q){row.push(field);field=""}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&nx==='\n')i++;row.push(field);if(row.some(Boolean))rows.push(row);row=[];field=""}else field+=c}if(field||row.length){row.push(field);rows.push(row)}const h=(rows.shift()||[]).map(norm);return rows.map(r=>Object.fromEntries(h.map((x,i)=>[x,norm(r[i])])))}async function csv(url){const r=await fetch(url+"?v="+Date.now(),{cache:"no-store"});if(!r.ok)throw Error(url+": HTTP "+r.status);return parse(await r.text())}
function group(a,label){const m=new Map;a.forEach(r=>{let k=norm(r[label])||"Sem.Info",raw=norm(r.Tipo_Desconexao).toLowerCase(),t=raw==="voluntaria"?"voluntaria":raw==="involuntaria"?"involuntaria":"Sem.Info";if(!m.has(k))m.set(k,{label:k,voluntaria:0,involuntaria:0,"Sem.Info":0,total:0});let o=m.get(k),v=n(r.Volume);o[t]+=v;o.total+=v});return [...m.values()].sort((a,b)=>b.total-a.total)}function simple(a,label){const m=new Map;a.forEach(r=>{let k=norm(r[label])||"Sem.Info";m.set(k,(m.get(k)||0)+n(r.Volume))});return [...m].map(([label,total])=>({label,total,voluntaria:total,involuntaria:0,"Sem.Info":0})).sort((a,b)=>b.total-a.total)}
function data(view){if(view==="baixados"){let d=latest(S.b,"Data_Baixa");return{tag:"BAIXADOS",title:`Volume por agente — ${show(d)}`,rows:group(S.b.filter(r=>same(r.Data_Baixa,d)),"Armazem_Agrupado"),chart:"bar",comp:"Tipo de desconexão"}}if(view==="estoque-terceiras")return{tag:"ESTOQUE D-1",title:"Concentração do estoque por terceira",rows:group(S.e.filter(r=>r.Tipo_Armazem==="TERCEIROS COLETA"),"Armazem_Exibicao"),chart:"tree",comp:"Tipo de desconexão"};if(view==="estoque-lojas")return{tag:"ESTOQUE D-1",title:"Mapa de calor — Top lojas",rows:group(S.e.filter(r=>r.Tipo_Armazem==="ALARES LOJA"),"Armazem_Exibicao"),chart:"storetree",comp:"Tipo de desconexão"};if(view==="internalizados"){let d=latest(S.i,"Data_Internalizacao");return{tag:"INTERNALIZADOS",title:`Volume por origem — ${show(d)}`,rows:group(S.i.filter(r=>same(r.Data_Internalizacao,d)),"Armazem_Agrupado_Origem"),chart:"bar",comp:"Tipo de desconexão"}}let d=latest(S.i,"Data_Internalizacao");return{tag:"TECNOLOGIA",title:`Volume internalizado no dia por tecnologia — ${show(d)}`,rows:simple(S.i.filter(r=>same(r.Data_Internalizacao,d)),"Tecnologia"),chart:"vertical",comp:"Participação no dia",simple:true}}
function stack(r,labels=false,viewTotal=0,maxRow=0){
  return ["involuntaria","voluntaria","Sem.Info"].map(k=>{
    if(!r[k])return "";
    const pctRow=r.total?r[k]/r.total*100:0;
    const pctTotal=viewTotal?r[k]/viewTotal*100:0;
    const visual=maxRow?r[k]/maxRow*100:0;
    const showLabel=labels&&visual>=7;
    const txt=showLabel?`<b>${F.format(r[k])} <em>/</em> ${pctTotal.toFixed(1).replace(".",",")}%</b>`:"";
    return `<i class="seg" title="${k}: ${F.format(r[k])} / ${pctTotal.toFixed(1).replace(".",",")}% do total da visão" style="width:${pctRow}%;background:${C.colors[k]}">${txt}</i>`
  }).join("")
}
function stockCards(rows,limit=9){
  if(rows.length<=limit)return rows;
  const visible=rows.slice(0,limit-1),rest=rows.slice(limit-1);
  const other=rest.reduce((a,r)=>{a.voluntaria+=r.voluntaria;a.involuntaria+=r.involuntaria;a["Sem.Info"]+=r["Sem.Info"];a.total+=r.total;return a},{label:`DEMAIS (${rest.length})`,voluntaria:0,involuntaria:0,"Sem.Info":0,total:0});
  return [...visible,other]
}
function stockCardHtml(rows){
  const max=rows[0]?.total||1;
  return rows.map((r,i)=>{
    const share=r.total/max;
    const size=share>=.65?"xl":share>=.32?"lg":share>=.16?"md":"sm";
    const details=["involuntaria","voluntaria","Sem.Info"].filter(k=>r[k]>0).map(k=>`<span><i style="background:${C.colors[k]}"></i>${k}: <b>${F.format(r[k])} / ${(r[k]/r.total*100).toFixed(1).replace(".",",")}%</b></span>`).join("");
    return `<article class="stock-card ${size}"><div class="stock-head"><span title="${r.label}">${r.label}</span><strong>${F.format(r.total)}</strong></div><div class="stock-details">${details}</div><div class="stack">${stack(r)}</div></article>`
  }).join("")
}
function render(){
  const v=data(S.view),all=v.rows,rows=all.slice(0,C.max),max=Math.max(...rows.map(r=>r.total),1),viewTotal=all.reduce((t,r)=>t+r.total,0);
  $("rotuloGrafico").textContent=v.tag;$("tituloGrafico").textContent=v.title;$("nomeVisao").textContent=v.title;$("tituloComposicao").textContent=v.comp;
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===S.view));
  $("legendaGrafico").innerHTML=v.simple?'<span><i style="background:#8f63ed"></i>Volume</span>':Object.entries(C.colors).map(([k,c])=>`<span><i style="background:${c}"></i>${k}</span>`).join("");
  let g=$("graficoPrincipal");
  if(!rows.length){g.className="bar-chart";g.innerHTML='<div class="empty">Nenhum dado disponível.</div>'}
  else if(v.chart==="tree"||v.chart==="storetree"){
    const cards=stockCards(all,v.chart==="storetree"?10:9);
    g.className="stock-grid";g.innerHTML=stockCardHtml(cards)
  }
  else if(v.chart==="vertical"){g.className="vertical";g.innerHTML=rows.slice(0,10).map(r=>`<div class="vitem"><span class="vvalue">${F.format(r.total)}</span><div class="vtrack"><i style="height:${r.total/max*100}%"></i></div><span class="vlabel" title="${r.label}">${r.label}</span></div>`).join("")}
  else{g.className="bar-chart";g.innerHTML=rows.map(r=>`<div class="bar-row"><span class="blabel" title="${r.label}">${r.label}</span><div class="btrack"><div class="bfill" style="width:${r.total/max*100}%">${stack(r,true,viewTotal,max)}</div></div><span class="bvalue">${F.format(r.total)}</span></div>`).join("")}
  let totals=v.simple?{total:viewTotal}:all.reduce((a,r)=>{for(const k of["involuntaria","voluntaria","Sem.Info"])a[k]+=r[k];a.total+=r.total;return a},{involuntaria:0,voluntaria:0,"Sem.Info":0,total:0});
  $("composicao").innerHTML=(v.simple?all.slice(0,5).map(r=>[r.label,r.total,"#8f63ed"]):["involuntaria","voluntaria","Sem.Info"].map(k=>[k,totals[k],C.colors[k]])).map(([k,val,col])=>`<div class="comp"><div class="chead"><span>${k}</span><b>${F.format(val)}</b></div><div class="ctrack"><i style="width:${totals.total?val/totals.total*100:0}%;background:${col}"></i></div></div>`).join("");
  $("totalVisao").textContent=F.format(totals.total);$("maiorAgente").textContent=all[0]?.label||"—";$("maiorAgenteValor").textContent=F.format(all[0]?.total||0)+" equipamentos";$("ticker").innerHTML=all.slice(0,10).map((r,i)=>`<span><b>${i+1}º ${r.label}</b> | Volume: ${F.format(r.total)}</span>`).join("")
}
function kpis(){let db=latest(S.b,"Data_Baixa"),di=latest(S.i,"Data_Internalizacao");$("kpiBaixadosHoje").textContent=F.format(sum(S.b.filter(r=>same(r.Data_Baixa,db))));$("kpiBaixadosMes").textContent=F.format(sum(S.b.filter(r=>sameMonth(r.Data_Baixa,db))));$("subBaixadosHoje").textContent=show(db);$("subBaixadosMes").textContent=db?`Competência ${String(db.getMonth()+1).padStart(2,"0")}/${db.getFullYear()}`:"Sem dados";$("kpiEstoque").textContent=F.format(sum(S.e));$("kpiInternalizadosHoje").textContent=F.format(sum(S.i.filter(r=>same(r.Data_Internalizacao,di))));$("kpiInternalizadosMes").textContent=F.format(sum(S.i.filter(r=>sameMonth(r.Data_Internalizacao,di))));$("subInternalizadosHoje").textContent=show(di);$("subInternalizadosMes").textContent=di?`Competência ${String(di.getMonth()+1).padStart(2,"0")}/${di.getFullYear()}`:"Sem dados";$("dataBase").textContent=show([db,di].filter(Boolean).sort((a,b)=>b-a)[0])}
function setView(v){S.view=v;S.left=C.rotate;render()}function timers(){setInterval(()=>$("relogio").textContent=new Date().toLocaleString("pt-BR"),1000);let r=C.reload;setInterval(()=>{r--;let h=String(Math.floor(r/3600)).padStart(2,"0"),m=String(Math.floor(r%3600/60)).padStart(2,"0"),s=String(r%60).padStart(2,"0");$("contadorRefresh").textContent=`${h}:${m}:${s}`;if(r<=0)location.reload()},1000);setInterval(()=>{S.left--;$("contadorVisao").textContent=S.left+"s";if(S.left<=0)setView(views[(views.indexOf(S.view)+1)%views.length])},1000)}
async function init(){timers();document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>setView(b.dataset.view));try{[S.b,S.e,S.i]=await Promise.all([csv(C.files.b),csv(C.files.e),csv(C.files.i)]);kpis();render();$("statusBase").className="status ok";$("statusBase").textContent="ATUALIZADO"}catch(e){console.error(e);$("statusBase").className="status bad";$("statusBase").textContent="ERRO NA BASE";$("erroGlobal").hidden=false;$("erroGlobal").textContent="Falha ao carregar os CSVs: "+e.message}}init();
