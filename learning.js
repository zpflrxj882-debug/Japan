(function(root){
"use strict";
const day=at=>{const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const blank=()=>({learned:{},review:{},mistakes:{},seen:0,weak:{},history:[],notes:{}});
function validate(v,valid){
 if(!v||typeof v!=="object"||Array.isArray(v))throw Error("학습 데이터가 올바르지 않아요");
 const s=blank(),obj=x=>x&&typeof x==='object'&&!Array.isArray(x),num=x=>Number.isFinite(x)&&x>=0;
 for(const field of ['learned','review','mistakes'])if(!obj(v[field]))throw Error('필수 학습 기록이 없어요');
 for(const field of ['learned','review','mistakes','weak','notes']){
  if(v[field]===undefined)continue;if(!obj(v[field]))throw Error('잘못된 '+field);
  for(const [id,x] of Object.entries(v[field])){
   if(!valid.includes(id))throw Error('알 수 없는 학습 항목');
   if(field==='learned'&&typeof x!=='boolean'||field==='mistakes'&&(!Number.isInteger(x)||x<0)||field==='review'&&(!obj(x)||!Number.isInteger(x.step)||x.step<0||x.step>6||!num(x.next))||field==='notes'&&(typeof x!=='string'||x.length>2000)||field==='weak'&&(!obj(x)||typeof x.locked!=='boolean'||!Array.isArray(x.days)||x.days.length>3||x.days.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d))||new Set(x.days).size!==x.days.length))throw Error('손상된 학습 기록');
   s[field][id]=x;
  }
 }
 if(!Number.isInteger(v.seen)||v.seen<0)throw Error('잘못된 정답 수');s.seen=v.seen;
 if(v.history!==undefined){if(!Array.isArray(v.history)||v.history.length>10000||v.history.some(e=>!obj(e)||!valid.includes(e.id)||!num(e.at)||typeof e.ok!=='boolean'||!['quiz','recall'].includes(e.kind)))throw Error('잘못된 학습 이력');s.history=v.history}
 return s;
}
function record(s,id,ok,kind,at=Date.now()){
 const prev=s.review[id],r=prev?{...prev}:{step:0,next:at};
 if(!ok){r.step=0;r.next=at+600000;s.mistakes[id]=(s.mistakes[id]||0)+1;s.weak[id]={locked:true,days:[]}}
 else {s.seen++;if(kind==='recall'){r.step=Math.min(6,r.step+1);r.next=at+[1,1,3,7,14,30,60][r.step]*86400000;const w=s.weak[id];if(w?.locked){const d=day(at);if(!w.days.includes(d))w.days.push(d);if(w.days.length>=3){w.locked=false;s.mistakes[id]=0}}}else if(!prev)r.next=at+86400000}
 s.learned[id]=true;s.review[id]=r;s.history.push({id,ok,kind,at});s.history=s.history.slice(-10000);
}
function queue(s,ids,at=Date.now()) {return ids.filter(id=>s.review[id]?.next<=at).sort((a,b)=>s.review[a].next-s.review[b].next).concat(ids.filter(id=>!s.learned[id])).slice(0,10)}
const api={day,blank,validate,record,queue};if(typeof module!=='undefined')module.exports=api;else root.JapanLearning=api;
})(globalThis);
