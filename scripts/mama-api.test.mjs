import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/mama/[[path]].js";

const base="https://example.test";
const invoke=(path,method="GET",body=undefined,env={},cookie=undefined)=>{
 const opts={method,headers:{"Origin":base}};
 if(cookie)opts.headers.Cookie=cookie;
 if(body!==undefined){opts.body=JSON.stringify(body);opts.headers["Content-Type"]="application/json";}
 return onRequest({request:new Request(base+"/api/mama/"+path,opts),env});
};
const testDb={prepare(){return{bind(){return this;},async run(){return{success:true};},async first(){return{n:0};},async all(){return{results:[]};}};}};

test("empty setup reports unauthenticated without exposing private records",async()=>{
 const response=await invoke("auth");
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{authenticated:false,role:null,ready:false});
});

test("login fails closed until the shared household password and database are configured",async()=>{
 const response=await invoke("auth","POST",{password:"example-not-a-real-secret",consent:true});
 assert.equal(response.status,503);
});

test("one shared household password authenticates members with full private access",async()=>{
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_MOTHER_PASSWORD:"example-not-a-real-secret",MAMA_QWEN_API_KEY:"test-key",MAMA_QWEN_WORKSPACE_ID:"ws-test123"};
 const login=await invoke("auth","POST",{password:"example-not-a-real-secret",consent:true},env);
 assert.equal(login.status,200);
 assert.deepEqual(await login.json(),{ok:true,role:"member"});
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 const session=await invoke("auth","GET",undefined,env,cookie);
 assert.deepEqual(await session.json(),{authenticated:true,role:"member",ready:true});
 const saved=await invoke("records","POST",{kind:"feeling",text:"虚构测试：今天精神不错"},env,cookie);
 assert.equal(saved.status,201);
});

test("guest can enter voice chat without gaining health-record access",async()=>{
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_QWEN_API_KEY:"test-key",MAMA_QWEN_WORKSPACE_ID:"ws-test123"};
 const missingConsent=await invoke("auth","POST",{action:"guest"},env);
 assert.equal(missingConsent.status,400);
 const login=await invoke("auth","POST",{action:"guest",consent:true},env);
 assert.equal(login.status,200);
 assert.deepEqual(await login.json(),{ok:true,role:"guest"});
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 const session=await invoke("auth","GET",undefined,env,cookie);
 assert.deepEqual(await session.json(),{authenticated:true,role:"guest",ready:true});
 const records=await invoke("records","GET",undefined,env,cookie);
 assert.equal(records.status,403);
 const save=await invoke("records","POST",{kind:"feeling",text:"虚构测试"},env,cookie);
 assert.equal(save.status,403);
 const memory=await invoke("memory","GET",undefined,env,cookie);
 assert.equal(memory.status,403);
 const saveMemory=await invoke("memory","POST",{kind:"preference",content:"虚构资料",confirmed:true},env,cookie);
 assert.equal(saveMemory.status,403);
});

test("only a family member can save confirmed companion memory",async()=>{
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_MOTHER_PASSWORD:"example-not-a-real-secret",MAMA_QWEN_API_KEY:"test-key",MAMA_QWEN_WORKSPACE_ID:"ws-test123"};
 const login=await invoke("auth","POST",{password:"example-not-a-real-secret"},env);
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 const unconfirmed=await invoke("memory","POST",{kind:"life_story",content:"虚构的童年故事"},env,cookie);
 assert.equal(unconfirmed.status,422);
 const saved=await invoke("memory","POST",{kind:"life_story",content:"虚构的童年故事",confirmed:true},env,cookie);
 assert.equal(saved.status,201);
 assert.equal((await saved.json()).item.kind,"life_story");
 const listed=await invoke("memory","GET",undefined,env,cookie);
 assert.equal(listed.status,200);
 const deleted=await invoke("memory","DELETE",{id:"test-memory-id"},env,cookie);
 assert.equal(deleted.status,200);
 const invalid=await invoke("memory","POST",null,env,cookie);
 assert.equal(invalid.status,422);
});

test("records cannot be accessed without authenticated signed cookie",async()=>{
 const response=await invoke("records");
 assert.equal(response.status,401);
});

test("realtime model access cannot be used anonymously",async()=>{
 const response=await invoke("sdp","POST",{fake:true});
 assert.equal(response.status,401);
});

test("guest SDP exchange proxies the official Beijing WebRTC endpoint without exposing the key",async t=>{
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_QWEN_API_KEY:"server-only-test-key",MAMA_QWEN_WORKSPACE_ID:"ws-test123"};
 const login=await invoke("auth","POST",{action:"guest",consent:true},env);
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 const offer="v=0\r\n"+"o=- 123456789 2 IN IP4 127.0.0.1\r\n".repeat(8);
 let forwarded;
 t.mock.method(globalThis,"fetch",async(url,options)=>{
  forwarded={url:String(url),options};
  return new Response("v=0\r\nanswer-sdp\r\n",{status:200,headers:{"Content-Type":"application/sdp"}});
 });
 const response=await onRequest({request:new Request(base+"/api/mama/sdp",{
  method:"POST",headers:{Origin:base,Cookie:cookie,"Content-Type":"application/sdp"},body:offer
 }),env});
 assert.equal(response.status,200);
 assert.equal(response.headers.get("Content-Type"),"application/sdp");
 assert.equal(await response.text(),"v=0\r\nanswer-sdp\r\n");
 assert.equal(forwarded.url,"https://ws-test123.cn-beijing.maas.aliyuncs.com/api/v1/webrtc/realtime?model=qwen3.8-omni-flash-realtime");
 assert.equal(forwarded.options.method,"POST");
 assert.equal(forwarded.options.headers.Authorization,"Bearer server-only-test-key");
 assert.equal(forwarded.options.headers["Content-Type"],"application/sdp");
 assert.equal(forwarded.options.body,offer);
});

test("unsupported realtime model IDs are rejected before contacting the provider",async t=>{
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_QWEN_API_KEY:"server-only-test-key",MAMA_QWEN_WORKSPACE_ID:"ws-test123",MAMA_QWEN_MODEL_ID:"arbitrary-model"};
 const login=await invoke("auth","POST",{action:"guest",consent:true},env);
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 let called=false;
 t.mock.method(globalThis,"fetch",async()=>{called=true;return new Response("unexpected");});
 const response=await onRequest({request:new Request(base+"/api/mama/sdp",{method:"POST",headers:{Origin:base,Cookie:cookie,"Content-Type":"application/sdp"},body:"v=0\r\n"+"o=- 123456789 2 IN IP4 127.0.0.1\r\n".repeat(8)}),env});
 assert.equal(response.status,503);
 assert.equal(called,false);
});

test("cross-origin API posts are rejected",async()=>{
 const response=await onRequest({request:new Request(base+"/api/mama/auth",{
  method:"POST",headers:{Origin:"https://attacker.example","Content-Type":"application/json"},
  body:JSON.stringify({password:"whatever"})}),env:{}});
 assert.equal(response.status,403);
});

test("unrecognized API route remains private",async()=>{
 const response=await invoke("export");
 assert.equal(response.status,401);
});
