"use strict";


class Main {
    constructor() {
        this.init();
        this.animate();
    }

    resetWindowSize() {
	   this.width = window.innerWidth;
       this.height = window.innerHeight;
    }

    init () {
        this.resetWindowSize();

        /* 
         * setup orthographic camera to render 2D
         */
        this.camera = new THREE.OrthographicCamera( 
    					  this.width / -2, this.width / 2, 
                          this.height / 2, this.height / -2, 1, 1000);
        this.camera.position.z = 100;

        this.scene = new THREE.Scene();

        // setup default webgl renderer.
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this.renderer.domElement );

        // setup particles
        this.isParticleReady = false;
        this.particles = new Particles(100, 100);
        this.particles.init().then ( (data) => {
                this.onParticlesReady(data);
            }
        );

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );
    }

    onParticlesReady(data) {
        this.isParticleReady = true;
        this.scene.add( this.particles.mesh );
    }

    onWindowResize() {
        this.resetWindowSize();
        this.camera.aspect = this.width / this.height;
        this.camera.left = this.width / -2;
        this.camera.right = this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = this.height / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( this.width, this.height );
    }

    animate() {
        window.requestAnimationFrame( this.animate.bind(this) );
        if (this.isParticleReady) {
            this.particles.update();
        }
        this.renderer.render( this.scene, this.camera );
    }
}

new Main();