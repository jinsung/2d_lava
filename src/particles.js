"use strict";
class Particles {
	constructor(width, height) {
		this.mWidth = width;
		this.mHeight = height;
		this.worldScale = 100;
	}

	init () {
		let textureLoader = new THREE.TextureLoader();
		this.loadCounter = 0;
		return new Promise(
			(resolve, reject) => {
				textureLoader.load('images/spark1.png', (texture) => {
					this.particleTexture = texture;
					this.onTextureLoaded(texture, resolve, this.response);
				});
				textureLoader.load('images/lavatile2.png', (texture) => {
					this.lavaImgData = this.getImageData(texture.image);
					this.onTextureLoaded(texture, resolve, this.response);
				});
				textureLoader.load('images/cloud.png', (texture) => {
					this.cloudImgData = this.getImageData(texture.image);
					texture.name = 'cloud';
					this.onTextureLoaded(texture, resolve, this.response);
				});
			}
		);
	}

	getImageData(image) {
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.drawImage(image, 0, 0 );
		return context.getImageData(0, 0, image.width, image.height);
	}

	onTextureLoaded(texture, resolve, response) {
		this.loadCounter++;
		if (this.loadCounter === 3) {
			let gravity = new b2Vec2(0, 10);
			window.world = new b2World(gravity);
			this.createBucket();
			this.createParticles();
			this.createMesh();
			resolve(response);
		}
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
		psd.radius = 0.02;
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
		this.group = this.b2ParticleSystem.CreateParticleGroup(particleGroupDef);
	}

	getColorFromImage(imageData, sampleSize) {

		let particlePositions = this.b2ParticleSystem.GetPositionBuffer();
		let numOfParticles = particlePositions.length / 2; 
		let colors = new Float32Array( numOfParticles * 3 );

		let adder = Math.ceil((this.mWidth*this.mHeight)/numOfParticles);
		let starter = Math.ceil(adder/4);

		for (let i=0, i3 = 0; i < numOfParticles; i++, i3 += 3) {

			let x = Math.floor(particlePositions[i*2] * this.worldScale + this.mWidth / 2);
			let y = Math.floor(particlePositions[i*2+1] * this.worldScale + this.mHeight / 2) / 2;

			let nX = x-1;
			let nY = y-1;

			let imageIndex = (nY*imageData.width+nX) * 4;
			colors[ i3 ] = imageData.data[ imageIndex ] / 255;
			colors[i3+1] = imageData.data[imageIndex+1] / 255;
			colors[i3+2] = imageData.data[imageIndex+2] / 255;
			//console.log('imageIndex', imageIndex);
			//console.log('color', colors[i3], y, imageIndex, imageData.data.length);
		}

		return colors;
	}

	createMesh() {
		this.geometry = new THREE.BufferGeometry();

		// creating position attribute to pass postions of vertices base on
		// where physic engine particles are.
		this.vertices = new Float32Array(
				( this.b2ParticleSystem.GetPositionBuffer().length / 2 ) * 3
			);

		let lavaColors = this.getColorFromImage( this.lavaImgData, this.vertices.length );

		this.geometry.addAttribute( 'position', new THREE.BufferAttribute( this.vertices, 3 ) );
		this.geometry.addAttribute( 'lavaColor', new THREE.BufferAttribute( lavaColors, 3 ) );

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

	applyImpulse () {
		var particleGroup = this.b2ParticleSystem.particleGroups[0];
  		var numParticles = particleGroup.GetParticleCount();
		var kImpulseMagnitude = 0.005;
		var direction = new b2Vec2(Math.random() * 0.2 - 0.1, Math.random() * -0.6);
		var impulse = new b2Vec2();
    	b2Vec2.MulScalar(impulse, direction, kImpulseMagnitude * numParticles);
    	this.group.ApplyLinearImpulse(impulse);
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
			'attribute vec3 lavaColor;',
			'varying vec3 vColor;',
			'void main() {',
				'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
				'vColor = lavaColor;',
				'gl_PointSize = 12.0;',
				'gl_Position = projectionMatrix * mvPosition;',
			'}'
		];
		return shader.join('');
	}

	getFragShader() {
		let shader = [
			'uniform sampler2D texture;',
			'varying vec3 vColor;',
			'void main() {',
				'gl_FragColor = vec4( vColor, 1.0 ) *texture2D(texture, gl_PointCoord );',
				
				//'gl_FragColor = texture2D(texture, gl_PointCoord );',
			'}'
		];
		return shader.join('');
	}
}