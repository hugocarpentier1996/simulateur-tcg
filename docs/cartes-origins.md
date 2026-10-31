# Lot Origins demandé — 28 octobre 2026

Périmètre : 69 entrées demandées, dont 24 déjà raccordées depuis OGS et 45 nouvelles
entrées Origins ci-dessous. Source locale : `ListeCartes/OGN - Origins/cartes.json`.
Les images restent des URL de métadonnées ; les fichiers bruts ne sont pas publiés.

## Nouvelles entrées

- [x] Back to Back — ogn-206-298
- [x] Cannon Barrage — ogn-127-298
- [x] Confront — ogn-129-298
- [x] Crackshot Corsair — ogn-130-298
- [x] Daring Poro — ogn-210-298
- [x] Disintegrate — ogn-005-298
- [x] Dune Drake — ogn-131-298
- [x] Eager Apprentice — ogn-084-298
- [x] En Garde — ogn-046-298
- [x] Faithful Manufactor — ogn-211-298
- [x] Falling Comet — ogn-085-298
- [x] First Mate — ogn-132-298
- [x] Gust — ogn-169-298
- [x] Lecturing Yordle — ogn-087-298
- [x] Maddened Marauder — ogn-191-298
- [x] Meditation — ogn-048-298
- [x] Mega-Mech — ogn-088-298
- [x] Mobilize — ogn-134-298
- [x] Morbid Return — ogn-170-298
- [x] Mountain Drake — ogn-142-298
- [x] Mystic Poro — ogn-171-298
- [x] Noxian Drummer — ogn-222-298
- [x] Petty Officer — ogn-215-298
- [x] Playful Phantom — ogn-049-298
- [x] Pouty Poro — ogn-013-298
- [x] Ravenbloom Student — ogn-103-298
- [x] Sai Scout — ogn-174-298
- [x] Singularity — ogn-105-298
- [x] Sneaky Deckhand — ogn-176-298
- [x] Stalwart Poro — ogn-052-298
- [x] Stormclaw Ursine — ogn-137-298
- [x] Stupefy — ogn-095-298
- [x] Traveling Merchant — ogn-185-298
- [x] Vanguard Sergeant — ogn-219-298
- [x] Wielder of Water — ogn-055-298
- [x] Body Rune — ogn-126-298
- [x] Calm Rune — ogn-042-298
- [x] Chaos Rune — ogn-166-298
- [x] Fury Rune — ogn-007-298
- [x] Mind Rune — ogn-089-298
- [x] Order Rune — ogn-214-298
- [x] Fortified Position — ogn-279-298
- [x] Startipped Peak — ogn-288-298
- [x] Trifarian War Camp — ogn-294-298
- [x] Void Gate — ogn-296-298

## Précisions de ce lot

- « Open battlefield » : entièrement vide. L'exception ajoute cette destination aux
  destinations normales (base propre et battlefield contrôlé), sans les remplacer.
- Eager Apprentice ne change pas le seuil de déclenchement Lux/Lady : coût imprimé.
- Deflect confirmé : 1 Power quelconque par choix adverse, pas pour une zone sans choix individuel.
- Réutiliser les tests de mécanismes communs ; nouveaux tests centrés sur les données
  de carte et les interactions réellement nouvelles. Commit/push après chaque carte.
- Cette liste entière est autorisée ; reprendre la prochaine entrée non cochée dont
  la règle est claire. Ne pas annoncer le lot terminé avant 45/45 nouvelles entrées.

## Fournée 1 terminée (10 cartes)

Daring Poro, Petty Officer, Stalwart Poro, Mega-Mech, Mountain Drake, Playful Phantom,
Vanguard Sergeant, Falling Comet, Ravenbloom Student et Wielder of Water.
Bilan : 34/69 entrées demandées raccordées (24 OGS + 10 Origins), 35 restantes.
Les cartes restent hors decks de démonstration. Questions : [questions-origins.md](questions-origins.md).
La demande courante s'arrête à dix cartes, puis réponse groupée aux questions.

## Fournée 3 — périmètre révisé le 29 octobre 2026

L’utilisateur demande maintenant toutes les cartes restantes sauf les quatre battlefields.
21 entrées supplémentaires implémentées : les six runes et quinze cartes de main.
Bilan : 65/69 entrées raccordées ; seuls Fortified Position, Startipped Peak,
Trifarian War Camp et Void Gate restent volontairement hors de cette fournée.
Les cartes restent hors decks de démonstration. Les choix provisoires sont consignés
dans questions-origins.md.

## Champs intégrés — 29 octobre 2026

Demande étendue aux quatre champs : Fortified Position, Startipped Peak, Trifarian
War Camp et Void Gate sont maintenant raccordés. Bilan final : **69/69 entrées**,
dont les 45 nouvelles définitions Origins. Les configurations fournissent le catalogue
dans `battlefieldDefinitions` ; les trois candidats de chaque joueur restent dans
`players[].battlefields`. BO1 et BO3 conservent leurs règles de sélection existantes.

Les deux bonus continus se calculent sur la position actuelle. Fortified Position
déclenche un choix avant réactions ; le Shield expire avec le combat. Startipped Peak
ouvre les réactions en Beginning puis propose son Channel facultatif à la résolution,
avant le Channel normal. Les nouveaux choix sont disponibles dans `getLegalActions`.

## Extension Origins complète

Cartes ajoutées une à une depuis le 31 octobre 2026, chacune testée et commitée.

- [x] Shipyard Skulker — ogn-175-298
- [x] Hextech Ray — ogn-009-298
- [x] Void Seeker — ogn-024-298
- [x] Primal Strength — ogn-154-298
- [x] Rune Prison — ogn-050-298
- [x] Discipline — ogn-058-298
- [x] Smoke Screen — ogn-093-298
- [x] Progress Day — ogn-114-298
- [x] Sunlit Guardian — ogn-054-298
- [x] Catalyst of Aeons — ogn-138-298
- [x] Vengeance — ogn-229-298
- [x] Rebuke — ogn-172-298
- [x] Grand Strategem — ogn-233-298
- [x] Challenge — ogn-128-298
- [x] Whiteflame Protector — ogn-082-298
- [x] Riptide Rex — ogn-092-298
- [x] Solari Shieldbearer — ogn-051-298
- [x] Harnessed Dragon — ogn-234-298
- [x] Zaunite Bouncer — ogn-188-298
- [x] Solari Chief — ogn-225-298
- [x] Carnivorous Snapvine — ogn-149-298
- [x] Watchful Sentry — ogn-096-298
- [x] Soaring Scout — ogn-216-298
- [x] Machine Evangel — ogn-239-298
- [x] Kog'Maw — ogn-190-298
- [x] Seal of Rage — ogn-040-298
- [x] Seal of Focus — ogn-081-298
- [x] Seal of Insight — ogn-120-298
- [x] Seal of Strength — ogn-163-298
- [x] Seal of Discord — ogn-204-298
- [x] Seal of Unity — ogn-245-298
- [x] Energy Conduit — ogn-098-298
- [x] Anivia — ogn-148-298
- [x] Warwick — ogn-159-298
- [x] Ahri — ogn-066-298
- [x] Legion Rearguard — ogn-010-298
