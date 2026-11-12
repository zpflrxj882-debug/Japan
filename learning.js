(function(root){
"use strict";
const DAY=86400000,INTERVALS=[0,1,3,7,14,30,60];
const day=at=>{const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const blank=()=>({learned:{},review:{},mistakes:{},seen:0,weak:{},history:[],notes:{},session:null});
const obj=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const num=x=>Number.isFinite(x)&&x>=0;
function validate(v,valid){
 if(!obj(v))throw Error("학습 데이터가 올바르지 않아요");
 const s=blank(),allowed=new Set(valid);
 for(const field of ["learned","review","mistakes"])if(!obj(v[field]))throw Error("필수 학습 기록이 없어요");
 for(const field of ["learned","review","mistakes","weak","notes"]){
  if(v[field]===undefined)continue;
  if(!obj(v[field]))throw Error("잘못된 "+field);
  for(const [id,x] of Object.entries(v[field])){
   if(!allowed.has(id))throw Error("알 수 없는 학습 항목");
   if(field==="learned"&&typeof x!=="boolean"||
      field==="mistakes"&&(!Number.isInteger(x)||x<0)||
      field==="review"&&(!obj(x)||!Number.isInteger(x.step)||x.step<0||x.step>6||!num(x.next)||
       ["lastAdvance","lastSeen","lastReviewed"].some(k=>x[k]!==undefined&&!num(x[k])))||
      field==="notes"&&(typeof x!=="string"||x.length>2000)||
      field==="weak"&&(!obj(x)||typeof x.locked!=="boolean"||!Array.isArray(x.days)||x.days.length>3||x.days.some(d=>typeof d!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(d))||new Set(x.days).size!==x.days.length))
    throw Error("손상된 학습 기록");
   s[field][id]=x;
  }
 }
 if(!Number.isInteger(v.seen)||v.seen<0)throw Error("잘못된 정답 수");s.seen=v.seen;
 if(v.history!==undefined){
  if(!Array.isArray(v.history)||v.history.length>10000||v.history.some(e=>!obj(e)||!allowed.has(e.id)||!num(e.at)||typeof e.ok!=="boolean"||!["quiz","recall"].includes(e.kind)||
   (e.qualified!==undefined&&typeof e.qualified!=="boolean")))throw Error("잘못된 학습 이력");
  s.history=v.history;
 }
 if(v.session!==undefined&&v.session!==null){
  const q=v.session;
  if(!obj(q)||!Array.isArray(q.keys)||q.keys.length>30||q.keys.some(id=>!allowed.has(id))||!Number.isInteger(q.index)||q.index<0||q.index>q.keys.length||typeof q.recall!=="boolean")throw Error("잘못된 진행 중 학습");
  s.session={keys:q.keys.slice(),index:q.index,recall:q.recall};
 }
 return s;
}
function record(s,id,ok,kind,at=Date.now()){
 if(!["quiz","recall"].includes(kind))throw Error("지원하지 않는 학습 방식");
 const prev=s.review[id],r=prev?{...prev}:{step:0,next:at};
 const d=day(at),priorDay=r.lastAdvance===undefined?null:day(r.lastAdvance);
 const due=!prev||r.next<=at;
 const canAdvance=kind==="recall"&&due&&priorDay!==d;
 const qualified=kind==="recall"&&!!prev&&due&&r.lastSeen!==undefined&&day(r.lastSeen)!==d;
 if(!ok){
  r.step=0;r.next=at+600000;
  s.mistakes[id]=(s.mistakes[id]||0)+1;
  s.weak[id]={locked:true,days:[]};
 }else{
  s.seen++;
  if(canAdvance){
   r.step=Math.min(6,r.step+1);
   r.next=at+INTERVALS[r.step]*DAY;
   r.lastAdvance=at;
   const w=s.weak[id];
   if(w?.locked&&qualified){
    if(!w.days.includes(d))w.days.push(d);
    if(w.days.length>=3){w.locked=false;s.mistakes[id]=0}
   }
  }else if(!prev){r.step=0;r.next=at+DAY}
  // Correct recognition does not advance a spaced-recall interval.
 }
 r.lastSeen=at;r.lastReviewed=at;
 s.learned[id]=true;s.review[id]=r;
 s.history.push({id,ok,kind,at,qualified});s.history=s.history.slice(-10000);
 return{qualified,next:r.next,step:r.step};
}
function queue(s,all,at=Date.now()){
 const due=all.filter(id=>s.review[id]?.next<=at).sort((a,b)=>{
  const wa=s.weak[a]?.locked?1:0,wb=s.weak[b]?.locked?1:0;
  return wb-wa||s.review[a].next-s.review[b].next;
 });
 const fresh=all.filter(id=>!s.learned[id]&&!s.review[id]);
 return [...new Set(due.concat(fresh))].slice(0,10);
}
function delayedSummary(s,at=Date.now()){
 const since=at-30*DAY;
 const e=s.history.filter(x=>x.kind==="recall"&&x.qualified&&x.at>=since);
 return{attempts:e.length,correct:e.filter(x=>x.ok).length};
}
const api={day,blank,validate,record,queue,delayedSummary};
if(typeof module!=="undefined"&&module.exports)module.exports=api;else root.JapanLearning=api;
})(globalThis);
