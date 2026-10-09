'use strict';
/* ================================================================
   设备检查管理系统 · 移动端 App（v2）
   - 检查录入：6 大模块 × 9 个部门/班组
   - 期间模型：按【年度 + 季度】归档，支持多年多季度
   - 文件库：查阅 / 修改 / 复制 / 导出 / 删除 各季度检查记录
   ================================================================ */

/* ================================================================
   CONFIGURATION
   ================================================================ */
const VER = '2.0.0';

const DEPTS = [
  {id:'pipeline',name:'管道公司',group:null},
  {id:'inspect',name:'检验检测中心',group:true},
  {id:'metrology',name:'计量检定班组',group:'inspect'},
  {id:'pipecheck',name:'管道检验班组',group:'inspect'},
  {id:'production',name:'生产输配中心',group:true},
  {id:'station',name:'场站班组',group:'production'},
  {id:'pdpipe',name:'管道班组',group:'production'},
  {id:'service',name:'客户服务中心',group:true},
  {id:'jinfeng',name:'金凤分中心',group:'service'},
  {id:'xixia',name:'西夏分中心',group:'service'},
  {id:'xingqing',name:'兴庆分中心',group:'service'},
  {id:'gongshang',name:'工商中心',group:'service'}
];

const MODS = [
  {id:'ledger',  n:'01', name:'台账管理', t:'设备"一机一档"台账管理', d:'统计各项设备设施数量，确保台账信息完整准确'},
  {id:'patrol',  n:'02', name:'巡查巡检', t:'巡查巡检管理',           d:'检查巡查巡检计划与完成情况'},
  {id:'calib',   n:'03', name:'检验检定', t:'设备检验检定',           d:'统计设备检验检定计划与完成情况'},
  {id:'maint',   n:'04', name:'维护保养', t:'设备维护保养',           d:'统计设备维护保养计划与完成情况'},
  {id:'changes', n:'05', name:'设备变更', t:'设备变更',               d:'统计本季度设备变更情况'},
  {id:'faults',  n:'06', name:'设备故障', t:'设备故障',               d:'统计本季度设备故障情况'}
];

const TMAP = {
  pipeline:  {ledger:'pipe_co',patrol:'prod',calib:'pipe_co',maint:'pipe_co'},
  metrology: {ledger:'pipe_co',patrol:'prod',calib:'pipe_co',maint:'pipe_co'},
  pipecheck: {ledger:'pipe_co',patrol:'prod',calib:'pipe_co',maint:'pipe_co'},
  station:   {ledger:'prod',  patrol:'prod',calib:'station',maint:'station'},
  pdpipe:    {ledger:'prod',  patrol:'prod',calib:'pdpipe', maint:'pdpipe'},
  jinfeng:   {ledger:'cs_std',patrol:'cs',  calib:'cs_std',maint:'cs_std'},
  xixia:     {ledger:'cs_std',patrol:'cs',  calib:'cs_std',maint:'cs_std'},
  xingqing:  {ledger:'cs_std',patrol:'cs',  calib:'cs_std',maint:'cs_std'},
  gongshang: {ledger:'gs',    patrol:'cs',  calib:'gs',    maint:'gs'}
};

/* --- LEDGER --- */
const LEDGER = {
  cs_std:[
    {title:'基础设施数量统计',hasNew:true,fields:[
      {k:'road_wells',l:'道路阀井',u:'个'},{k:'yard_wells',l:'庭院阀井',u:'个'},
      {k:'road_pipes',l:'道路管道',u:'km'},{k:'yard_pipes',l:'庭院管道',u:'km'},
      {k:'regulators',l:'调压箱',u:'个'},{k:'buried_alarm',l:'埋地燃气报警器',u:'个'},
      {k:'well_alarm',l:'阀井燃气报警器',u:'个'}
    ]},
    {title:'设备工具统计',hasNew:true,fields:[
      {k:'patrol_eq',l:'巡检类设备',u:'台'},{k:'repair_eq',l:'抢修类设备',u:'台'},
      {k:'inspect_eq',l:'检验检定类设备',u:'台'}
    ]}
  ],
  gs:[{title:'设备设施统计',hasNew:true,fields:[
    {k:'patrol_eq',l:'巡检类设备',u:'台'},{k:'regulators',l:'调压箱',u:'个'},
    {k:'flowmeters',l:'流量计',u:'个'},{k:'gas_meters',l:'燃气表',u:'个'}
  ]}],
  pipe_co:[{title:'设备台账统计',hasNew:true,fields:[
    {k:'patrol_eq',l:'巡检类设备',u:'台'},{k:'repair_eq',l:'抢修类设备',u:'台'},
    {k:'inspect_eq',l:'检验检定类设备',u:'台'}
  ]}],
  prod:[{title:'设备台账统计',hasNew:true,fields:[
    {k:'patrol_eq',l:'巡检类设备',u:'台'},{k:'repair_eq',l:'抢修类设备',u:'台'},
    {k:'special_eq',l:'特种设备',u:'台'},{k:'safety_attach',l:'安全附件总数',u:'个'}
  ]}]
};

/* --- PATROL --- */
const PATROL = {
  cs:{
    sections:[
      {k:'tour',label:'巡视完成率'},
      {k:'check',label:'巡查完成率'}
    ],
    ranges:['0～60%','60%～80%','80%～100%']
  },
  prod:{fields:[
    {k:'plan_count',l:'制定计划数',u:'个'},
    {k:'task_count',l:'计划任务数',u:'个'},
    {k:'done_count',l:'实际完成数',u:'个'}
  ]}
};

/* --- CALIB --- */
const CALIB = {
  cs_std:[
    {title:'手持检测工器具',fields:[
      {k:'hand_plan',l:'纳入标定计划数目'},{k:'hand_overdue',l:'超期未检数目'}
    ]},
    {title:'管道定检',fields:[
      {k:'pipe_plan',l:'定检计划数目'},{k:'pipe_done',l:'定检完成数目'},
      {k:'pipe_overdue',l:'超期未检数目'},{k:'pipe_report',l:'报告上传系统数目'}
    ]},
    {title:'管道年检',fields:[
      {k:'annual_plan',l:'年检计划数目'},{k:'annual_done',l:'年检完成数目'}
    ]}
  ],
  gs:[
    {title:'燃气表流量计',fields:[
      {k:'meter_plan',l:'计划检定数目'},{k:'meter_done',l:'检定完成数目'},
      {k:'meter_report',l:'报告上传系统数目'}
    ]},
    {title:'手持检测工器具',fields:[
      {k:'hand_plan',l:'纳入标定计划数目'},{k:'hand_overdue',l:'超期未检数目'}
    ]}
  ],
  station:[
    {title:'安全附件',fields:[
      {k:'sa_plan',l:'计划检定完成数目'},{k:'sa_done',l:'实际检定完成数目'},
      {k:'sa_report',l:'报告上传数目'}
    ]},
    {title:'手持检测工器具',fields:[
      {k:'hand_plan',l:'计划检定完成数目'},{k:'hand_done',l:'实际检定完成数目'},
      {k:'hand_report',l:'检定报告上传数目'}
    ]},
    {title:'特种设备',fields:[
      {k:'sp_plan',l:'计划检定完成数目'},{k:'sp_done',l:'实际检定完成数目'},
      {k:'sp_report',l:'报告上传数目'}
    ]}
  ],
  pdpipe:[{title:'管道定检',fields:[
    {k:'pipe_plan',l:'定检计划数目'},{k:'pipe_done',l:'定检完成数目'},
    {k:'pipe_report',l:'定检报告上传数目'}
  ]}],
  pipe_co:[{title:'检定统计',fields:[
    {k:'q2_count',l:'二季度检定数目'},{k:'report_count',l:'报告上传数目'},
    {k:'overdue_count',l:'超期未检数目'}
  ]}]
};

/* --- MAINT --- */
const MAINT = {
  pipe_co:[{title:'维护保养统计',fields:[
    {k:'plan_cover',l:'维护保养计划涵盖设备数目'},{k:'plan_done',l:'本季度按计划完成保养数目'}
  ]}],
  cs_std:[{title:'维护保养统计',fields:[
    {k:'well_maint',l:'本季度阀井维护保养数目'},
    {k:'repair_plan',l:'维抢修设备维护保养计划涵盖设备数目'},
    {k:'repair_done',l:'维抢修设备维护保养完成数目'}
  ]}],
  gs:[{title:'调压箱维护保养',fields:[
    {k:'reg_plan',l:'本季度调压箱计划保养数目'},{k:'reg_done',l:'本季度调压箱实际完成数目'}
  ]}],
  station:[{title:'工器具维护保养',fields:[
    {k:'tool_plan',l:'本季度工器具维护保养计划完成数目'},{k:'tool_done',l:'本季度保养实际完成数目'}
  ]}],
  pdpipe:[{title:'维护保养统计',fields:[
    {k:'plan_cover',l:'维护保养计划涵盖设备数目'},{k:'plan_done',l:'本季度按计划完成保养数目'}
  ]}]
};

const ASSESS = {excellent:'优秀',good:'良好',pass:'合格',fail:'不合格'};

/* ================================================================
   STATE
   ================================================================ */
const S = {
  view:'check',
  year:0, quarter:0,
  dept:null, mod:'ledger',
  openQ:new Set(),
  yearFilter:'all'
};

const META_KEY='eqi_meta_v1';
const KEY_RE=/^eqi_(\d{4})Q([1-4])_([a-z]+)_([a-z]+)$/;

/* ================================================================
   STORAGE
   ================================================================ */
function loadMeta(){try{return JSON.parse(localStorage.getItem(META_KEY))||{}}catch(e){return{}}}
function saveMeta(m){try{localStorage.setItem(META_KEY,JSON.stringify(m))}catch(e){}}

function recKey(y,q,dept,mod){return `eqi_${y}Q${q}_${dept}_${mod}`}
function loadRec(y,q,dept,mod){try{return JSON.parse(localStorage.getItem(recKey(y,q,dept,mod)))}catch(e){return null}}
function saveRec(y,q,dept,mod,data){
  data._updatedAt=new Date().toISOString();
  try{localStorage.setItem(recKey(y,q,dept,mod),JSON.stringify(data))}catch(e){toast('存储空间不足，保存失败')}
}
function delRec(y,q,dept,mod){localStorage.removeItem(recKey(y,q,dept,mod))}

function hasData(d){
  if(!d||typeof d!=='object')return false;
  return Object.keys(d).some(k=>k!=='_updatedAt'&&d[k]!=null&&String(d[k]).trim()!=='');
}
function isDone(y,q,dept,mod){return hasData(loadRec(y,q,dept,mod))}
function prog(y,q,dept){let c=0;MODS.forEach(m=>{if(isDone(y,q,dept,m.id))c++});return{c,t:MODS.length}}
function dotC(y,q,dept){const p=prog(y,q,dept);if(p.c===0)return'e';if(p.c===p.t)return'g';return'y'}

/* 扫描全部记录 → { year: { quarter: { dept: { mod: data } } } } */
function scanAll(){
  const out={};
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    const m=k&&k.match(KEY_RE);
    if(!m)continue;
    const y=+m[1],q=+m[2],dept=m[3],mod=m[4];
    if(!TMAP[dept]||!MODS.some(x=>x.id===mod))continue;
    let data=null;
    try{data=JSON.parse(localStorage.getItem(k))}catch(e){}
    if(!data)continue;
    if(!out[y])out[y]={};
    if(!out[y][q])out[y][q]={};
    if(!out[y][q][dept])out[y][q][dept]={};
    out[y][q][dept][mod]=data;
  }
  return out;
}

function periodStats(recs){
  const deptTotal=DEPTS.filter(d=>d.group!==true).length;
  let deptFilled=0,modFilled=0,lastTs=null;
  DEPTS.forEach(d=>{
    if(d.group===true)return;
    const mods=(recs&&recs[d.id])||{};
    let n=0;
    MODS.forEach(m=>{
      const dd=mods[m.id];
      if(dd&&hasData(dd)){
        n++;modFilled++;
        if(dd._updatedAt&&(!lastTs||dd._updatedAt>lastTs))lastTs=dd._updatedAt;
      }
    });
    if(n>0)deptFilled++;
  });
  return{deptFilled,deptTotal,modFilled,modTotal:deptTotal*MODS.length,lastTs};
}

function deptLastTs(mods){
  let ts=null;
  MODS.forEach(m=>{
    const d=mods&&mods[m.id];
    if(d&&d._updatedAt&&(!ts||d._updatedAt>ts))ts=d._updatedAt;
  });
  return ts;
}

/* ================================================================
   UTILITIES
   ================================================================ */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function debounce(fn,ms){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.classList.add('show');
  clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),2200);
}
function dName(id){return(DEPTS.find(d=>d.id===id)||{}).name||''}
function pShort(y,q){return `${y} Q${q}`}
function pLong(y,q){return `${y}年 第${q}季度`}
function fmtTs(iso){return iso?String(iso).slice(0,10)+' '+String(iso).slice(11,16):'--'}
function fmtDate(v){return v?String(v).slice(0,10):''}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function footPrefix(mod){return{ledger:'ld',patrol:'pt',calib:'cb',maint:'mt',changes:'change',faults:'fault'}[mod]||'ld'}

/* ================================================================
   SHEETS（底部弹层）
   ================================================================ */
function openSheet(title,bodyHTML){
  const root=document.getElementById('sheetRoot');
  root.innerHTML=`<div class="sheet-back" onclick="closeSheet()"></div>
  <div class="sheet" role="dialog" aria-label="${esc(title)}">
    <div class="sheet-head"><h3>${esc(title)}</h3><button class="sheet-close" onclick="closeSheet()" aria-label="关闭">✕</button></div>
    <div class="sheet-body">${bodyHTML}</div>
  </div>`;
  requestAnimationFrame(()=>{
    const b=root.querySelector('.sheet-back'),s=root.querySelector('.sheet');
    if(b)b.classList.add('show');
    if(s)s.classList.add('show');
  });
}
function closeSheet(){
  const root=document.getElementById('sheetRoot');
  const b=root.querySelector('.sheet-back'),s=root.querySelector('.sheet');
  if(!b&&!s)return;
  if(b)b.classList.remove('show');
  if(s)s.classList.remove('show');
  clearTimeout(closeSheet._t);
  closeSheet._t=setTimeout(()=>{root.innerHTML=''},240);
}
function confirmSheet(title,text,onYes,okLabel,danger){
  openSheet(title,`<p class="desc" style="margin:2px 0 18px">${text}</p>
  <div class="form-actions" style="margin:0">
    <button class="btn btn-s" onclick="closeSheet()">取消</button>
    <button class="btn btn-s ${danger?'btn-d':'btn-a'}" id="cfmYes">${esc(okLabel||'确定')}</button>
  </div>`);
  const y=document.getElementById('cfmYes');
  if(y)y.onclick=()=>{closeSheet();setTimeout(onYes,140)};
}

/* ================================================================
   RENDER · 外壳
   ================================================================ */
function render(){
  document.getElementById('barPeriod').textContent=`${S.year} · Q${S.quarter}`;
  const v=document.getElementById('view');
  if(S.view==='check')v.innerHTML=checkHTML();
  else if(S.view==='library')v.innerHTML=libraryHTML();
  else v.innerHTML=settingsHTML();
  document.querySelectorAll('.tb').forEach(b=>b.classList.toggle('act',b.dataset.view===S.view));
  if(S.view==='check'&&S.dept)populateForm();
}
function switchView(v){
  if(v===S.view)return;
  saveForm(false);
  if(v==='library'&&S.openQ.size===0)S.openQ.add(`${S.year}Q${S.quarter}`);
  S.view=v;render();
  window.scrollTo({top:0,behavior:'instant'in document.body.style?'instant':'auto'});
}

/* ================================================================
   RENDER · 检查视图
   ================================================================ */
function checkHTML(){
  let h='<div class="stagger">'+ctxHTML()+modsHTML()+'</div>';
  if(!S.dept)return h+welcomeHTML();
  h+=formHTML();
  h+=`<div class="form-actions">
    <button class="btn btn-s" onclick="doPrint()">打印</button>
    <button class="btn btn-s" onclick="exportRecordAt(${S.year},${S.quarter},'${S.dept}')">导出记录</button>
    <button class="btn btn-p" onclick="doSave()">保存数据</button>
  </div>
  <p class="hint" style="text-align:center;margin-top:8px">输入内容自动保存 · 当前档案：${pShort(S.year,S.quarter)} · ${esc(dName(S.dept))}</p>`;
  return h;
}

function ctxHTML(){
  const p=S.dept?prog(S.year,S.quarter,S.dept):{c:0,t:MODS.length};
  return `<div class="ctx">
    <button class="ctx-pick" onclick="openPeriodPicker()">
      <span class="cap">检查期间</span>
      <span class="val">${pLong(S.year,S.quarter)}</span>
    </button>
    <button class="ctx-pick" onclick="openDeptPicker()">
      <span class="cap">受检部门</span>
      <span class="val">${S.dept?esc(dName(S.dept)):'未选择'}</span>
    </button>
    <div class="ctx-prog">
      ${ringHTML(p.c,p.t)}
      <span class="pt" id="progText">${p.c}/${p.t}</span>
    </div>
  </div>`;
}

function ringHTML(c,t){
  const C=94.25,off=C*(1-(t?c/t:0));
  return `<svg class="ring" viewBox="0 0 36 36" aria-hidden="true">
    <circle class="bgc" cx="18" cy="18" r="15" fill="none" stroke-width="3"/>
    <circle class="fgc" cx="18" cy="18" r="15" fill="none" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${off}"/>
  </svg>`;
}

function modsHTML(){
  if(!S.dept)return '';
  let h='<div class="mods">';
  MODS.forEach(m=>{
    const act=m.id===S.mod,dn=isDone(S.year,S.quarter,S.dept,m.id);
    h+=`<button class="mt${act?' act':''}${dn?' done':''}" data-mod="${m.id}" onclick="pickMod('${m.id}')">
      <span class="n">${m.n}</span>${m.name}<span class="dt"></span></button>`;
  });
  return h+'</div>';
}

function welcomeHTML(){
  const total=DEPTS.filter(d=>d.group!==true).length;
  return `<div class="welcome stagger">
    <div class="sub2">EQUIPMENT INSPECTION ARCHIVE</div>
    <div class="big">季度检查<br>从这里开始</div>
    <p>选择受检部门与检查期间后，逐项录入 6 大模块的检查数据。所有记录按 <b>年度 + 季度</b> 归档，随时在文件库中查阅、修改与导出。</p>
    <div class="stat-strip">
      <div class="st-cell"><span class="num">${MODS.length}</span><span class="lab">检查模块</span></div>
      <div class="st-cell"><span class="num">${total}</span><span class="lab">部门 / 班组</span></div>
      <div class="st-cell"><span class="num">4</span><span class="lab">季度归档</span></div>
    </div>
    <button class="btn btn-a" onclick="openDeptPicker()">选择受检部门开始检查</button>
  </div>`;
}

/* ---------------- 表单模板 ---------------- */
function formHTML(){
  const m=MODS.find(x=>x.id===S.mod);
  let h=`<div class="doc-head"><h2>${m.t}</h2><p class="desc">${m.d}</p></div>`;
  switch(S.mod){
    case 'ledger': return h+rLedger();
    case 'patrol': return h+rPatrol();
    case 'calib':  return h+rCalib();
    case 'maint':  return h+rMaint();
    case 'changes':return h+rSimple('change_count','设备变更数目','台','change_desc','变更说明');
    case 'faults': return h+rSimple('fault_count','设备故障数目','台','fault_desc','故障说明');
  }
  return h;
}

function numInput(field,wide){
  return `<input type="number" inputmode="numeric" data-field="${field}" min="0" placeholder="0">`;
}

function rLedger(){
  const cfg=LEDGER[(TMAP[S.dept]||{}).ledger];
  if(!cfg)return '<p class="desc">配置错误</p>';
  let h='';
  cfg.forEach((sec,i)=>{
    h+=`<section class="sec"><div class="sec-t"><span class="sn">${String(i+1).padStart(2,'0')}</span><span class="st">${sec.title}</span><span class="rule"></span></div>`;
    sec.fields.forEach(f=>{
      h+=`<div class="row">
        <div class="rl"><span class="rl-t">${f.l}</span><span class="rl-u">${f.u}</span></div>
        <div class="ri">${numInput('ld_'+f.k)}<span class="rc">数量</span></div>`;
      if(sec.hasNew)h+=`<div class="ri">${numInput('ld_'+f.k+'_new')}<span class="rc">本季新增</span></div>`;
      h+='</div>';
    });
    h+='</section>';
  });
  return h+footHTML('ld');
}

function rPatrol(){
  const cfg=PATROL[(TMAP[S.dept]||{}).patrol];
  if(!cfg)return '<p class="desc">配置错误</p>';
  let h='',n=0;
  if(cfg.sections){
    cfg.sections.forEach(sec=>{
      n++;
      h+=`<section class="sec"><div class="sec-t"><span class="sn">${String(n).padStart(2,'0')}</span><span class="st">${sec.label}</span><span class="rule"></span></div>`;
      cfg.ranges.forEach((range,idx)=>{
        const cls=idx===0?'rate-low':idx===1?'rate-mid':'rate-hi';
        h+=`<div class="row">
          <div class="rl"><span class="rate-badge ${cls}">${range}</span></div>
          <div class="ri">${numInput(`pt_${sec.k}_${idx}`)}<span class="rc">个 / 项</span></div>
        </div>`;
      });
      h+='</section>';
    });
  }
  if(cfg.fields){
    n++;
    h+=`<section class="sec"><div class="sec-t"><span class="sn">${String(n).padStart(2,'0')}</span><span class="st">计划与完成情况</span><span class="rule"></span></div>`;
    cfg.fields.forEach(f=>{
      h+=`<div class="row">
        <div class="rl"><span class="rl-t">${f.l}</span><span class="rl-u">${f.u}</span></div>
        <div class="ri">${numInput('pt_'+f.k)}<span class="rc">数量</span></div>
      </div>`;
    });
    h+='</section>';
  }
  return h+footHTML('pt');
}

function sectionsHTML(cfg,prefix,unitLabel){
  let h='';
  cfg.forEach((sec,i)=>{
    h+=`<section class="sec"><div class="sec-t"><span class="sn">${String(i+1).padStart(2,'0')}</span><span class="st">${sec.title}</span><span class="rule"></span></div>`;
    sec.fields.forEach(f=>{
      h+=`<div class="row">
        <div class="rl"><span class="rl-t">${f.l}</span></div>
        <div class="ri">${numInput(prefix+f.k)}<span class="rc">${unitLabel||'数量'}</span></div>
      </div>`;
    });
    h+='</section>';
  });
  return h;
}

function rCalib(){
  const cfg=CALIB[(TMAP[S.dept]||{}).calib];
  if(!cfg)return '<p class="desc">配置错误</p>';
  return sectionsHTML(cfg,'cb_')+footHTML('cb');
}
function rMaint(){
  const cfg=MAINT[(TMAP[S.dept]||{}).maint];
  if(!cfg)return '<p class="desc">配置错误</p>';
  return sectionsHTML(cfg,'mt_')+footHTML('mt');
}

function rSimple(countKey,countLabel,countUnit,descKey,descLabel){
  const pre=footPrefix(S.mod);
  let h=`<section class="sec">
    <div class="sec-t"><span class="sn">01</span><span class="st">统计信息</span><span class="rule"></span></div>
    <div class="row">
      <div class="rl"><span class="rl-t">${countLabel}</span><span class="rl-u">${countUnit}</span></div>
      <div class="ri">${numInput(countKey)}<span class="rc">数量</span></div>
    </div>
    <div class="row col">
      <div class="rl"><span class="rl-t">${descLabel}</span></div>
      <textarea data-field="${descKey}" rows="3" placeholder="详细说明（选填）"></textarea>
    </div>
  </section>`;
  return h+footHTML(pre);
}

function footHTML(prefix){
  return `<section class="sec">
    <div class="sec-t"><span class="sn">备注</span><span class="st">备注与综合评估</span><span class="rule"></span></div>
    <div class="row col">
      <div class="rl"><span class="rl-t">备注说明</span></div>
      <textarea data-field="${prefix}_notes" rows="2" placeholder="备注信息（选填）"></textarea>
    </div>
    <div class="row">
      <div class="rl"><span class="rl-t">综合评估</span></div>
      <div class="ri wide">
        <select data-field="${prefix}_assess">
          <option value="">请选择</option>
          <option value="excellent">优秀</option>
          <option value="good">良好</option>
          <option value="pass">合格</option>
          <option value="fail">不合格</option>
        </select>
      </div>
    </div>
    <div class="row">
      <div class="rl"><span class="rl-t">检查日期</span></div>
      <div class="ri wide"><input type="date" data-field="_date"></div>
    </div>
    <div class="row">
      <div class="rl"><span class="rl-t">检查人</span></div>
      <div class="ri wide"><input type="text" data-field="_inspector" placeholder="姓名"></div>
    </div>
  </section>`;
}

/* ================================================================
   表单读写
   ================================================================ */
function populateForm(){
  const raw=localStorage.getItem(recKey(S.year,S.quarter,S.dept,S.mod));
  if(!raw){
    const d=document.querySelector('#view [data-field="_date"]');
    if(d&&!d.value)d.value=todayISO();
    return;
  }
  try{
    const data=JSON.parse(raw);
    Object.keys(data).forEach(f=>{
      const el=document.querySelector(`#view [data-field="${f}"]`);
      if(el&&el.value!==undefined)el.value=data[f]==null?'':data[f];
    });
  }catch(e){}
}

function saveForm(showToast){
  /* 仅在检查表单真实渲染时写入，避免空表单覆盖已归档数据 */
  if(!S.dept||S.view!=='check')return false;
  const nodes=document.querySelectorAll('#view [data-field]');
  if(!nodes.length)return false;
  const data={};
  nodes.forEach(el=>{
    data[el.dataset.field]=el.value;
  });
  saveRec(S.year,S.quarter,S.dept,S.mod,data);
  refreshProgress();
  if(showToast)toast(`已保存 · ${pShort(S.year,S.quarter)} · ${dName(S.dept)}`);
  return true;
}

function refreshProgress(){
  document.querySelectorAll('#view .mt').forEach(el=>{
    el.classList.toggle('done',isDone(S.year,S.quarter,S.dept,el.dataset.mod));
  });
  const p=prog(S.year,S.quarter,S.dept);
  const ring=document.querySelector('#view .ring .fgc');
  if(ring){const C=94.25;ring.setAttribute('stroke-dashoffset',String(C*(1-p.c/p.t)))}
  const pt=document.getElementById('progText');
  if(pt)pt.textContent=`${p.c}/${p.t}`;
}

function doSave(){
  if(saveForm(true))return;
  toast('当前没有可保存的表单');
}
function doPrint(){saveForm(false);window.print()}

function pickMod(mid){
  saveForm(false);
  S.mod=mid;render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function chooseDept(id){
  saveForm(false);
  S.dept=id;
  const first=MODS.find(m=>!isDone(S.year,S.quarter,id,m.id));
  S.mod=first?first.id:'ledger';
  const meta=loadMeta();meta.dept=id;saveMeta(meta);
  closeSheet();render();
  toast(`已选择 · ${dName(id)} · ${pShort(S.year,S.quarter)}`);
}

/* ================================================================
   弹层：期间 / 部门选择
   ================================================================ */
function openPeriodPicker(){
  const cy=new Date().getFullYear();
  let h='<div class="pick-grp">年度</div><div class="seg-wrap">';
  for(let y=cy-3;y<=cy+3;y++)h+=`<button class="seg-btn${y===S.year?' act':''}" onclick="setPeriod(${y},S.quarter)">${y}</button>`;
  h+='</div><div class="pick-grp">季度</div><div class="seg-wrap">';
  [1,2,3,4].forEach(q=>{
    h+=`<button class="seg-btn${q===S.quarter?' act':''}" onclick="setPeriod(${S.year},${q},true)">${'Q'+q} · 第${q}季度</button>`;
  });
  h+=`</div><div class="pick-grp">其他年份</div>
  <div class="stepper">
    <button onclick="setYearStep(-1)" aria-label="上一年">−</button>
    <span class="sv">${S.year}</span>
    <button onclick="setYearStep(1)" aria-label="下一年">＋</button>
    <button class="mini" style="margin-left:8px" onclick="setPeriod(${cy},${Math.floor(new Date().getMonth()/3)+1},true)">回到今年</button>
  </div>
  <p class="hint" style="margin-top:14px">切换期间后，录入的数据将归档到所选年度与季度。</p>`;
  openSheet('选择检查期间',h);
}

function setPeriod(y,q,close){
  saveForm(false);
  S.year=y;S.quarter=q;
  const meta=loadMeta();meta.year=y;meta.quarter=q;saveMeta(meta);
  if(close)closeSheet();
  render();
  if(close)toast(`已切换到 ${pShort(y,q)}`);
}
function setYearStep(d){
  const y=Math.min(2100,Math.max(2015,S.year+d));
  setPeriod(y,S.quarter,false);
  openPeriodPicker();
}

function openDeptPicker(){
  const tops=DEPTS.filter(d=>d.group===null);
  const gps=DEPTS.filter(d=>d.group===true);
  let h='<div class="pick-list">';
  h+='<div class="pick-grp">受检部门 / 班组</div>';
  tops.forEach(d=>{h+=deptPickItem(d)});
  gps.forEach(g=>{
    h+=`<div class="pick-grp">${g.name}</div>`;
    DEPTS.filter(d=>d.group===g.id).forEach(d=>{h+=deptPickItem(d)});
  });
  h+='</div>';
  openSheet('选择受检部门',h);
}
function deptPickItem(d){
  const p=prog(S.year,S.quarter,d.id);
  return `<button class="pick-item${S.dept===d.id?' act':''}" onclick="chooseDept('${d.id}')">
    <span class="dot ${dotC(S.year,S.quarter,d.id)}"></span>
    <span>${d.name}</span>
    <span class="pi-sub">${p.c}/${p.t} 模块</span>
  </button>`;
}

/* ================================================================
   文件库
   ================================================================ */
function libraryHTML(){
  const all=scanAll();
  const years=Object.keys(all).map(Number).sort((a,b)=>b-a);
  if(!years.includes(S.year))years.push(S.year);
  years.sort((a,b)=>b-a);
  const shown=S.yearFilter==='all'?years:years.filter(y=>y===+S.yearFilter);

  let h=`<div class="lib-head stagger">
    <div class="display">文件库</div>
    <p class="desc">按年度与季度归档的设备检查记录，可查阅、修改、复制与导出。</p>
    <div class="filter-strip">
      <button class="fchip${S.yearFilter==='all'?' act':''}" onclick="setYearFilter('all')">全部年度</button>`;
  years.forEach(y=>{
    h+=`<button class="fchip${String(S.yearFilter)===String(y)?' act':''}" onclick="setYearFilter(${y})">${y}</button>`;
  });
  h+='</div></div>';

  if(!shown.length||shown.every(y=>!all[y])){
    h+=`<div class="empty">
      <div class="e-t">文件库暂无归档记录</div>
      <div class="e-d">切换到「检查」录入本季度数据，保存后将自动归档到 ${pShort(S.year,S.quarter)}。</div>
      <button class="btn btn-a" onclick="switchView('check')">去录入检查数据</button>
    </div>`;
    return h;
  }

  shown.forEach(y=>{
    h+=yearHTML(y,all[y]||{});
  });
  return h;
}

function setYearFilter(y){
  S.yearFilter=y;
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

function yearHTML(y,quarters){
  let totalRec=0;
  [1,2,3,4].forEach(q=>{
    const recs=quarters[q]||{};
    Object.keys(recs).forEach(d=>{
      MODS.forEach(m=>{if(hasData(recs[d][m.id]))totalRec++});
    });
  });
  let h=`<section class="year-blk">
    <div class="year-head">
      <span class="y-num">${y}</span>
      <span class="y-meta">${totalRec} 条记录</span>
      <span class="y-rule"></span>
    </div>`;
  [1,2,3,4].forEach(q=>{
    h+=quarterHTML(y,q,quarters[q]||{});
  });
  return h+'</section>';
}

function quarterHTML(y,q,recs){
  const st=periodStats(recs);
  const key=`${y}Q${q}`;
  const open=S.openQ.has(key);
  const empty=st.modFilled===0;
  const status=empty?'无记录':(st.modFilled>=st.modTotal?'已归档':'进行中');
  let h=`<div class="q-blk${open?' open':''}${empty?' empty-q':''}">
    <button class="q-head" onclick="toggleQuarter(${y},${q})">
      <span class="q-tag">Q${q}</span>
      <span class="q-info">
        <span class="q-name">第${q}季度 · ${status}</span>
        <span class="q-sub">${st.deptFilled}/${st.deptTotal} 部门 · ${st.modFilled}/${st.modTotal} 模块 · 更新 ${fmtTs(st.lastTs).slice(0,10)}</span>
      </span>
      <span class="q-arrow"></span>
    </button>
    <div class="q-body">`;

  const withData=DEPTS.filter(d=>d.group!==true&&recs[d.id]&&MODS.some(m=>hasData(recs[d.id][m.id])));
  if(!withData.length){
    h+=`<div class="q-empty">本季度暂无检查记录<br>
      <button class="mini" style="margin-top:10px" onclick="startPeriod(${y},${q})">新建本季度记录</button>
      <button class="mini" style="margin-top:10px;margin-left:6px" onclick="openCopySheet(${y},${q})">从其他季度复制</button></div>`;
  }else{
    withData.forEach(d=>{
      const mods=recs[d.id]||{};
      let n=0;
      MODS.forEach(m=>{if(hasData(mods[m.id]))n++});
      let dots='';
      MODS.forEach(m=>{dots+=`<i class="${hasData(mods[m.id])?'on':''}"></i>`});
      h+=`<div class="rec-row">
        <div class="rr-main">
          <div class="rr-name">${d.name}</div>
          <div class="rr-meta">${n}/6 模块 · 更新 ${fmtTs(deptLastTs(mods)).slice(0,10)}</div>
          <div class="mod-dots">${dots}</div>
        </div>
        <div class="rr-acts">
          <button class="mini" onclick="viewRecord(${y},${q},'${d.id}')">查阅</button>
          <button class="mini pri" onclick="editRecord(${y},${q},'${d.id}')">修改</button>
        </div>
      </div>`;
    });
    h+=`<div class="q-acts">
      <button class="mini" onclick="exportPeriod(${y},${q})">导出本季度</button>
      <button class="mini" onclick="openCopySheet(${y},${q})">从其他季度复制</button>
      <button class="mini dan" onclick="clearPeriod(${y},${q})">清空本季度</button>
    </div>`;
  }
  return h+'</div></div>';
}

function toggleQuarter(y,q){
  const key=`${y}Q${q}`;
  if(S.openQ.has(key))S.openQ.delete(key);else S.openQ.add(key);
  render();
}
function startPeriod(y,q){
  setPeriod(y,q,false);
  S.view='check';
  render();
  openDeptPicker();
}
function editRecord(y,q,dept,mod){
  saveForm(false);
  S.year=y;S.quarter=q;S.dept=dept;
  if(mod)S.mod=mod;
  else{
    const first=MODS.find(m=>!isDone(y,q,dept,m.id));
    S.mod=first?first.id:'ledger';
  }
  const meta=loadMeta();meta.year=y;meta.quarter=q;meta.dept=dept;saveMeta(meta);
  closeSheet();
  S.view='check';
  render();
  window.scrollTo({top:0,behavior:'smooth'});
  toast(`正在修改 ${pShort(y,q)} · ${dName(dept)}`);
}
function deleteRecordAt(y,q,dept){
  confirmSheet('删除记录',
    `确定删除 <b>${esc(dName(dept))}</b> 在 <b>${pShort(y,q)}</b> 的全部检查记录？此操作不可恢复。`,
    ()=>{
      MODS.forEach(m=>delRec(y,q,dept,m.id));
      closeSheet();render();
      toast('记录已删除');
    },'删除',true);
}

/* ---------------- 记录查阅 ---------------- */
function fieldSpecList(dept,mod){
  const out=[];
  const t=TMAP[dept]||{};
  if(mod==='ledger'){
    (LEDGER[t.ledger]||[]).forEach(sec=>{
      sec.fields.forEach(f=>{
        out.push({k:'ld_'+f.k,l:f.l,u:f.u,sub:sec.title});
        if(sec.hasNew)out.push({k:'ld_'+f.k+'_new',l:f.l+'（本季新增）',u:f.u,sub:sec.title});
      });
    });
  }else if(mod==='patrol'){
    const cfg=PATROL[t.patrol]||{};
    (cfg.sections||[]).forEach(sec=>{
      cfg.ranges.forEach((range,idx)=>out.push({k:`pt_${sec.k}_${idx}`,l:`${sec.label} · ${range}`,u:'个/项',sub:sec.label}));
    });
    (cfg.fields||[]).forEach(f=>out.push({k:'pt_'+f.k,l:f.l,u:f.u,sub:'计划与完成情况'}));
  }else if(mod==='calib'){
    (CALIB[t.calib]||[]).forEach(sec=>sec.fields.forEach(f=>out.push({k:'cb_'+f.k,l:f.l,u:'',sub:sec.title})));
  }else if(mod==='maint'){
    (MAINT[t.maint]||[]).forEach(sec=>sec.fields.forEach(f=>out.push({k:'mt_'+f.k,l:f.l,u:'',sub:sec.title})));
  }else if(mod==='changes'){
    out.push({k:'change_count',l:'设备变更数目',u:'台',sub:'统计信息'});
    out.push({k:'change_desc',l:'变更说明',u:'',sub:'统计信息'});
  }else if(mod==='faults'){
    out.push({k:'fault_count',l:'设备故障数目',u:'台',sub:'统计信息'});
    out.push({k:'fault_desc',l:'故障说明',u:'',sub:'统计信息'});
  }
  return out;
}

function viewRecord(y,q,dept){
  let h=`<div class="rec-doc">
    <div class="rd-head"><b>${esc(dName(dept))}</b><span class="sn">${pShort(y,q)}</span></div>
    <div class="kv"><span class="k">检查日期</span><span class="v">${esc(fmtDate(anyMeta(y,q,dept,'_date')))||'--'}</span></div>
    <div class="kv"><span class="k">检查人</span><span class="v">${esc(anyMeta(y,q,dept,'_inspector'))||'--'}</span></div>
    <div class="kv"><span class="k">最后更新</span><span class="v">${fmtTs(deptLastTs((scanAll()[y]||{})[q]&&((scanAll()[y]||{})[q][dept])))}</span></div>
  </div>`;
  MODS.forEach(m=>{
    const data=loadRec(y,q,dept,m.id);
    const filled=hasData(data);
    h+=`<div class="rec-doc">
      <div class="rd-head"><span class="sn">${m.n}</span><b>${m.name}</b>
        <span style="margin-left:auto" class="rr-meta">${filled?'已填写':'未填写'}</span></div>`;
    if(!filled){
      h+=`<div class="kv"><span class="k" style="color:var(--ink3)">本模块暂无数据</span><span class="v"></span></div>`;
    }else{
      const specs=fieldSpecList(dept,m.id);
      let shownAny=false;
      specs.forEach(s=>{
        const v=data[s.k];
        if(v==null||String(v).trim()==='')return;
        shownAny=true;
        h+=`<div class="kv"><span class="k">${s.l}${s.u?'（'+s.u+'）':''}</span><span class="v">${esc(v)}</span></div>`;
      });
      const pre=footPrefix(m.id);
      if(data[pre+'_notes'])h+=`<div class="kv"><span class="k">备注说明</span><span class="v">${esc(data[pre+'_notes'])}</span></div>`;
      if(data[pre+'_assess'])h+=`<div class="kv"><span class="k">综合评估</span><span class="v">${esc(ASSESS[data[pre+'_assess']]||data[pre+'_assess'])}</span></div>`;
      if(!shownAny&&!data[pre+'_notes']&&!data[pre+'_assess']){
        h+=`<div class="kv"><span class="k" style="color:var(--ink3)">本模块暂无有效数据</span><span class="v"></span></div>`;
      }
    }
    h+=`<div class="kv"><span class="k">操作</span><span class="v">
      <button class="mini" onclick="editRecord(${y},${q},'${dept}','${m.id}')">修改本模块</button>
    </span></div>`;
    h+='</div>';
  });
  h+=`<div class="form-actions" style="margin-top:16px">
    <button class="btn btn-s btn-d" onclick="deleteRecordAt(${y},${q},'${dept}')">删除记录</button>
    <button class="btn btn-s" onclick="exportRecordAt(${y},${q},'${dept}')">导出记录</button>
    <button class="btn btn-a" onclick="editRecord(${y},${q},'${dept}')">修改</button>
  </div>`;
  openSheet('查阅检查记录',h);
}

function anyMeta(y,q,dept,field){
  let v='';
  MODS.forEach(m=>{
    const d=loadRec(y,q,dept,m.id);
    if(d&&d[field])v=d[field];
  });
  return v;
}

/* ---------------- 季度复制 ---------------- */
function openCopySheet(dstY,dstQ){
  const cy=new Date().getFullYear();
  let h=`<p class="desc" style="margin:2px 0 12px">把某个已有季度的全部记录复制到 <b>${pShort(dstY,dstQ)}</b>，作为填报底稿（目标季度同名内容将被覆盖）。</p>`;
  h+='<div class="pick-grp">来源年度</div><div class="seg-wrap">';
  for(let y=cy-3;y<=cy+1;y++)h+=`<button class="seg-btn" onclick="copyPickYear(${y},${dstY},${dstQ})">${y}</button>`;
  h+='</div><div class="pick-grp">来源季度</div><div class="seg-wrap">';
  [1,2,3,4].forEach(q=>{
    if(q===dstQ&&cy===dstY)return;
    h+=`<button class="seg-btn" onclick="doCopyPeriod(${cy},${q},${dstY},${dstQ})">Q${q} · 第${q}季度</button>`;
  });
  h+='</div><p class="hint">提示：先选择来源年度，再点季度即可开始复制。</p>';
  openSheet('从其他季度复制',h);
  copyPickYear._dst=[dstY,dstQ];
}
function copyPickYear(y,dstY,dstQ){
  openSheet('从其他季度复制',
    `<p class="desc" style="margin:2px 0 12px">把 <b>${y} 年</b>某个季度的记录复制到 <b>${pShort(dstY,dstQ)}</b>。</p>
    <div class="pick-grp">来源季度</div><div class="seg-wrap">
    ${[1,2,3,4].map(q=>`<button class="seg-btn" onclick="doCopyPeriod(${y},${q},${dstY},${dstQ})">Q${q} · 第${q}季度</button>`).join('')}
    </div>`);
}
function doCopyPeriod(srcY,srcQ,dstY,dstQ){
  const all=scanAll();
  const recs=(all[srcY]||{})[srcQ]||{};
  const st=periodStats(recs);
  if(st.modFilled===0){toast(`${pShort(srcY,srcQ)} 没有可复制的记录`);return}
  confirmSheet('确认复制',
    `将 <b>${pShort(srcY,srcQ)}</b> 的 ${st.modFilled} 条模块记录复制到 <b>${pShort(dstY,dstQ)}</b>，目标季度已填内容会被覆盖。`,
    ()=>{
      let n=0;
      DEPTS.forEach(d=>{
        if(d.group===true)return;
        MODS.forEach(m=>{
          const data=recs[d.id]&&recs[d.id][m.id];
          if(data&&hasData(data)){
            const cp=JSON.parse(JSON.stringify(data));
            delete cp._updatedAt;
            saveRec(dstY,dstQ,d.id,m.id,cp);
            n++;
          }
        });
      });
      closeSheet();
      S.openQ.add(`${dstY}Q${dstQ}`);
      S.view='library';
      render();
      toast(`已复制 ${n} 条记录到 ${pShort(dstY,dstQ)}`);
    },'开始复制');
}

/* ---------------- 季度导出 / 清空 ---------------- */
function exportPeriod(y,q){
  const all=scanAll();
  const recs=(all[y]||{})[q]||{};
  const st=periodStats(recs);
  if(st.modFilled===0){toast('本季度暂无数据');return}
  const payload={
    app:'设备检查管理系统',ver:2,
    exportedAt:new Date().toISOString(),
    period:pShort(y,q),
    records:{[`${y}Q${q}`]:recs}
  };
  downloadJSON(payload,`设备检查档案_${y}Q${q}_${todayISO()}.json`);
  toast(`已导出 ${pShort(y,q)}`);
}
function clearPeriod(y,q){
  confirmSheet('清空本季度',
    `确定清空 <b>${pShort(y,q)}</b> 的全部检查记录？此操作不可恢复，建议先导出备份。`,
    ()=>{
      const all=scanAll();
      const recs=(all[y]||{})[q]||{};
      DEPTS.forEach(d=>{
        if(d.group===true)return;
        MODS.forEach(m=>{
          if(recs[d.id]&&recs[d.id][m.id])delRec(y,q,d.id,m.id);
        });
      });
      render();
      toast(`${pShort(y,q)} 已清空`);
    },'清空',true);
}

function exportRecordAt(y,q,dept){
  const all=scanAll();
  const recs=((all[y]||{})[q]||{})[dept]||{};
  if(!MODS.some(m=>hasData(recs[m.id]))){toast('该记录暂无数据');return}
  const payload={
    app:'设备检查管理系统',ver:2,
    exportedAt:new Date().toISOString(),
    period:pShort(y,q),
    records:{[`${y}Q${q}`]:{[dept]:recs}}
  };
  downloadJSON(payload,`设备检查_${dName(dept)}_${y}Q${q}.json`);
  toast('记录已导出');
}

/* ================================================================
   设置
   ================================================================ */
function settingsHTML(){
  const meta=loadMeta();
  const legacy=legacyKeys();
  const cy=new Date().getFullYear();
  let h=`<div class="stagger">
  <div class="display" style="margin:2px 2px 4px">设置</div>
  <p class="desc" style="margin:0 2px 16px">当前检查期间、数据备份与安装选项。</p>

  <div class="set-blk">
    <div class="sb-head">当前检查期间</div>
    <div class="set-row">
      <div class="sr-t"><b>年度</b><span>记录归档的年份</span></div>
      <div class="stepper">
        <button onclick="setYearStep(-1)" aria-label="上一年">−</button>
        <span class="sv">${S.year}</span>
        <button onclick="setYearStep(1)" aria-label="下一年">＋</button>
      </div>
    </div>
    <div class="set-row" style="flex-direction:column;align-items:stretch;gap:10px">
      <div class="sr-t"><b>季度</b><span>每年四个季度独立归档</span></div>
      <div class="qseg">
        ${[1,2,3,4].map(q=>`<button class="${S.quarter===q?'act':''}" onclick="setPeriod(${S.year},${q})">Q${q}</button>`).join('')}
      </div>
      <button class="mini" onclick="setPeriod(${cy},${Math.floor(new Date().getMonth()/3)+1})">回到今年（${cy} Q${Math.floor(new Date().getMonth()/3)+1}）</button>
    </div>
  </div>

  <div class="set-blk">
    <div class="sb-head">数据管理</div>
    <div class="set-row">
      <div class="sr-t"><b>导出全部数据</b><span>生成 JSON 备份文件，可用于跨设备迁移</span></div>
      <button class="mini pri" onclick="exportAll()">导出</button>
    </div>
    <div class="set-row">
      <div class="sr-t"><b>导入备份</b><span>从 JSON 备份恢复 / 合并记录</span></div>
      <button class="mini" onclick="openImport()">选择文件</button>
    </div>
    <div class="set-row">
      <div class="sr-t"><b>打印当前页</b><span>将当前检查表单输出为纸质表</span></div>
      <button class="mini" onclick="doPrint()">打印</button>
    </div>
    <div class="set-row">
      <div class="sr-t"><b>清除所有数据</b><span>删除本机全部检查记录（不可恢复）</span></div>
      <button class="mini dan" onclick="doClearAll()">清除</button>
    </div>
    <div class="set-row">
      <div class="sr-t"><b>存储占用</b><span>浏览器本地存储（localStorage）</span></div>
      <span class="mono" style="font-size:.85rem">${storageSize()}</span>
    </div>
  </div>`;

  if(legacy.length){
    h+=`<div class="set-blk">
      <div class="sb-head">旧版数据</div>
      <div class="set-row">
        <div class="sr-t"><b>发现 ${legacy.length} 条旧版记录</b><span>来自旧版网页（无年度/季度信息），可导入到 ${pShort(S.year,S.quarter)}</span></div>
        <button class="mini pri" onclick="importLegacy()">导入</button>
      </div>
    </div>`;
  }

  h+=`<div class="set-blk">
    <div class="sb-head">安装与隐私</div>
    <div class="set-row" id="installRow"${isNative()?' style="display:none"':''}>
      <div class="sr-t"><b>添加到主屏幕</b><span>安装后可全屏离线使用，体验与原生 App 一致</span></div>
      <button class="mini pri" onclick="doInstall()">安装</button>
    </div>
    <div class="set-row">
      <div class="sr-t"><b>隐私政策</b><span>数据仅存本机，不收集个人信息</span></div>
      <button class="mini" onclick="window.open('privacy.html','_blank')">查看</button>
    </div>
    <div class="set-row" style="flex-direction:column;align-items:stretch;gap:6px">
      <div class="sr-t"><b>使用说明</b></div>
      <p class="hint">iPhone：Safari 打开本页 → 分享 → 添加到主屏幕。<br>
      Android：浏览器菜单 → 安装应用 / 添加到主屏幕。<br>
      数据保存在手机浏览器本地，请定期使用「导出全部数据」备份。</p>
    </div>
  </div>

  <div class="set-blk">
    <div class="sb-head">关于</div>
    <div class="set-row">
      <div class="sr-t"><b>设备检查管理系统</b><span>移动端版本 ${VER} · 6 大检查模块 · 年度/季度档案</span></div>
    </div>
  </div>
  </div>`;
  return h;
}

function storageSize(){
  let n=0;
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&(k.startsWith('eqi_')||k.startsWith('insp_'))){
      n+=k.length+(localStorage.getItem(k)||'').length;
    }
  }
  return n>1024*1024?(n/1024/1024).toFixed(2)+' MB':(n/1024).toFixed(1)+' KB';
}

/* ================================================================
   导出 / 导入
   ================================================================ */
function buildExport(){
  const all=scanAll();
  const records={};
  Object.keys(all).forEach(y=>{
    Object.keys(all[y]).forEach(q=>{
      records[`${y}Q${q}`]=all[y][q];
    });
  });
  return{
    app:'设备检查管理系统',ver:2,
    exportedAt:new Date().toISOString(),
    records
  };
}

/* 统一两种归档格式 → { "YYYYQq": { dept: { mod: data } } } */
function normalizeRecords(records){
  const out={};
  Object.keys(records||{}).forEach(key=>{
    const val=records[key];
    if(/^\d{4}Q[1-4]$/.test(key)&&val&&typeof val==='object'){
      out[key]=val;
      return;
    }
    const ym=key.match(/^(\d{4})$/);
    if(ym&&val&&typeof val==='object'){
      Object.keys(val).forEach(qk=>{
        if(/^[1-4]$/.test(qk))out[`${ym[1]}Q${qk}`]=val[qk];
      });
    }
  });
  return out;
}
function exportAll(){
  const payload=buildExport();
  const st=Object.keys(payload.records).length;
  if(!st){toast('暂无保存的数据');return}
  downloadJSON(payload,`设备检查档案_全部_${todayISO()}.json`);
  toast('全部数据已导出');
}
function downloadJSON(obj,filename){
  try{
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600);
  }catch(e){
    toast('导出失败：当前浏览器不支持下载');
  }
}

function openImport(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='.json,application/json';
  input.onchange=()=>{
    const file=input.files&&input.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>handleImport(String(reader.result||''));
    reader.readAsText(file,'utf-8');
  };
  input.click();
}

function handleImport(text){
  let obj=null;
  try{obj=JSON.parse(text)}catch(e){toast('文件格式错误，无法解析');return}
  if(!obj||typeof obj!=='object'){toast('文件内容无效');return}
  let n=0;
  if(obj.records&&typeof obj.records==='object'){
    const recs=normalizeRecords(obj.records);
    Object.keys(recs).forEach(pk=>{
      const m=pk.match(/^(\d{4})Q([1-4])$/);
      if(!m)return;
      const y=+m[1],q=+m[2];
      const depts=recs[pk]||{};
      Object.keys(depts).forEach(dept=>{
        if(!TMAP[dept])return;
        const mods=depts[dept]||{};
        Object.keys(mods).forEach(mod=>{
          if(!MODS.some(x=>x.id===mod))return;
          const data=mods[mod];
          if(data&&typeof data==='object'){
            saveRec(y,q,dept,mod,JSON.parse(JSON.stringify(data)));
            n++;
          }
        });
      });
    });
    S.view='library';render();
    toast(n?`已导入 ${n} 条模块记录`:'未找到可导入的记录');
    return;
  }
  /* 兼容旧版：insp_<dept>_<mod> 平铺格式 */
  let legacyN=0;
  Object.keys(obj).forEach(k=>{
    const m=k.match(/^insp_([a-z]+)_([a-z]+)$/);
    if(!m)return;
    const dept=m[1],mod=m[2];
    if(!TMAP[dept]||!MODS.some(x=>x.id===mod))return;
    saveRec(S.year,S.quarter,dept,mod,obj[k]||{});
    legacyN++;
  });
  if(legacyN){
    S.view='library';render();
    toast(`已按旧版格式导入 ${legacyN} 条记录到 ${pShort(S.year,S.quarter)}`);
  }else{
    toast('未识别到可导入的数据');
  }
}

/* ================================================================
   旧版数据迁移
   ================================================================ */
function legacyKeys(){
  const out=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&/^insp_[a-z]+_[a-z]+$/.test(k))out.push(k);
  }
  return out;
}
function importLegacy(){
  const keys=legacyKeys();
  if(!keys.length){toast('未发现旧版数据');return}
  let n=0,skipped=0;
  keys.forEach(k=>{
    const m=k.match(/^insp_([a-z]+)_([a-z]+)$/);
    const dept=m[1],mod=m[2];
    if(!TMAP[dept]||!MODS.some(x=>x.id===mod))return;
    let data=null;
    try{data=JSON.parse(localStorage.getItem(k))}catch(e){}
    if(!data)return;
    if(hasData(loadRec(S.year,S.quarter,dept,mod))){skipped++;return}
    saveRec(S.year,S.quarter,dept,mod,data);
    n++;
  });
  render();
  toast(`已导入 ${n} 条旧版记录到 ${pShort(S.year,S.quarter)}${skipped?`，跳过 ${skipped} 条已有记录`:''}`);
}

function doClearAll(){
  confirmSheet('清除所有数据',
    '确定清除本机保存的全部检查记录（含旧版数据）？此操作不可恢复，建议先导出备份。',
    ()=>{
      const keys=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i);
        if(k&&(k.startsWith('eqi_')||k.startsWith('insp_')))keys.push(k);
      }
      keys.forEach(k=>localStorage.removeItem(k));
      S.dept=null;S.openQ.clear();
      render();
      toast('所有数据已清除');
    },'全部清除',true);
}

/* ================================================================
   PWA / 原生（Capacitor）适配
   ================================================================ */
let deferredPrompt=null;
function isNative(){
  const c=window.Capacitor;
  if(!c)return false;
  if(typeof c.isNativePlatform==='function')return !!c.isNativePlatform();
  return c.isNative===true||location.protocol==='capacitor:';
}
function doInstall(){
  if(isNative()){toast('当前已是安装版应用');return}
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(()=>{deferredPrompt=null});
    return;
  }
  toast('请用浏览器菜单中的「添加到主屏幕」安装');
}

/* 首次启动隐私确认（应用商店上架合规要求） */
function ensurePrivacyConsent(){
  try{
    if(localStorage.getItem('***'))return;
    if(!isNative()&&location.search.indexOf('privacy=1')<0)return;
  }catch(e){return}
  openSheet('用户协议与隐私政策',`
    <p class="desc" style="margin:2px 0 12px">在使用本应用前，请了解我们的数据处理方式：</p>
    <div class="rec-doc" style="margin-bottom:14px">
      <div class="kv"><span class="k">数据存储</span><span class="v" style="max-width:60%">所有检查记录仅保存在本机，不上传任何服务器</span></div>
      <div class="kv"><span class="k">个人信息</span><span class="v" style="max-width:60%">不收集任何个人信息，无第三方统计/广告 SDK</span></div>
      <div class="kv"><span class="k">检查人姓名</span><span class="v" style="max-width:60%">由用户自愿填写，仅存于本机</span></div>
      <div class="kv"><span class="k">数据备份</span><span class="v" style="max-width:60%">卸载/清数据会删除记录，请自行导出备份</span></div>
    </div>
    <button class="mini" onclick="window.open('privacy.html','_blank')" style="margin-bottom:16px">查看完整隐私政策</button>
    <div class="form-actions" style="margin:0">
      <button class="btn btn-s" onclick="privacyDecline()">暂不使用</button>
      <button class="btn btn-a" onclick="privacyAccept()">同意并继续</button>
    </div>`);
}
function privacyAccept(){
  try{localStorage.setItem('***','1')}catch(e){}
  closeSheet();
}
function privacyDecline(){
  openSheet('已拒绝使用',`
    <p class="desc" style="margin:2px 0 16px">您已选择暂不使用本应用。如需继续，请退出应用后重新进入并同意隐私政策。</p>
    <button class="btn btn-s" onclick="privacyAccept()">返回并同意</button>`);
}

function initPWA(){
  if(isNative()){
    const b=document.getElementById('installBtn');
    if(b)b.hidden=true;
    ensurePrivacyConsent();
    return;
  }
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    const b=document.getElementById('installBtn');
    if(b)b.hidden=false;
  });
  window.addEventListener('appinstalled',()=>{
    const b=document.getElementById('installBtn');
    if(b)b.hidden=true;
    toast('已安装到主屏幕');
  });
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.protocol==='http:')){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    });
  }
}

/* ================================================================
   INIT
   ================================================================ */
function init(){
  const meta=loadMeta();
  const now=new Date();
  S.year=meta.year||now.getFullYear();
  S.quarter=meta.quarter||(Math.floor(now.getMonth()/3)+1);
  if(meta.dept&&TMAP[meta.dept])S.dept=meta.dept;

  render();
  initPWA();

  const view=document.getElementById('view');
  view.addEventListener('input',debounce(()=>{
    if(S.view==='check'&&S.dept)saveForm(false);
  },400));
  view.addEventListener('change',()=>{
    if(S.view==='check'&&S.dept)saveForm(false);
  });

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeSheet();
  });
}

document.addEventListener('DOMContentLoaded',init);
