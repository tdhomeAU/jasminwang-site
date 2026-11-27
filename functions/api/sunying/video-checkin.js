// Private-by-capability video publication and screenshot check-in, backed by existing FREEDOM_DB (Cloudflare D1).
// Every screenshot is attached to a daily video and a server-generated upload timestamp.
// The shared token is not in the pathname or query string; only Authorization headers carry it.
const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const json=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers});
const validDate=s=>typeof s==="string"&&/^20(?:2[6-9]|3[0-2])-[01][0-9]-[0-3][0-9]$/.test(s)&&!Number.isNaN(Date.parse(s+"T00:00:00Z"));
const validLocal=s=>typeof s==="string"&&/^20\d\d-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d$/.test(s)&&!Number.isNaN(Date.parse(s));
const schema1="CREATE TABLE IF NOT EXISTS sunying_video_checkins (room_hash TEXT NOT NULL, video_day TEXT NOT NULL, published_at_local TEXT, published_by TEXT, published_logged_at TEXT, updated_at TEXT NOT NULL, PRIMARY KEY(room_hash,video_day))";
const schema2="CREATE TABLE IF NOT EXISTS sunying_video_uploads (id TEXT PRIMARY KEY, room_hash TEXT NOT NULL, video_day TEXT NOT NULL, screenshot_local TEXT NOT NULL, window_label TEXT NOT NULL, mime TEXT NOT NULL, image_base64 TEXT NOT NULL, byte_size INTEGER NOT NULL, editor TEXT NOT NULL, uploaded_at TEXT NOT NULL)";
const hashToken=async request=>{
 const token=request.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9_-]{32}$/.test(token))return null;
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token.slice(7)));
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
};
async function connect(request,env){
 if(!env.FREEDOM_DB)return {error:json({error:"尚未配置 FREEDOM_DB，上传暂不可用"},503)};
 const hash=await hashToken(request);if(!hash)return {error:json({error:"请通过专属团队链接打开后上传"},401)};
 try{await env.FREEDOM_DB.prepare(schema1).run();await env.FREEDOM_DB.prepare(schema2).run();return {hash,db:env.FREEDOM_DB}}
 catch(err){console.error("video checkin schema",err);return {error:json({error:"数据存储暂时不可用"},503)}}
}
const publicRow=r=>r&&({date:r.video_day,published_at_local:r.published_at_local,published_by:r.published_by,published_logged_at:r.published_logged_at,updated_at:r.updated_at});
export async function onRequestGet({request,env}){
 const c=await connect(request,env);if(c.error)return c.error;
 const url=new URL(request.url);const day=url.searchParams.get("day");
 if(!validDate(day))return json({error:"日期格式错误"},400);
 try{
 const checkin=await c.db.prepare("SELECT video_day,published_at_local,published_by,published_logged_at,updated_at FROM sunying_video_checkins WHERE room_hash=? AND video_day=?").bind(c.hash,day).first();
 const uploads=await c.db.prepare("SELECT id,video_day,screenshot_local,window_label,byte_size,editor,uploaded_at FROM sunying_video_uploads WHERE room_hash=? AND video_day=? ORDER BY uploaded_at DESC LIMIT 12").bind(c.hash,day).all();
 return json({ok:true,checkin:publicRow(checkin),uploads:uploads.results||[]});
 }catch(err){console.error("video checkin read",err);return json({error:"读取失败，请重试"},503)}
}
export async function onRequestPost({request,env}){
 const c=await connect(request,env);if(c.error)return c.error;
 if(Number(request.headers.get("content-length")||0)>1200000)return json({error:"文件过大，请使用自动压缩后的截图"},413);
 let data;try{data=await request.json()}catch{return json({error:"上传内容格式无效"},400)}
 const day=data.day,editor=typeof data.editor==="string"?data.editor.trim().slice(0,36):"";
 if(!validDate(day)||!editor)return json({error:"请填写有效日期和记录人"},400);
 const now=new Date().toISOString();
 try{
 if(data.action==="publish"){
  const published=typeof data.published_at_local==="string"?data.published_at_local:"";
  if(!validLocal(published)||published.slice(0,10)!==day)return json({error:"请填写该视频实际发布的墨尔本日期和时间"},400);
  await c.db.prepare("INSERT INTO sunying_video_checkins(room_hash,video_day,published_at_local,published_by,published_logged_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(room_hash,video_day) DO UPDATE SET published_at_local=excluded.published_at_local,published_by=excluded.published_by,updated_at=excluded.updated_at").bind(c.hash,day,published,editor,now,now).run();
  return json({ok:true,action:"publish",published_at_local:published,recorded_at:now});
 }
 if(data.action==="screenshot"){
  const screenshot=typeof data.screenshot_local==="string"?data.screenshot_local:"";
  const window=typeof data.window_label==="string"?data.window_label:"24h";
  const b64=typeof data.base64==="string"?data.base64:"";
  if(!validLocal(screenshot)||!["24h","72h","7d","other"].includes(window))return json({error:"请填写截图实际采集时间及数据观察窗口"},400);
  if(!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)||b64.length>900000||b64.length<1000)return json({error:"截图压缩后应小于约650KB"},413);
  let bytes;try{bytes=atob(b64)}catch{return json({error:"截图内容无效"},400)}
  if(bytes.length>675000)return json({error:"截图文件过大，请重新选择"},413);
  const type=bytes.slice(0,3).split("").map(c=>c.charCodeAt(0));if(type[0]!==255||type[1]!==216||type[2]!==255)return json({error:"仅接受手机端自动压缩后的JPEG截图"},400);
  const id=crypto.randomUUID();
  await c.db.prepare("INSERT INTO sunying_video_uploads(id,room_hash,video_day,screenshot_local,window_label,mime,image_base64,byte_size,editor,uploaded_at) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(id,c.hash,day,screenshot,window,"image/jpeg",b64,bytes.length,editor,now).run();
  return json({ok:true,action:"screenshot",id,uploaded_at:now,byte_size:bytes.length,window_label:window});
 }
 return json({error:"未知操作"},400);
 }catch(err){console.error("video checkin write",err);return json({error:"云端保存失败，请稍后重试"},503)}
}
export async function onRequestOptions(){return json({error:"Method not allowed"},405)}
