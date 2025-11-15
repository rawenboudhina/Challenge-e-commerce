# 🛒 TechZone

## 📖 Description du projet

**TechZone** est une application web de commerce électronique moderne développée avec **Angular** dans le cadre du *Challenge Front-End 2025*. Elle offre une **expérience d’achat fluide, rapide et responsive**, tout en appliquant les meilleures pratiques front-end : *routing modulaire*, *lazy loading*, *RxJS pour la gestion d’état*, *intercepteurs HTTP*, et *gestion centralisée des erreurs*. L’application combine intelligemment **l’API publique [DummyJSON](https://dummyjson.com/)** pour les produits et un **fichier db.json interne** pour enrichir les données simulées (stocks, caractéristiques, avis clients, etc.). Cette architecture hybride permet de démontrer la gestion complète d’un e-commerce sans backend réel.

### 🎯 Objectifs pédagogiques
- Concevoir et développer une **application responsive** moderne.
- Maîtriser le framework **Angular 20** et ses bonnes pratiques.
- Implémenter une **navigation fluide et intuitive**.
- Gérer efficacement **l’état de l’application**.
- Offrir une **expérience utilisateur claire et cohérente**.

### 🧩 Valeur ajoutée du projet
TechZone illustre une **architecture front-end réaliste** combinant appels API et données locales. C’est une base solide pour tout futur projet e-commerce complet : intégration d’un backend, authentification réelle, ou gestion des paiements.

## 🧰 Technologies utilisées

### 🔹 Framework principal
- **Angular 20** – Framework front-end choisi pour sa structure modulaire, sa gestion réactive via RxJS et son CLI performant.
- **TypeScript** – Langage fortement typé pour une meilleure maintenabilité et lisibilité du code.

### 🔹 Styling & Design
- **SCSS (SASS)** – Préprocesseur CSS utilisé pour structurer et factoriser le style (mixins, variables, nesting).

### 🔹 Gestion de l’état & des données
- **RxJS / Services Angular** – Gestion réactive des flux de données et communication entre composants.
- **DummyJSON API** – Fournit les données principales (produits, catégories, prix, images).
- **Fichier db.json interne** – Ajout de données locales enrichies : stock, caractéristiques techniques, avis, etc.
- **localStorage** – Persistance du panier et de la session utilisateur.

### 🔹 Outils & environnement
- **Node.js / npm** – Installation et gestion des dépendances.
- **Angular CLI** – Outil de génération et de compilation du projet.
- **Git / GitHub** – Gestion de version et hébergement du code source.

### 🔹 Bonus techniques (optionnels)
- **Animations Angular** – Pour les transitions entre pages et les loaders.
- **Responsive Design** – Adaptation complète sur mobile, tablette et desktop.
- **Validation Reactive Forms** – Pour l’inscription et la connexion avec messages d’erreur dynamiques.

## ⚙️ Instructions d'installation et de lancement

### 1️⃣ Cloner le projet
Commence par cloner le dépôt GitHub sur ta machine :
```bash
git clone https://github.com/rawenboudhina/Challenge-e-commerce.git
```

### 2️⃣ Installer les dépendances
Installe toutes les dépendances nécessaires avec npm :
```bash
npm install
```

### 3️⃣ Lancer le serveur de développement
Démarre le projet en mode développement :
```bash
ng serve
```
Une fois le serveur lancé, ouvre ton navigateur à l’adresse : `http://localhost:4200/`
L’application se recharge automatiquement à chaque modification du code source.

### 4️⃣ Générer une version de production
Pour créer une version optimisée prête à être déployée :
```bash
ng build --configuration production
```
Les fichiers générés se trouvent dans le dossier dist/.

### 5️⃣ Déploiement sur Vercel
npm install -g vercel
vercel


## 🚀 Démo en ligne

https://techzone-n39ld4y5j-rawenboudhinas-projects.vercel.app/


### 🧩 Organisation modulaire
Chaque fonctionnalité principale est développée dans un **module indépendant**, avec ses propres composants, services et styles. Cette approche favorise la **maintenabilité**, la **réutilisabilité** et la **clarté du code**.

### 🔄 Communication entre composants
- Les **services Angular** (comme `ProductService` ou `CartService`) assurent la gestion centralisée de l’état et la communication entre les pages.
- L’utilisation d’**RxJS** permet une synchronisation en temps réel entre les vues (par exemple, mise à jour du panier).

## ✨ Fonctionnalités implémentées
L’application **TechZone** respecte toutes les fonctionnalités **obligatoires** du challenge, ainsi que plusieurs **améliorations bonus**.

### 🏠 Page d’accueil
- Carousel / slider présentant les **produits en promotion** ou **nouveautés**.
- Affichage des **catégories de produits** sous forme de cartes cliquables.
- Section de **produits vedettes** (minimum 8 produits).
- Barre de **recherche fonctionnelle** permettant de filtrer les produits par nom.
- Navigation principale dynamique avec redirection vers les différentes pages.

### 🛍️ Catalogue de produits
- Grille de produits avec :
  - Image, nom, prix, note (étoiles), et bouton **“Ajouter au panier”**.
- **Filtres dynamiques** :
  - Par catégorie
  - Par plage de prix
  - Par note d’évaluation
- **Tri** :
  - Prix croissant / décroissant
  - Popularité / Nouveauté
- **Pagination** automatique ou scroll infini.
- Chargement avec indicateurs visuels (loader).

### 🧾 Page détail produit
- **Galerie d’images** du produit (3 images minimum).
- Informations détaillées :
  - Nom, description complète, prix, disponibilité, caractéristiques.
  - Avis et évaluations clients (mockés ou via DummyJSON).
- Sélection de **quantité** avant ajout au panier.
- Section “**Produits similaires**” générée automatiquement.

### 🛒 Panier d’achat
- Liste complète des articles ajoutés :
  - Image miniature, nom, prix unitaire, quantité, sous-total.
- **Mise à jour dynamique** des quantités et suppression d’articles.
- **Récapitulatif du panier** :
  - Sous-total, frais de livraison, total global.
- **Persistance locale** grâce au `localStorage` (le panier reste sauvegardé après rechargement).
- Bouton **“Procéder au paiement”**.

### 🔐 Authentification
- **Page d’inscription** avec validation des champs :
  - Nom, prénom, email, mot de passe, adresse.
- **Page de connexion** simulant une authentification (session locale).
- **Formulaires réactifs** (`Reactive Forms`) avec messages d’erreur personnalisés.
- Gestion de la session utilisateur simulée (via `localStorage`).

### 💳 Processus de commande (Bonus)
- Page **checkout** avec :
  - Récapitulatif des articles du panier.
  - Formulaire d’adresse de livraison.
  - Choix du mode de livraison et paiement simulé.
- Page **confirmation de commande** avec message de succès.

### 👤 Espace utilisateur (Bonus)
- Page de **profil** (mockée) avec informations personnelles.
- Historique des commandes simulé.
- Système de **favoris** / **wishlist** (optionnel).

### ⚡ Autres fonctionnalités techniques
- **Gestion des erreurs** et affichage de messages adaptés.
- **Animations Angular** pour les transitions et effets de survol.
- **Responsive design** complet (mobile, tablette, desktop).
- **Accessibilité** : labels, contrastes, navigation clavier.
- **Code propre et modulaire**, basé sur des composants réutilisables.

## ⚠️ Difficultés rencontrées
Durant le développement du projet **TechZone**, plusieurs difficultés techniques ont été rencontrées et ont nécessité une réelle phase d’apprentissage et de recherche :

### 🔹 1. Intégration de l’API DummyJSON
C’était la **première fois** que j’intégrais une API REST externe comme DummyJSON dans un projet Angular. La principale difficulté a été de :
- comprendre la **structure des données retournées** par DummyJSON,
- gérer les **appels HTTP asynchrones** avec `HttpClient` et `RxJS`,
- traiter les erreurs (API non disponible, latence réseau, etc.).
> 💡 J’ai surmonté cela en créant un **service dédié (`DummyJsonService`)** avec gestion des observables et d’un **interceptor** pour suivre les requêtes HTTP.

### 🔹 2. Fusion des données API + fichier db.json
La combinaison entre les données externes (DummyJSON) et le **fichier db.json local** enrichi (stock, caractéristiques, avis, etc.) a été complexe. Il fallait maintenir la cohérence entre les deux sources sans backend réel.
> 💡 J’ai utilisé des **mappings typés** (`Product` interface) et des **opérateurs RxJS (`map`, `mergeMap`)** pour fusionner les données proprement.

### 🔹 3. Déploiement sur Vercel
Voici la procédure simple et propre pour déployer un projet Angular sur Vercel :

1️⃣ Installer Vercel globalement
npm install -g vercel
2️⃣ Compiler le projet en production
ng build --configuration production
3️⃣ Lancer le déploiement
vercel
4️⃣ Lors de la configuration Vercel, choisir :

Build Output Directory :
dist/techzone-angular



Ces difficultés m’ont permis de renforcer ma compréhension d’**Angular**, de la **programmation réactive (RxJS)**, et de la **gestion de données API** dans un contexte réel de projet.

## 🖼️ Captures d’écran
Voici un aperçu visuel de l’application **TechZone** et de ses principales pages.

### 🏠 Page d’accueil

### 🛍️ Catalogue de produits

### 🧾 Détail produit

### 🪄 Promotions & Offres spéciales

### 🛒 Panier d’achat

### 💳 Checkout & Confirmation

### 🔐 Authentification (Inscription / Connexion)

### 👤 Profil utilisateur
