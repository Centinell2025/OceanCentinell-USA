(function(){
'use strict';
const C=window.OceanCore,KEY='oceancentinell-evaluation-v1';
const $=id=>document.getElementById(id),E=C.esc;
const names={overview:'Command center',vessels:'Vessel registry',assets:'Asset inventory',incidents:'Incident log',maintenance:'Maintenance',network:'Network & OT',reports:'Reports & backups',evaluation:'Company evaluation'};
const subtitles={overview:'A clear view of your local operational records.',vessels:'Identify vessels and maintain manually reported conditions.',assets:'Keep equipment, assignment and recorded condition together.',incidents:'Document observations and follow each item through resolution.',maintenance:'Plan follow-up and track due dates from local records.',network:'Define an authorized integration scope before connecting systems.',reports:'Review, export and preserve your operational records.',evaluation:'Explore the workflow and prepare a company pilot brief.'};
let db=C.empty(),page='overview',editing=null,blocked=false,toastTimer;
function notice(message){$('storageNotice').textContent=message;$('storageNotice').classList.remove('hidden');}
function toast(message){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),6000);}
function load(){
  try{const raw=localStorage.getItem(KEY);if(raw!==null){db=C.normalizeData(JSON.parse(raw));return;}db=C.sampleData();localStorage.setItem(KEY,JSON.stringify(db));}
  catch(error){blocked=true;notice('Local storage could not be read or saved. Existing storage has been preserved. Edits and imports are paused; use a browser with local storage enabled. '+error.message);}
}
function commit(next){
  if(blocked){toast('Saving is paused because local storage is unavailable.');return false;}
  try{const safe=C.normalizeData(next);localStorage.setItem(KEY,JSON.stringify(safe));db=safe;render();return true;}
  catch(error){toast('Not saved. '+error.message);return false;}
}
function badge(value){return '<span class="badge '+E(String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'">'+E(value)+'</span>';}
function go(target,focus=false){
  if(!Object.hasOwn(names,target))target='overview';page=target;
  document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===page));
  document.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  $('pageTitle').textContent=names[page];$('breadcrumb').textContent=names[page];$('subtitle').textContent=subtitles[page];$('addBtn').classList.toggle('hidden',!C.KINDS.includes(page));
  if(location.hash!=='#'+page)history.replaceState(null,'','#'+page);
  if(page==='reports')$('reportPreview').textContent=C.report(db);
  if(focus){$('main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function render(){
 const s=C.stats(db);$('kVessels').textContent=s.vessels;$('kAssets').textContent=s.assets;$('kIncidents').textContent=s.open;$('kOverdue').textContent=s.overdue;
 $('fleetCards').innerHTML=db.vessels.slice(0,4).map(r=>'<div class="fleet-row"><span class="fleet-icon" aria-hidden="true">⚓</span><div class="row-main"><strong>'+E(r.name)+'</strong><small>'+E(r.location||'Location not recorded')+'</small></div>'+badge(r.status)+'</div>').join('')||'<p class="empty">No vessels recorded. Add a vessel to begin.</p>';
 $('severityChart').innerHTML=s.bySeverity.map(r=>'<div class="chart-row '+r.label.toLowerCase()+'"><span>'+r.label+'</span><progress max="'+Math.max(s.open,1)+'" value="'+r.count+'" aria-label="'+r.label+' incidents: '+r.count+'"></progress><strong>'+r.count+'</strong></div>').join('');
 $('severityChart').setAttribute('aria-label',s.bySeverity.map(r=>r.label+': '+r.count).join(', '));
 $('recentIncidents').innerHTML=db.incidents.filter(r=>r.status!=='Resolved').sort((a,b)=>['Low','Medium','High','Critical'].indexOf(b.severity)-['Low','Medium','High','Critical'].indexOf(a.severity)).slice(0,4).map(r=>'<div class="rowitem"><div class="row-main"><strong>'+E(r.title)+'</strong><small>'+E(r.vessel||'Vessel not recorded')+' · '+E(r.status)+'</small></div>'+badge(r.severity)+'</div>').join('')||'<p class="empty">No unresolved incidents recorded.</p>';
 $('upcomingMaintenance').innerHTML=db.maintenance.filter(r=>r.status!=='Completed').sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4).map(r=>'<div class="rowitem"><div class="row-main"><strong>'+E(r.title)+'</strong><small>'+E(r.asset||'Asset not recorded')+'</small></div>'+badge(r.due<C.dateKey()?'Overdue':r.due)+'</div>').join('')||'<p class="empty">No pending maintenance recorded.</p>';
 C.KINDS.forEach(renderTable);if(page==='reports')$('reportPreview').textContent=C.report(db);
}
function renderTable(kind){
 const query=(document.querySelector('[data-search="'+kind+'"]').value||'').trim().toLowerCase();
 const rows=db[kind].filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(query)));
 const columns=C.SCHEMA[kind].filter(f=>f[2]!=='textarea');
 $(''+kind+'Table').innerHTML='<table><caption class="sr-only">'+names[kind]+' — '+rows.length+' records shown</caption><thead><tr>'+columns.map(f=>'<th scope="col">'+E(f[1])+'</th>').join('')+'<th scope="col">Source</th><th scope="col">Actions</th></tr></thead><tbody>'+rows.map(r=>'<tr>'+columns.map(([key])=>'<td>'+(key==='status'||key==='severity'?badge(r[key]):E(r[key]||'—'))+'</td>').join('')+'<td><span class="record-origin">'+E(r.origin)+'</span></td><td><div class="row-actions"><button class="smallbtn" data-action="review" data-kind="'+kind+'" data-id="'+E(r.id)+'" aria-label="Review '+E(r.name||r.title)+'">Review</button><button class="smallbtn" data-action="edit" data-kind="'+kind+'" data-id="'+E(r.id)+'" aria-label="Edit '+E(r.name||r.title)+'">Edit</button><button class="smallbtn danger" data-action="delete" data-kind="'+kind+'" data-id="'+E(r.id)+'" aria-label="Delete '+E(r.name||r.title)+'">Delete</button></div></td></tr>').join('')+'</tbody></table>'+(rows.length?'':'<p class="empty">No matching records. Try another search or add a record.</p>');
}
function edit(kind,id){
 if(blocked){toast('Saving is paused because local storage is unavailable.');return;}
 const row=id?db[kind].find(r=>r.id===id):null;editing={kind,id:id||null};
 $('dialogTitle').textContent=(row?'Edit ':'Add ')+({vessels:'vessel',assets:'asset',incidents:'incident',maintenance:'maintenance task'})[kind];
 $('editorNote').textContent=row&&row.origin==='Synthetic sample'?'This fictional sample remains labeled as a synthetic sample after editing.':'Saved locally. Use non-confidential evaluation data.';
 $('formFields').innerHTML=C.SCHEMA[kind].map(([field,label,type,required])=>{
  const value=row?.[field]||'',attrs=' id="field-'+field+'" name="'+field+'"'+(required?' required':'');
  let control;if(type.startsWith('select:'))control='<select'+attrs+'>'+type.slice(7).split('|').map(v=>'<option'+(v===value?' selected':'')+'>'+E(v)+'</option>').join('')+'</select>';
  else if(type==='textarea')control='<textarea'+attrs+' rows="4" maxlength="4000">'+E(value)+'</textarea>';
  else control='<input'+attrs+' type="'+type+'" maxlength="180" value="'+E(value)+'">';
  return '<div class="field'+(type==='textarea'?' full':'')+'"><label for="field-'+field+'">'+E(label)+(required?' *':'')+'</label>'+control+'</div>';
 }).join('');$('editor').showModal();
}
function review(kind,id){const r=db[kind].find(x=>x.id===id);if(!r)return;$('detailsTitle').textContent=r.name||r.title;$('detailsBody').innerHTML=[...C.SCHEMA[kind].map(([k,l])=>[l,r[k]||'Not recorded']),['Source',r.origin],['Updated',r.updatedAt||'Not recorded'],['Record ID',r.id]].map(([label,value])=>'<dt>'+E(label)+'</dt><dd>'+E(value)+'</dd>').join('');$('recordDetails').showModal();}
function download(name,value,type){const url=URL.createObjectURL(new Blob([value],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Download prepared: '+name);}
$('recordForm').addEventListener('submit',event=>{event.preventDefault();if(!editing)return;const {kind,id}=editing,old=db[kind].find(r=>r.id===id),row={id:id||(crypto.randomUUID?crypto.randomUUID():'record-'+Date.now()+'-'+Math.random().toString(36).slice(2)),origin:old?.origin||'Manual entry',updatedAt:new Date().toISOString()};const form=new FormData(event.target);for(const [field]of C.SCHEMA[kind])row[field]=String(form.get(field)||'').trim();const next=structuredClone(db);if(id)next[kind]=next[kind].map(r=>r.id===id?row:r);else next[kind].push(row);if(commit(next)){$('editor').close();toast('Record saved in this local workspace.');}});
$('cancelModal').onclick=()=>$('editor').close();$('closeDetails').onclick=()=>$('recordDetails').close();$('addBtn').onclick=()=>edit(page);
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.page)go(b.dataset.page,true);if(b.dataset.openPage)go(b.dataset.openPage,true);if(b.dataset.new){go(b.dataset.new);edit(b.dataset.new);}if(b.dataset.action){const {kind,id,action}=b.dataset;if(action==='review')review(kind,id);if(action==='edit')edit(kind,id);if(action==='delete'){const r=db[kind].find(x=>x.id===id);if(r&&confirm('Delete this local record: '+(r.name||r.title)+'? Export a backup first if you need to keep it.')){const next=structuredClone(db);next[kind]=next[kind].filter(x=>x.id!==id);if(commit(next))toast('Local record deleted.');}}}});
document.querySelectorAll('[data-search]').forEach(input=>input.addEventListener('input',()=>renderTable(input.dataset.search)));
$('demoBtn').onclick=()=>{try{const result=C.merge(db,C.sampleData());if(!result.added){toast('All sample records are already present. Existing edits were preserved.');return;}if(commit(result.data))toast(result.added+' sample records added. Existing records preserved.');}catch(error){toast(error.message);}};
$('previewReport').onclick=()=>{$('reportPreview').textContent=C.report(db);toast('Briefing updated from current local records.');};
$('exportReport').onclick=()=>download('OceanCentinell_Briefing_'+C.dateKey()+'.txt',C.report(db),'text/plain;charset=utf-8');
$('printReport').onclick=()=>{$('reportPreview').textContent=C.report(db);window.print();};
$('exportCsv').onclick=()=>{const kind=$('csvType').value;download('OceanCentinell_'+kind+'_'+C.dateKey()+'.csv','\uFEFF'+C.csv(db,kind),'text/csv;charset=utf-8');};
$('exportJson').onclick=()=>download('OceanCentinell_Workspace_'+C.dateKey()+'.json',C.backup(db),'application/json');
$('importBtn').onclick=()=>{if(blocked){toast('Imports are paused because local storage is unavailable.');return;}$('importFile').click();};
$('importFile').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('Backup exceeds 5 MB.');const result=C.merge(db,C.readBackup(await file.text()));if(!result.added){toast('No new records. '+result.skipped+' existing IDs preserved.');return;}if(commit(result.data))toast(result.added+' records imported. '+result.skipped+' existing IDs preserved.');}catch(error){toast('Import rejected. '+error.message);}finally{event.target.value='';}});
$('pilotForm').addEventListener('submit',event=>{event.preventDefault();const value=['OCEANCENTINELL | COMPANY PILOT BRIEF','Beacon of the Eagle LLC','Prepared: '+new Date().toISOString(),'','Company / team: '+($('pilotCompany').value.trim()||'To be defined'),'Vessels / sites: '+($('pilotScope').value.trim()||'To be defined'),'Operational goal: '+($('pilotGoal').value.trim()||'To be defined'),'','SCOPE TO AGREE','Authorized data sources, user roles, integration boundaries, security requirements, measurable acceptance criteria, responsibilities, duration and pricing.','','Evaluation edition: local vessel, asset, incident and maintenance records with CSV/JSON export and printable briefings.','Live monitoring, AI, cloud accounts, enterprise deployment and licensing are separately scoped and are not included in this demonstration.','','Contact: centinellsuite@gmail.com','This download does not submit or send information.'].join('\n');download('OceanCentinell_Company_Pilot_Brief.txt',value,'text/plain;charset=utf-8');});
window.addEventListener('hashchange',()=>go(location.hash.slice(1)));$('year').textContent=new Date().getFullYear();load();render();go(location.hash.slice(1)||'overview');
if('serviceWorker'in navigator&&location.protocol!=='file:'&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
