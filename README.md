# CV en ligne

Mon CV personnel en HTML/CSS/JS, hébergé sur GitHub Pages.

→ [https://meries.github.io/cv/](https://meries.github.io/cv/)

## Fonctionnalités

- Multi-langues (FR/EN) via sélecteur en bas à droite
- Thème clair/sombre configurable
- Tout le contenu dans `config.yml`
- Responsive (mobile, tablette, desktop, print)
- URLs avec paramètres : `?lang=en` et `?print=true`

## Structure

```
cv/
├── index.html          # Structure du CV
├── stylesheet.css      # Styles
├── cv.js              # Traduction et génération dynamique
├── config.yml         # Contenu et configuration
└── assets/flags/      # Drapeaux SVG
```

## Utilisation locale

```bash
git clone https://github.com/meries/cv.git
cd cv
python3 -m http.server 8000
```

Puis ouvrir [http://localhost:8000](http://localhost:8000)

## Configuration

Tout se configure dans `config.yml` :

- **Langue par défaut** : `lang: fr`
- **Thème** : `mode: light` ou `mode: dark`
- **Couleurs** : sections `palette` et `palette_dark`
- **Contenu** : section `i18n` avec traductions FR/EN

### Exemple d'ajout de contenu

```yaml
i18n:
  fr:
    skills_items:
      - title: "DevOps & Infrastructure as Code"
        level: 90
        chips:
          - AWS
          - Terraform
```

### Changer le thème

Dans `config.yml`, changer `mode: light` en `mode: dark`.

### Ajouter une langue

1. Ajouter dans `languages` :
```yaml
languages:
  - code: es
    label: ES
    flag: "🇪🇸"
```

2. Ajouter les traductions dans `i18n.es`

## Paramètres URL

- `?lang=fr` ou `?lang=en` : Force la langue
- `?print=true` : Masque le sélecteur (pour export PDF)
- Combinaison possible : `?lang=en&print=true`

## Export PDF

Utiliser un convertisseur comme [pdfcrowd.com](https://pdfcrowd.com) avec l'URL :
```
https://meries.github.io/cv/?lang=en&print=true
```

## Déploiement

Push sur `main` déploie automatiquement via GitHub Pages.

```bash
git add .
git commit -m "update CV"
git push
```

## Tests

GitHub Actions valide le HTML à chaque push (sauf sur `main`).

## Dépendances

Une seule : [js-yaml](https://github.com/nodeca/js-yaml) (chargé via CDN) pour parser le `config.yml`.

## Licence

Libre d'utilisation. Pensez à personnaliser le contenu.

## Contact

Rémi SEIDITA  
[LinkedIn](https://www.linkedin.com/in/remi-seidita-40b38915a) • seidita.remi.perso@gmail.com