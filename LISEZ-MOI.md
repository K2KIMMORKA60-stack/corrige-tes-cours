# Corrige tes cours

Application installable (téléphone et PC) qui montre :
- si le pétrole (ou l'or, le dollar, le Nasdaq…) monte ou baisse aujourd'hui ;
- quelles actions, indices, secteurs, devises et cryptos montent avec lui, et lesquels vont à l'inverse ;
- les « familles » de marchés qui bougent ensemble ;
- la règle de confirmation : acheter ou vendre seulement quand trois marchés liés vont dans le même sens (or, argent, platine, pétrole, cuivre, blé).

130 marchés du monde entier. Données gratuites : Yahoo Finance (clôtures journalières), sans clé.

## Fichiers
- `index.html`, `style.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `icons/` : l'application.
- `data/marche.json` : les cours. Ici ce sont des données d'EXEMPLE (simulées).
- `scripts/univers.py` : la liste des marchés suivis (on peut en ajouter).
- `scripts/recuperer_donnees.py` : télécharge les vrais cours.
- `.github/workflows/cours.yml` : sur GitHub, met à jour les cours toutes les 2 h et publie l'application.

## Mise en ligne (GitHub Pages)
1. Mettre ces fichiers dans un dépôt GitHub.
2. Réglages du dépôt > Pages > Source : « GitHub Actions ».
3. Les vrais cours se chargent tout seuls au premier passage.
