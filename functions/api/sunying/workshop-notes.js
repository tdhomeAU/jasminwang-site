// Shared discussion notes for the HERS FREEDOM 2027 workshop outline.
// A 192-bit unguessable room token is shared via the URL fragment, never sent in
// page navigation; only authenticated API requests receive the token.
// Do not put personal health information, passwords or payment details in notes.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
const schema=`CREATE TABLE IF NOT EXISTS sunying_workshop_notes (
  room_hash TEXT NOT NULL,
  section_key TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  edited_by TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (room_hash,section_key)
)`;
const validateToken=async request=>{
 const auth=request.headers.get("Authorization")||"";
 if(!/^Bearer [A-Za-z0-9_-]{32}$/.test(auth))return null;
 const bytes=new TextEncoder().encode(auth.slice(7));
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
};
async function connect(request,env){
 if(!env.FREEDOM_DB)return {error:json({error:"共享笔记数据库未连接"},503)};
 const hash=await validateToken(request);
 if(!hash)return {error:json({error:"请通过专属共创链接打开笔记"},401)};
 try{await env.FREEDOM_DB.prepare(schema).run();return {db:env.FREEDOM_DB,hash};}
 catch(e){console.error("Workshop notes database unavailable",e);return {error:json({error:"共享笔记暂时不可用"},503)};}
}
export async function onRequestGet({request,env}){
 const con=await connect(request,env);
 if(con.error)return con.error;
 try{
  const {results}=await con.db.prepare("SELECT section_key,note,edited_by,updated_at FROM sunying_workshop_notes WHERE room_hash=? ORDER BY section_key").bind(con.hash).all();
  return json({ok:true,notes:results||[]});
 }catch(e){console.error("Workshop notes read failed",e);return json({error:"读取失败，请重试"},503);}
}
export async function onRequestPost({request,env}){
 const con=await connect(request,env);
 if(con.error)return con.error;
 if(Number(request.headers.get("content-length")||0)>9000)return json({error:"笔记内容过长"},413);
 let data;try{data=await request.json()}catch{return json({error:"无效的笔记数据"},400);}
 const section=typeof data.section==="string"?data.section:"";
 const note=typeof data.note==="string"?data.note:"";
 const editor=typeof data.editor==="string"?data.editor.trim().slice(0,36):"";
 if(!/^(overview|sales|d1-[1-9][0-9]?|d2-[1-9][0-9]?)$/.test(section)||note.length>4000||!editor||!/^.{1,36}$/.test(editor))return json({error:"请检查笔记、署名或环节"},400);
 try{
  const now=new Date().toISOString();
  await con.db.prepare("INSERT INTO sunying_workshop_notes(room_hash,section_key,note,edited_by,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(room_hash,section_key) DO UPDATE SET note=excluded.note,edited_by=excluded.edited_by,updated_at=excluded.updated_at").bind(con.hash,section,note,editor,now).run();
  return json({ok:true,section,updated_at:now,edited_by:editor});
 }catch(e){console.error("Workshop notes write failed",e);return json({error:"保存失败，请重试"},503);}
}
export async function onRequestOptions(){return json({error:"Method not allowed"},405)}
