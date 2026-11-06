# Pont de validation DVWA vers YA CyberLab

Ce pont permet au serveur DVWA de certifier une réussite après son propre contrôle. Les cases à cocher de YA CyberLab ne valident plus les laboratoires DVWA : la progression DVWA reste « En attente d’un résultat signé » jusqu’à la réception d’un événement HMAC valide.

## 1. Secrets côté serveur

Générez un secret aléatoire d’au moins 32 octets et configurez **la même valeur** à deux endroits :

- Dans Supabase : **Project → Edge Functions → Manage Secrets**, nom `DVWA_EVENT_SECRET`.
- Dans la configuration privée de l’hébergement DVWA : `YA_CYBERLAB_DVWA_EVENT_SECRET`.

Ne mettez jamais cette valeur dans le code source servi au navigateur, dans Git, ou dans un paramètre d’URL. Configurez aussi `YA_CYBERLAB_SUPABASE_PUBLISHABLE_KEY` côté serveur DVWA avec la clé publishable du projet. Cette clé n’est pas le secret de signature.

## 2. Lier la session DVWA à un compte YA

Le pont attend l’UUID Supabase du compte apprenant dans `$_SESSION['ya_cyberlab_user_id']`. Cette valeur doit être définie par votre callback SSO serveur, après validation de l’identité fédérée et résolution du compte YA. Ne l’acceptez jamais depuis un formulaire, un cookie non signé, un paramètre d’URL ou le corps d’une requête navigateur.

Le compte doit déjà exister dans Supabase. La clé étrangère refusera les identifiants inconnus.

## 3. Installer la fonction PHP

Copiez `docs/dvwa-progress-bridge.php` dans un répertoire PHP privé de l’installation DVWA et chargez-le depuis les points de contrôle des exercices. Le serveur doit disposer de PHP cURL, d’une session DVWA active et d’un accès HTTPS sortant vers `tzwrbrydmgstlfkrqoug.supabase.co`.

Appelez `yaCyberLabReportCompletion('dvwa-sqli')` **uniquement après** le contrôle serveur qui établit la réussite du scénario, dans la version et le niveau de sécurité réellement utilisés. Ne déclenchez pas l’événement au simple chargement de la page, sur une réponse HTTP 200, ni à la réception d’une valeur du navigateur. Si le contrôle échoue, ne signalez pas de réussite.

Slugs acceptés :

| Lab | Slug signé |
| --- | --- |
| SQL Injection | `dvwa-sqli` |
| Cross-Site Scripting réfléchi | `dvwa-xss` |
| CSRF | `dvwa-csrf` |
| Contrôle d’accès / Weak ID | `dvwa-access` |

Insérez l’appel après le contrôle de réussite de chaque exercice correspondant, jamais dans un point d’entrée partagé qui recevrait des appels non validés. Faites d’abord le test sur un compte DVWA et un compte YA dédiés à la formation.

## 4. Vérification du flux

Le serveur PHP signe le corps exact avec HMAC-SHA256, un horodatage de courte durée et un identifiant d’événement unique. La fonction `dvwa-progress` vérifie la signature, l’horodatage, l’UUID, le slug autorisé et `completed: true`. Supabase refuse les événements rejoués, écrit l’événement et met à jour la progression dans une transaction. Le navigateur authentifié peut lire uniquement ses propres résultats certifiés ; il ne peut ni créer ni modifier ces résultats.

Après avoir terminé un exercice DVWA, revenez à YA CyberLab. Au retour de focus, la page recharge le résultat signé et affiche le pourcentage, le nombre d’événements acceptés et l’heure de la dernière réussite. Le compteur d’événements représente les notifications de réussite émises par DVWA, pas toutes les visites ou tentatives.

## Limite d’intégration

Le endpoint, la vérification de signature, la déduplication et le stockage Supabase sont préparés dans YA CyberLab. Le code spécifique de votre instance DVWA doit appeler le helper **après ses contrôles de réussite réels** et son SSO doit remplir la session apprenant comme décrit ci-dessus. Les fichiers DVWA de votre hébergement ne sont pas accessibles depuis ce projet ; tant que les hooks PHP ne sont pas installés, aucun résultat n’apparaîtra comme vérifié.
