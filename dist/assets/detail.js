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
  if (isPubliclyDownloadable(skill)) {
    const button = document.querySelector("[data-download-skill]");
    const link = document.createElement("a");
    link.className = "button";
    link.href = skill.publicRelease.artifact;
    link.download = "";
    link.textContent = "下载 Skill ↓";
    button.replaceWith(link);
  }
}
