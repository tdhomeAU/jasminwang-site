const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
// Outbound mail is optional until a verified sender and a Resend key are configured.
const escapeHtml=(value)=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const sendMail=async(env,{to,subject,html,text,key})=>{
 if(!env.RESEND_API_KEY||!env.FREEDOM_MAIL_FROM||!to)return false;
 try{
  const replyTo=env.FREEDOM_REPLY_TO?{reply_to:env.FREEDOM_REPLY_TO}:{};
  const res=await fetch("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":key},
   body:JSON.stringify({from:env.FREEDOM_MAIL_FROM,to:[to],subject,html,text,...replyTo})
  });
  if(!res.ok){console.error("Freedom 2027 email rejected with HTTP",res.status);return false;}
  const result=await res.json().catch(()=>null);
  return Boolean(result&&result.id);
 }catch(error){console.error("Freedom 2027 email provider unavailable");return false;}
};
const ticketEmail=(name,ticket)=>{
 const person=escapeHtml(name),code=escapeHtml(ticket);
 return {
  subject:"你的2027自由女神计划专属入场券",
  text:`亲爱的${name}，\n\n感谢报名2027自由女神计划线上闭门分享！\n\n你的电子入场券编号：${ticket}\n请保存此邮件或在提交成功页面保存你的专属入场券。\n\n孙颖会通过微信联系你，提供入群和线上分享安排。请以她后续确认的时间及入会信息为准。\n\nHer’s 女性幸福圈\n如果你未报名，请忽略此邮件。`,
  html:`<div style="font-family:Arial,'Microsoft YaHei',sans-serif;background:#f8f1fb;padding:28px 16px;color:#432451"><div style="max-width:560px;margin:auto;background:white;border-radius:18px;padding:30px"><div style="font-size:12px;letter-spacing:2px;color:#866098">HER’S · FREEDOM 2027</div><h1 style="font-size:25px">你的专属入场券</h1><p>亲爱的 ${person}，感谢报名2027自由女神计划线上闭门分享！</p><div style="background:linear-gradient(135deg,#55256f,#9861ae);border-radius:14px;padding:24px;color:#fff;text-align:center"><div style="font-size:14px">2027 自由女神计划</div><strong style="font-size:26px;display:block;margin:12px 0">专属入场券</strong><div style="font-size:18px">${person}</div><div style="margin-top:12px;font-size:14px">NO. ${code}</div></div><p>请保存这封邮件。你也可以在提交成功页面保存专属入场券。</p><p>孙颖会通过微信联系你，发送入群和线上分享的具体安排。请以她后续确认的信息为准。</p><p style="font-size:13px;color:#86778d">Her’s 女性幸福圈 · 如果你没有报名，请忽略此邮件。</p></div></div>`
 };
};
export async function onRequestPost({request,env}) {
 if(!env.FREEDOM_DB)return json({error:'报名系统正在配置，请稍后再试。'},503);
 let data;try{if(Number(request.headers.get('content-length')||0)>12000)return json({error:'提交内容过长'},413);data=await request.json()}catch{return json({error:'无效的报名数据'},400)}
 const clean=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const name=clean(data.name,80),wechat=clean(data.wechat,100),email=clean(data.email,180),city=clean(data.city,120),goals=Array.isArray(data.goals)?data.goals:[],barriers=Array.isArray(data.barriers)?data.barriers.map(v=>clean(v,160)):[],expectation=clean(data.expectation,160);
 if(!name||!wechat||!city||!email||!/^\S+@\S+\.\S+$/.test(email)||goals.length<1||goals.length>3||barriers.length<1||barriers.length>6||!expectation||data.consent!==true)return json({error:'请完整填写报名信息并同意活动联系'},400);
 const allowedGoals=['健康减重，保持理想体态','逆龄焕活，越来越年轻有活力','女性荷尔蒙与周期健康（经期、围绝经期、更年期）','提升精力，告别疲惫','改善睡眠，提升身心状态','健康饮食，建立可持续的生活习惯','平衡压力，享受更精彩的生活','其他'];
 const allowedBarriers=['工作、家庭太忙，没有时间','知道该做什么，却很难坚持','尝试过不少方法，但效果不理想','不知道什么方法真正适合自己','缺少一起行动、互相鼓励的伙伴','其他'];
 const allowedExpectations=['学到马上能用的健康实用技巧','了解 FREEDOM 健康生活方法系统','找到适合自己的长期健康生活方式','了解2027自由女神计划及内部共创机会','了解《2027澳洲健康女神日历》的内容与设计','了解如何结合澳洲四季和生活节奏，用健康日历安排健康生活'];
 if(!goals.every(g=>allowedGoals.includes(g))||!barriers.every(v=>allowedBarriers.includes(v))||new Set(barriers).size!==barriers.length||!allowedExpectations.includes(expectation))return json({error:'选项无效'},400);
 const ticket='FG27-'+crypto.randomUUID().slice(0,8).toUpperCase();
 try{await env.FREEDOM_DB.prepare('INSERT INTO freedom_registrations (ticket,name,wechat,email,city,goals,barrier,expectation,consented_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(ticket,name,wechat,email,city,JSON.stringify(goals),JSON.stringify(barriers),expectation,new Date().toISOString()).run()}catch{return json({error:'报名暂时无法保存，请稍后再试'},503)}
 // The registration is saved first. An email failure must never erase a successful booking.
 const customerMail=ticketEmail(name,ticket);
 const emailSent=await sendMail(env,{to:email,...customerMail,key:"freedom2027-customer-"+ticket});
 if(env.FREEDOM_NOTIFY_EMAIL){
  const adminText=`2027自由女神计划有一位新报名者。\n\n姓名：${name}\n微信：${wechat}\n邮箱：${email}\n城市：${city}\n票号：${ticket}\n\n请登录 Cloudflare D1 的 freedom_registrations 表查看报名详细资料并安排跟进。健康目标和困难等敏感回答不通过邮件发送。`;
  const adminSent=await sendMail(env,{to:env.FREEDOM_NOTIFY_EMAIL,subject:"【自由女神计划】新报名通知 "+ticket,text:adminText,html:"<pre style=\"font-family:Arial,'Microsoft YaHei',sans-serif;white-space:pre-wrap\">"+escapeHtml(adminText)+"</pre>",key:"freedom2027-admin-"+ticket});
  if(!adminSent)console.warn("Freedom 2027 admin notification not sent for ticket",ticket);
 }
 return json({ok:true,ticket,emailSent});
}
export async function onRequestGet(){return json({error:'Method not allowed'},405)}
