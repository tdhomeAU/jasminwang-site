import { getCategory, getSkill, isPubliclyDownloadable } from "./catalog.js";

const skill = getSkill("chief-agent");
if (!skill) {
  document.querySelector("main").innerHTML = '<div class="shell catalog"><h1>暂未提供此 Skill</h1><a href="../">返回 AI 技能库</a></div>';
} else {
  const fields = { "skill-name": skill.name, summary: skill.summary, description: skill.description, problem: skill.problem, "category-name": getCategory(skill.categoryId).name, type: skill.type, version: skill.version };
  Object.entries(fields).forEach(([key, value]) => {
    document.querySelector("[data-" + key + "]").textContent = value;
  });
  for (const key of ["decisions", "scenarios"]) {
    skill[key].forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      document.querySelector("[data-" + key + "]").append(item);
    });
  }
  skill.mechanism.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "principle";
    item.innerHTML = '<span class="principle-number">' + String(index + 1).padStart(2, "0") + '</span><div><h3>' + step.title + '</h3><p>' + step.description + '</p></div>';
    document.querySelector("[data-mechanism]").append(item);
  });
  const trigger = document.querySelector("[data-open-lead-form]");
  const form = document.querySelector("[data-lead-form]");
  const formStatus = document.querySelector("[data-form-status]");
  const successState = document.querySelector("[data-success-state]");

  trigger.addEventListener("click", () => {
    form.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    form.querySelector("input[type=email]").focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    formStatus.hidden = true;
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.elements.email.value.trim(),
          consent: form.elements.consent.checked,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "暂时无法提交，请稍后再试。");

      const heading = document.createElement("h2");
      heading.textContent = "你的 AI 总舵手已经准备好了";
      const prompt = document.createElement("blockquote");
      prompt.textContent = "我现在把今天脑子里的事情全部倒给你，不用我分类。\n帮我找出今天的第一杠杆和最多三只大青蛙。";
      const successCopy = document.createElement("p");
      successCopy.textContent = "下载并安装后，你可以直接对它说：";
      const downloadNow = document.createElement("p");
      downloadNow.className = "download-now";
      downloadNow.textContent = "现在就下载 ↓";
      const download = document.createElement("a");
      download.className = "button";
      download.href = skill.publicRelease.artifact;
      download.download = "chief-agent-daily-leverage-v0.1-public.zip";
      download.textContent = "下载 AI 总舵手";
      const emailCopy = document.createElement("p");
      emailCopy.className = "delivery-note";
      emailCopy.textContent = "下载链接也已经发送到你的邮箱，之后可以随时回来找。";

      successState.replaceChildren(heading, downloadNow, download, successCopy, prompt, emailCopy);
      if (result.mode === "mock") {
        const previewNote = document.createElement("p");
        previewNote.className = "preview-note";
        previewNote.textContent = "本地预览模式：没有写入 Kit，也没有发送邮件。";
        successState.append(previewNote);
      }
      form.hidden = true;
      trigger.hidden = true;
      successState.hidden = false;
      successState.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.hidden = false;
      submitButton.disabled = false;
    }
  });

  if (!isPubliclyDownloadable(skill)) {
    trigger.disabled = true;
  }
}
