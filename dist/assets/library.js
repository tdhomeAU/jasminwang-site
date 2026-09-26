import { catalog, isPubliclyDownloadable } from "./catalog.js";

const categoryNav = document.querySelector("[data-category-nav]");
const catalogRoot = document.querySelector("[data-catalog]");
const publishedSkills = catalog.skills.filter((skill) => skill.status === "published");

function downloadButton(label, skills, className = "button secondary") {
  const available = skills.filter(isPubliclyDownloadable);
  const gatedSkill = available.find((skill) => skill.leadCaptureRequired);
  if (gatedSkill) {
    const link = document.createElement("a");
    link.className = className;
    link.textContent = label.replace(/^下载/, "免费获取") + " ↓";
    link.href = "./" + gatedSkill.slug + "/#download";
    return link;
  }
  // Never generate bundles from private source files.
  if (available.length === 1) {
    const link = document.createElement("a");
    link.className = className;
    link.textContent = label + " ↓";
    link.href = available[0].publicRelease.artifact;
    link.download = "";
    return link;
  }
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.disabled = true;
  button.textContent = label + " ↓";
  return button;
}

catalog.categories.forEach((category) => {
  const skills = publishedSkills.filter((skill) => skill.categoryId === category.id);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "category-filter";
  button.dataset.filter = category.id;
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = '<span class="filter-name">' + category.name + '</span>' + (skills.length ? "" : '<span class="coming-soon">Coming soon</span>');
  categoryNav.append(button);
  if (!skills.length) return;

  const section = document.createElement("section");
  section.className = "category-section";
  section.dataset.category = category.id;
  section.id = category.id;
  const intro = document.createElement("div");
  intro.innerHTML = '<div class="category-kicker">' + category.number + ' / ' + String(skills.length).padStart(2, "0") + ' SKILL</div><h2 class="category-heading">' + category.name + '</h2><p class="category-copy">' + category.question + '</p>';
  intro.append(downloadButton("下载本类别技能包", skills, "category-download"));
  const grid = document.createElement("div");
  grid.className = "skill-grid";
  skills.forEach((skill) => {
    const article = document.createElement("article");
    article.className = "skill-card";
    article.innerHTML = '<div class="skill-meta"><span class="tag">' + skill.type + '</span><span class="tag">' + skill.version + '</span></div><p class="card-english">' + skill.eyebrow + '</p><h3><a href="./' + skill.slug + '/">' + skill.name + '</a></h3><p class="skill-summary">' + skill.summary + '</p><div class="skill-card-footer"><a class="text-link" href="./' + skill.slug + '/">认识 AI 总舵手</a></div>';
    article.querySelector(".skill-card-footer").append(downloadButton("下载这个 Skill", [skill], "category-download"));
    grid.append(article);
  });
  section.append(intro, grid);
  catalogRoot.append(section);
});

document.querySelector("[data-download-all]").replaceWith(downloadButton("下载全部技能包", publishedSkills));
const empty = document.createElement("p");
empty.className = "filter-empty";
empty.hidden = true;
empty.setAttribute("role", "status");
catalogRoot.append(empty);

categoryNav.addEventListener("click", (event) => {
  const selected = event.target.closest("[data-filter]");
  if (!selected) return;
  const id = selected.dataset.filter;
  let count = 0;
  document.querySelectorAll("[data-category]").forEach((section) => {
    section.hidden = id !== "all" && section.dataset.category !== id;
    if (!section.hidden) count++;
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const active = button.dataset.filter === id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  empty.hidden = count !== 0;
  empty.textContent = count ? "" : catalog.categories.find((c) => c.id === id).name + " · 更多 Skill 即将上线。";
});
