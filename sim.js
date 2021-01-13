// ============================================================================================
// Les deux classes de base : Sim et Acteur
//
// Une instance de Sim fait évoluer l'état des instances de la classe Acteur
// et les restitue
// ===========================================================================================


function Sim(){
	this.renderer   = null ;
	this.scene      = null ;
	this.camera     = null ;
	this.controleur = null ;
	this.horloge    = 0.0 ;
	this.chrono     = null ;
	// entités dans le monde (object 3D)
	this.acteurs    = [] ;

	this.textureLoader = new THREE.TextureLoader() ;
}

Sim.prototype.init = function(params){
	params = params || {} ;
	var scn = new THREE.Scene() ;
	var rd  = new THREE.WebGLRenderer({antialias:true, alpha:true}) ;
	rd.setSize(window.innerWidth, window.innerHeight) ;
	document.body.appendChild(rd.domElement) ;
	var cam = new THREE.PerspectiveCamera(45.0,window.innerWidth/window.innerHeight,0.1,1000.0) ;
	cam.position.set(5.0,1.7,5.0) ;
	// l'utilisateur
	this.controleur = new ControleurCamera(cam) ;

	var that = this ;
	window.addEventListener(
			'resize',
			function(){
				that.camera.aspect = window.innerWidth / window.innerHeight ;
				that.camera.updateProjectionMatrix() ;
				that.renderer.setSize(window.innerWidth, window.innerHeight) ;
				  }
				) ;

	// Affectation de callbacks aux événements utilisateur
	document.addEventListener("keyup",    function(e){that.controleur.keyUp(e);}    ,false) ;
	document.addEventListener("keydown",  function(e){that.controleur.keyDown(e);}  ,false) ;
	document.addEventListener("mousemove",function(e){that.controleur.mouseMove(e);},false) ;
	document.addEventListener("mousedown",function(e){that.controleur.mouseDown(e);},false) ;

	scn.add(new THREE.AmbientLight(0xffffff,1.0)) ;
	scn.add(new THREE.GridHelper(100,20)) ;

	this.scene    = scn ;
	this.camera   = cam ;
	this.renderer = rd ;

	this.creerScene() ;

	this.chrono   = new THREE.Clock() ;
	this.chrono.start() ;

}

// Méthode de création du contenu du monde : à surcharger
// ======================================================

Sim.prototype.creerScene = function(params){}

// Boucle de simulation
// ====================

Sim.prototype.actualiser = function(dt){

	var that     = this ;

	var dt       = this.chrono.getDelta() ;
	this.horloge += dt ;

	// Modification de la caméra virtuelle
	// ===================================

	this.controleur.update(dt) ;

	// Boucle ACTION
	// =============

	var n = this.acteurs.length ;
	for(var i=0; i<n; i++){
		if (this.acteurs[i] != undefined){
			this.acteurs[i].actualiser(dt) ;
		}
	} ;

	this.renderer.render(this.scene,this.camera) ;

	requestAnimationFrame(function(){that.actualiser();}) ;
}

Sim.prototype.addActeur = function(act){
	this.acteurs.push(act) ;
}

Sim.prototype.destroy = function(act){
	this.acteurs.splice(this.acteurs.indexOf(act), 1);
	act.setVisible(false);
	this.scene.remove(act.objet3d);
}

function Acteur(nom,data,sim){
	this.nom = nom ;
	this.objet3d = null ;
	this.sim = sim ;
	this.nimbus = null;
	this.nimbusType = "cylindre";
}

// Affectation d'une incarnation à un acteur
Acteur.prototype.setObjet3d = function(obj){
	this.objet3d = obj ;
	this.sim.scene.add(this.objet3d) ;
}


// Modification de la position de l'acteur
Acteur.prototype.setPosition = function(x,y,z){
	if(this.objet3d){
		this.objet3d.position.set(x,y,z) ;
	}
}

// Modification de l'orientation de l'acteur
Acteur.prototype.setOrientation = function(cap){
	if(this.objet3d){
		this.objet3d.rotation.y = cap ;
	}
}

// Modification de la visibilité de l'acteur
Acteur.prototype.setVisible = function(v){
	if(this.objet3d){
		this.objet3d.isVisible = v ;
	}
}

// Affectation d'un nimbus à l'acteur sous une forme géométrique de détection autour de lui
Acteur.prototype.setNimbus = function(nom,  params){
	if(this.objet3d){
		if (this.nimbusType == "cylindre"){
			this.nimbus = creerCylindre(nom, params);
		}
		else if(this.nimbusType == "sphere"){
			this.nimbus = creerSphere(nom, params);
		}
		else if (this.nimbusType == "cone"){
			this.nimbus = creerCone(nom, params);
		}
		this.objet3d.add(this.nimbus);
	}
}

Acteur.prototype.nimbusBehavior = function(otherActeurNimbus){}

Acteur.prototype.nimbusDetection = function(){
	for (let otherActeur of this.sim.acteurs){
		if (otherActeur != undefined && otherActeur.nimbus != null && (otherActeur.objet3d.position != this.objet3d.position)){
			if (this.nimbusType == "cylindre" && otherActeur.nimbusType == "cylindre"){
				var intersection = cylinderIntersectsCylinder(
					this.objet3d.position.x,
					(this.nimbus.geometry.parameters.height - this.objet3d.position.y) / 2,
					this.objet3d.position.z,
					this.nimbus.geometry.parameters.height,
					this.nimbus.geometry.parameters.radiusTop,
					otherActeur.objet3d.position.x,
					(otherActeur.nimbus.geometry.parameters.height - otherActeur.objet3d.position.y) / 2,
					otherActeur.objet3d.position.z,
					otherActeur.nimbus.geometry.parameters.height,
					otherActeur.nimbus.geometry.parameters.radiusTop
				)
			}
			else if(this.nimbusType == "sphere" && otherActeur.nimbusType == "sphere"){
				var intersection = sphereIntersectsSphere(
					this.objet3d.position.x,
					(this.nimbus.geometry.parameters.radius - this.objet3d.position.y) / 2,
					this.objet3d.position.z,
					this.nimbus.geometry.parameters.radius,
					otherActeur.objet3d.position.x,
					(otherActeur.nimbus.geometry.parameters.radius - otherActeur.objet3d.position.y) / 2,
					otherActeur.objet3d.position.z,
					otherActeur.nimbus.geometry.parameters.radius
				)
			}
			else if (this.nimbusType == "sphere" && otherActeur.nimbusType == "cylindre"){
				var intersection = sphereIntersectsCylinder(
					this.objet3d.position.x,
					(this.nimbus.geometry.parameters.radius - this.objet3d.position.y) / 2,
					this.objet3d.position.z,
					this.nimbus.geometry.parameters.radius,
					otherActeur.objet3d.position.x,
					(otherActeur.nimbus.geometry.parameters.height - otherActeur.objet3d.position.y) / 2,
					otherActeur.objet3d.position.z,
					otherActeur.nimbus.geometry.parameters.height,
					otherActeur.nimbus.geometry.parameters.radiusTop
				)
			}
			else if (this.nimbusType == "cylindre" && otherActeur.nimbusType == "sphere"){
				var intersection = cylinderIntersectsSphere(
					this.objet3d.position.x,
					(this.nimbus.geometry.parameters.height - this.objet3d.position.y) / 2,
					this.objet3d.position.z,
					this.nimbus.geometry.parameters.height,
					this.nimbus.geometry.parameters.radiusTop,
					otherActeur.objet3d.position.x,
					(otherActeur.nimbus.geometry.parameters.radius - otherActeur.objet3d.position.y) / 2,
					otherActeur.objet3d.position.z,
					otherActeur.nimbus.geometry.parameters.radius
				)
			}
			else if (this.nimbusType == "cone" && otherActeur.nimbusType == "cone"){
				var intersection = coneIntersectsCone(
					this.objet3d.position.x,
					(this.nimbus.geometry.parameters.height - this.objet3d.position.y) / 2,
					this.objet3d.position.z,
					this.nimbus.geometry.parameters.height,
					this.nimbus.geometry.parameters.radiusTop,
					otherActeur.objet3d.position.x,
					(otherActeur.nimbus.geometry.parameters.height - otherActeur.objet3d.position.y) / 2,
					otherActeur.objet3d.position.z,
					otherActeur.nimbus.geometry.parameters.height,
					otherActeur.nimbus.geometry.parameters.radiusTop
				)
			}
			//console.log(intersection);
			if (intersection !== false){
				this.nimbusBehavior(otherActeur);
			}
		}
	}
}

Acteur.prototype.actualiser = function(dt){}
