
// ======================================================================================================================
// Spécialisation des classes Sim et Acteur pour un projet particulier
// ======================================================================================================================

function Appli(){
	Sim.call(this) ;
}

Appli.prototype = Object.create(Sim.prototype) ;
Appli.prototype.constructor = Appli ;

Appli.prototype.creerScene = function(params){
	params = params || {} ;
	this.scene.add(new THREE.AxesHelper(3.0)) ;
	this.scene.add(creerSol()) ;

	// var tux = new Acteur1("tux1",{path:"assets/obj/pingouin",obj:"penguin",mtl:"penguin"},this) ;
	// this.addActeur(tux) ;

	var rocher = new Rocher("rocher",{largeur:3,profondeur:2,hauteur:1.5,couleur:0xffaa22},this);
	rocher.setPosition(-5,0.75,5) ;
	this.addActeur(rocher) ;

	// Question 1
	var nbrHerbes = 10;
	for (var i = 0; i < nbrHerbes; i++) {
		x = pickRandomInt(20);
		y = 0;
		z = pickRandomInt(20);
		var herbe = new Herbe("herbe" + String(i), {couleur:0xaaff55},this);
		herbe.setPosition(x, y, z);
		this.addActeur(herbe);
	}

	// Question 2
	var nbrPingouin = 3;
	for (var i = 0; i < nbrPingouin; i++) {
		x = pickRandomInt(20);
		y = 0;
		z = pickRandomInt(20);
		var pingouin = new Pingouin("pingouin" + String(i), {path:"assets/obj/pingouin",obj:"penguin",mtl:"penguin"},this);
		this.addActeur(pingouin);
		pingouin.setPosition(x, y, z);
	}
}

// La classe décrivant les touffes d'herbe
// =======================================

function Herbe(nom,data,sim){
	Acteur.call(this,nom,data,sim) ;

	var rayon   = data.rayon || 0.25 ;
	var couleur = data.couleur || 0x00ff00 ;
	this.nimbusType = "cylindre";
	this.isEaten = false;
	var sph = creerSphere(nom,{rayon:rayon, couleur:couleur}) ;
	this.setObjet3d(sph);
	this.setNimbus(nom, {rayon: 1, hauteur: 2, couleur: 0xf4ec2e, opacity: 0.3});
}
Herbe.prototype = Object.create(Acteur.prototype) ;
Herbe.prototype.constructor = Herbe ;

// La classe décrivant les rochers
// ===============================

function Rocher(nom,data,sim){
	Acteur.call(this,nom,data,sim) ;

	var l = data.largeur || 0.25 ;
	var h = data.hauteur || 1.0 ;
	var p = data.profondeur || 0.5 ;
	var couleur = data.couleur || 0x00ff00 ;

	var box = creerBoite(nom,{largeur:l, hauteur:h, profondeur:p, couleur:couleur}) ;
	this.setObjet3d(box);

}
Rocher.prototype = Object.create(Acteur.prototype) ;
Rocher.prototype.constructor = Rocher ;

// La classe décrivant les pheromones
// ===============================

function Pheromone(nom,data,sim,pingouin){
	Acteur.call(this,nom,data,sim) ;

	var rayon   = data.rayon || 0.1 ;
	var couleur = data.couleur || 0x0000ff ;
	this.horloge = 0;
	this.pingouin = pingouin;
	this.nimbusType = "sphere";
	this.isEaten = false;
	var sphere = creerSphere(nom,{rayon:rayon, couleur:couleur, opacity: 0.9}) ;
	this.setObjet3d(sphere);
	this.setNimbus(nom, {rayon: 0.1, couleur: couleur, opacity: 0.00001});
}
Pheromone.prototype = Object.create(Acteur.prototype) ;
Pheromone.prototype.constructor = Pheromone ;

Pheromone.prototype.actualiser = function(){
    if(this.sim.horloge-this.horloge>0.3){
        this.horloge=this.sim.horloge;
        var opacity=this.objet3d.material.opacity;
        opacity-=0.1;
        this.objet3d.material.opacity=opacity;
        if(opacity<=0){
             this.sim.destroy(this);
        }
    }
}

// La classe décrivant les pingouins
// ===============================

function Pingouin(nom, data, sim){
	Acteur.call(this, nom, data, sim);

	var repertoire = data.path + "/" ;
	var fObj       = data.obj + ".obj" ;
	var fMtl       = data.mtl + ".mtl" ;
	this.nimbusType = "sphere";
	this.vitesse = 0.05;
	this.FOV_angle = 100;
	this.visionRange = 70;
	this.lastproduction=0;
	this.timeStuck = 0;
	this.isFleeing = false;
	this.plantToEat = 'None';
	this.cible = new THREE.Vector3(pickRandomInt(10), 0, pickRandomInt(10));

	var obj = chargerObj("tux1",repertoire,fObj,fMtl) ;
	this.setObjet3d(obj) ;
	this.setNimbus(nom, {rayon: 2, hauteur: 3, opacity: 0.3});
}

Pingouin.prototype = Object.create(Acteur.prototype);
Pingouin.prototype.constructor = Pingouin;

Pingouin.prototype.champVision = function(otherPos){
	var pos = this.objet3d.position;
	// b is the angle also called field of view
	var b = Math.atan2(otherPos.z-pos.z, otherPos.x-pos.x) * 180 / Math.PI;
	var beta = (b+360)%360;
	var alpha = (this.FOV_angle+360)%360;
	var delta = Math.abs(beta-alpha);
	return (delta <= this.visionRange/2);
}

Pingouin.prototype.nimbusBehavior = function(otherActeur){
	if(otherActeur.nom.startsWith("herbe") && otherActeur.isEaten == false || this.plantToEat == otherActeur.nom){
		// state machine so that when one pingouin is going to eat the grass, 
		// others wont go for it
		this.plantToEat = otherActeur.nom;
		otherActeur.isEaten = true;
		this.cible = otherActeur.objet3d.position;
		if (this.objet3d.position.distanceTo(this.cible) < 0.1){
			//destroy the grass
			this.sim.destroy(otherActeur);
		}
	}
	else if(otherActeur.nom.startsWith("pingouin")){
		//pingouin is going close to the other pingouin
		if (this.objet3d.position.distanceTo(otherActeur.objet3d.position) > 5){
			//move towards the other pingouin
			this.cible = otherActeur.objet3d.position.clone();
		}
	}
	else if(otherActeur.nom.startsWith("pheromone")){
		//check if it is not our own pheromone
		if (otherActeur.pingouin != this && this.sim.horloge-this.timeStuck>2){
			if (this.objet3d.position.distanceTo(otherActeur.objet3d.position) < 1){
				this.timeStuck = this.sim.horloge;
				// so that pingouins don't get stuck to each other
				otherActeur.cible = new THREE.Vector3(pickRandomInt(30), 0, pickRandomInt(30));
				this.cible = new THREE.Vector3(pickRandomInt(30), 0, pickRandomInt(30));
			} else {
				//move towards the pingouin who dropped the pheromone
				this.cible = otherActeur.pingouin.objet3d.position.clone();
			}
		}
	}
}

Pingouin.prototype.deposerPheromone = function(){
    if(this.sim.horloge-this.lastproduction>0.3){
        this.lastproduction=this.sim.horloge;
		var sph = new Pheromone(this.nom,{},this.sim) ;
		var pos = this.objet3d.position;
		x = 0.5 + Math.random() + pos.x;
		y = Math.random() + pos.y;
		z = pos.z;
		var pheromone = new Pheromone("pheromone", {couleur:0x0000ff},this.sim, this);
		pheromone.setPosition(x, y, z);
		this.sim.addActeur(pheromone);
    }
}

Pingouin.prototype.actualiser = function(){
	//moving randomly
	this.objet3d.lookAt(this.cible);
	this.objet3d.translateOnAxis(new THREE.Vector3(0,0,1), this.vitesse);
	if (this.objet3d.position.distanceTo(this.cible) < 0.1){
		this.cible = new THREE.Vector3(pickRandomInt(30), 0, pickRandomInt(30));
		// state machine to give the priority to fleeing the user above all other behaviors
		this.isFleeing = false;
	}
	//fleeing the user
	if (this.objet3d.position.distanceTo(this.sim.camera.position) < 5)
	{
		this.cible = this.sim.camera.position.clone();
		//selecting a point by linear interpolation between the two vector3
		this.cible.lerp(this.objet3d.position, 2);
		this.cible.setY(0);
		this.isFleeing = true;
	}
	//associating an action for actor in nimbus
	if (this.isFleeing == false){
		this.nimbusDetection();
	}
	this.deposerPheromone();
}
