"use strict";

document.addEventListener("DOMContentLoaded", main);

var gl;
var shaderProgram;
var neheTexture;

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

var xRot = 0;
var yRot = 0;
var zRot = 0;

var lastTime = 0;

/**
 * main
 **/

function main(){
	var canvas = document.getElementById("canvas");
	gl = canvas.getContext("experimental-webgl");

	if(!gl){
		throw "Could not get webgl context";
	}

	gl.viewportWidth = canvas.width;
	gl.viewportHeight = canvas.height;

	initShaders();
	initBuffers();
	initTexture();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);

	tick();
}

/**
 * initShaders
 **/

function initShaders(){
	var fragmentShader = getShader(gl, "shader-fs");
	var vertexShader = getShader(gl, "shader-vs");

	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
		throw "Could not link shader programs";
	}

	gl.useProgram(shaderProgram);

	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
	gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

	shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

	shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

/**
 * getShader
 **/

function getShader(gl, id){
	var shaderScript = document.getElementById(id);
	if(!shaderScript){
		throw "Could not find script id: " + id;
	}

	var str = "";
	var k = shaderScript.firstChild;
	while(k){
		if(k.nodeType === 3){
			str += k.textContent;
		}

		k = k.nextSibling;
	}

	var shader;
	switch(shaderScript.type){
		case "x-shader/x-fragment":
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		break;
		case "x-shader/x-vertex":
			shader = gl.createShader(gl.VERTEX_SHADER);
		break;
		default:
			throw "Unknown shader script type: " + shaderScript.type;
		break;
	}

	gl.shaderSource(shader, str);
	gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
		console.error("Could not compile %s", id);
		throw gl.getShaderInfoLog(shader);
	}

	return shader;
}

/**
 * initBuffers
 **/

function initBuffers(){
	cubeVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	var vertices = new Float32Array([
		//1
		-1.987873, -0.000006, 2.034786, //3
		-1.987873, -2.034806, 0.000006, //4
		1.987873, -0.000006, 2.034786, //7
		
		//2
		-1.987873, -2.034806, 0.000006, //4
		1.987873, -2.034806, 0.000006, //8
		1.987873, -0.000006, 2.034786, //7

		//3
		1.987873, -0.000006, 2.034786, //7
		1.987873, -2.034806, 0.000006, //8
		1.987873, 0.000006, -2.034786, //6

		//4
		1.987873, -2.034806, 0.000006, //8
		-1.987873, -2.034806, 0.000006, //4
		1.987873, 0.000006, -2.034786, //6

		//5
		1.987873, 0.000006, -2.034786, //6
		-1.987873, -2.034806, 0.000006, //4
		-1.987873, 0.000006, -2.034786, //2

		//6
		-1.987873, -2.034806, 0.000006, //4
		-1.987873, -0.000006, 2.034786, //3
		-1.987873, 0.000006, -2.034786, //2

		//7
		-1.987873, 0.000006, -2.034786, //2
		-1.987873, -0.000006, 2.034786, //3
		-1.987873, 2.034806, -0.000006, //1

		//8
		-1.987873, -0.000006, 2.034786, //3
		1.987873, -0.000006, 2.034786, //7
		-1.987873, 2.034806, -0.000006, //1

		//9
		-1.987873, 2.034806, -0.000006, //1
		1.987873, -0.000006, 2.034786, //7
		1.987873, 2.034806, -0.000006, //5
		
		//10
		1.987873, -0.000006, 2.034786, //7
		1.987873, 0.000006, -2.034786, //6
		1.987873, 2.034806, -0.000006, //5

		//11
		1.987873, 2.034806, -0.000006, //5
		1.987873, 0.000006, -2.034786, //6
		-1.987873, 2.034806, -0.000006, //1

		//12
		1.987873, 0.000006, -2.034786, //6
		-1.987873, 0.000006, -2.034786, //2
		-1.987873, 2.034806, -0.000006 //1

		/*
		-1.987873, 2.034806, -0.000006, //1
		-1.987873, 0.000006, -2.034786, //2
		-1.987873, -0.000006, 2.034786, //3
		-1.987873, -2.034806, 0.000006, //4
		1.987873, 2.034806, -0.000006, //5
		1.987873, 0.000006, -2.034786, //6
		1.987873, -0.000006, 2.034786, //7
		1.987873, -2.034806, 0.000006 //8
		*/
	]);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	cubeVertexPositionBuffer.itemSize = 3;
	cubeVertexPositionBuffer.numItems = 36;

	cubeVertexTextureCoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	var textureCoords = new Float32Array([
		//1
		0.000000, 0.486275, //1
		0.000000, 1.000000, //2
		1.003922, 0.486275, //3
		//2
		0.000000, 1.000000, //2
		1.003922, 1.000000, //4
		1.003922, 0.486275, //3
		//3
		1.003922, 0.486275, //3
		1.003922, 1.000000, //4
		1.003922, 0.486275, //5
		//4
		1.003922, 1.000000, //4
		0.000000, 1.000000, //6
		1.003922, 0.486275, //5
		//5
		1.003922, 0.486275, //5
		0.000000, 1.000000, //6
		0.000000, 0.486275, //7
		//6
		0.000000, 1.000000, //6
		0.000000, 0.486275, //8
		0.000000, 0.486275, //7
		//7
		0.000000, 0.486275, //7
		0.000000, 0.486275, //8
		0.000000, 0.000000, //9
		//8
		0.000000, 0.486275, //8
		1.003922, 0.486275, //10
		0.000000, 0.000000, //9
		//9
		0.000000, 0.000000, //9
		1.003922, 0.486275, //10
		1.003922, 0.000000, //11
		//10
		1.003922, 0.486275, //10
		1.003922, 0.486275, //12
		1.003922, 0.000000, //11
		//11
		1.003922, 0.000000, //11
		1.003922, 0.486275, //12
		0.000000, 0.000000, //13
		//12
		1.003922, 0.486275, //12
		0.000000, 0.486275, //14
		0.000000, 0.000000 //13
	]);
	gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);
	cubeVertexTextureCoordBuffer.itemSize = 2;
	cubeVertexTextureCoordBuffer.numItems = 36;

	cubeVertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	/*var cubeVertexIndices = new Uint16Array([
		2, 3, 6, //1
		3, 7, 6, //2
		6, 7, 5, //3
		7, 3, 5, //4
		5, 3, 1, //5
		3, 2, 1, //6
		1, 2, 0, //7
		2, 6, 0, //8
		0, 6, 4, //9
		6, 5, 4, //10
		4, 5, 0, //11
		5, 1, 0 //12
	]);*/
	var cubeVertexIndices = new Uint16Array([
		0, 1, 2, //1
		3, 4, 5, //2
		6, 7, 8, //3
		9, 10, 11, //4
		12, 13, 14, //5
		15, 16, 17, //6
		18, 19, 20, //7
		21, 22, 23, //8
		24, 25, 26, //9
		27, 28, 29, //10
		30, 31, 32, //11
		33, 34, 35 //12
	]);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndices, gl.STATIC_DRAW);
	cubeVertexIndexBuffer.itemSize = 1;
	cubeVertexIndexBuffer.numItems = 36;
}


/**
 * initTexture
 **/

function initTexture(){
	neheTexture = gl.createTexture();
	neheTexture.image = new Image();
	neheTexture.image.onload = function(){
		console.log(neheTexture.image);
		handleLoadedTexture(neheTexture);
	}

	neheTexture.image.src = "img/ixt_box02a.png";
}

/**
 * handleLoadedTexture
 **/

function handleLoadedTexture(texture){
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
}

/**
 * tick
 **/

function tick(){
	requestAnimationFrame(tick);
	drawScene();
	animate();
}

/**
 * drawScene
 **/

function drawScene(){
	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	mat4.perspective(45, gl.viewportWidth/gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, [0.0, 0.0, -8.0]);

	mat4.rotate(mvMatrix, degToRad(xRot), [0, 1, 0]);
	//mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
	//mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, neheTexture);
	gl.uniform1i(shaderProgram.samplerUniform, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
	setMatrixUniforms();
	gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

/**
 * degToRad
 **/

function degToRad(degrees){
	return degrees * Math.PI / 180;
}

/**
 * setMatrixUniforms
 **/

function setMatrixUniforms(){
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * animate
 **/

function animate(){
	var timeNow = new Date().getTime();
	if(lastTime !== 0){
		var elapsed = timeNow - lastTime;

		xRot += (90 * elapsed) / 8000.0;
		yRot += (90 * elapsed) / 1000.0;
		zRot += (90 * elapsed) / 1000.0;
	}
	lastTime = timeNow;
}
