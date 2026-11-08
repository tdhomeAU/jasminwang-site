import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {onRequestPost} from '../functions/api/qingshijiu-generate.js';
import {EVERGREEN_TOPICS} from '../src/qingshijiu-brain/evergreen-topics.js';
const base='dist/qingshijiu/ai-content/';
const read=p=>readFileSync(p,'utf8');
const html=read(base+'index.html'),real=read(base+'real-ai.js'),ui=read(base+'photo-ui.js'),css=read(base+'photo-ui.css');
assert.equal(EVERGREEN_TOPICS.filter(x=>x.series==='脸部风水').length,15);
const publicTopics=JSON.parse(read(base+'topics.json'));
assert.deepEqual(publicTopics.map(x=>x.id),EVERGREEN_TOPICS.map(x=>x.id));
for(const name of ['face','client','team','avatar']){
  const path=base+'assets/'+name+'.svg';
  assert.ok(existsSync(path));
  const svg=read(path);
  assert.ok(svg.includes('data:image/jpeg;base64,'),'Image missing in '+name);
  const encoded=svg.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)?.[1];
  assert.ok(encoded && Buffer.from(encoded,'base64').subarray(0,3).equals(Buffer.from([255,216,255])),'Invalid original JPG '+name);
}
for(const id of ['story','make','voice','swap','result','output','taskTitle','taskList','copy','rewrite','markDone','openAdmin','back','save','export','reset','videoAction','mediaTip']){
  assert.ok(html.includes('id="'+id+'"'),id+' missing');
}
assert.ok(html.includes('photo-ui.css?v=26'));
assert.ok(html.includes('photo-ui.js?v=26'));
assert.ok(html.includes('real-ai.js?v=26'));
assert.ok(ui.includes('photo-tile')&&ui.includes('face.svg')&&ui.includes('client.svg')&&ui.includes('avatar.svg'));
assert.ok(css.includes('.topic-picker')&&css.includes('photo-tile'));
assert.ok(real.includes('evergreenTopicId'));
assert.ok(real.includes('qsjAiChooseTopic'));
assert.ok(real.includes('qsjAiAvatarScript'));
let prompts=[];
const oldFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
  assert.equal(url,'https://api.deepseek.com/chat/completions');
  const body=JSON.parse(options.body);
  prompts.push(JSON.parse(body.messages[1].content));
  return Response.json({choices:[{message:{content:JSON.stringify({title:'脸部话题',content:'眼神和表情，常常是第一印象里最先注意到的细节。为什么老一辈爱谈眉眼？你怎么看？',checks:[],facts:[],imageTip:'搭配品牌现有的人物头像'})}}]});
};
try {
  const req=(data)=>new Request('https://jasminwang.com/api/qingshijiu-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await onRequestPost({request:req({raw:'',evergreenTopicId:'face01',mode:'moments',task:'beauty'}),env:{DEEPSEEK_API_KEY:'test-key'}});
  const body=await result.json();
  assert.equal(result.status,200,JSON.stringify(body));
  assert.equal(body.mode,'live');
  assert.equal(body.evergreenTopic?.id,'face01');
  assert.equal(body.skill.id,'F11');
  assert.equal(body.knowledgeVersion,'QSJ-BRAIN-0.4');
  assert.equal(prompts.at(-1).evergreenTopic.title,'传统面相为什么重视眉眼？');
  assert.equal(prompts.at(-1).raw,'');
  const other=await onRequestPost({request:req({raw:'',evergreenTopicId:'face15',mode:'video15'}),env:{DEEPSEEK_API_KEY:'test-key'}});
  assert.equal(other.status,200);
  const bad=await onRequestPost({request:req({raw:'',evergreenTopicId:'face999',mode:'moments'}),env:{DEEPSEEK_API_KEY:'test-key'}});
  assert.equal(bad.status,400);
  const normal=await onRequestPost({request:req({raw:'今天和朋友聊了一下我参加的团队培训，认识了很多新伙伴。',task:'business',mode:'moments'}),env:{DEEPSEEK_API_KEY:'test-key'}});
  assert.equal(normal.status,200);
  assert.equal((await normal.json()).evergreenTopic,null);
  console.log('PASS: 18 evergreen topics, all real photo assets, page controls, direct image flows, DeepSeek-generated topic route and original business route');
} finally {globalThis.fetch=oldFetch}
