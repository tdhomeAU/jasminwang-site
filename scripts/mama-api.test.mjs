import test from "node:test";
import assert from "node:assert/strict";
import { onRequest } from "../functions/api/mama/[[path]].js";

const base="https://example.test";
const invoke=(path,method="GET",body=undefined,env={})=>{
 const opts={method,headers:{"Origin":base}};
 if(body!==undefined){opts.body=JSON.stringify(body);opts.headers["Content-Type"]="application/json";}
 return onRequest({request:new Request(base+"/api/mama/"+path,opts),env});
};

test("empty setup reports unauthenticated without exposing private records",async()=>{
 const response=await invoke("auth");
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{authenticated:false,role:null,ready:false});
});

test("login fails closed until secrets and independent database are configured",async()=>{
 const response=await invoke("auth","POST",{password:"example-not-a-real-secret",consent:true});
 assert.equal(response.status,503);
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
