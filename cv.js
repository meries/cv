// cv.js - Avec gestion de la langue, du thème ET du PDF (VERSION LIGHT FORCÉ)
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
  let cfg = { lang: "fr", languages: [], i18n: {}, theme: {} };
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

  // 4) Génération dynamique du menu de langues avec drapeaux
  const sel = document.getElementById("lang-select");
  
  if (sel && Array.isArray(cfg.languages) && cfg.languages.length > 0) {
    sel.innerHTML = "";
    cfg.languages.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.code;
      // Utiliser le drapeau défini dans config.yml ou un drapeau par défaut
      const flag = lang.flag || '🌐';
      option.textContent = `${flag} ${lang.label}`;
      sel.appendChild(option);
    });
  } else if (sel) {
    console.warn('[i18n] Aucune langue configurée dans config.yml ou format invalide.');
  }

  // 5) Gestion du thème Dark/Light
  function applyTheme(isDark) {
    try {
      const palette = isDark ? (cfg?.theme?.palette_dark || {}) : (cfg?.theme?.palette || {});
      
      const root = document.documentElement.style;
      const map = {
        "--so-orange": palette["so-orange"],
        "--so-green": palette["so-green"],
        "--so-blue": palette["so-blue"],
        "--so-blue-light": palette["so-blue-light"],
        "--so-blue-border": palette["so-blue-border"],
        "--ink": palette["ink"],
        "--muted": palette["muted"],
        "--line": palette["line"],
        "--bg": palette["bg"],
        "--tag-bg": palette["tag-bg"],
        "--tag-border": palette["tag-border"],
      };
      
      Object.entries(map).forEach(([k, v]) => v && root.setProperty(k, v));
      
      if (isDark) {
        document.documentElement.classList.add("theme-dark");
        console.log("[theme] Mode dark activé");
      } else {
        document.documentElement.classList.remove("theme-dark");
        console.log("[theme] Mode light activé");
      }
      
      localStorage.setItem("cv-theme", isDark ? "dark" : "light");
    } catch (e) {
      console.warn("[theme]", e);
    }
  }

  // Initialiser le thème
  const savedTheme = localStorage.getItem("cv-theme");
  const configTheme = cfg?.theme?.mode || "light";
  const initialTheme = savedTheme || configTheme;
  applyTheme(initialTheme === "dark");

  // Écouteur du bouton toggle thème
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = !document.documentElement.classList.contains("theme-dark");
      themeToggle.classList.add("toggling");
      setTimeout(() => themeToggle.classList.remove("toggling"), 400);
      applyTheme(isDark);
    });
  }

  // 6) Gestion du bouton PDF avec traduction et jsPDF + html2canvas (TOUJOURS EN MODE LIGHT)
  const pdfButton = document.getElementById("pdf-download");
  const pdfButtonText = document.getElementById("pdf-button-text");
  
  if (pdfButton) {
    // Fonction pour mettre à jour le texte selon la langue
    const updatePdfText = () => {
      const lang = document.documentElement.getAttribute('lang') || 'fr';
      const translations = {
        fr: {
          text: 'Télécharger en PDF',
          title: 'Télécharger le CV en PDF',
          generating: 'Génération...',
          filename: 'CV_Remi_SEIDITA'
        },
        en: {
          text: 'Download as PDF',
          title: 'Download CV as PDF',
          generating: 'Generating...',
          filename: 'CV_Remi_SEIDITA'
        }
      };
      
      const t = translations[lang] || translations.fr;
      
      if (pdfButtonText) {
        pdfButtonText.textContent = t.text;
      }
      pdfButton.setAttribute('title', t.title);
      pdfButton.setAttribute('aria-label', t.title);
      pdfButton.dataset.filename = t.filename;
      pdfButton.dataset.generating = t.generating;
    };
    
    // Mettre à jour au chargement
    updatePdfText();
    
    // Observer les changements de langue
    const observer = new MutationObserver(updatePdfText);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['lang'] 
    });
    
    // Gestionnaire de clic avec jsPDF + html2canvas optimisé (FORCE MODE LIGHT)
    pdfButton.addEventListener("click", async () => {
      console.log("[pdf] Génération du PDF avec jsPDF + html2canvas...");
      
      // Animation du bouton et changement de texte
      pdfButton.classList.add("downloading");
      const originalText = pdfButtonText.textContent;
      pdfButtonText.textContent = pdfButton.dataset.generating || 'Génération...';
      pdfButton.disabled = true;
      
      // Variables pour la restauration
      let wasDarkMode = false;
      const controls = document.querySelector('.controls-floating');
      
      try {
        // Sauvegarder le thème actuel
        wasDarkMode = document.documentElement.classList.contains('theme-dark');
        
      // Forcer le mode light pour le PDF (plus professionnel)
      if (wasDarkMode) {
        document.documentElement.classList.remove('theme-dark');
        console.log("[pdf] Passage temporaire en mode light pour un PDF professionnel");
        
        // Forcer l'application du thème light
        applyTheme(false);
      }
        
      // Masquer les contrôles avant la capture
      if (controls) {
        controls.style.display = 'none';
      }

      // Forcer un reflow pour que le navigateur applique tous les changements CSS
      const element = document.querySelector('.container');
      void element.offsetHeight; // Force reflow

      // Délai plus long pour laisser le navigateur recalculer tous les styles
      await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log("[pdf] Génération du PDF en mode light");
        
        // Configuration optimale pour html2canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Haute résolution
          useCORS: true, // Pour charger les images externes (Gravatar)
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          imageTimeout: 0,
          allowTaint: true
        });
        
        // Restaurer les contrôles
        if (controls) {
          controls.style.display = '';
        }
        
      // Restaurer le thème dark si nécessaire
      if (wasDarkMode) {
        applyTheme(true); 
        console.log("[pdf] ✓ Thème dark restauré");
      }
        
        // Dimensions A4 en mm
        const pdfWidth = 210;
        const pdfHeight = 297;
        
        // Calculer les dimensions pour tenir sur une page
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        // Marges en mm
        const margin = 10;
        const availableWidth = pdfWidth - (2 * margin);
        const availableHeight = pdfHeight - (2 * margin);
        
        // Calculer les dimensions finales
        let imgWidth = availableWidth;
        let imgHeight = imgWidth / ratio;
        
        // Si l'image est trop haute, ajuster par la hauteur
        if (imgHeight > availableHeight) {
          imgHeight = availableHeight;
          imgWidth = imgHeight * ratio;
        }
        
        // Centrer l'image sur la page
        const xPos = (pdfWidth - imgWidth) / 2;
        const yPos = margin;
        
        // Créer le PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });
        
        // Convertir le canvas en image et l'ajouter au PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', xPos, yPos, imgWidth, imgHeight, '', 'FAST');
        
        // Télécharger le PDF
        const filename = `${pdfButton.dataset.filename || 'CV'}.pdf`;
        pdf.save(filename);
        
        console.log("[pdf] ✓ PDF généré avec succès - 1 page A4 en mode light");
        
      } catch (error) {
        console.error("[pdf] ✗ Erreur lors de la génération:", error);
        
        // Restaurer le thème même en cas d'erreur
        if (wasDarkMode) {
          applyTheme(true);
        }
        if (controls) {
          controls.style.display = '';
        }
        
        alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
      } finally {
        // Restaurer le bouton
        setTimeout(() => {
          pdfButton.classList.remove("downloading");
          pdfButtonText.textContent = originalText;
          pdfButton.disabled = false;
        }, 500);
      }
    });
  }

  // 7) Fonction d'application de la langue
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
      }

      // --- Rendu dynamique des EXPÉRIENCES ---
      const expContainer = document.getElementById("experience-list");
      if (expContainer && Array.isArray(dict.experience_items)) {
        expContainer.innerHTML = dict.experience_items.map(exp => `
          <div class="job">
            <h3>${exp.title} – <a href="${exp.link}" target="_blank">${exp.company}</a>
            <span class="where"> (${exp.years})</span></h3>
            <ul>${exp.details.map(d => `<li>${d}</li>`).join("")}</ul>
          </div>
        `).join("") + `
        <p style="color:var(--muted); font-size:12px; margin-top:3px;">${dict.experience_footer || ""}</p>`;
        console.log(`[i18n] ${dict.experience_items.length} expériences chargées en ${lang}`);
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
      
      // Mettre à jour l'URL avec le paramètre lang
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);

      console.log(`[i18n] ✓ Langue appliquée : ${lang}`);

    } catch (e) {
      console.warn("[i18n]", e);
    }
  }

  // 8) Initialisation
  const urlParams = new URLSearchParams(window.location.search);
  const langFromUrl = urlParams.get('lang');
  const isPrintMode = urlParams.get('print') === 'true';
  
  // Si mode impression, masquer les contrôles
  if (isPrintMode) {
    const controls = document.querySelector('.controls-floating');
    if (controls) {
      controls.style.display = 'none';
      controls.style.visibility = 'hidden';
      controls.style.opacity = '0';
    }
    console.log('[i18n] Mode impression activé - contrôles masqués');
  }
  
  // Priorité : URL > localStorage > config.yml
  const initial = langFromUrl || localStorage.getItem("cv-lang") || cfg.lang || "fr";
  
  if (langFromUrl) {
    localStorage.setItem("cv-lang", langFromUrl);
    console.log(`[i18n] Langue définie via URL : ${langFromUrl}`);
  }

  if (sel) {
    sel.value = initial;
    sel.addEventListener("change", (e) => applyLang(e.target.value));
  }

  // Applique la langue initiale
  applyLang(initial);
})();