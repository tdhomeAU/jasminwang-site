const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function onRequestPost({request,env}) {
 if(!env.FREEDOM_DB)return json({error:'报名系统正在配置，请稍后再试。'},503);
 let data;try{if(Number(request.headers.get('content-length')||0)>12000)return json({error:'提交内容过长'},413);data=await request.json()}catch{return json({error:'无效的报名数据'},400)}
 const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const name=clean(data.name,80),wechat=clean(data.wechat,100),email=clean(data.email,180),city=clean(data.city,120),goals=Array.isArray(data.goals)?data.goals:[],barriers=Array.isArray(data.barriers)?data.barriers.map(v=>clean(v,160)),expectation=clean(data.expectation,160);
 if(!name||!wechat||!city||!email||!/^\S+@\S+\.\S+$/.test(email)||goals.length<1||goals.length>3||barriers.length<1||barriers.length>6||!expectation||data.consent!==true)return json({error:'请完整填写报名信息并同意活动联系'},400);
 const allowedGoals=['健康减重，保持理想体态','逆龄焕活，越来越年轻有活力','女性荷尔蒙与周期健康（经期、围绝经期、更年期）','提升精力，告别疲惫','改善睡眠，提升身心状态','健康饮食，建立可持续的生活习惯','平衡压力，享受更精彩的生活','其他'];
 const allowedBarriers=['工作、家庭太忙，没有时间','知道该做什么，却很难坚持','尝试过不少方法，但效果不理想','不知道什么方法真正适合自己','缺少一起行动、互相鼓励的伙伴','其他'];
 const allowedExpectations=['学到马上能用的健康实用技巧','了解 FREEDOM 健康生活方法系统','找到适合自己的长期健康生活方式','了解2027自由女神计划及内部共创机会','了解《2027澳洲健康女神日历》的内容与设计','了解如何结合澳洲四季和生活节奏，用健康日历安排健康生活'];
 if(!goals.every(g=>allowedGoals.includes(g))||!barriers.every(v=>allowedBarriers.includes(v))||new Set(barriers).size!==barriers.length||!allowedExpectations.includes(expectation))return json({error:'选项无效'},400);
 const ticket='FG27-'+crypto.randomUUID().slice(0,8).toUpperCase();
 try{await env.FREEDOM_DB.prepare('INSERT INTO freedom_registrations (ticket,name,wechat,email,city,goals,barrier,expectation,consented_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(ticket,name,wechat,email,city,JSON.stringify(goals),JSON.stringify(barriers),expectation,new Date().toISOString()).run()}catch{return json({error:'报名暂时无法保存，请稍后再试'},503)}
 // Mail delivery intentionally disabled until a verified transactional mail provider is configured.
 return json({ok:true,ticket,emailSent:false});
}
export async function onRequestGet(){return json({error:'Method not allowed'},405)}
