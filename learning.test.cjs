const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),L=require('./learning.js');
test('wrong answers wait ten minutes; recognition preserves schedule and weak lock',()=>{const s=L.blank();L.record(s,'h0',false,'quiz',1000);assert.equal(s.review.h0.next,601000);L.record(s,'h0',true,'quiz',2000);assert.equal(s.review.h0.next,601000);assert.equal(s.weak.h0.locked,true);assert.deepEqual(L.queue(s,['h0'],600999),[]);assert.deepEqual(L.queue(s,['h0'],601000),['h0'])});
test('weak cards require three eligible, spaced-day recalls; same-day repetition does not advance',()=>{const s=L.blank(),t=new Date(2026,0,1,12).getTime(),D=86400000;
 L.record(s,'h0',false,'quiz',t);
 L.record(s,'h0',true,'recall',t+600000);
 const due=s.review.h0.next;
 L.record(s,'h0',true,'recall',t+700000);
 assert.equal(s.weak.h0.days.length,0);
 assert.equal(s.review.h0.next,due);
 for(const d of [1,2,5])L.record(s,'h0',true,'recall',t+d*D+600000);
 assert.equal(s.weak.h0.locked,false);
 L.record(s,'h0',false,'recall',t+6*D);
 assert.equal(s.weak.h0.days.length,0)
});
test('due cards precede new cards; future cards excluded',()=>{const s=L.blank();s.learned.h0=s.learned.k0=true;s.review.h0={step:1,next:100};s.review.k0={step:1,next:300};assert.deepEqual(L.queue(s,['v0','k0','h0'],200),['h0','v0'])});
test('backup round trip, legacy migration, and invalid records',()=>{const s=L.blank();L.record(s,'h0',false,'quiz');assert.deepEqual(L.validate(JSON.parse(JSON.stringify(s)),['h0']),s);assert.deepEqual(L.validate({learned:{},review:{},mistakes:{},seen:4},['h0']).history,[]);for(const bad of [{...s,review:{h0:{step:1,next:-1}}},{...s,notes:{h0:'x'.repeat(2001)}},{...s,learned:{evil:true}},{...s,history:[{id:'h0',at:0,ok:true,kind:'bad'}]}])assert.throws(()=>L.validate(bad,['h0']))});
test('app renders courses, mixed review, missions and statistics; repeated mark preserves schedule',()=>{const app={innerHTML:''},elements={},storage=new Map();const context=vm.createContext({JapanLearning:L,console,Date,Math,Set,Blob,URL,setTimeout,alert:()=>{},confirm:()=>true,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{querySelector:()=>app,getElementById:id=>elements[id]||=( {value:'',innerHTML:'',textContent:'',hidden:true,disabled:true,querySelectorAll:()=>[]})},window:{}});const html=fs.readFileSync('index.html','utf8');const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];vm.runInContext(fs.readFileSync("features.js","utf8"),context);vm.runInContext(code,context);assert.match(app.innerHTML,/히라가나/);assert.match(app.innerHTML,/가타카나/);vm.runInContext('start("h");mark();const dueBefore=state.review.h0.next;mark();if(state.review.h0.next!==dueBefore)throw Error("reset");begin(["h0","k0"]);answer(0);nextQuestion()',context);assert.match(app.innerHTML,/퀴즈|회상/);vm.runInContext('missionPage();showMission()',context);assert.match(elements['mission-example'].innerHTML,/みずをください/);vm.runInContext('weakPage();statsPage()',context);assert.match(app.innerHTML,/JSON 백업/)});

test('quiz recognition never advances a spaced interval; failed delayed recall is counted',()=>{const s=L.blank(),D=86400000,t=new Date(2026,0,1,12).getTime();
 s.learned.h0=true;s.review.h0={step:1,next:t,lastSeen:t-D};
 L.record(s,'h0',true,'quiz',t);
 assert.equal(s.review.h0.step,1);
 L.record(s,'h0',false,'recall',t+1000);
 assert.equal(s.review.h0.next,t+601000);
 const summary=L.delayedSummary(s,t+1000);
 assert.equal(summary.attempts,1);assert.equal(summary.correct,0)
});

test('previous button crosses lesson boundaries and object words have Korean readings',()=>{
 const app={innerHTML:''},elements={},storage=new Map();
 const context=vm.createContext({JapanLearning:L,console,Date,Math,Set,Blob,URL,setTimeout,alert:()=>{},confirm:()=>true,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 document:{querySelector:()=>app,getElementById:id=>elements[id]||=({value:'',innerHTML:'',hidden:false,disabled:true,querySelectorAll:()=>[]})},window:{}});
 const html=fs.readFileSync('index.html','utf8');
 vm.runInContext(fs.readFileSync('features.js','utf8'),context);
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 vm.runInContext('startObjects();if(idx!==133)throw Error("object start");move(-1);if(idx!==132)throw Error("previous");move(1)',context);
 assert.match(app.innerHTML,/한글 읽기/);
 assert.match(app.innerHTML,/혼/);
 assert.match(app.innerHTML,/📖/);
});
test('quiz order is randomized across launches and stored for resume',()=>{
 const app={innerHTML:''},elements={},storage=new Map();
 const context=vm.createContext({JapanLearning:L,console,Date,Math,Set,Blob,URL,setTimeout,alert:()=>{},confirm:()=>true,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 document:{querySelector:()=>app,getElementById:id=>elements[id]||=({value:'',innerHTML:'',hidden:false,disabled:true,querySelectorAll:()=>[]})},window:{}});
 const html=fs.readFileSync('index.html','utf8');
 vm.runInContext(fs.readFileSync('features.js','utf8'),context);
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
 vm.runInContext('startQuiz();const a=quiz.join(",");startQuiz();const b=quiz.join(",");if(a===b)throw Error("not shuffled");if(state.session.keys.join(",")!==b)throw Error("not saved")',context);
});
