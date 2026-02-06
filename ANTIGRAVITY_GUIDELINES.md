# Guide de Codage - Style "Antigravity"

Ce document synthétise les pratiques de codage, les noms de méthodes et les structures récurrentes observées dans les projets 1 à 10. Il doit servir de référence pour tout nouveau développement afin de conserver une cohérence avec le style du "professeur".

## 1. Structure Générale d'un Projet

Chaque projet suit généralement cette structure :
- `index.html` : Charge les librairies (p5.js, p5.dom.js, tf.js si besoin) et les scripts du projet.
- `sketch.js` : Point d'entrée principal. Contient `setup()` et `draw()`, ainsi que les variables globales.
- `vehicle.js` (ou `boid.js`, `agent.js`) : Classe définissant l'agent autonome.
- `target.js` / `obstacle.js` / `boundary.js` : Classes pour les autres entités.

## 2. Variables Globales (dans `sketch.js`)

Les déclarations se font au tout début du fichier.
*Pattern récurrent :*
```javascript
let target;
let vehicles = [];
let obstacles = [];
let nbVehicules = 10;
// Sliders UI
let vitesseMaxSlider, forceMaxSlider, nbVehiculesSlider;
// Débug
let debug = false; // Souvent static dans la classe Vehicle aussi
```

## 3. La Classe `Vehicle` (Standard)

### Propriétés du Constructeur
```javascript
constructor(x, y) {
  this.pos = createVector(x, y);
  this.vel = createVector(0, 0); // Parfois random2D()
  this.acc = createVector(0, 0);
  this.maxSpeed = 4;
  this.maxForce = 0.2;
  this.r = 16; // Rayon pour le dessin/collision
  this.perceptionRadius = 50; // Pour les boids/vision
}
```

### Méthodes Clés
*Les noms de méthodes doivent être respectés.*

#### Physique Eulérienne (`update`)
Toujours implémentée ainsi :
```javascript
update() {
  this.vel.add(this.acc);
  this.vel.limit(this.maxSpeed);
  this.pos.add(this.vel);
  this.acc.set(0, 0); // Reset accélération
  // Gestion optionnelle : trainée (path), durée de vie
}
```

#### Application des Forces (`applyForce` et `applyBehaviors`)
```javascript
applyForce(force) {
  this.acc.add(force);
}

applyBehaviors(target, obstacles, vehicles) {
  // Calculs des forces
  let seekForce = this.seek(target);
  let avoidForce = this.avoid(obstacles);
  // Pondération
  seekForce.mult(1);
  avoidForce.mult(3);
  // Application
  this.applyForce(seekForce);
  this.applyForce(avoidForce);
}
```

#### Affichage (`show`)
Toujours utiliser `push()` et `pop()` avec `translate()` et `rotate()`.
```javascript
show() {
  push();
  translate(this.pos.x, this.pos.y);
  rotate(this.vel.heading());
  // Dessin (triangle, cercle, image...)
  triangle(-this.r, -this.r/2, -this.r, this.r/2, this.r, 0);
  pop();
}
```

## 4. Comportements (Steering Behaviors)

Voici la signature standard et la logique des comportements.

### Seek (Poursuite)
Le code du prof commente souvent "ETAPE 1" et "ETAPE 2".
```javascript
seek(target) {
  // ETAPE 1 : Vitesse désirée (vers la cible)
  let desired = p5.Vector.sub(target, this.pos);
  desired.setMag(this.maxSpeed);

  // ETAPE 2 : Force de pilotage (Steering force)
  let steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxForce);
  return steer;
}
```

### Arrive (Arrivée en douceur)
Comme seek, mais ralentit dans un rayon donné.
```javascript
arrive(target) {
  // ... calcul vecteur desired ...
  let d = desired.mag();
  if (d < 100) { // Rayon de ralentissement
    let m = map(d, 0, 100, 0, this.maxSpeed);
    desired.setMag(m);
  } else {
    desired.setMag(this.maxSpeed);
  }
  // ... steering ...
}
```

### Wander (Errance)
Utilise la projection d'un cercle devant le véhicule.
*Variables :* `wanderDistance`, `wanderRadius`, `wanderTheta`.
```javascript
wander() {
  // Point devant
  let center = this.vel.copy();
  center.setMag(this.wanderDistance);
  center.add(this.pos);
  // Point sur le cercle
  let offset = createVector(this.wanderRadius * cos(this.wanderTheta), this.wanderRadius * sin(this.wanderTheta));
  let target = p5.Vector.add(center, offset);
  // Déplacement aléatoire
  this.wanderTheta += random(-0.1, 0.1);
  // Force (Seek vers le point cible)
  return this.seek(target);
}
```

### Path Following (Suivi de Chemin)
*Observé dans 5-2-PathFollowing*
Utilise une fonction utilitaire pour la projection scalaire.
```javascript
// Fonction utilitaire (souvent hors classe)
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

// Dans la classe Vehicle
follow(path) {
  // 1. Prédire le futur
  let future = this.vel.copy();
  future.mult(20);
  future.add(this.pos);

  // 2. Projeter sur le chemin
  let target = findProjection(path.start, future, path.end);

  // 3. Vérifier la distance
  let d = p5.Vector.dist(future, target);
  if (d > path.radius) {
    return this.seek(target);
  } else {
    return createVector(0, 0);
  }
}
```

### Avoid (Évitement d'obstacles)
Logique : Projeter un vecteur `ahead`, vérifier l'intersection avec des cercles (obstacles), calculer une force latérale/normale pour esquiver.

## 5. Algorithmes Génétiques

*Observé dans 10-missiles genetic algo et 9-VoitureSuitCircuit*

### Structure des Classes
*   **Rocket / Agent** : Possède un `dna` (génome) et une `fitness`.
*   **DNA** : Gère les gènes (tableaux de vecteurs ou poids neuronaux), le `crossover` et la `mutation`.
*   **Population** : Gère le tableau d'agents, la sélection naturelle (`matingPool` ou roulette wheel).

### Logique Spécifique (Rocket)
Le mouvement est déterminé par les gènes lus séquentiellement.
```javascript
run() {
  this.applyForce(this.dna.genes[this.geneCounter]);
  this.geneCounter = (this.geneCounter + 1) % this.dna.genes.length;
  this.update();
}
```

### Fonction de Fitness
Souvent exponentielle pour favoriser grandement les meilleurs.
```javascript
calcFitness() {
  // ... calcul de la fitness de base ...
  this.fitness = pow(this.fitness, 4); // Exponentielle
}
```

## 6. Conventions de Codage Spécifiques

*   **Commentaires** : Le code est souvent commenté en Français, expliquant la physique (ex: "vitesse = dérivée de la position").
*   **Debug** : Utilisation de `Vehicle.debug` (static bool) pour afficher/masquer les vecteurs (lignes rouges/vertes), rayons de perception et cercles d'errance.
*   **Vecteurs** : Utilisation intensive de `p5.Vector` (`copy()`, `add()`, `sub()`, `mult()`, `dist()`, `limit()`, `setMag()`).
*   **UI** : Création de sliders HTML/p5 dans `setup()` pour ajuster `maxSpeed`, `maxForce` ou les poids des comportements en temps réel.
