// 轻拾玖 Brain Orchestrator：轻量按需检索，禁止把案例当成当前经销商个人经历。
import {BRAIN_VERSION,BRAND_CARDS,SONG_CARDS,SAMPLE_CARDS} from './brain-data.js';

const strongWords=['富贵包','客户变化','前后','照片','眼周','法令纹','颈部','收款','空瓶','培训','大会','经营','创业','产品','体验','团队','人物','平台','生活','学习','成长'];
const normalise=s=>String(s||'').toLowerCase().slice(0,3200);
function tagScore(card,raw,title,kind,skillId){
  let score=0;
  for(const tag of card.tags){
    if(tag.length<2)continue;
    if(raw.includes(tag)) score+=strongWords.includes(tag)?7:4;
    if(title.includes(tag)) score+=3;
  }
  if(card.category===kind)score+=8;
  if(card.skillId===skillId)score+=12;
  if(card.type===kind)score+=5;
  return score;
}
function selectTop(items,{raw,title,kind,skillId,limit=2,exclude=[],distinctBy=''}){
  let ranked=items.filter(x=>!exclude.includes(x.id)).map(x=>({...x,rank:tagScore(x,raw,title,kind,skillId)}));
  ranked.sort((a,b)=>b.rank-a.rank||a.id.localeCompare(b.id));
  const result=[];
  for(const item of ranked){
    if(result.length>=limit)break;
    if(distinctBy&&result.some(x=>x[distinctBy]===item[distinctBy])&&ranked.some(x=>x[distinctBy]!==item[distinctBy]))continue;
    result.push(item);
  }
  return result.map(({rank,...x})=>x);
}
function kindOf(task,raw,title){
  if(task==='beauty'||/客户变化|变美|脸|眼|皮肤|富贵包|护理|面部|照片/.test(title))return 'beauty';
  if(task==='product'||/产品|空瓶|爱米乐/.test(title))return 'product';
  if(task==='business'||task==='brand'||/事业|创业|平台|经营|总部|培训|收款/.test(title))return 'business';
  if(task==='growth'||/成长|感悟|学习/.test(title))return 'growth';
  if(task==='video'&&/美|客户|护理|对比/.test(raw))return 'beauty';
  if(task==='video'&&/创业|收款|经营|培训|团队/.test(raw))return 'business';
  return 'life';
}
function slimBrand(card){return {id:card.id,text:card.fact,evidence:card.evidence};}
function slimPattern(card){return {id:card.id,scene:card.title,mechanic:card.pattern,media:card.media,sourceStatus:card.sourceStatus,performance:card.performance,skillId:card.skillId};}
export function retrieveQingshijiuBrain({raw='',taskTitle='',task='life',mode='moments',skillId='F05'}={}){
  const rawText=normalise(raw),title=normalise(taskTitle);
  const kind=kindOf(task,rawText,title);
  const isSong=/宋星辉|宋老师|星辉/.test(rawText+' '+title);
  // Business method cards can be borrowed. Song's autobiographical material only when user explicitly requests Song.
  const brandRelevant=selectTop(BRAND_CARDS.filter(x=>x.id!=='B001'),{raw:rawText,title,kind,skillId,limit:2});
  const brand=[BRAND_CARDS[0],...brandRelevant].map(slimBrand);
  // Two source examples support the selected Skill; a third, different Skill supplies a contrasting angle.
  const primary=selectTop(SAMPLE_CARDS.filter(x=>x.skillId===skillId),{raw:rawText,title,kind,skillId,limit:2});
  const supplementary=selectTop(SAMPLE_CARDS.filter(x=>x.skillId!==skillId),{raw:rawText,title,kind,skillId,limit:1});
  const methods=[...primary,...supplementary].map(slimPattern);
  const person=isSong?selectTop(SONG_CARDS,{raw:rawText,title,kind,skillId,limit:3}).map(x=>({id:x.id,thought:x.thought,evidence:x.evidence})): [];
  return {
    version:BRAIN_VERSION,
    kind,
    brand,
    operatorMethods:methods,
    person,
    writingInstructions:[
      '先分析经销商当前原话，然后利用总部事实和成功者样本的结构来写。样本仅是“创作方法”而非当前经销商已发生的经历。',
      '不能照抄任何历史朋友圈原句，不能把参考样本的天数、收款金额、人物、效果或客户感受挪给这位经销商。',
      '朋友圈直接讲人、事、反馈，有画面和情绪，不要用模板味总结和“风险/授权/审核”说教。',
      '视频参考已有素材的画面结构，但不得假装用户已拍摄没有提到的镜头。',
      '参考样本目前只有录屏索引和方法推测，没有实际咨询或成交数据；不声称其结构已验证高转化。'
    ],
    trace:{brandIds:brand.map(x=>x.id),sampleIds:methods.map(x=>x.id),personIds:person.map(x=>x.id),sourceStatus:'compiled_from_drive_2026-11-08'}
  };
}
export {BRAIN_VERSION, BRAND_CARDS, SONG_CARDS, SAMPLE_CARDS};