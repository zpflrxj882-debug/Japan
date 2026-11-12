function page(title,body){app.innerHTML='<button class="back" onclick="goHome()">← 홈</button><h1>'+title+'</h1>'+body}
function weakPage(){view='weak';const keys=ids.filter(id=>state.weak[id]?.locked||state.mistakes[id]>0);page('취약 카드 관리','<p>정답을 보기 전에 떠올려 보세요. 서로 다른 3일에 직접 기억하면 졸업해요. 객관식 정답만으로는 졸업하지 않아요.</p><button class="primary" onclick="reviewMissed()">복습 기한이 된 취약 카드 연습</button>'+keys.map(id=>{const x=DATA[id[0]][+id.slice(1)],r=state.review[id];return '<div class="tile"><div class="detail"><b>'+esc(x[0])+'</b><div>'+esc(x[1])+' · 오답 '+(state.mistakes[id]||0)+'회</div><div class="tiny">회상 성공 '+(state.weak[id]?.days.length||0)+'/3일 · '+(r?esc(new Date(r.next).toLocaleString()):'지금 복습')+'</div></div><button onclick="begin([\''+id+'\'],true)">연습</button></div>'}).join('')+(keys.length?'':'<p>아직 취약 카드가 없어요.</p>'))}
const MISSIONS=[
["식당에서 물 부탁하기","물 + 주세요를 연결해 보세요.","みずをください","mizu o kudasai","물을 주세요. 조사 を는 여기서 o로 읽어요."],
["가격 물어보기","이것은 얼마인가요?","これはいくらですか","kore wa ikura desu ka","이것은 얼마예요? 조사 は는 주제 표시일 때 wa로 읽어요."],
["역 위치 물어보기","역은 어디인가요?","えきはどこですか","eki wa doko desu ka","역은 어디예요? どこ는 어디라는 뜻이에요."],
["자기소개하기","저는 한국인입니다.","わたしはかんこくじんです","watashi wa kankokujin desu","わたし는 저, かんこくじん은 한국인이에요."],
["처음 만난 사람에게 인사하기","처음 뵙겠습니다.","はじめまして","hajimemashite","첫 만남에서 쓰는 표현이에요. 이어서 よろしくおねがいします를 자주 말해요."],
["카페에서 커피 주문하기","커피를 주세요.","コーヒーをください","kōhī o kudasai","コーヒー는 커피, をください는 요청 표현이에요."],
["식당에서 계산 요청하기","계산 부탁합니다.","おかいけいおねがいします","okaikei onegaishimasu","식당에서 계산을 요청하는 정중한 표현이에요."],
["천천히 말해 달라고 하기","천천히 말씀해 주세요.","ゆっくりはなしてください","yukkuri hanashite kudasai","ゆっくり는 천천히라는 뜻이에요."],
["카드 결제 가능한지 묻기","카드 사용할 수 있나요?","カードはつかえますか","kādo wa tsukaemasu ka","カード는 카드, つかえますか는 사용할 수 있나요?라는 뜻이에요."],
["길을 알려 달라고 하기","여기로 가고 싶어요.","ここにいきたいです","koko ni ikitai desu","ここ는 여기, いきたい는 가고 싶다는 뜻이에요."],
["도움 요청하기","도와주세요.","たすけてください","tasukete kudasai","도움이 필요한 상황에서 사용하는 표현이에요."]
];

let mission=0,missionShown=false;
function missionPage(n=mission){view='mission';mission=n;missionShown=false;const x=MISSIONS[n];page('여행 회화 미션', '<p>'+(n+1)+' / '+MISSIONS.length+'</p><div class="card"><h2>'+x[0]+'</h2><p>'+x[1]+'</p><p>먼저 소리 내어 말하거나 아래에 적어 보세요.</p><label for="mission-note">내 일본어 답변</label><textarea id="mission-note" maxlength="2000" style="width:100%;min-height:100px"></textarea><button class="primary" onclick="showMission()">예시 답변과 비교하기</button><div id="mission-example" aria-live="polite"></div></div>');document.getElementById('mission-note').value=state.notes['v'+n]||'';document.getElementById('mission-note').oninput=e=>{state.notes['v'+n]=e.target.value;save()}}
function showMission(){if(missionShown)return;missionShown=true;const x=MISSIONS[mission];document.getElementById('mission-example').innerHTML='<h2>'+x[2]+'</h2><p>'+x[3]+'</p><p>'+x[4]+'</p><button onclick="speak(\''+x[2]+'\')">🔊 발음 듣고 따라 말하기</button><p>예시와 비교해 표현을 확인하세요. 자동 발음·문법 채점은 하지 않아요.</p><button onclick="missionPage('+(mission+1)%MISSIONS.length+')">다음 미션 →</button>'}
function statsPage(){
 view="stats";const now=Date.now(),events=state.history,delayed=L.delayedSummary(state,now);
 const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);const date=L.day(d);
  const e=events.filter(x=>L.day(x.at)===date);
  return '<tr><td>'+date+'</td><td>'+e.length+'</td><td>'+e.filter(x=>x.ok).length+'</td></tr>'
 }).join("");
 const dueNow=ids.filter(id=>state.review[id]?.next<=now).length;
 const waiting=ids.filter(id=>state.review[id]?.step===0&&state.review[id]?.next>now&&state.review[id]?.next<=now+600000).length;
 const delayedText=delayed.attempts?delayed.correct+'/'+delayed.attempts+'회 ('+Math.round(delayed.correct/delayed.attempts*100)+'%)':'아직 측정 전';
 page('학습 통계 · 기록 보관',
 '<div class="stats"><div class="stat"><b>'+events.length+'</b><span>풀이 기록</span></div><div class="stat"><b>'+dueNow+'</b><span>지금 복습</span></div><div class="stat"><b>'+waiting+'</b><span>10분 대기</span></div></div>'+
 '<div class="note"><b>날짜 간격을 둔 회상 자기평가</b><p>'+delayedText+'</p><p class="tiny">최근 30일, 다른 날에 다시 떠올려 본 기록만 계산해요. 정답을 보기 전에 스스로 평가한 결과이며 실제 발음·회화 실력 점수가 아니에요.</p></div>'+
 '<p>전체 퀴즈·회상 정답률: '+(events.length?Math.round(events.filter(e=>e.ok).length/events.length*100)+'%':'아직 기록 없음')+'</p>'+
 '<table style="width:100%"><caption>최근 7일 학습</caption><thead><tr><th>날짜</th><th>풀이</th><th>정답</th></tr></thead><tbody>'+week+'</tbody></table>'+
 '<button class="primary" onclick="exportBackup()">JSON 백업 저장</button>'+
 '<p>복원하면 현재 Japan 학습 기록을 덮어써요. 먼저 백업을 저장해 주세요. Oxford 영어 백업은 사용할 수 없어요.</p>'+
 '<label for="restore">Japan JSON 백업 선택</label><input id="restore" type="file" accept=".json,application/json"><p id="restore-status" role="status"></p>');
 document.getElementById("restore").onchange=restoreBackup
}

function exportBackup(){const url=URL.createObjectURL(new Blob([JSON.stringify({format:'japan-studio-backup',version:1,createdAt:new Date().toISOString(),data:state})],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='japan-backup-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function restoreBackup(e){const f=e.target.files[0];if(!f)return;try{if(f.size>5000000)throw Error('파일이 너무 커요');const raw=JSON.parse(await f.text());if(raw.format!=='japan-studio-backup'||raw.version!==1)throw Error('지원하는 Japan 백업이 아니에요');const next=L.validate(raw.data,ids);if(!confirm('현재 Japan 학습 기록을 이 백업으로 바꿀까요?'))return;localStorage.setItem(KEY,JSON.stringify(next));state=next;statsPage();document.getElementById('restore-status').textContent='복원했어요.'}catch(err){document.getElementById('restore-status').textContent='복원 실패. 기존 기록을 유지했어요: '+err.message}finally{e.target.value=''}}
