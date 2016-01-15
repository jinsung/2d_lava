"use strict";

class Shaders {
	constructor() {

	}

	getParticleVertShader() {
		var shader = [
			'void main() {',
				'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
				'gl_PointSize = 10.0;',
				'gl_Position = projectionMatrix * mvPosition;',
			'}'
		];
		return shader.join('');
	}

	getParticleFragShader() {
		var shader = [
			'uniform sampler2D texture;',
			'void main() {',
				//'gl_FragColor = texture2D(texture, gl_PointCoord );',
				'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
			'}'
		];
		return shader.join('');
	}
}