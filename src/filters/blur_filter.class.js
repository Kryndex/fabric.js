(function(global) {

  'use strict';

  var fabric  = global.fabric || (global.fabric = { }),
      filters = fabric.Image.filters,
      createClass = fabric.util.createClass;

  /**
   * Blur filter class
   * @class fabric.Image.filters.Blur
   * @memberOf fabric.Image.filters
   * @extends fabric.Image.filters.BaseFilter
   * @see {@link fabric.Image.filters.Blur#initialize} for constructor definition
   * @see {@link http://fabricjs.com/image-filters|ImageFilters demo}
   * @example
   * var filter = new fabric.Image.filters.Blur({
   *   blur: 0.5
   * });
   * object.filters.push(filter);
   * object.applyFilters();
   * canvas.renderAll();
   */
  filters.Blur = createClass(filters.BaseFilter, /** @lends fabric.Image.filters.Blur.prototype */ {

    type: 'Blur',

/*
'gl_FragColor = vec4(0.0);',
'gl_FragColor += texture2D(texture, vTexCoord + -7 * uDelta)*0.0044299121055113265;',
'gl_FragColor += texture2D(texture, vTexCoord + -6 * uDelta)*0.00895781211794;',
'gl_FragColor += texture2D(texture, vTexCoord + -5 * uDelta)*0.0215963866053;',
'gl_FragColor += texture2D(texture, vTexCoord + -4 * uDelta)*0.0443683338718;',
'gl_FragColor += texture2D(texture, vTexCoord + -3 * uDelta)*0.0776744219933;',
'gl_FragColor += texture2D(texture, vTexCoord + -2 * uDelta)*0.115876621105;',
'gl_FragColor += texture2D(texture, vTexCoord + -1 * uDelta)*0.147308056121;',
'gl_FragColor += texture2D(texture, vTexCoord              )*0.159576912161;',
'gl_FragColor += texture2D(texture, vTexCoord + 1 * uDelta)*0.147308056121;',
'gl_FragColor += texture2D(texture, vTexCoord + 2 * uDelta)*0.115876621105;',
'gl_FragColor += texture2D(texture, vTexCoord + 3 * uDelta)*0.0776744219933;',
'gl_FragColor += texture2D(texture, vTexCoord + 4 * uDelta)*0.0443683338718;',
'gl_FragColor += texture2D(texture, vTexCoord + 5 * uDelta)*0.0215963866053;',
'gl_FragColor += texture2D(texture, vTexCoord + 6 * uDelta)*0.00895781211794;',
'gl_FragColor += texture2D(texture, vTexCoord + 7 * uDelta)*0.0044299121055113265;',
*/

    /* eslint-disable max-len */
    fragmentSource: 'precision highp float;\n' +
      'uniform sampler2D uTexture;\n' +
      'uniform vec2 uDelta;\n' +
      'varying vec2 vTexCoord;\n' +
      'const float nSamples = 15.0;\n' +
      'vec3 v3offset = vec3(12.9898, 78.233, 151.7182);\n' +
      'float random(vec3 scale) {\n' +
        /* use the fragment position for a different seed per-pixel */
        'return fract(sin(dot(gl_FragCoord.xyz, scale)) * 43758.5453);\n' +
      '}\n' +
      'void main() {\n' +
        'vec4 color = vec4(0.0);\n' +
        'float total = 0.0;\n' +
        'float offset = random(v3offset);\n' +
        'for (float t = -nSamples; t <= nSamples; t++) {\n' +
          'float percent = (t + offset - 0.5) / nSamples;\n' +
          'float weight = 1.0 - abs(percent);\n' +
          'color += texture2D(uTexture, vTexCoord + uDelta * percent) * weight;\n' +
          'total += weight;\n' +
        '}\n' +
        'gl_FragColor = color / total;\n' +
      '}',
    /* eslint-enable max-len */

    /**
     * blur value, in percentage of image dimensions.
     * specific to keep the image blur constant at different resolutions
     * range bewteen 0 and 1.
     */
    blur: 0,

    mainParameter: 'blur',

    applyTo: function(options) {
      if (options.webgl) {
        // this aspectRatio is used to give the same blur to vertical and horizontal
        this.aspectRatio = options.sourceWidth / options.sourceHeight;
        options.passes++;
        this._setupFrameBuffer(options);
        this.horizontal = true;
        this.applyToWebGL(options);
        this._swapTextures(options);
        this._setupFrameBuffer(options);
        this.horizontal = false;
        this.applyToWebGL(options);
        this._swapTextures(options);
      }
      else {
        this.applyTo2d(options);
      }
    },

    applyTo2d: function(options) {
      // options.imageData = simpleBlur(this.blur * 0.06 * 0.3, options.imageData);
    },

    /**
     * Return WebGL uniform locations for this filter's shader.
     *
     * @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
     * @param {WebGLShaderProgram} program This filter's compiled shader program.
     */
    getUniformLocations: function(gl, program) {
      return {
        delta: gl.getUniformLocation(program, 'uDelta'),
      };
    },

    /**
     * Send data from this filter to its shader program's uniforms.
     *
     * @param {WebGLRenderingContext} gl The GL canvas context used to compile this filter's shader.
     * @param {Object} uniformLocations A map of string uniform names to WebGLUniformLocation objects
     */
    sendUniformData: function(gl, uniformLocations) {
      var delta = this.chooseRightDelta();
      gl.uniform2fv(uniformLocations.delta, delta);
    },

    /**
     * choose right value of image percentage to blur with
     * @returns {Array} a numeric array with delta values
     */
    chooseRightDelta: function() {
      var blurScale = 1, delta = [0, 0], blur;
      if (this.horizontal) {
        if (this.aspectRatio > 1) {
          // image is wide, i want to shrink radius horizontal
          blurScale = 1 / this.aspectRatio;
        }
      }
      else {
        if (this.aspectRatio < 1) {
          // image is tall, i want to shrink radius vertical
          blurScale = this.aspectRatio;
        }
      }
      blur = blurScale * this.blur * 0.12;
      if (this.horizontal) {
        delta[0] = blur;
      }
      else {
        delta[1] = blur;
      }
      return delta;
    },
  });

  /**
   * Deserialize a JSON definition of a BlurFilter into a concrete instance.
   */
  filters.Blur.fromObject = fabric.Image.filters.BaseFilter.fromObject;

})(typeof exports !== 'undefined' ? exports : this);

/*
import { isChrome } from 'app/lib/Util';

const canvas1 = document.createElement('canvas');
const canvas2 = document.createElement('canvas');
const ctx1 = canvas1.getContext('2d');
const ctx2 = canvas2.getContext('2d');
const nSamples = 15;

export function simpleBlur(blur, imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const _isChrome = isChrome();
  // TODO commented code should be used once the bug in chrome is fixed.
  if (_isChrome) {
    canvas1.width = 1;
    canvas1.height = 1;
    canvas2.width = 1;
    canvas2.height = 1;
  }
  if (canvas1.width !== imageData.width || canvas1.height !== imageData.height || _isChrome) {
    canvas1.width = imageData.width;
    canvas1.height = imageData.height;
    canvas2.width = imageData.width;
    canvas2.height = imageData.height;
  } else {
    // clean from old run
    ctx1.globalAlpha = 1;
    ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
    ctx2.globalAlpha = 1;
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  }
  // load first canvas
  ctx1.putImageData(imageData, 0, 0);
  for (let i = -nSamples; i <= nSamples; i++) {
    const random = (Math.random() - 0.5) / 4;
    const percent = i / nSamples;
    const j = blur * percent * width + random;
    ctx2.globalAlpha = 1 - Math.abs(percent);
    ctx2.drawImage(canvas1, j, random);
    ctx1.drawImage(canvas2, 0, 0);
    ctx2.globalAlpha = 1;
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  }
  for (let i = -nSamples; i <= nSamples; i++) {
    const random = (Math.random() - 0.5) / 4;
    const percent = i / nSamples;
    const h = blur * percent * height + random;
    ctx2.globalAlpha = 1 - Math.abs(percent);
    ctx2.drawImage(canvas1, random, h);
    ctx1.drawImage(canvas2, 0, 0);
    ctx2.globalAlpha = 1;
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
  }
  const newImageData = ctx1.getImageData(0, 0, canvas1.width, canvas1.height);
  ctx1.globalAlpha = 1;
  ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
  return newImageData;
}

*/
