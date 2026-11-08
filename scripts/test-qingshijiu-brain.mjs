import assert from 'node:assert/strict';
import {onRequestPost} from '../functions/api/qingshijiu-generate.js';
import {retrieveQingshijiuBrain,BRAIN_VERSION,SAMPLE_CARDS,BRAND_CARDS,SONG_CARDS} from '../src/qingshijiu-brain/brain.js';

assert.equal(BRAIN_VERSION,'QSJ-BRAIN-0.4');
assert.equal(SAMPLE_CARDS.length,25);
assert.equal(new Set(SAMPLE_CARDS.map(x=>x.id)).size,25);
assert.ok(BRAND_CARDS.length>=6&&SONG_CARDS.length>=5);
assert.ok(SAMPLE_CARDS.every(x=>x.source.includes('docs.google.com')&&x.performance==='unknown'));

const cases=[
 {raw:'50岁的客户说脖子后的富贵包看着小了不少，非常开心，我有她的前后变化照片。',task:'beauty',taskTitle:'客户变美的故事',expect:'F09',noSong:true},
 {raw:'这周又用完一瓶爱米乐护肤产品，我想讲讲自己的空瓶日常，还有平时怎么用。',task:'product',taskTitle:'产品介绍',expect:'F07',noSong:true},
 {raw:'今天收到一笔真实的服务收款，想讲讲做事业的这段经历，以及感谢客户信任。',task:'business',taskTitle:'事业分享',expect:'F08',noSong:true},
 {raw:'今天去总部参加品牌培训，学到了不少如何跟客户沟通的实际方法和技巧。',task:'business',taskTitle:'总部培训',expect:'F10',noSong:true},
 {raw:'想介绍宋星辉自己对轻拾玖平台做重个人做轻的理解，以及她的创业转型经历。',task:'business',taskTitle:'宋星辉的故事',expect:'F12',noSong:false}
];

const originalFetch=globalThis.fetch;
let observed=[];
globalThis.fetch=async (url,options)=>{
  const body=JSON.parse(options.body);
  assert.equal(url,'https://api.deepseek.com/chat/completions');
  assert.equal(body.model,'deepseek-flash');
  const prompt=JSON.parse(body.messages[1].content);
  observed.push(prompt);
  assert.equal(prompt.brandKnowledgeVersion,BRAIN_VERSION);
  assert.ok(prompt.brandBrain.length>=2);
  assert.ok(prompt.successfulOperatorBrain.length>=1);
  assert.ok(prompt.successfulOperatorBrain.every(x=>x.sourceStatus==='screen_recording_index'&&x.performance==='unknown'));
  assert.ok(!JSON.stringify(prompt.successfulOperatorBrain).includes('月入百万'));
  assert.ok(!JSON.stringify(prompt).includes('brandKnowledge:BRAND_CONTEXT'));
  return Response.json({choices:[{message:{content:JSON.stringify({
    title:'案例文案测试',content:'今天遇到的这件事挺值得和朋友聊聊，用真实的一点小事把话说清楚了。',
    why:'从真实场景切入',imageTip:'用今天手头已有的照片',checks:[],facts:[]
  })}}]});
};
try {
  for(const c of cases){
    const request=new Request('https://jasminwang.com/api/qingshijiu-generate',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({raw:c.raw,task:c.task,taskTitle:c.taskTitle,mode:'moments'})
    });
    const response=await onRequestPost({request,env:{DEEPSEEK_API_KEY:'dummy-for-test'}});
    assert.equal(response.status,200,await response.clone().text());
    const data=await response.json(),prompt=observed.at(-1);
    assert.equal(data.mode,'live');
    assert.equal(data.brain.version,BRAIN_VERSION);
    assert.equal(data.skill.id,c.expect);
    assert.equal(data.brain.brandCardIds.length,prompt.brandBrain.length);
    assert.equal(data.brain.operatorSampleIds.length,prompt.successfulOperatorBrain.length);
    assert.equal(data.brain.personCardIds.length,prompt.songXinghuiContext?.length||0);
    assert.ok(data.brain.operatorSampleIds.every(id=>SAMPLE_CARDS.some(x=>x.id===id)));
    if(c.noSong){assert.equal(prompt.songXinghuiContext,undefined);assert.equal(data.brain.personCardIds.length,0);}
    else{assert.ok(prompt.songXinghuiContext.length>0);}
    console.log(c.expect,JSON.stringify({brand:data.brain.brandCardIds,samples:data.brain.operatorSampleIds,person:data.brain.personCardIds}));
  }
} finally {globalThis.fetch=originalFetch;}

const beauty=retrieveQingshijiuBrain({raw:'客户照片对比与变化',taskTitle:'客户变美',task:'beauty',skillId:'F09'});
const biz=retrieveQingshijiuBrain({raw:'真实收款经历',taskTitle:'事业分享',task:'business',skillId:'F08'});
assert.notDeepEqual(beauty.trace.sampleIds,biz.trace.sampleIds,'Different content tasks must not reuse the same operator patterns');
console.log('PASS: two linked Brains, 25 source observations, conditional Song retrieval, live handler orchestration');
