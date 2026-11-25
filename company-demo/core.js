(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OceanCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KINDS=['vessels','assets','incidents','maintenance'];
  const SCHEMA={
    vessels:[['name','Vessel name','text',true],['identifier','Registration / reference','text',true],['type','Vessel type','text',false],['location','Reported location','text',false],['status','Reported status','select:Operational|Warning|Out of service',true]],
    assets:[['name','Asset name','text',true],['category','Category','text',true],['vessel','Assigned vessel','text',false],['serial','Serial / reference','text',false],['status','Recorded condition','select:Operational|Warning|Out of service',true]],
    incidents:[['title','Incident title','text',true],['vessel','Vessel / site','text',false],['severity','Analyst-assigned severity','select:Low|Medium|High|Critical',true],['status','Status','select:Open|In progress|Resolved',true],['details','Observations and next steps','textarea',false]],
    maintenance:[['title','Task title','text',true],['asset','Asset / vessel','text',false],['due','Due date','date',true],['status','Status','select:Planned|In progress|Completed',true],['notes','Work instructions / notes','textarea',false]]
  };
  const empty=()=>Object.fromEntries(KINDS.map(k=>[k,[]]));
  const dateKey=(date=new Date())=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
  const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const validTime=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(s)&&Number.isFinite(Date.parse(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalizeData(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('The file does not contain an OceanCentinell register.');
    const result=empty(),ids=new Set();
    for(const kind of KINDS){
      if(!Array.isArray(value[kind])||value[kind].length>1000)throw Error('Each register must contain at most 1,000 records.');
      result[kind]=value[kind].map(row=>{
        if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(row.id)||ids.has(row.id))throw Error('A record has an invalid or duplicate ID.');
        ids.add(row.id);const clean={id:row.id};
        for(const [field,label,type,required] of SCHEMA[kind]){
          const val=row[field]??'';
          if(typeof val!=='string'||val.length>(type==='textarea'?4000:180)||(required&&!val.trim())||(type.startsWith('select:')&&!type.slice(7).split('|').includes(val))||(type==='date'&&!validDate(val)))throw Error('Invalid '+label.toLowerCase()+'.');
          clean[field]=val;
        }
        if(row.updatedAt!==undefined&&row.updatedAt!==''&&!validTime(row.updatedAt))throw Error('Invalid record timestamp.');
        if(row.origin!==undefined&&!['Synthetic sample','Manual entry'].includes(row.origin))throw Error('Invalid record source.');
        clean.origin=row.origin||'Manual entry';clean.updatedAt=row.updatedAt||'';return clean;
      });
    }
    if(new TextEncoder().encode(JSON.stringify(result)).length>5000000)throw Error('The combined workspace exceeds 5 MB.');
    return result;
  }
  function validData(v){try{normalizeData(v);return true;}catch{return false;}}
  function readBackup(raw){
    if(typeof raw!=='string'||new TextEncoder().encode(raw).length>5000000)throw Error('Backup exceeds 5 MB.');
    let doc;try{doc=JSON.parse(raw);}catch{throw Error('The selected file is not valid JSON.');}
    if(!['OceanCentinell-USA','OceanCentinell-Evaluation'].includes(doc?.app)||doc.version!==1)throw Error('Choose a JSON backup exported by OceanCentinell.');
    return normalizeData(doc.data);
  }
  function backup(data){return JSON.stringify({app:'OceanCentinell-USA',edition:'Enterprise evaluation',version:1,exportedAt:new Date().toISOString(),data:normalizeData(data)},null,2);}
  function merge(current,incoming){
    const result=normalizeData(current),next=normalizeData(incoming),ids=new Set(KINDS.flatMap(k=>result[k].map(r=>r.id)));let added=0,skipped=0;
    for(const kind of KINDS)for(const row of next[kind]){if(ids.has(row.id)){skipped++;continue;}result[kind].push(row);ids.add(row.id);added++;}
    return {data:normalizeData(result),added,skipped};
  }
  function stats(data,today=dateKey()){
    const open=data.incidents.filter(x=>x.status!=='Resolved');
    return {vessels:data.vessels.length,assets:data.assets.length,open:open.length,overdue:data.maintenance.filter(x=>x.status!=='Completed'&&x.due<today).length,pending:data.maintenance.filter(x=>x.status!=='Completed').length,bySeverity:['Low','Medium','High','Critical'].map(label=>({label,count:open.filter(x=>x.severity===label).length})),sample:KINDS.reduce((n,k)=>n+data[k].filter(x=>x.origin==='Synthetic sample').length,0),manual:KINDS.reduce((n,k)=>n+data[k].filter(x=>x.origin!=='Synthetic sample').length,0)};
  }
  function csv(data,kind){
    if(!KINDS.includes(kind))throw Error('Choose a register.');
    const cols=['id',...SCHEMA[kind].map(f=>f[0]),'origin','updatedAt'];
    const cell=value=>{let str=String(value??'');if(/^[\s\u0000-\u001f]*[=+@-]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"';};
    return [cols,...data[kind].map(row=>cols.map(key=>row[key]))].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function report(data,today=dateKey()){
    const s=stats(data,today),lines=['OCEANCENTINELL | OPERATIONS BRIEFING','Beacon of the Eagle LLC','ENTERPRISE EVALUATION — LOCAL RECORDS','',`Generated: ${new Date().toISOString()}`,`Maintenance date basis: ${today}`,`Vessels: ${s.vessels} | Assets: ${s.assets} | Open incidents: ${s.open} | Overdue tasks: ${s.overdue}`,`Synthetic sample records: ${s.sample} | Manually entered records: ${s.manual}`,''];
    for(const kind of KINDS){lines.push(kind.toUpperCase(),'');if(!data[kind].length)lines.push('No records.');for(const row of data[kind]){lines.push((row.name||row.title)+' ['+row.id+']');for(const [field,label]of SCHEMA[kind])lines.push(label+': '+(row[field]||'Not recorded'));lines.push('Source: '+row.origin,'Updated: '+(row.updatedAt||'Not recorded'),'');}}
    lines.push('EVALUATION LIMITS','Locations, conditions and severity are recorded manually. Sample records are fictional. No live AIS/GPS, telemetry, threat detection, AI inference, compliance certification or cloud synchronization is provided. This is not a navigation or emergency-response tool.');return lines.join('\n');
  }
  function sampleData(now=new Date()){
    const when=offset=>{const d=new Date(now);d.setDate(d.getDate()+offset);return dateKey(d);};
    const row=(id,fields)=>({id,...fields,origin:'Synthetic sample',updatedAt:now.toISOString()});
    return normalizeData({
      vessels:[row('demo-vessel-01',{name:'Atlantic Pioneer',identifier:'DEMO-VSL-001',type:'Workboat',location:'Jacksonville, Florida',status:'Operational'}),row('demo-vessel-02',{name:'Harbor Sentinel',identifier:'DEMO-VSL-002',type:'Service vessel',location:'Miami, Florida',status:'Warning'}),row('demo-vessel-03',{name:'Coastal Meridian',identifier:'DEMO-VSL-003',type:'Survey vessel',location:'Norfolk, Virginia',status:'Operational'})],
      assets:[row('demo-asset-01',{name:'Primary VHF radio',category:'Communications',vessel:'Atlantic Pioneer',serial:'DEMO-VHF-01',status:'Operational'}),row('demo-asset-02',{name:'Operations gateway',category:'Network / IT',vessel:'Atlantic Pioneer',serial:'DEMO-NET-02',status:'Warning'}),row('demo-asset-03',{name:'Backup generator',category:'Power',vessel:'Harbor Sentinel',serial:'DEMO-PWR-03',status:'Warning'}),row('demo-asset-04',{name:'Radar console',category:'Operational technology',vessel:'Coastal Meridian',serial:'DEMO-OT-04',status:'Operational'}),row('demo-asset-05',{name:'Backup storage',category:'Data protection',vessel:'Coastal Meridian',serial:'DEMO-BKP-05',status:'Operational'})],
      incidents:[row('demo-incident-01',{title:'Gateway firmware review',vessel:'Atlantic Pioneer',severity:'Medium',status:'In progress',details:'Synthetic scenario. An operator recorded a firmware review requirement. Verify the inventory and approved maintenance window; no vulnerability or compromise is established.'}),row('demo-incident-02',{title:'Generator inspection requested',vessel:'Harbor Sentinel',severity:'High',status:'Open',details:'Synthetic scenario. An operator reported intermittent generator operation. A qualified maintenance team must inspect and record findings. This entry is not a real-time alarm.'}),row('demo-incident-03',{title:'Communications check documented',vessel:'Coastal Meridian',severity:'Low',status:'Resolved',details:'Synthetic scenario. A completed local check was entered manually for demonstration.'})],
      maintenance:[row('demo-task-01',{title:'Inspect backup generator',asset:'Harbor Sentinel / Backup generator',due:when(-2),status:'Planned',notes:'Synthetic overdue task. Assign an authorized technician and document inspection results.'}),row('demo-task-02',{title:'Verify backup restoration procedure',asset:'Coastal Meridian / Backup storage',due:when(3),status:'Planned',notes:'Synthetic task. Confirm backup scope, restoration evidence and owner.'}),row('demo-task-03',{title:'Review gateway update plan',asset:'Atlantic Pioneer / Operations gateway',due:when(7),status:'In progress',notes:'Synthetic task. Verify approved firmware and change window before any real change.'}),row('demo-task-04',{title:'Record VHF equipment check',asset:'Coastal Meridian',due:when(-1),status:'Completed',notes:'Synthetic completed task; not an equipment certification.'})]
    });
  }
  return {KINDS,SCHEMA,empty,dateKey,validDate,esc,normalizeData,validData,readBackup,backup,merge,stats,csv,report,sampleData};
});
