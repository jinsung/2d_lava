"use strict";

class ParticlesRenderTarget {
	constructor(renderer, width, height, contents) {
		let scale = 1;
		this.blurDelta = 0.1;
		this.bluriness = 0.1;

		this.mWidth = width;
		this.mHeight = height;

		this.renderer = renderer;

		this.renderTarget = new THREE.WebGLRenderTarget(
			width,
			height,
			{
				minFilter: THREE.LinearFilter, 
				magFilter: THREE.NearestFilter,
				format: THREE.RGBFormat
			} 
		);

		this.scene = new THREE.Scene();
		this.scene.add(contents);

		this.camera = new THREE.OrthographicCamera( width  * -0.5,
												    width  *  0.5,
												    height *  0.5,
												    height * -0.5,
												    -1, 1000 );
		this.camera.position.z = 100;

		this.setupScene();
	}

	setupScene() {
		this.uniforms = {
			texture: { type: 't', value: this.renderTarget }
		}

		let material = new THREE.ShaderMaterial( {
			uniforms: this.uniforms,
			vertexShader: this.getVertShader(),
			fragmentShader: this.getFragShader()
		} );

		let plane = new THREE.PlaneBufferGeometry( this.mWidth, this.mHeight );
		this.mesh = new THREE.Mesh(plane, material);
	}

	update() {
		this.renderer.render( this.scene, this.camera, this.renderTarget, true );
	}

	getVertShader() {
		let shader = [
			'varying vec2 vUv;',
			'void main() {',
				'vUv = uv;',
				'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
				'gl_Position = projectionMatrix * mvPosition;',
			'}'
		];
		return shader.join('');
	}

	getFragShader() {
		let shader = [
			'uniform sampler2D texture;',

			'varying vec2 vUv;',
			'void main() {',
				'gl_FragColor = texture2D( texture, vUv );',
				//'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0 );',
			'}'
		];
		return shader.join('');
	}

}