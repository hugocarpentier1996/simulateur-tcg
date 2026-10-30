# Développement

- Communiquer en français et expliquer les étapes importantes.
- Documenter les contrats d'entrée/sortie des interfaces publiques : données attendues,
  résultats, refus et limites. Éviter les commentaires qui paraphrasent chaque ligne.
- TDD strict pour les comportements : écrire le test, constater un échec pertinent,
  implémenter le minimum, vérifier puis refactorer.
- Toutes les vérifications (format, lint, types, tests, build) doivent passer **avant** chaque
  commit. La CI GitHub est un contrôle de sécurité, pas un outil de test : ne jamais pousser
  pour découvrir un échec, ni laisser dans l'historique un commit dont la CI échoue.
- Lancer `pnpm check` après les modifications. Avec Docker :
  `docker compose run --rm dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm check"`.
- Moteur TypeScript pur : aucune dépendance UI, réseau ou base de données.
- Aucun hasard, temps ou identifiant non reproductible dans la simulation.
- Ne pas supposer exactement deux joueurs dans les structures de données.
- Construire des tranches fonctionnelles ; ne pas préconstruire tous les systèmes d'effets.
- Les règles confirmées sont dans `docs/regles.md`. Ne pas transformer une hypothèse en règle.

## Suivi et GitHub

- Au début d'une reprise, lire `docs/suivi.md`, `docs/regles.md` et l'état Git.
- À chaque étape fonctionnelle terminée et validée, mettre à jour `docs/suivi.md`
  avec le travail réalisé, les vérifications, les limites et les suites possibles.
  Une étape correspond à un changement cohérent, pas à chaque édition de fichier.
- Créer un commit descriptif puis pousser sur le dépôt distant configuré. L'utilisateur
  a autorisé ce suivi systématique : ne pas redemander à chaque étape.
- Vérifier la réussite du push et signaler le commit dans le compte rendu final.
  Si l'envoi échoue, conserver le travail et expliquer précisément ce qui reste local.
- Ne pas écraser de modifications tierces ni forcer un push. Ne pas présenter une étape
  incomplète ou des vérifications en échec comme un résultat validé.
