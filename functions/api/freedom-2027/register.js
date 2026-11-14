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
 const markup="<!doctype html><html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:0;background-color:#f6f0fa;color:#432451;font-family:Arial,'Microsoft YaHei',sans-serif\"><table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#f6f0fa\"><tr><td align=\"center\" style=\"padding:28px 12px\"><table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"max-width:570px;background-color:#ffffff;border-radius:22px\"><tr><td style=\"padding:30px 24px\"><p style=\"font-size:12px;letter-spacing:2px;color:#8a699b;margin:0 0 12px\">HER’S · FREEDOM 2027</p><h1 style=\"color:#522966;font-size:25px;line-height:1.4;margin:0 0 14px\">你的专属入场券</h1><p style=\"font-size:15px;line-height:1.85;margin:0 0 22px;color:#57435e\">亲爱的 {{person}}，感谢报名2027自由女神计划线上闭门分享！</p><table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background-color:#7c448f;background-image:linear-gradient(135deg,#55256f,#9a5bad 55%,#6f3c89);border:2px solid #dabb7a;border-radius:18px;overflow:hidden;color:#ffffff\"><tr><td colspan=\"2\" align=\"center\" style=\"font-size:12px;letter-spacing:1.8px;color:#f6dfac;border-bottom:1px solid #a984b8;padding:17px 10px\">2027 · FREEDOM GODDESS PROJECT</td></tr><tr><td width=\"126\" valign=\"middle\" align=\"center\" style=\"padding:18px 0 18px 15px;vertical-align:middle\"><img src=\"https://jasminwang.com/freedom-2027/sunying-portrait.jpg\" alt=\"孙颖\" width=\"110\" height=\"146\" style=\"display:block;width:110px;height:146px;object-fit:cover;object-position:center 18%;border:2px solid #e6cd8c;border-radius:13px\"></td><td valign=\"middle\" style=\"padding:17px 14px 17px 12px;vertical-align:middle;color:#ffffff\"><div style=\"color:#f6dfac;font-size:11px;letter-spacing:1px;margin:0 0 8px\">首批线上闭门分享</div><div style=\"color:#ffffff;font-weight:700;font-size:23px;line-height:1.35;margin-bottom:11px\">专属入场券</div><div style=\"color:#ffffff;font-weight:700;font-size:17px;line-height:1.45;margin-bottom:10px;word-break:break-word\">{{person}} 姐妹</div><div style=\"color:#ffffff;font-size:14px;line-height:1.8\">11月17日、18日<br>墨尔本时间晚上8:00</div><div style=\"color:#ffffff;font-size:14px;line-height:1.8\">腾讯会议 · 线上分享</div><div style=\"color:#f7e0ac;font-size:11px;line-height:1.8;margin-top:9px\">专属票号 · <span style=\"letter-spacing:.2px;font-size:12px\">{{code}}</span></div></td></tr><tr><td colspan=\"2\" align=\"center\" style=\"border-top:1px dashed #e1c987;padding:16px 17px 19px;background-color:#75418a;color:#ffffff;font-size:13px;line-height:1.8\"><strong style=\"color:#f5dfad;font-size:15px\">入群和会议室信息</strong><div>孙颖会通过微信联系你，邀请你入群，并把会议室的入会信息发送给你。到时我们线上见！</div></td></tr></table><p style=\"font-size:14px;line-height:1.9;color:#57435e;margin:23px 0 10px\">请保存这封邮件。你也可以在报名成功页面保存同款专属入场券。</p><p style=\"font-size:12px;line-height:1.7;color:#897590;margin:0\">Her’s 女性幸福圈 · 如非本人报名，请忽略此邮件。</p></td></tr></table></td></tr></table></body></html>";
 const plain="亲爱的 {{name}}，\n\n感谢报名2027自由女神计划线上闭门分享！\n\n专属票号：{{code}}\n活动时间：11月17日及18日，墨尔本时间晚上8:00。\n请保存此邮件或在报名成功页面保存专属入场券。\n\n孙颖会通过微信联系你，邀请你入群并发送线上分享安排。会议链接及入群安排将由孙颖通过微信发送。\n\nHer’s 女性幸福圈\n如果你未报名，请忽略此邮件。";
 return {
  subject:"你的2027自由女神计划专属入场券",
  text:plain.replaceAll("{{code}}",ticket).replaceAll("{{name}}",name),
  html:markup.replaceAll("{{code}}",code).replaceAll("{{person}}",person)
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
