// cv.js (avec génération dynamique complète : menu, skills, expériences, projets)
(async () => {
  // 1) Promesse DOM prêt
  const domReady = new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
    } else {
      resolve();
    }
  });

  // 2) Charger la config YAML
  let cfg = { lang: "fr", languages: [], i18n: {} };
  try {
    const res = await fetch("config.yml", { cache: "no-store" });
    if (res.ok) {
      const txt = await res.text();
      cfg = jsyaml.load(txt) || cfg;
    } else {
      console.warn("[config] HTTP", res.status);
    }
  } catch (e) {
    console.warn("[config] Impossible de charger config.yml :", e);
  }

  // 3) Attendre que le DOM soit prêt
  await domReady;

  // 4) Génération dynamique du menu de langues
  const sel = document.getElementById("lang-select");
  if (sel && Array.isArray(cfg.languages) && cfg.languages.length > 0) {
    sel.innerHTML = "";
    cfg.languages.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.code;
      option.textContent = `${lang.flag || ""} ${lang.label}`.trim();
      sel.appendChild(option);
    });
  } else if (sel) {
    console.warn('[i18n] Aucune langue configurée dans config.yml ou format invalide.');
  }

  // 5) Optionnel : appliquer le thème/palette depuis la config
  try {
    const p = cfg?.theme?.palette || {};
    const root = document.documentElement.style;
    const map = {
      "--so-orange": p["so-orange"],
      "--so-green": p["so-green"],
      "--so-blue": p["so-blue"],
      "--so-blue-light": p["so-blue-light"],
      "--so-blue-border": p["so-blue-border"],
      "--ink": p["ink"],
      "--muted": p["muted"],
      "--line": p["line"],
      "--bg": p["bg"],
      "--tag-bg": p["tag-bg"],
      "--tag-border": p["tag-border"],
    };
    Object.entries(map).forEach(([k, v]) => v && root.setProperty(k, v));
    if (cfg?.theme?.mode === "dark") {
      document.documentElement.classList.add("theme-dark");
    }
  } catch (e) {
    console.warn("[theme]", e);
  }

  // 6) Fonction d'application de la langue
  function applyLang(lang) {
    try {
      const dict = (cfg && cfg.i18n && cfg.i18n[lang]) || {};

      // Remplace tout [data-i18n="clé"]
      document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.dataset.i18n;
        const val = dict[key];
        if (typeof val === "string") {
          el.textContent = val;
        } else if (val && typeof val === "object" && "html" in val) {
          el.innerHTML = val.html;
        }
      });

      // --- Rendu dynamique des COMPÉTENCES ---
      const skillsNote = document.getElementById("skills-note");
      if (skillsNote && dict.skills_note) {
        skillsNote.textContent = dict.skills_note;
      }

      const skillsContainer = document.getElementById("skills-list");
      if (skillsContainer && Array.isArray(dict.skills_items)) {
        skillsContainer.innerHTML = dict.skills_items.map(skill => `
          <div class="tile">
            <h3>${skill.title}</h3>
            <div class="bar"><i style="width:${skill.level}%"></i></div>
            <div class="chips">
              ${skill.chips.map(chip => `<span class="chip">${chip}</span>`).join('')}
            </div>
          </div>
        `).join('');
        console.log(`[i18n] ${dict.skills_items.length} compétences chargées en ${lang}`);
      } else {
        console.warn('[i18n] skills_items non trouvé ou invalide');
      }

      // --- Rendu dynamique des EXPÉRIENCES ---
      const expContainer = document.getElementById("experience-list");
      if (expContainer && Array.isArray(dict.experience_items)) {
        expContainer.innerHTML = dict.experience_items.map(exp => `
          <div class="job">
            <h3>${exp.title} — <a href="${exp.link}" target="_blank">${exp.company}</a>
            <span class="where"> (${exp.years})</span></h3>
            <ul>${exp.details.map(d => `<li>${d}</li>`).join("")}</ul>
          </div>
        `).join("") + `
        <p style="color:var(--muted); font-size:12px; margin-top:3px;">${dict.experience_footer || ""}</p>`;
        console.log(`[i18n] ${dict.experience_items.length} expériences chargées en ${lang}`);
      } else {
        console.warn('[i18n] experience_items non trouvé ou invalide');
      }

      // --- Rendu dynamique des PROJETS ---
      const projectsContainer = document.getElementById("projects-list");
      if (projectsContainer && Array.isArray(dict.projects_items)) {
        projectsContainer.innerHTML = dict.projects_items.map(project => `
          <div class="tile">
            <h3>${project.title}</h3>
            <p style="margin:6px 0 0; color:var(--muted)">${project.description}</p>
          </div>
        `).join('');
        console.log(`[i18n] ${dict.projects_items.length} projets chargés en ${lang}`);
      } else {
        console.warn('[i18n] projects_items non trouvé ou invalide');
      }

      // --- Rendu dynamique de l'ÉDUCATION ---
      const educationContainer = document.getElementById("education-list");
      if (educationContainer && Array.isArray(dict.education_items)) {
        educationContainer.innerHTML = `
          <ul style="margin:6px 0 0;padding-left:18px;">
            ${dict.education_items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        `;
      }

      // La ligne "Langues"
      const langLine = document.getElementById("lang-line");
      if (langLine && dict.langline) {
        langLine.innerHTML = dict.langline;
      }

      // Persistance + synchro sélecteur + <html lang="...">
      localStorage.setItem("cv-lang", lang);
      document.documentElement.setAttribute("lang", lang);

      const sel = document.getElementById("lang-select");
      if (sel && sel.value !== lang) sel.value = lang;
      
      // Mettre à jour l'URL avec le paramètre lang (sans recharger la page)
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);

      console.log(`[i18n] ✓ Langue appliquée : ${lang}`);

    } catch (e) {
      console.warn("[i18n]", e);
    }
  }

  // 7) Initialisation + écouteur du sélecteur
  
  // Lire le paramètre de langue depuis l'URL (?lang=en ou ?lang=fr)
  const urlParams = new URLSearchParams(window.location.search);
  const langFromUrl = urlParams.get('lang');
  
  // Priorité : URL > localStorage > config.yml
  const initial = langFromUrl || localStorage.getItem("cv-lang") || cfg.lang || "fr";
  
  // Si la langue vient de l'URL, la sauvegarder dans localStorage
  if (langFromUrl) {
    localStorage.setItem("cv-lang", langFromUrl);
    console.log(`[i18n] Langue définie via URL : ${langFromUrl}`);
  }

  if (sel) {
    sel.value = initial;
    sel.addEventListener("change", (e) => applyLang(e.target.value));
  } else {
    console.warn('[i18n] Sélecteur "#lang-select" introuvable dans le DOM.');
  }

  // Applique tout de suite la langue initiale (DOM + config présents)
  applyLang(initial);
})();
