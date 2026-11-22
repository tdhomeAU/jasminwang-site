// Private family prototype. No medical data may be processed until deployment,
// consent, and storage-location/privacy review are complete.
const JSON_HEADERS = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...headers}});
const enc=new TextEncoder();
const byteEqual=(a,b)=>{if(a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a[i]^b[i];return mismatch===0;};
async function digest(s){return new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(s)));}
const b64url=(s)=>btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
async function sign(data,secret){
 const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=await crypto.subtle.sign("HMAC",key,enc.encode(data));
 return b64url(String.fromCharCode(...new Uint8Array(sig)));
}
function sharedPassword(env){return env.MAMA_SHARED_PASSWORD||env.MAMA_MOTHER_PASSWORD||"";}
function sessionReady(env){return Boolean(env.MAMA_DB && env.MAMA_SESSION_SECRET);}
function voiceReady(env){return Boolean(sessionReady(env)&&env.MAMA_QWEN_API_KEY&&env.MAMA_QWEN_WORKSPACE_ID);}
function config(env){return voiceReady(env);}
async function identity(request,env){
 const raw=(request.headers.get("Cookie")||"").split(";").map(s=>s.trim()).find(s=>s.startsWith("mama_session="))?.slice(13);
 if(!raw||!env.MAMA_SESSION_SECRET||raw.length>400)return null;
 const pieces=raw.split(".");
 if(pieces.length!==4)return null;
 const [role,expiry,nonce,signature]=pieces;
 if(!["member","guest"].includes(role)||!/^\d{13}$/.test(expiry)||!raw||Date.now()>Number(expiry)||!/^[-_A-Za-z0-9]{10,80}$/.test(nonce))return null;
 const expected=await sign([role,expiry,nonce].join("."),env.MAMA_SESSION_SECRET);
 if(!byteEqual(enc.encode(signature),enc.encode(expected)))return null;
 return role;
}
const cookie=(value,maxAge)=>`mama_session=${value}; Path=/api/mama; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const sameOrigin=(request)=>{const origin=request.headers.get("Origin");return !origin||origin===new URL(request.url).origin;};
async function getBody(request,max=4000){
 const raw=await request.text();
 if(raw.length>max)throw new Error("内容过长");
 return JSON.parse(raw);
}
async function recordAuth({request,env},method){
 if(method==="GET"){const role=await identity(request,env);return json({authenticated:!!role,role,ready:config(env)});}
 if(method!=="POST")return json({error:"请求方式不支持"},405);
 let body;try{body=await getBody(request,1000);}catch{return json({error:"请求内容无效"},400);}
 if(body.action==="logout")return json({ok:true},200,{"Set-Cookie":cookie("",0)});
 if(!config(env))return json({error:"家庭专属功能尚未配置"},503);
 if(body.action==="guest"){
  if(body.consent!==true)return json({error:"请先确认语音隐私告知"},400);
  const expiry=String(Date.now()+30*86400000),nonce=crypto.randomUUID().replace(/-/g,"");
  const bodypart=["guest",expiry,nonce].join(".");
  const token=bodypart+"."+await sign(bodypart,env.MAMA_SESSION_SECRET);
  return json({ok:true,role:"guest"},200,{"Set-Cookie":cookie(token,30*86400)});
 }
 if(!sharedPassword(env))return json({error:"家庭记录口令尚未配置"},503);
 const ip=request.headers.get("CF-Connecting-IP")||"unknown";
 const keyhash=Array.from(await digest(env.MAMA_SESSION_SECRET+"|"+ip),x=>x.toString(16).padStart(2,"0")).join("");
 try{
  const oneHourAgo=new Date(Date.now()-3600e3).toISOString();
  await env.MAMA_DB.prepare("DELETE FROM mama_login_failures WHERE occurred_at < ?").bind(oneHourAgo).run();
  const row=await env.MAMA_DB.prepare("SELECT count(*) AS n FROM mama_login_failures WHERE ip_hash=?").bind(keyhash).first();
  if(Number(row?.n||0)>=6)return json({error:"尝试过多，请一小时后再试"},429);
  const submitted=typeof body.password==="string"?body.password:"";
  let role=null;
  if(submitted.length>=12&&submitted.length<=180){
   const val=await digest(submitted);
   const shared=await digest(sharedPassword(env));
   if(byteEqual(val,shared))role="member";
  }
  if(!role){
   await env.MAMA_DB.prepare("INSERT INTO mama_login_failures(ip_hash,occurred_at) VALUES (?,?)").bind(keyhash,new Date().toISOString()).run();
   return json({error:"口令不正确"},401);
  }
  await env.MAMA_DB.prepare("DELETE FROM mama_login_failures WHERE ip_hash=?").bind(keyhash).run();
  const expiry=String(Date.now()+30*86400000),nonce=crypto.randomUUID().replace(/-/g,"");
  const bodypart=[role,expiry,nonce].join(".");
  const token=bodypart+"."+await sign(bodypart,env.MAMA_SESSION_SECRET);
  return json({ok:true,role},200,{"Set-Cookie":cookie(token,30*86400)});
 }catch(e){console.error("Mama auth database unavailable",e?.name);return json({error:"登录服务尚未就绪"},503);}
}
const VALID_KINDS=new Set(["vitals","feeling","glucose","lipids","medication_draft","medication_taken","medication_missed"]);
function validateRecord(body){
 if(!body||!VALID_KINDS.has(body.kind)||typeof body.text!=="string")return null;
 const text=body.text.trim();
 if(!text||text.length>1000)return null;
 const payload={text,confirmed:true,source:"self_report",notes:"非医学诊断；未经医护核实"};
 if(body.kind==="vitals"){
  const sys=Number(body.systolic),dia=Number(body.diastolic);
  if(!Number.isInteger(sys)||!Number.isInteger(dia)||sys<30||sys>350||dia<20||dia>250)return null;
  payload.systolic=sys;payload.diastolic=dia;
  if(body.pulse!==undefined&&body.pulse!==null&&body.pulse!==""){
   const pulse=Number(body.pulse);
   if(!Number.isInteger(pulse)||pulse<20||pulse>300)return null;
   payload.pulse=pulse;
  }
 }
 if(body.kind==="glucose"){
  const reading=Number(body.value);
  if(!(reading>0&&reading<100))return null;
  payload.value=reading;payload.unit="mmol/L";
 }
 return payload;
}
async function recordRecords({request,env},method,role){
 if(!env.MAMA_DB)return json({error:"健康数据存储尚未配置"},503);
 if(role!=="member")return json({error:"家庭记录需要家庭口令验证"},403);
 if(method==="GET"){
  try{
   const rows=await env.MAMA_DB.prepare("SELECT id,kind,content,created_at FROM mama_health_records ORDER BY created_at DESC LIMIT 100").all();
   return json({records:(rows.results||[]).map(r=>({...r,content:JSON.parse(r.content)}))});
  }catch{return json({error:"记录尚不可读取"},503);}
 }
 if(method!=="POST"||role!=="member")return json({error:"此账号没有记录权限"},403);
 let body;try{body=await getBody(request);}catch{return json({error:"记录格式无效"},400);}
 const payload=validateRecord(body);
 if(!payload)return json({error:"数据需要再次核对"},422);
 try{
  const id=crypto.randomUUID(),now=new Date().toISOString();
  await env.MAMA_DB.prepare("INSERT INTO mama_health_records(id,kind,content,created_at) VALUES (?,?,?,?)").bind(id,body.kind,JSON.stringify(payload),now).run();
  return json({ok:true,record:{id,kind:body.kind,content:payload,created_at:now}},201);
 }catch{return json({error:"保存失败，请重试"},503);}
}
async function realtimeSdp({request,env},role){
 if(!["member","guest"].includes(role))return json({error:"请先进入家庭聊天"},403);
 if(!env.MAMA_QWEN_API_KEY||!env.MAMA_QWEN_WORKSPACE_ID||!env.MAMA_DB)return json({error:"语音接口尚未配置"},503);
 if(!/^[a-zA-Z0-9_-]{6,100}$/.test(env.MAMA_QWEN_WORKSPACE_ID))return json({error:"工作空间设置不正确"},503);
 const offer=await request.text();
 if(offer.length<100||offer.length>110000||!offer.startsWith("v=0"))return json({error:"语音握手格式错误"},400);
 try{
  const today=new Date().toISOString().slice(0,10);
  const previous=await env.MAMA_DB.prepare("SELECT count(*) AS n FROM mama_voice_sessions WHERE day=?").bind(today).first();
  if(Number(previous?.n||0)>=8)return json({error:"今天语音连接次数已达保护上限，请明天再试"},429);
  const url=`https://${env.MAMA_QWEN_WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen-audio-3.1-realtime-flash`;
  const answer=await fetch(url,{method:"POST",headers:{"Authorization":"Bearer "+env.MAMA_QWEN_API_KEY,"Content-Type":"application/sdp"},body:offer,signal:AbortSignal.timeout(25000)});
  if(!answer.ok){console.error("Mama model SDP failed with status",answer.status);return json({error:"语音服务连接失败，请检查配置或稍后重试"},502);}
  const sdp=await answer.text();
  await env.MAMA_DB.prepare("INSERT INTO mama_voice_sessions(id,day,created_at) VALUES (?,?,?)").bind(crypto.randomUUID(),today,new Date().toISOString()).run();
  return new Response(sdp,{headers:{"Content-Type":"application/sdp","Cache-Control":"no-store"}});
 }catch(e){console.error("Mama SDP unavailable",e?.name);return json({error:"语音服务暂时无法连接"},503);}
}
export async function onRequest(context){
 const {request,env}=context,method=request.method,path=new URL(request.url).pathname.slice("/api/mama/".length);
 if(!sameOrigin(request))return json({error:"请求来源不允许"},403);
 if(path==="auth")return recordAuth(context,method);
 if(!["GET","POST"].includes(method))return json({error:"不支持此请求"},405);
 const role=await identity(request,env);
 if(!role)return json({error:"请先进入家庭聊天"},401);
 if(path==="records")return recordRecords(context,method,role);
 if(path==="sdp"&&method==="POST")return realtimeSdp(context,role);
 return json({error:"没有此接口"},404);
}
