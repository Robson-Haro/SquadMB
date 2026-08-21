import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import seedVagas from './data/vagas.json';
import './styles.css';
import './dashboard.css';

type Vacancy=Record<string,any>&{_id:number};
type Candidate={id:string;name:string;status:string};
type Entry={id:string;owner:string;squad:number;jobCode:string;jobTitle:string;createdAt:string;candidates:Candidate[]};

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
const supabase=!!(url&&key);
const headers={'apikey':key||'','Authorization':`Bearer ${key||''}`,'Content-Type':'application/json','Prefer':'return=representation'};
async function db(path:string,init:RequestInit={}){if(!url)return null;const r=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{...headers,...(init.headers||{})}});if(!r.ok)throw new Error(await r.text());const t=await r.text();return t?JSON.parse(t):null}
const columns=['COD VAGA','Abertura da vaga','DIVISÃO','SETOR','Cidade','Cargo','Nível da vaga','GESTOR','SLA','DATA FECHAMENTO','GUPY ANDAMENTO','Status','CANDIDATO SELECIONADO','DATA ADMISSÃO','PRIORIDADE','VAGA COM TALENT','BP RESPONSÁVEL','SUBSTITUTO','NEGÓCIO','STATUS GERAL'];
const statuses=['Acima da Faixa','Carta Oferta','Declinou','Encerrado','Entrevista Gestor','Entrevista Gestor do Gestor','Pesquisa pregressa','Reprovado Gestor','Reprovado Gestor do Gestor','Reprovado RH'];
const team=[
 {name:'Gabrielli Caroline Soares',short:'Gabrielli',squad:1,role:'Triagem e agendamento',img:'/team/gabrielli.png'},
 {name:'Raphaela Costa do Nascimento',short:'Raphaela',squad:1,role:'Triagem e agendamento',img:'/team/raphaela.png'},
 {name:'Giovana Sampaio de Sá',short:'Giovana',squad:2,role:'Entrevistas',img:'/team/giovana.png'},
 {name:'Larissa Ferraioli',short:'Larissa',squad:2,role:'Entrevistas',img:'/team/larissa.png'},
 {name:'Thamyres Targino Dantas',short:'Thamyres',squad:2,role:'Entrevistas',img:'/team/thamyres.png'},
 {name:'Barbara Madrid',short:'Barbara',squad:3,role:'Entrevistas críticas',img:'/team/barbara.png'},
 {name:'Bruna Siqueira de Faria',short:'Bruna',squad:3,role:'Entrevistas críticas',img:'/team/bruna.png'},
 {name:'Robson Ramos',short:'Robson',squad:3,role:'Entrevistas críticas',img:'/team/robson.png'},
];
const uid=()=>crypto.randomUUID();
const today=()=>new Date();
const days=(date?:string)=>date?Math.max(0,Math.floor((today().getTime()-new Date(date+'T12:00:00').getTime())/86400000)):0;
function slaTone(v:Vacancy){
 if(String(v.Status||'').toLowerCase().includes('conclu')||String(v['STATUS GERAL']||'').toLowerCase()==='fechada')return 'closed';
 const d=days(v['Abertura da vaga']); const n=String(v['Nível da vaga']||'').toLowerCase();
 if(n.includes('gerente')) return d<=39?'green':d<=50?'yellow':'red';
 if(n.includes('coordenador')) return d<=25?'green':d<=35?'yellow':'red';
 return d<=15?'green':d<=30?'yellow':'red';
}
function statusTone(s:string){if(s==='Encerrado')return'green';if(s.includes('Reprovado'))return'red';if(s.includes('Entrevista Gestor'))return'blue';if(s==='Carta Oferta')return'purple';if(s==='Pesquisa pregressa')return'yellow';return'neutral'}

function App(){
 const [tab,setTab]=useState<'vagas'|'squad'|'dashboard'>('vagas');
 const [vagas,setVagas]=useState<Vacancy[]>(seedVagas as Vacancy[]); const [entries,setEntries]=useState<Entry[]>([]);
 const [query,setQuery]=useState(''); const [filter,setFilter]=useState('Todas'); const [saving,setSaving]=useState(false); const [notice,setNotice]=useState('');
 useEffect(()=>{let live=true;async function load(){if(!supabase)return;try{const v=await db('vacancies?select=*&order=id');if(v?.length&&live)setVagas(v.map((x:any)=>({...x.data,_id:x.id})));else if(!v?.length)await db('vacancies',{method:'POST',body:JSON.stringify((seedVagas as Vacancy[]).map(x=>({id:x._id,data:x}))),headers:{Prefer:'resolution=merge-duplicates'}});const e=await db('squad_entries?select=*,candidates(*)&order=created_at.desc');if(e&&live)setEntries(e.map((x:any)=>({id:x.id,owner:x.owner,squad:x.squad,jobCode:x.job_code||'',jobTitle:x.job_title||'',createdAt:x.created_at,candidates:(x.candidates||[]).sort((a:any,b:any)=>a.position-b.position).map((c:any)=>({id:c.id,name:c.name,status:c.status}))})));}catch(err){console.error(err)}}load();const timer=setInterval(load,15000);return()=>{live=false;clearInterval(timer)}},[]);
 const divisions=useMemo(()=>['Todas',...Array.from(new Set(vagas.map(v=>v.DIVISÃO).filter(Boolean))).sort()], [vagas]);
 const shown=useMemo(()=>vagas.filter(v=>(filter==='Todas'||v.DIVISÃO===filter)&&Object.values(v).join(' ').toLowerCase().includes(query.toLowerCase())),[vagas,query,filter]);
 async function saveVacancy(v:Vacancy,col:string,value:string){const next={...v,[col]:value};setVagas(a=>a.map(x=>x._id===v._id?next:x));if(supabase){setSaving(true);await db('vacancies?on_conflict=id',{method:'POST',body:JSON.stringify({id:v._id,data:next}),headers:{Prefer:'resolution=merge-duplicates'}});setSaving(false)}}
 async function addEntry(person=team[2]){const e:Entry={id:uid(),owner:person.short,squad:person.squad,jobCode:'',jobTitle:'',createdAt:new Date().toISOString(),candidates:[]};setEntries(a=>[e,...a]);if(supabase)await db('squad_entries',{method:'POST',body:JSON.stringify({id:e.id,owner:e.owner,squad:e.squad,job_code:'',job_title:''})})}
 async function patchEntry(id:string,patch:Partial<Entry>){setEntries(a=>a.map(e=>e.id===id?{...e,...patch}:e));if(supabase){const p:any={};if(patch.jobCode!==undefined)p.job_code=patch.jobCode;if(patch.jobTitle!==undefined)p.job_title=patch.jobTitle;if(Object.keys(p).length)await db(`squad_entries?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(p)})}}
 async function setCandidateCount(e:Entry,count:number){let cs=[...e.candidates];while(cs.length<count)cs.push({id:uid(),name:'',status:'Entrevista Gestor'});cs=cs.slice(0,count);patchEntry(e.id,{candidates:cs});if(supabase){await db(`candidates?entry_id=eq.${e.id}`,{method:'DELETE'});if(cs.length)await db('candidates',{method:'POST',body:JSON.stringify(cs.map((c,i)=>({id:c.id,entry_id:e.id,name:c.name,status:c.status,position:i})))})}}
 async function patchCandidate(e:Entry,id:string,p:Partial<Candidate>){const cs=e.candidates.map(c=>c.id===id?{...c,...p}:c);setEntries(a=>a.map(x=>x.id===e.id?{...x,candidates:cs}:x));if(supabase)await db(`candidates?id=eq.${id}`,{method:'PATCH',body:JSON.stringify(p)})}
 const open=vagas.filter(v=>slaTone(v)!=='closed').length, closed=vagas.length-open;
 return <div className="app">
  <header><div className="brand"><img src="/logo.webp"/><div><b>Squad</b><span>Suprimentos / MB</span></div></div><nav>
   <button className={tab==='vagas'?'active':''} onClick={()=>setTab('vagas')}>◆ Vagas</button><button className={tab==='squad'?'active':''} onClick={()=>setTab('squad')}>● Indicações</button><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}>▥ Dashboard</button>
  </nav><div className={'sync '+(supabase?'online':'demo')}><i/>{saving?'Salvando...':supabase?'Sincronizado':'Conectar Supabase'}</div></header>
  <main>
  {tab==='vagas'&&<><section className="hero"><div><span className="eyebrow">CENTRAL DE RECRUTAMENTO</span><h1>Vagas em movimento.<br/><em>Decisões à vista.</em></h1><p>SLA atualizado diariamente, prioridades visíveis e edição compartilhada.</p></div><div className="hero-stats"><Metric n={vagas.length} label="Vagas totais"/><Metric n={open} label="Em andamento"/><Metric n={closed} label="Encerradas" happy/></div></section>
   <section className="panel"><div className="toolbar"><div className="search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar vaga, cidade, gestor..."/></div><select value={filter} onChange={e=>setFilter(e.target.value)}>{divisions.map(x=><option>{x}</option>)}</select><span>{shown.length} resultados</span></div><div className="table-wrap"><table><thead><tr>{columns.map(c=><th>{c}</th>)}</tr></thead><tbody>{shown.map(v=><tr className={slaTone(v)}>{columns.map(c=><td className={c==='SLA'?'sla-cell':''}>{c==='SLA'?<b>{days(v['Abertura da vaga'])} dias</b>:<input value={v[c]??''} onChange={e=>setVagas(a=>a.map(x=>x._id===v._id?{...x,[c]:e.target.value}:x))} onBlur={e=>saveVacancy(v,c,e.target.value)} />}</td>)}</tr>)}</tbody></table></div></section></>}
  {tab==='squad'&&<><section className="page-head"><span className="eyebrow">SQUAD DE INDICAÇÃO</span><h1>Do primeiro contato à proposta.</h1><p>Registre as vagas e acompanhe cada pessoa candidata em uma única visão.</p></section><div className="squad-flow">{[1,2,3].map(s=><div className={'squad-band s'+s}><b>Squad {s}</b><span>{s===1?'Triagem e agendamento':s===2?'Entrevistas • SLA intermediário':'Entrevistas críticas • maior SLA'}</span></div>)}</div><section className="team-grid">{team.map(p=><article className={'person-card s'+p.squad}><img src={p.img}/><div><span>Squad {p.squad}</span><h3>{p.name}</h3><p>{p.role}</p></div>{p.squad>1&&<button onClick={()=>addEntry(p)}>＋ Nova vaga</button>}</article>)}</section><section className="entries">{entries.length===0&&<div className="empty"><b className="spark">✦</b><h2>Pronto para a primeira indicação</h2><p>Clique em “Nova vaga” na pessoa que conduzirá as entrevistas.</p></div>}{entries.map(e=><article className="entry-card"><div className="entry-owner"><img src={team.find(p=>p.short===e.owner)?.img}/><div><small>SQUAD {e.squad}</small><b>{e.owner}</b></div></div><label>Código Gupy<input value={e.jobCode} onChange={x=>patchEntry(e.id,{jobCode:x.target.value})}/></label><label>Nome da vaga<input value={e.jobTitle} onChange={x=>patchEntry(e.id,{jobTitle:x.target.value})}/></label><label>Indicados<select value={e.candidates.length} onChange={x=>setCandidateCount(e,+x.target.value)}><option value="0">0</option>{[1,2,3,4,5,6,7,8,9,10].map(n=><option>{n}</option>)}</select></label><div className="candidate-list">{e.candidates.map((c,i)=><div><span>{i+1}</span><input placeholder="Nome da pessoa candidata" value={c.name} onChange={x=>patchCandidate(e,c.id,{name:x.target.value})}/><select className={'status '+statusTone(c.status)} value={c.status} onChange={x=>patchCandidate(e,c.id,{status:x.target.value})}>{statuses.map(s=><option>{s}</option>)}</select></div>)}</div></article>)}</section></>}
  {tab==='dashboard'&&<Dashboard vagas={vagas} entries={entries}/>} 
  </main><footer><span>Squad Suprimentos / MB</span><span>Início da operação: 24/08/2026</span></footer>
 </div>
}
function Metric({n,label,happy}:{n:number,label:string,happy?:boolean}){return <div><strong>{n}</strong><span>{label}</span>{happy&&n>0?<b className="happy">☺</b>:null}</div>}
function Dashboard({vagas,entries}:{vagas:Vacancy[],entries:Entry[]}){const cands=entries.flatMap(e=>e.candidates.map(c=>({...c,squad:e.squad})));const statusData=statuses.map(s=>({name:s,value:cands.filter(c=>c.status===s).length})).filter(x=>x.value);const squadData=[1,2,3].map(s=>({name:'Squad '+s,value:cands.filter(c=>c.squad===s).length}));const max=Math.max(1,...squadData.map(x=>x.value));const avg=Math.round(vagas.filter(v=>slaTone(v)!=='closed').reduce((a,v)=>a+days(v['Abertura da vaga']),0)/Math.max(1,vagas.filter(v=>slaTone(v)!=='closed').length));return <><section className="page-head dash"><span className="eyebrow">INTELIGÊNCIA DA OPERAÇÃO</span><h1>Dashboard executivo</h1><p>Indicadores das vagas e da Squad desde 24/08/2026.</p></section><div className="kpis"><Metric n={entries.length} label="Vagas na Squad"/><Metric n={cands.length} label="Candidatos indicados"/><Metric n={avg} label="SLA médio (dias)"/><Metric n={cands.filter(c=>c.status==='Encerrado').length} label="Encerrados" happy/></div><div className="charts"><section><h2>Indicações por Squad</h2><div className="bars">{squadData.map(x=><div><span>{x.name}</span><i style={{width:`${Math.max(4,x.value/max*100)}%`}}/><b>{x.value}</b></div>)}</div></section><section><h2>Status das pessoas candidatas</h2><div className="status-chart">{statusData.length?statusData.map(x=><div><span>{x.name}</span><b>{x.value}</b></div>):<div className="chart-empty">Os indicadores aparecerão com as primeiras indicações.</div>}</div></section></div><section className="sla-board"><h2>Saúde do SLA das vagas</h2>{['green','yellow','red','closed'].map(t=><div className={t}><strong>{vagas.filter(v=>slaTone(v)===t).length}</strong><span>{t==='green'?'Dentro do SLA':t==='yellow'?'Atenção':t==='red'?'Críticas':'Encerradas'}</span></div>)}</section></>}
createRoot(document.getElementById('root')!).render(<App/>);
