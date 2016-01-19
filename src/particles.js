"use strict";
class Particles {
	constructor(width, height) {
		this.mWidth = width;
		this.mHeight = height;
		this.worldScale = 100;
	}

	init () {
		let textureLoader = new THREE.TextureLoader();

		return new Promise(
			(resolve, reject) => {
				textureLoader.load('images/spark1.png', (texture) => {
					this.onTextureLoaded(texture);					
					resolve(this.response);
				})
			}
		);
	}

	onTextureLoaded(texture) {
		this.particleTexture = texture;
		let gravity = new b2Vec2(0, 10);
		window.world = new b2World(gravity);
		this.createBucket();
		this.createParticles();
		this.createMesh();
	}

	createBucket () {
		let bodyDef = new b2BodyDef();
		bodyDef.density = 1.0;

		let ground = window.world.CreateBody(bodyDef);

		let b2_width = this.mWidth / this.worldScale * 2;
		let b2_height = this.mHeight / this.worldScale * 2;
		let b2_centerX = b2_width / 2;
		let b2_centerY = b2_height / 2;
		let shapeDensity = 1;
		let thickness = 0.05;

		// TODO: why origin is not the center????
		// bottom bar
		let wg = new b2PolygonShape();
		wg.SetAsBoxXYCenterAngle(
			b2_width, 
			thickness,
			new b2Vec2( b2_centerX/2, b2_height),
			0
		);
		ground.CreateFixtureFromShape( wg, shapeDensity );

		// right bar
		let wgr = new b2PolygonShape();
		wgr.SetAsBoxXYCenterAngle(
			thickness, 
			b2_height,
			new b2Vec2( -b2_centerX, b2_centerY ),
			0
		);
		ground.CreateFixtureFromShape( wgr, shapeDensity );

		// left bar
		let wgl = new b2PolygonShape();
		wgl.SetAsBoxXYCenterAngle(
			thickness,
			b2_height, 
			new b2Vec2( b2_width , b2_centerY ),
			0
		);
		ground.CreateFixtureFromShape( wgl, shapeDensity );
	}

	createParticles () {
		
		let psd = new b2ParticleSystemDef();
		psd.radius = 0.075;
		psd.destroyByAge = false;

		this.b2ParticleSystem = window.world.CreateParticleSystem(psd);

		let box = new b2PolygonShape();
		let worldWidth = this.mWidth / this.worldScale;
		let worldHeight = this.mHeight / this.worldScale;
		box.SetAsBoxXYCenterAngle(
			worldWidth, 
			worldHeight,
			new b2Vec2(worldWidth/2, worldHeight/2),
			0
		);
		let particleGroupDef = new b2ParticleGroupDef();
		particleGroupDef.shape = box;
		particleGroupDef.flags = b2_viscousParticle;
		this.b2ParticleSystem.CreateParticleGroup(particleGroupDef);
	}

	createMesh() {
		this.geometry = new THREE.BufferGeometry();

		// creating position attribute to pass postions of vertices base on
		// where physic engine particles are.
		this.vertices = new Float32Array(
				(this.b2ParticleSystem.GetPositionBuffer().length / 2) * 3
			);
		this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.vertices, 3 ) );

		this.uniforms = {
			texture: { type: 't', value: this.particleTexture }
		}

		let material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			vertexShader: this.getVertShader(),
			fragmentShader: this.getFragShader(),
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});

		this.mesh = new THREE.Points( this.geometry, material );
	}

	updateParticlePositions () {
		let particlePositions = this.b2ParticleSystem.GetPositionBuffer();
		// positionPoses is the list of x and y of poistion of particles,
		// so divide by 2 returns number of particles.
		let numOfParticles = particlePositions.length / 2; 
		for (let i=0, i3 = 0; i < numOfParticles; i++, i3 += 3) {
			// translate box2D coordinate position to webgl position
			let x = this.mWidth / 2 - particlePositions[i*2] * this.worldScale;
			let y = this.mHeight / 2 - particlePositions[i*2+1] * this.worldScale;
			// we are making 2D particles, but built in glsl attributes for
			// buffered geometry position is 3D,
			// so make all z to 0 and pass the 3d position.
			let z = 0; 
			this.vertices[ i3 + 0 ] = x;
			this.vertices[ i3 + 1 ] = y;
			this.vertices[ i3 + 2 ] = z;
		}	
		
	}

	update() {
		window.world.Step(1.0 / 60.0, 8, 10);
		this.updateParticlePositions();
		this.geometry.attributes.position.needsUpdate = true;
	}

	getVertShader() {
		let shader = [
			'void main() {',
				'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
				'gl_PointSize = 60.0;',
				'gl_Position = projectionMatrix * mvPosition;',
			'}'
		];
		return shader.join('');
	}

	getFragShader() {
		let shader = [
			'uniform sampler2D texture;',
			'void main() {',
				'gl_FragColor = texture2D(texture, gl_PointCoord );',
				'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
			'}'
		];
		return shader.join('');
	}
}