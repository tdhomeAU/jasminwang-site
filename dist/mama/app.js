const $=id=>document.getElementById(id);
const el={private:$("privateArea"),recordsLogin:$("recordsLogin"),status:$("status"),start:$("start"),stop:$("stop"),role:$("roleText"),pending:$("pendingSection"),pendingText:$("pendingText"),conversation:$("conversation"),records:$("records"),audio:$("remoteAudio"),manual:$("manualPanel"),consent:$("consent")};
let role=null,active=null,pending=null,saving=false,audioContext=null;
const tz=new Intl.DateTimeFormat("zh-CN",{timeZone:"Asia/Shanghai",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false});
function status(text,bad=false){el.status.textContent=text;el.status.className=bad?"error":"success";}
async function api(path,method="GET",body){
 const options={method,credentials:"same-origin",headers:{}};
 if(body!==undefined){options.headers["Content-Type"]="application/json";options.body=JSON.stringify(body);}
 const response=await fetch("/api/mama/"+path,options);
 const data=await response.json().catch(()=>({error:"服务器没有返回可用内容"}));
 if(!response.ok)throw new Error(data.error||"暂时连接失败");
 return data;
}
async function init(){
 try{el.consent.checked=localStorage.getItem("mama_voice_consent_v1")==="yes";}catch{}
 try{const session=await api("auth");
  if(session.authenticated&&session.role==="member")await showPrivate(session.role);
  else if(session.authenticated&&session.role==="guest"){role="guest";el.consent.checked=true;}
  else if(!session.ready)status("语音服务还没有配置好，请稍后联系家人。",true);
 }catch{status("还不能连接到家庭服务，请稍后再试。",true);}
}
async function showPrivate(userRole){
 role=userRole;el.private.hidden=false;el.recordsLogin.hidden=true;
 el.role.textContent="家庭共享空间";
 await refresh();
}
$("loginForm").addEventListener("submit",async event=>{
 event.preventDefault();
 $("loginMessage").textContent="正在验证…";
 try{const res=await api("auth","POST",{password:$("password").value});$("password").value="";await showPrivate(res.role);}
 catch(error){$("loginMessage").textContent=error.message;}
});
$("logout").addEventListener("click",async()=>{
 stopVoice();
 await api("auth","POST",{action:"logout"}).catch(()=>{});
 location.reload();
});
$("refresh").addEventListener("click",refresh);
function titleFor(record){
 const c=record.content||{};
 if(record.kind==="vitals")return `血压 ${c.systolic}/${c.diastolic} mmHg${c.pulse?"，心率 "+c.pulse+" 次/分":""}`;
 if(record.kind==="medication_taken")return "本人报告：已服药";
 if(record.kind==="medication_missed")return "本人报告：尚未服药／漏服";
 if(record.kind==="medication_draft")return "用药清单草稿 · 未经医生核对";
 if(record.kind==="glucose")return `血糖 ${c.value} mmol/L`;
 if(record.kind==="lipids")return "血脂化验情况";
 return "今天的感受";
}
async function refresh(){
 try{
  const data=await api("records");el.records.replaceChildren();
  if(!data.records?.length){el.records.textContent="还没有记录。";return;}
  data.records.forEach(r=>{
   const item=document.createElement("article");item.className="record";
   const heading=document.createElement("strong");heading.textContent=titleFor(r);
   const small=document.createElement("small");small.textContent=tz.format(new Date(r.created_at))+"（北京时间） · 自述，已确认录入";
   const detail=document.createElement("div");detail.textContent=r.content?.text||"";
   item.append(heading,small,detail);el.records.append(item);
  });
 }catch(error){el.records.textContent=error.message;}
}
function showPending(next){
 pending=next;el.pending.hidden=false;
 const titles={vitals:`血压：${next.systolic}/${next.diastolic} mmHg${next.pulse?"；心率："+next.pulse:""}`,
 glucose:`血糖：${next.value} mmol/L`,medication_taken:"本人报告已服药",medication_missed:"本人报告漏服或未服药",
 medication_draft:"用药清单草稿（需医生核对）",feeling:"今天的感受",lipids:"血脂检查相关记录"};
 el.pendingText.textContent=(titles[next.kind]||"健康记录")+"\n"+next.text;
 el.pending.scrollIntoView({behavior:"smooth",block:"nearest"});
}
async function savePending(){
 if(!pending||saving)return;
 saving=true;$("confirm").disabled=true;
 try{await api("records","POST",pending);pending=null;el.pending.hidden=true;status("已确认并保存到健康日记。");await refresh();}
 catch(error){status("没有保存成功："+error.message,true);}
 finally{saving=false;$("confirm").disabled=false;}
}
$("confirm").addEventListener("click",savePending);
$("discard").addEventListener("click",()=>{pending=null;el.pending.hidden=true;status("这条记录已取消，不会保存。");});
$("manualForm").addEventListener("submit",event=>{
 event.preventDefault();const text=$("manualText").value.trim();if(!text)return;
 showPending({kind:$("kind").value,text});
 $("manualText").value="";
});
function proposalFromSpeech(heard){
 const text=String(heard||"").trim().slice(0,800);
 if(!text)return null;
 // Only measurable blood-pressure formats are converted to structured values.
 // Unclear numbers are not guessed; all candidate records need confirmation.
 let m=text.match(/血压(?:是|为|有|测了|测到|：|:|\s)*([1-3]?\d{2})\s*(?:[\/、，,比和]|到|\s+低压\s*|\s+)(\d{2,3})/);
 if(!m)m=text.match(/高压(?:是|：|:|\s)*([1-3]?\d{2}).{0,12}?低压(?:是|：|:|\s)*(\d{2,3})/);
 if(m){
  const systolic=Number(m[1]),diastolic=Number(m[2]);
  if(systolic>=30&&systolic<=350&&diastolic>=20&&diastolic<=250){
   const pulse=text.match(/(?:心率|心跳|脉搏)(?:是|：|:|\s)*(\d{2,3})/);
   return {kind:"vitals",systolic,diastolic,pulse:pulse?Number(pulse[1]):undefined,text};
  }
 }
 if(/血糖/.test(text)){
  const reading=text.match(/血糖(?:是|为|有|：|:|\s)*(\d{1,2}(?:\.\d{1,2})?)\s*(?:毫摩尔|mmol)/i);
  if(reading)return {kind:"glucose",value:Number(reading[1]),text};
  return {kind:"feeling",text:"血糖测量（单位待核对）："+text};
 }
 if(/药|服药|吃药/.test(text)){
  if(/(?:没吃|没有吃|未吃|忘记吃|漏服|没服|未服)/.test(text))return {kind:"medication_missed",text};
  if(/(?:吃的药|药的名字|药名|药单|用药清单|每天吃.*(?:片|粒|毫克|mg)|医生开.*药)/.test(text))return {kind:"medication_draft",text};
  if(/(?:吃过药|药吃了|药吃过|已经吃|刚吃了|服了药|按时服药|已经服药|服用过)/.test(text))return {kind:"medication_taken",text};
 }
 if(/血脂|胆固醇|甘油三酯/.test(text))return {kind:"lipids",text};
 if(/(?:今天|昨晚|昨天|现在).{0,15}(?:感觉|心情|睡|走路|精神|腿|手|累|舒服|疼)/.test(text))return {kind:"feeling",text};
 return null;
}
function addTranscript(speaker,text){
 const div=document.createElement("div");div.style.padding="6px 0";
 div.textContent=(speaker==="user"?"你：":"小伙伴：")+text;
 if(el.conversation.dataset.empty==="true"){el.conversation.replaceChildren();el.conversation.dataset.empty="false";}
 el.conversation.prepend(div);
 while(el.conversation.children.length>8)el.conversation.lastChild.remove();
}
function handleSpeech(text){
 addTranscript("user",text);
 if(role!=="member")return;
 if(/^(?:好|嗯|好的)?(?:确认记录|确认保存|可以保存|保存吧|就这样保存)/.test(text)&&pending){savePending();return;}
 if(/^(?:取消记录|不要保存|不保存)/.test(text)&&pending){pending=null;el.pending.hidden=true;status("已取消待保存内容。");return;}
 if(pending)return; // Don't silently overwrite an unconfirmed record.
 const candidate=proposalFromSpeech(text);
 if(candidate)showPending(candidate);
}
const INSTRUCTIONS="你是妈妈熟悉、亲切的中文聊天伙伴，像家人一样温暖、耐心、有生活气息，不要像客服或机械播报。请用自然普通话，语速舒缓，每次说一两句；妈妈说得慢或停顿时多等一会儿，不要急着接话；她插话时先停下倾听。可以聊家常、心情、睡眠、散步和日常安排，多倾听，少盘问。你是陪伴和自我记录工具，不是医生；不要诊断、解释异常结果为安全、提供药物剂量或建议自行停药或补服。所有药名和服药时间都必须以医生医嘱为准。不能宣称系统已经保存数据；用户说出血压等信息时提醒：请核对记录草稿并说‘确认记录’或者点确认保存。出现新发一侧无力、言语困难、胸痛、呼吸困难等急症迹象，请立即建议拨打中国120。";
function stopVoice(message="聊天结束了，明天再来聊也可以。",bad=false){
 const ctx=active;if(!ctx)return;active=null;
 clearTimeout(ctx.handshakeTimer);ctx.controller.abort();
 ctx.stream?.getTracks().forEach(t=>t.stop());
 ctx.channels.forEach(c=>{try{c.close();}catch{}});
 ctx.peer.close();el.audio.srcObject=null;el.audio.pause();
 audioContext?.suspend().catch(()=>{});
 el.start.disabled=false;el.start.setAttribute("aria-busy","false");el.stop.disabled=true;
 status(message,bad);
}
async function startVoice(){
 if(active)return;
 if(!el.consent.checked){status("请先勾选上方的知情说明，再开始语音。",true);el.consent.focus();return;}
 // Unlock the phone's audio output during the same tap that starts the call.
 let audioUnlock=null;
 try{
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  if(AudioContextClass){
   if(!audioContext){audioContext=new AudioContextClass();audioContext.createMediaElementSource(el.audio).connect(audioContext.destination);}
   audioUnlock=audioContext.resume();
  }
 }catch(error){console.info("Web Audio output unlock unavailable",error?.name);}
 if(!role){
  try{const session=await api("auth","POST",{action:"guest",consent:true});role=session.role;try{localStorage.setItem("mama_voice_consent_v1","yes");}catch{}}
  catch(error){status("暂时不能开始聊天："+error.message,true);return;}
 }
 try{localStorage.setItem("mama_voice_consent_v1","yes");}catch{}
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){status("当前浏览器不支持实时语音，请用最新版手机浏览器。",true);return;}
 el.start.disabled=true;el.stop.disabled=false;el.start.setAttribute("aria-busy","true");status("正在申请麦克风并连接语音…");
  const ctx={peer:new RTCPeerConnection({iceServers:[]}),channels:new Set(),controller:new AbortController(),ready:false,updated:false,created:false,stream:null,channel:null,timeout:null,audioUnlock};
 active=ctx;const pc=ctx.peer;
 function sendEvent(evt){
  if(ctx.channel?.readyState==="open")ctx.channel.send(JSON.stringify({event_id:"event_"+crypto.randomUUID(),...evt}));
 }
 async function handleEvent(evt,channel){
  if(active!==ctx)return;
  if(evt.type==="session.created"){ctx.created=true;ctx.channel=channel;tryInitialize();}
  if(evt.type==="session.updated"&&!ctx.ready){
   ctx.ready=true;
   const track=ctx.stream?.getAudioTracks()[0];
   if(track)await ctx.sender.replaceTrack(track);
   clearTimeout(ctx.handshakeTimer);ctx.handshakeTimer=null;
    status("已经接通啦，直接说话就可以。说完停一停，我会用语音回答。");
  }
  if(evt.type==="conversation.item.input_audio_transcription.completed"&&evt.transcript)handleSpeech(evt.transcript);
   if(evt.type==="response.audio_transcript.done"&&evt.transcript){addTranscript("ai",evt.transcript);if(active===ctx&&ctx.audioTrack)status("小伙伴正在用语音回答…");}
   if(evt.type==="response.audio.done"&&active===ctx){
    if(!ctx.audioTrack)status("收到语音回复，但手机没有接到播放声音。请点下方播放器的播放键，或检查媒体音量。",true);
    else if(el.audio.paused||audioContext?.state==="suspended")status("小伙伴的语音回复准备好了，请点下方播放器播放。",true);
    else status("小伙伴刚才用语音回答了。你可以接着说。");
   }
  if(evt.type==="error"){
   const code=String(evt.error?.code||evt.error?.type||"连接错误").slice(0,100);
   const detail=String(evt.error?.message||"").replace(/Bearer\s+\S+/gi,"Bearer [已隐藏]").replace(/sk-[A-Za-z0-9_-]+/g,"[已隐藏]").slice(0,180);
   console.warn("Mama realtime provider error",{code,detail,param:String(evt.error?.param||"").slice(0,80)});
   const message=/quota|allocation|free.?tier|billing|insufficient/i.test(code+" "+detail)?"百炼当前可用额度或模型权限不足，请家人到控制台查看免费额度状态。":"语音服务暂时无法回应（"+code+(detail?"："+detail:"")+"）。请重新开始；如反复出现，请把这条提示告诉家人。";
   stopVoice(message,true);
  }
 }
 function bindChannel(channel){
  ctx.channels.add(channel);
  channel.onopen=()=>{if(active===ctx)tryInitialize();};
  channel.onmessage=message=>{let evt;try{evt=JSON.parse(message.data);}catch{return;}handleEvent(evt,channel).catch(()=>stopVoice("语音连接有问题，请重新试一次。"));};
 }
 async function tryInitialize(){
  if(active!==ctx||ctx.updated||!ctx.created||pc.connectionState!=="connected"||ctx.channel?.readyState!=="open")return;
  ctx.updated=true;
  let memory="";
  try{
   const result=await api("records");
   memory=(result.records||[]).filter(r=>["vitals","feeling","medication_taken","medication_missed"].includes(r.kind))
    .slice(0,5).map(r=>"（"+tz.format(new Date(r.created_at))+"）"+(r.content?.text||"")).join("；").slice(0,1000);
  }catch{}
  if(active!==ctx)return;
  sendEvent({type:"session.update",session:{modalities:["text","audio"],audio:{output:{voice:"Tina"}},
   instructions:INSTRUCTIONS+(memory?" 最近的本人确认记录（仅供追问和陪伴，绝不可作诊断）："+memory:""),
   input_audio_transcription:{model:"qwen3-asr-flash-realtime"},
   turn_detection:{type:"server_vad",silence_duration_ms:3000}}});
 }
 pc.ondatachannel=event=>bindChannel(event.channel);
 bindChannel(pc.createDataChannel("oai-events"));
 pc.ontrack=event=>{
  if(active!==ctx||event.track.kind!=="audio")return;
   ctx.audioTrack=event.track;
  const stream=new MediaStream([event.track]);el.audio.srcObject=stream;
   Promise.resolve(ctx.audioUnlock).then(()=>el.audio.play()).catch(()=>{
    if(active===ctx)status("手机暂时没有自动播放语音。请点下方播放器的播放键听回复。",true);
   });
 };
 pc.onconnectionstatechange=()=>{
  if(active!==ctx)return;
  if(pc.connectionState==="connected")tryInitialize();
  if(pc.connectionState==="failed")stopVoice("网络连接失败了。请检查网络后，再点“开始聊天”重试。",true);
  if(pc.connectionState==="disconnected")stopVoice("网络暂时中断，聊天已结束。请检查网络后重新开始。",true);
 };
 try{
  ctx.sender=pc.addTransceiver("audio",{direction:"sendrecv"}).sender;
  ctx.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
  if(active!==ctx){ctx.stream.getTracks().forEach(t=>t.stop());return;}
  const offer=await pc.createOffer();await pc.setLocalDescription(offer);
  if(pc.iceGatheringState!=="complete")await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{cleanup();reject(new Error("网络握手超时"));},15000);
   const cleanup=()=>{clearTimeout(timer);pc.removeEventListener("icegatheringstatechange",check);};
   const check=()=>{if(pc.iceGatheringState==="complete"){cleanup();resolve();}};
   pc.addEventListener("icegatheringstatechange",check);check();
  });
  const response=await fetch("/api/mama/sdp",{method:"POST",body:pc.localDescription.sdp,
   headers:{"Content-Type":"application/sdp"},credentials:"same-origin",signal:ctx.controller.signal});
  if(!response.ok){const detail=await response.json().catch(()=>({error:"接口不可用"}));throw new Error(detail.error||"语音连接失败");}
  const sdp=(await response.text()).trim().replace(/\r?\n/g,"\r\n")+"\r\n";
  await pc.setRemoteDescription({type:"answer",sdp});
  const handshakeTimer=setTimeout(()=>{if(active===ctx&&!ctx.ready)stopVoice("连接等待太久了。请检查网络和麦克风权限，再点“开始聊天”重试。",true);},30000);
  ctx.handshakeTimer=handshakeTimer;
 }catch(error){
  if(active===ctx){
   let message="连接没有成功。请检查网络和麦克风权限，再点“开始聊天”重试。";
   if(error?.name==="NotAllowedError"||error?.name==="SecurityError")message="还没有麦克风权限。请在浏览器设置中允许本网站使用麦克风，再重新开始。";
   else if(error?.name==="NotFoundError")message="没有找到可用的麦克风，请检查手机麦克风后重试。";
   else if(error?.message)message="连接没有成功："+error.message+"。请检查网络后重新开始。";
   stopVoice(message,true);
  }
 }
}
el.start.addEventListener("click",startVoice);
el.stop.addEventListener("click",()=>stopVoice());
window.addEventListener("pagehide",()=>stopVoice("已结束。"));
init();
