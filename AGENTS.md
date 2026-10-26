# Développement

- Communiquer en français et expliquer les étapes importantes.
- Documenter les contrats d'entrée/sortie des interfaces publiques : données attendues,
  résultats, refus et limites. Éviter les commentaires qui paraphrasent chaque ligne.
- TDD strict pour les comportements : écrire le test, constater un échec pertinent,
  implémenter le minimum, vérifier puis refactorer.
- Lancer `pnpm check` après les modifications. Avec Docker :
  `docker compose run --rm dev sh -c "pnpm install --frozen-lockfile --store-dir /pnpm/store && pnpm check"`.
- Moteur TypeScript pur : aucune dépendance UI, réseau ou base de données.
- Aucun hasard, temps ou identifiant non reproductible dans la simulation.
- Ne pas supposer exactement deux joueurs dans les structures de données.
- Construire des tranches fonctionnelles ; ne pas préconstruire tous les systèmes d'effets.
- Les règles confirmées sont dans `docs/regles.md`. Ne pas transformer une hypothèse en règle.
