export type LessonConcept = {
  introduction: string;
  scenario: string;
  risk: string;
  steps: [string, string, string, string];
  defense: string;
  takeaway: string;
};

export const lessonConcepts: Record<string, LessonConcept> = {
  'SQL Injection': {
    introduction: 'Une injection SQL survient quand une application assemble une requête à partir de texte contrôlé par l’utilisateur. La base de données peut alors confondre une valeur de recherche avec une partie de l’instruction.',
    scenario: 'Imaginez une boutique de démonstration : une personne saisit un nom de produit, le serveur prépare une recherche et la base renvoie les résultats.',
    risk: 'Si les données et la syntaxe SQL sont concaténées, une entrée inattendue peut changer le sens de la requête et exposer ou modifier des informations.',
    steps: ['Le visiteur saisit un terme de recherche.', 'Le serveur insère ce texte dans une requête dynamique.', 'La base interprète la donnée comme une partie de l’instruction.', 'Une requête paramétrée garde la saisie au rang de simple valeur.'],
    defense: 'Paramétrez les requêtes avec le pilote de base de données. Les vérifications de format apportent une aide supplémentaire, mais ne remplacent pas cette séparation.',
    takeaway: 'Les données envoyées par un utilisateur ne doivent jamais pouvoir redéfinir la structure d’une requête.'
  },
  'Cross-Site Scripting (XSS)': {
    introduction: 'Le XSS apparaît lorsqu’une donnée contrôlée par un utilisateur est réaffichée dans une page comme du code interprétable par le navigateur plutôt que comme du texte.',
    scenario: 'Dans un forum fictif, une personne publie un commentaire. D’autres membres ouvrent la discussion et leur navigateur affiche ce contenu.',
    risk: 'Un affichage non échappé peut exécuter du contenu dans le contexte du site et agir avec les privilèges de la session de la victime.',
    steps: ['Un membre soumet un commentaire.', 'L’application conserve ou transmet le contenu.', 'Le navigateur reçoit la page et interprète le contenu inséré.', 'Un rendu échappé affiche le commentaire comme du texte inerte.'],
    defense: 'Encodez la sortie selon le contexte HTML, utilisez les API de rendu texte de votre framework et assainissez explicitement les rares contenus HTML autorisés. Une CSP ajoute une défense complémentaire.',
    takeaway: 'C’est au moment du rendu que le contexte compte : une donnée non fiable doit rester une donnée, jamais devenir du code.'
  },
  'Contrôle d’accès brisé': {
    introduction: 'L’authentification répond à « qui êtes-vous ? ». Le contrôle d’accès répond à « avez-vous le droit d’effectuer cette action sur cet objet précis ? ». Confondre les deux laisse des ressources accessibles.',
    scenario: 'Une personne connectée consulte un dossier. Le navigateur transmet un identifiant et l’API doit vérifier que ce dossier appartient bien à son périmètre.',
    risk: 'Un identifiant prévisible ou simplement modifié peut conduire à lire, modifier ou supprimer les données d’un autre compte si le serveur vérifie uniquement la connexion.',
    steps: ['La personne se connecte à l’application.', 'Le navigateur demande une ressource identifiée.', 'Le serveur vérifie uniquement la session, sans vérifier le propriétaire.', 'Une règle d’autorisation par ressource refuse l’accès non permis.'],
    defense: 'Vérifiez les permissions côté serveur pour chaque objet et chaque opération. Refusez par défaut et ne considérez jamais un identifiant difficile à deviner comme une autorisation.',
    takeaway: 'Une session valide n’accorde pas automatiquement l’accès à toutes les ressources.'
  },
  'Sécurité des mots de passe': {
    introduction: 'Un mot de passe est un secret d’authentification. Le stockage doit empêcher qu’une fuite de base de données ne révèle les secrets originaux.',
    scenario: 'Lors d’une inscription, le serveur reçoit un mot de passe, le transforme avant stockage puis compare un dérivé lors des connexions ultérieures.',
    risk: 'Un stockage en clair ou avec un hachage trop rapide permet à un attaquant ayant obtenu la base de retrouver rapidement de nombreux mots de passe.',
    steps: ['La personne choisit un mot de passe.', 'Le serveur calcule un hachage adaptatif avec un sel unique.', 'La base conserve uniquement le dérivé, jamais le secret en clair.', 'À la connexion, le même procédé vérifie le mot de passe sans le stocker.'],
    defense: 'Utilisez Argon2id, scrypt ou bcrypt correctement configuré, un sel distinct par mot de passe, la limitation des tentatives et la MFA pour les comptes sensibles.',
    takeaway: 'Un hachage de mot de passe doit être lent à calculer et impossible à inverser directement.'
  },
  'CSRF : requête forgée': {
    introduction: 'Le CSRF exploite le fait qu’un navigateur joint automatiquement les cookies d’un site à certaines requêtes. Un site tiers peut tenter de déclencher une action dans la session déjà ouverte.',
    scenario: 'Une personne est connectée à un service et visite ensuite une page externe. Cette page tente d’amener son navigateur à envoyer une requête de modification.',
    risk: 'Sans preuve que la requête provient bien du formulaire légitime, une action peut être effectuée avec les cookies de la victime.',
    steps: ['La personne ouvre une session sur le service.', 'Un site tiers provoque une requête vers ce service.', 'Le navigateur joint automatiquement le cookie de session.', 'Le serveur exige un jeton imprévisible et rejette la requête forgée.'],
    defense: 'Protégez les actions qui modifient l’état avec des jetons anti-CSRF imprévisibles, des cookies SameSite adaptés et, selon le contexte, une vérification d’origine.',
    takeaway: 'Un cookie valide prouve une session, pas l’intention de l’utilisateur pour chaque action.'
  },
  'SSRF : requêtes côté serveur': {
    introduction: 'Une SSRF survient quand un serveur récupère une URL contrôlée par un utilisateur sans limiter les destinations. Le serveur peut alors joindre des ressources que l’utilisateur ne peut pas atteindre directement.',
    scenario: 'Un service de prévisualisation reçoit une adresse à récupérer. Il doit décider si cette destination publique est autorisée avant toute connexion.',
    risk: 'Un accès involontaire à des réseaux privés ou à des métadonnées cloud peut révéler des ressources internes et des secrets.',
    steps: ['L’utilisateur fournit une adresse à prévisualiser.', 'Le serveur résout et vérifie la destination.', 'Une validation trop permissive autorise une cible interne.', 'Une allowlist et un filtrage réseau bloquent la destination non autorisée.'],
    defense: 'Préférez une allowlist d’hôtes et de schémas, revalidez les redirections et les résolutions DNS, et bloquez les plages internes au niveau réseau.',
    takeaway: 'Une URL est une instruction réseau : le serveur doit restreindre strictement où il accepte de se connecter.'
  },
  'JWT : valider les jetons': {
    introduction: 'Un JWT transporte des claims signés, mais son contenu encodé n’est pas secret par défaut. Le serveur doit vérifier la signature et les règles attendues avant d’en utiliser les informations.',
    scenario: 'Une application reçoit un jeton lors d’une requête. Elle doit confirmer son authenticité, son émetteur, son audience et sa durée de validité.',
    risk: 'Un jeton simplement décodé, expiré ou destiné à un autre service peut être accepté à tort et accorder des privilèges.',
    steps: ['Le client présente un jeton.', 'Le serveur choisit la politique de validation attendue.', 'Les claims non vérifiés sont utilisés trop tôt.', 'Signature, algorithme, émetteur, audience et expiration sont vérifiés.'],
    defense: 'Utilisez une bibliothèque éprouvée, imposez explicitement les algorithmes autorisés et validez tous les claims nécessaires avant toute décision d’accès.',
    takeaway: 'Décoder un jeton ne signifie pas lui faire confiance.'
  },
  'Traversée de répertoires': {
    introduction: 'Une traversée de répertoires se produit lorsqu’un chemin contrôlé par l’utilisateur permet de sortir du dossier prévu par l’application.',
    scenario: 'Un service de téléchargement cherche un fichier pédagogique dans un répertoire dédié à partir d’un nom fourni par le navigateur.',
    risk: 'Une résolution de chemin insuffisamment contrôlée peut exposer des fichiers de configuration, des données privées ou des secrets locaux.',
    steps: ['L’utilisateur demande un fichier par son nom.', 'Le serveur construit un chemin sur le système.', 'Le chemin n’est pas normalisé ni confiné au répertoire autorisé.', 'Le serveur résout le chemin canonique et vérifie son répertoire parent.'],
    defense: 'Évitez les chemins arbitraires. Utilisez des identifiants internes, normalisez le chemin final, vérifiez son confinement et limitez les permissions du processus.',
    takeaway: 'Validez le chemin résolu, pas uniquement la chaîne saisie.'
  },
  'Prompt injection': {
    introduction: 'Une prompt injection cherche à faire traiter un contenu non fiable comme une instruction de contrôle par un système d’IA. Le modèle peut être influencé par du texte reçu directement ou trouvé dans un document.',
    scenario: 'Un assistant résume un document fourni par une personne et dispose aussi d’outils limités. Il doit résumer le document sans suivre les instructions qu’il contient.',
    risk: 'Si les instructions et les données sont confondues, le modèle peut divulguer des informations de contexte ou demander une action non prévue.',
    steps: ['L’utilisateur transmet une question et un document.', 'Le système assemble le contexte destiné au modèle.', 'Le document contient une instruction qui tente de détourner la tâche.', 'Des contrôles externes limitent les outils et vérifient chaque action.'],
    defense: 'Traitez les documents comme des données non fiables, limitez les outils au strict nécessaire et exigez une autorisation indépendante avant toute action sensible.',
    takeaway: 'Un prompt ne remplace jamais un contrôle d’accès : les décisions sensibles doivent être vérifiées hors du modèle.'
  },
  'Sécurité des API': {
    introduction: 'Une API expose des données et des actions au-delà de l’interface visible. Chaque requête doit être considérée comme modifiable par son appelant.',
    scenario: 'Une application mobile demande des informations de profil. Le serveur contrôle les champs reçus, l’identité, les droits sur l’objet et la quantité de données renvoyée.',
    risk: 'Une validation faible ou une autorisation manquante peut exposer des propriétés privées, permettre des actions non permises ou épuiser les ressources.',
    steps: ['Le client envoie une requête avec ses paramètres.', 'L’API valide le schéma et authentifie l’appelant.', 'Une permission d’objet ou de champ est oubliée.', 'L’API applique les règles d’accès, limite l’usage et filtre sa réponse.'],
    defense: 'Définissez des schémas d’entrée et de sortie, contrôlez l’autorisation objet par objet, limitez le débit et exposez uniquement les propriétés nécessaires.',
    takeaway: 'Une route masquée dans l’interface reste accessible tant que le serveur ne la protège pas.'
  },
  'Mauvaise configuration cloud': {
    introduction: 'Une mauvaise configuration cloud rend parfois publiques des ressources ou accorde des permissions trop larges. Les réglages par défaut et les évolutions rapides augmentent ce risque.',
    scenario: 'Une équipe déploie un espace de stockage destiné à une application. La politique d’accès doit autoriser uniquement le service et les personnes qui en ont besoin.',
    risk: 'Des données peuvent devenir accessibles sur Internet, des identifiants privilégiés être utilisés abusivement ou des services internes exposés.',
    steps: ['Une équipe déclare une ressource cloud.', 'Une politique de partage ou un rôle est configuré.', 'Une permission large rend la ressource accessible au-delà du besoin.', 'Des règles de moindre privilège et des contrôles de dérive détectent l’écart.'],
    defense: 'Privilégiez les ressources privées par défaut, des rôles dédiés, l’infrastructure comme code revue et une surveillance des changements de configuration.',
    takeaway: 'La sécurité cloud dépend des permissions effectives, pas seulement du fournisseur choisi.'
  },
  'Détection réseau : MITM': {
    introduction: 'Une attaque de type homme-du-milieu interpose un acteur entre deux parties qui communiquent. Le chiffrement seul ne suffit pas si l’identité du correspondant n’est pas vérifiée.',
    scenario: 'Un navigateur se connecte à un service via un réseau partagé. Il doit authentifier le serveur et refuser toute connexion dont le certificat n’est pas valide.',
    risk: 'Un intermédiaire peut observer ou altérer des échanges lorsque le canal n’est pas chiffré ou que les certificats sont acceptés sans vérification.',
    steps: ['Le navigateur initie une connexion au service.', 'Un intermédiaire se trouve sur le chemin réseau.', 'L’identité du serveur n’est pas vérifiée correctement.', 'TLS avec validation de certificat protège l’authenticité du canal.'],
    defense: 'Utilisez TLS moderne, vérifiez le nom d’hôte et la chaîne de certificats, refusez les erreurs de certificat et segmentez les réseaux sensibles.',
    takeaway: 'Un canal sécurisé doit garantir à la fois le chiffrement et l’identité de son destinataire.'
  }
};

export function getLessonConcept(title: string): LessonConcept {
  return lessonConcepts[title] ?? lessonConcepts['SQL Injection'];
}
