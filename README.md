# FM26

Prototype de simulation de management football en une seule page, conçu pour GitHub Pages.

## Fonctions incluses

- Création du manager : prénom, nom, nationalité, réputation, style et formation.
- Sélection d'une compétition puis d'un club.
- Tableau de bord de manager avec boîte mail à gauche.
- Rapports de comité de direction, scouting, matchs, supporters et mercato.
- Effectif avec forme, moral, statistiques et conversations joueur.
- Conversations "IA simulée" avec réponses contextuelles basées sur la personnalité.
- Tactique : formation, mentalité, tempo, pressing, ligne défensive et largeur.
- Marché des transferts avec offres et budget.
- Calendrier et résultats.
- Moteur de match simulé : buts, occasions, fautes, cartons jaunes, cartons rouges, changements, blessures, possession, tirs et corners.
- Conférences de presse et effets sur direction / supporters.
- Réputation et historique de carrière.
- Système narratif d'héritage : après 3 Ligues des champions simulées, le stade prend le nom du manager.
- Sauvegarde locale dans le navigateur.

## Déploiement

Dans GitHub : Settings → Pages → Deploy from branch → main → /(root).

La version actuelle ne dépend d'aucune API externe, donc elle fonctionne en statique. Les conversations de joueurs sont des simulations locales ; aucune clé d'API n'est stockée côté navigateur.
