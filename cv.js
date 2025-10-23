// cv.js - Avec custom select pour drapeaux SVG (version robuste avec fallback)
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

  // Fonction helper pour obtenir le chemin du drapeau SVG
  function getFlagPath(lang) {
    const flagMap = {
      'fr': 'assets/flags/fr.svg',
      'en': 'assets/flags/gb.svg'
    };
    
    // Si c'est déjà un chemin de fichier valide, le retourner
    if (lang.flag && (lang.flag.endsWith('.svg') || lang.flag.startsWith('assets/'))) {
      return lang.flag;
    }
    
    // Sinon utiliser le mapping basé sur le code de langue
    return flagMap[lang.code] || 'assets/flags/fr.svg';
  }

  // 4) Génération dynamique du custom select de langues avec drapeaux SVG
  const langContainer = document.getElementById("lang-select-container");
  
  if (langContainer && Array.isArray(cfg.languages) && cfg.languages.length > 0) {
    // Créer le custom select
    const customSelect = document.createElement("div");
    customSelect.className = "custom-select";
    customSelect.id = "lang-select";
    
    // Bouton principal
    const selectBtn = document.createElement("button");
    selectBtn.className = "select-button";
    selectBtn.setAttribute("aria-label", "Choisir la langue");
    selectBtn.setAttribute("aria-haspopup", "listbox");
    selectBtn.setAttribute("aria-expanded", "false");
    
    // Contenu du bouton (sera mis à jour)
    selectBtn.innerHTML = '<span class="select-content"></span><span class="select-arrow">▼</span>';
    
    // Liste des options
    const optionsList = document.createElement("div");
    optionsList.className = "select-options";
    optionsList.setAttribute("role", "listbox");
    
    cfg.languages.forEach((lang, index) => {
      const flagPath = getFlagPath(lang);
      console.log(`[i18n] Langue ${lang.code}: flag path = ${flagPath}`);
      
      const option = document.createElement("button");
      option.className = "select-option";
      option.setAttribute("role", "option");
      option.setAttribute("data-value", lang.code);
      option.innerHTML = `
        <img src="${flagPath}" alt="${lang.label}" class="flag-icon" onerror="console.error('Flag not found:', this.src)">
        <span>${lang.label}</span>
      `;
      
      option.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        applyLang(lang.code);
        updateSelectButton(lang);
        closeSelect();
      });
      
      optionsList.appendChild(option);
    });
    
    customSelect.appendChild(selectBtn);
    customSelect.appendChild(optionsList);
    langContainer.appendChild(customSelect);
    
    // Fonction pour mettre à jour le bouton
    function updateSelectButton(lang) {
      const content = selectBtn.querySelector('.select-content');
      const flagPath = getFlagPath(lang);
      content.innerHTML = `
        <img src="${flagPath}" alt="${lang.label}" class="flag-icon" onerror="console.error('Flag not found:', this.src)">
        <span>${lang.label}</span>
      `;
      
      // Mettre à jour l'état sélectionné
      optionsList.querySelectorAll('.select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === lang.code);
      });
    }
    
    // Fonction pour ouvrir/fermer le select
    function toggleSelect() {
      const isOpen = customSelect.classList.toggle('open');
      selectBtn.setAttribute('aria-expanded', isOpen);
    }
    
    function closeSelect() {
      customSelect.classList.remove('open');
      selectBtn.setAttribute('aria-expanded', 'false');
    }
    
    // Events
    selectBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSelect();
    });
    
    // Fermer si on clique ailleurs
    document.addEventListener("click", (e) => {
      if (!customSelect.contains(e.target)) {
        closeSelect();
      }
    });
    
    // Initialiser avec la langue par défaut
    const initialLang = cfg.languages.find(l => l.code === (localStorage.getItem("cv-lang") || cfg.lang || "fr")) || cfg.languages[0];
    updateSelectButton(initialLang);
    
    console.log('[i18n] Custom select créé avec drapeaux SVG');
  } else if (langContainer) {
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
      console.log("[pdf] Génération du PDF avec jsPDF + html2canvas HAUTE QUALITÉ...");
      
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
        
        console.log("[pdf] Génération du PDF en mode light HAUTE QUALITÉ");
        
        // Configuration OPTIMISÉE pour HAUTE QUALITÉ
        const canvas = await html2canvas(element, {
          scale: 4, // TRÈS HAUTE RÉSOLUTION (x4 au lieu de x2)
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          imageTimeout: 0,
          allowTaint: true,
          // Options supplémentaires pour améliorer la qualité
          letterRendering: true, // Améliore le rendu du texte
          removeContainer: false,
          foreignObjectRendering: false, // Meilleur rendu des polices
          onclone: (clonedDoc) => {
            // Forcer le rendu optimal des polices et des images
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * {
                -webkit-font-smoothing: antialiased !important;
                -moz-osx-font-smoothing: grayscale !important;
                text-rendering: optimizeLegibility !important;
                image-rendering: -webkit-optimize-contrast !important;
                image-rendering: crisp-edges !important;
              }
              img {
                image-rendering: high-quality !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        
        console.log(`[pdf] Canvas généré: ${canvas.width}x${canvas.height}px (scale 4)`);
        
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
        
        // Créer le PDF SANS COMPRESSION
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: false, // DÉSACTIVER LA COMPRESSION pour meilleure qualité
          precision: 16, // Précision maximale
          userUnit: 1.0
        });
        
        // Convertir le canvas en PNG (meilleure qualité que JPEG)
        const imgData = canvas.toDataURL('image/png'); // PNG au lieu de JPEG
        
        // Ajouter l'image au PDF avec alias NONE pour désactiver l'anti-aliasing
        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'NONE');
        
        // Télécharger le PDF
        const filename = `${pdfButton.dataset.filename || 'CV'}.pdf`;
        pdf.save(filename);
        
        console.log("[pdf] ✓ PDF HAUTE QUALITÉ généré avec succès (PNG, scale x4, sans compression)");
        
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

      // Mettre à jour le custom select
      const currentLang = cfg.languages.find(l => l.code === lang);
      if (currentLang) {
        const selectBtn = document.querySelector('.select-button');
        if (selectBtn) {
          const content = selectBtn.querySelector('.select-content');
          if (content) {
            const flagPath = getFlagPath(currentLang);
            content.innerHTML = `
              <img src="${flagPath}" alt="${currentLang.label}" class="flag-icon" onerror="console.error('Flag not found:', this.src)">
              <span>${currentLang.label}</span>
            `;
          }
        }
        
        // Mettre à jour l'état sélectionné dans la liste
        document.querySelectorAll('.select-option').forEach(opt => {
          opt.classList.toggle('selected', opt.dataset.value === lang);
        });
      }
      
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

  // Applique la langue initiale
  applyLang(initial);
})();