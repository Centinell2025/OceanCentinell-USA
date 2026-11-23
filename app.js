"use strict";
const KEY="oceancentinell-usa-v1";
const MAX_ROWS=1000, MAX_TEXT=4000;
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
const currentDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")};
const KINDS=["vessels","assets","incidents","maintenance"];
const SCHEMA={
 vessels:[["name","Vessel name","text",true],["identifier","Registration / IMO","text",true],["type","Vessel type","text",false],["location","Last reported location","text",false],["status","Status","select:Operational|Warning|Out of service",true]],
 assets:[["name","Asset name","text",true],["category","Category","text",true],["vessel","Assigned vessel","text",false],["serial","Serial / reference","text",false],["status","Status","select:Operational|Warning|Out of service",true]],
 incidents:[["title","Incident title","text",true],["vessel","Vessel / location","text",false],["severity","Severity","select:Low|Medium|High|Critical",true],["status","Status","select:Open|In progress|Resolved",true],["details","Notes","textarea",false]],
 maintenance:[["title","Task title","text",true],["asset","Asset / vessel","text",false],["due","Due date","date",true],["status","Status","select:Planned|In progress|Completed",true],["notes","Notes","textarea",false]]
};
const empty=()=>({vessels:[],assets:[],incidents:[],maintenance:[]});
function validData(v){
 if(!v||typeof v!=="object"||Array.isArray(v))return false;
 const ids=new Set();
 return KINDS.every(k=>Array.isArray(v[k])&&v[k].length<=MAX_ROWS&&v[k].every(row=>{
  if(!row||typeof row!=="object"||Array.isArray(row)||typeof row.id!=="string"||!/^[-a-zA-Z0-9]{1,100}$/.test(row.id)||ids.has(row.id))return false;
  ids.add(row.id);
  return SCHEMA[k].every(([field,,type,required])=>{
   const value=row[field];if(value===undefined||value===null)return !required;
   if(typeof value!=="string"||value.length>(type==="textarea"?MAX_TEXT:180))return false;
   if(required&&!value.trim())return false;
   if(type.startsWith("select:")&&!type.slice(7).split("|").includes(value))return false;
   if(type==="date"&&!validDate(value))return false;
   return true;
  });
 }));
}
function load(){try{const v=JSON.parse(localStorage.getItem(KEY));return validData(v)?v:empty()}catch{return empty()}}
let db=load(),page="overview",editing=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function commit(next){
 if(!validData(next)){notify("Invalid record data or record limit exceeded.");return false}
 try{localStorage.setItem(KEY,JSON.stringify(next));db=next;render();return true}
 catch{notify("Storage unavailable or full. Export your data.");return false}
}
function notify(message){const e=$("toast");e.textContent=message;e.classList.remove("hidden");clearTimeout(notify.timer);notify.timer=setTimeout(()=>e.classList.add("hidden"),3200)}
function badge(v){return '<span class="badge '+esc(String(v).toLowerCase().replace(/[^a-z]+/g,"-"))+'">'+esc(v)+'</span>'}
const today=currentDate;
const overdue=x=>x.due&&x.due<today()&&x.status!=="Completed";
function drawOverview(){
 $("kVessels").textContent=db.vessels.length;$("kAssets").textContent=db.assets.length;$("kIncidents").textContent=db.incidents.filter(x=>x.status!=="Resolved").length;$("kOverdue").textContent=db.maintenance.filter(overdue).length;
 const inc=db.incidents.filter(x=>x.status!=="Resolved").slice(-5).reverse();
 $("recentIncidents").innerHTML=inc.length?inc.map(x=>'<div class="rowitem"><div><strong>'+esc(x.title)+'</strong><div class="muted">'+esc(x.vessel||"Unassigned")+'</div></div>'+badge(x.severity)+'</div>').join(""):'<div class="empty">No open incidents recorded.</div>';
 const tasks=[...db.maintenance].filter(x=>x.status!=="Completed").sort((a,b)=>(a.due||"").localeCompare(b.due||"")).slice(0,5);
 $("upcomingMaintenance").innerHTML=tasks.length?tasks.map(x=>'<div class="rowitem"><div><strong>'+esc(x.title)+'</strong><div class="muted">'+esc(x.due||"Not scheduled")+'</div></div>'+badge(overdue(x)?"Overdue":x.status)+'</div>').join(""):'<div class="empty">No pending maintenance.</div>';
}
function drawTable(kind){
 const term=document.querySelector('[data-search="'+kind+'"]').value.trim().toLowerCase();
 const fields=SCHEMA[kind].filter(x=>x[2]!=="textarea").slice(0,4);
 const data=db[kind].filter(x=>Object.values(x).some(v=>String(v??"").toLowerCase().includes(term)));
 let h='<table class="data"><thead><tr>'+fields.map(f=>'<th>'+esc(f[1])+'</th>').join("")+'<th>Actions</th></tr></thead><tbody>';
 h+=data.map(x=>'<tr>'+fields.map(f=>'<td>'+(f[0]==="status"||f[0]==="severity"?badge(x[f[0]]||"—"):esc(x[f[0]]||"—"))+'</td>').join("")+'<td><button class="smallbtn" data-action="edit" data-kind="'+kind+'" data-id="'+esc(x.id)+'">Edit</button><button class="smallbtn" data-action="delete" data-kind="'+kind+'" data-id="'+esc(x.id)+'">Delete</button></td></tr>').join("");
 h+='</tbody></table>';$(kind+"Table").innerHTML=data.length?h:'<div class="empty">No matching records. Select “Add” to create one.</div>';
}
function render(){drawOverview();KINDS.forEach(drawTable)}
const titles={overview:["Maritime overview","Manage your fleet operations in one workspace."],vessels:["Vessel registry","Register vessels and record their reported status."],assets:["Asset management","Track equipment, ownership and condition."],incidents:["Incident command log","Document operational incidents and resolution."],maintenance:["Maintenance planner","Schedule and follow up on preventive tasks."],network:["Network & OT Architecture","Visualize connectivity planning and security boundaries."],threats:["Cyber Threat Intelligence","Maritime security planning and incident response."],compliance:["Compliance & Governance","Track frameworks and evidence readiness."],reports:["Reports & data","Export reports and manage local backups."]};
function go(p){page=p;document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===p));document.querySelectorAll("[data-page]").forEach(x=>x.setAttribute("aria-current",x.dataset.page===p?"page":"false"));$("pageTitle").textContent=titles[p][0];$("subtitle").textContent=titles[p][1];$("addBtn").classList.toggle("hidden",!KINDS.includes(p));$("addBtn").textContent="+ Add "+({vessels:"vessel",assets:"asset",incidents:"incident",maintenance:"task"}[p]||"");}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
document.querySelectorAll("[data-search]").forEach(b=>b.addEventListener("input",()=>drawTable(b.dataset.search)));
function openForm(kind,id=null){editing={kind,id};const original=id?db[kind].find(x=>x.id===id):null;if(id&&!original)return;$("dialogTitle").textContent=(id?"Edit ":"Add ")+({vessels:"vessel",assets:"asset",incidents:"incident",maintenance:"maintenance task"}[kind]);const wrap=$("formFields");wrap.replaceChildren();
 for(const [key,label,type,required] of SCHEMA[kind]){const d=document.createElement("div");d.className="field"+(type==="textarea"?" full":"");const l=document.createElement("label");l.htmlFor="field-"+key;l.textContent=label;let e;if(type==="textarea")e=document.createElement("textarea");else if(type.startsWith("select:")){e=document.createElement("select");for(const option of type.slice(7).split("|")){const o=document.createElement("option");o.value=option;o.textContent=option;e.append(o)}}else{e=document.createElement("input");e.type=type;e.maxLength=180}if(type==="textarea")e.maxLength=MAX_TEXT;e.name=key;e.id="field-"+key;e.required=required;if(original&&original[key]!==undefined)e.value=original[key];else if(key==="due")e.value=today();d.append(l,e);wrap.append(d)}$("editor").showModal()}
$("addBtn").addEventListener("click",()=>openForm(page));
$("cancelModal").addEventListener("click",()=>$("editor").close());
$("recordForm").addEventListener("submit",e=>{e.preventDefault();if(!editing)return;const {kind,id}=editing;const values={};for(const [key] of SCHEMA[kind])values[key]=String(new FormData(e.currentTarget).get(key)||"").trim();const record={id:id||crypto.randomUUID(),...values,updatedAt:new Date().toISOString()};const next={...db,[kind]:id?db[kind].map(x=>x.id===id?record:x):[...db[kind],record]};if(commit(next)){$("editor").close();notify("Record saved locally.")}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-action]");if(!b)return;const {kind,id,action}=b.dataset;if(!KINDS.includes(kind))return;if(action==="edit")openForm(kind,id);if(action==="delete"&&confirm("Delete this record permanently from this browser?")){if(commit({...db,[kind]:db[kind].filter(x=>x.id!==id)}))notify("Record deleted.")}});
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
$("exportJson").addEventListener("click",()=>download("oceancentinell-usa-backup.json",JSON.stringify({app:"OceanCentinell-USA",version:1,exportedAt:new Date().toISOString(),data:db},null,2),"application/json"));
$("exportCsv").addEventListener("click",()=>{const kind=$("csvType").value;const cols=["id",...SCHEMA[kind].map(f=>f[0]),"updatedAt"];const csv=[cols.join(","),...db[kind].map(x=>cols.map(k=>{const raw=String(x[k]??"");const safe=/^[\s\u0000-\u001f]*[=+@\-]/.test(raw)?"'"+raw:raw;return '"'+safe.replace(/"/g,'""')+'"'}).join(","))].join("\r\n");download("oceancentinell-"+kind+".csv",csv,"text/csv;charset=utf-8")});
$("importFile").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5e6)throw Error("Backup exceeds 5 MB");const obj=JSON.parse(await file.text());if(obj.app!=="OceanCentinell-USA"||obj.version!==1||!validData(obj.data))throw Error("Unrecognized backup format");if(confirm("Replace all current local records with this backup?")){if(commit(obj.data))notify("Backup restored.")}}catch(err){notify("Import failed: "+err.message)}e.target.value=""});
$("clearAll").addEventListener("click",()=>{if(confirm("Delete ALL local OceanCentinell records? This cannot be undone.")){if(commit(empty()))notify("All local records deleted.")}});
$("demoBtn").addEventListener("click",()=>{if(KINDS.some(k=>db[k].length)&&!confirm("Replace current records with sample demo data?"))return;const uid=()=>crypto.randomUUID();const next={vessels:[{id:uid(),name:"Atlantic Pioneer",identifier:"US-DEMO-001",type:"Workboat",location:"Jacksonville, FL (sample)",status:"Operational"},{id:uid(),name:"Harbor Sentinel",identifier:"US-DEMO-002",type:"Service vessel",location:"Miami, FL (sample)",status:"Warning"}],assets:[{id:uid(),name:"Primary VHF radio",category:"Communications",vessel:"Atlantic Pioneer",serial:"DEMO-VHF-1",status:"Operational"},{id:uid(),name:"Backup generator",category:"Power",vessel:"Harbor Sentinel",serial:"DEMO-GEN-2",status:"Warning"}],incidents:[{id:uid(),title:"Generator inspection requested",vessel:"Harbor Sentinel",severity:"Medium",status:"Open",details:"Illustrative record only."}],maintenance:[{id:uid(),title:"VHF equipment check",asset:"Atlantic Pioneer",due:today(),status:"Planned",notes:"Illustrative record only."}]};if(commit(next))notify("Sample records loaded. Not real vessel data.")});
$("year").textContent=new Date().getFullYear();render();go("overview");if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
