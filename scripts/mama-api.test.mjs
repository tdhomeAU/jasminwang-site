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
 const env={MAMA_DB:testDb,MAMA_SESSION_SECRET:"test-session-secret-01234567890123456789",MAMA_MOTHER_PASSWORD:"example-not-a-real-secret"};
 const login=await invoke("auth","POST",{password:"example-not-a-real-secret",consent:true},env);
 assert.equal(login.status,200);
 assert.deepEqual(await login.json(),{ok:true,role:"member"});
 const cookie=login.headers.get("Set-Cookie").split(";")[0];
 const session=await invoke("auth","GET",undefined,env,cookie);
 assert.deepEqual(await session.json(),{authenticated:true,role:"member",ready:true});
 const saved=await invoke("records","POST",{kind:"feeling",text:"虚构测试：今天精神不错"},env,cookie);
 assert.equal(saved.status,201);
});

test("records cannot be accessed without authenticated signed cookie",async()=>{
 const response=await invoke("records");
 assert.equal(response.status,401);
});

test("realtime model access cannot be used anonymously",async()=>{
 const response=await invoke("sdp","POST",{fake:true});
 assert.equal(response.status,401);
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
