/* One measured room shared by all finish presets. World units are meters. */
const aftroPresets = {
  before: { wall: "#bab5af", floor: "#b4ada5", ceiling: "#bab4aa", trim: "#ada8a0" },
  warm: { wall: "#d8c2a8", floor: "#a37855", ceiling: "#f4ebe0", trim: "#f0e2d1", fabric: "#9d806a", wood: "#644329", rug: "#d5bc9e" },
  light: { wall: "#eee8de", floor: "#d9bd93", ceiling: "#f7f3ec", trim: "#f7f0e4", fabric: "#e0d4c1", wood: "#ad916a", rug: "#e9d9c0" },
};

function aftroColor(hex) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function aftroMesh(finish, room) {
  const theme = aftroPresets[finish];
  const vertices = [];
  function box(x, y, z, w, h, d, hex, variation = 1) {
    const rgb = aftroColor(hex).map((channel) => Math.min(1, channel * variation));
    const x1 = x + w, y1 = y + h, z1 = z + d;
    const faces = [
      [[0, 0, 1], [[x,y,z1], [x1,y,z1], [x1,y1,z1], [x,y1,z1]]],
      [[0, 0, -1], [[x1,y,z], [x,y,z], [x,y1,z], [x1,y1,z]]],
      [[1, 0, 0], [[x1,y,z1], [x1,y,z], [x1,y1,z], [x1,y1,z1]]],
      [[-1, 0, 0], [[x,y,z], [x,y,z1], [x,y1,z1], [x,y1,z]]],
      [[0, 1, 0], [[x,y1,z1], [x1,y1,z1], [x1,y1,z], [x,y1,z]]],
      [[0, -1, 0], [[x,y,z], [x1,y,z], [x1,y,z1], [x,y,z1]]],
    ];
    for (const [normal, points] of faces) {
      for (const index of [0, 1, 2, 0, 2, 3]) vertices.push(...points[index], ...normal, ...rgb);
    }
  }

  if (room) {
    const { width: w, length: d, height: h } = room;
    const left = -w / 2, back = -d / 2;
    box(left, -0.12, back, w, 0.12, d, theme.floor);
    box(left, h, back, w, 0.08, d, theme.ceiling);
    box(left - 0.06, 0, back, 0.06, h, d, theme.wall, 0.96);
    box(w / 2, 0, back, 0.06, h, d, theme.wall, 0.97);
    box(left, 0, back - 0.06, w, h, 0.06, theme.wall);
    box(left, 0, d / 2, w, h, 0.06, theme.wall, 0.95);

    if (finish !== "before") {
      const rows = Math.ceil(w / 0.22);
      for (let i = 0; i < rows; i++) {
        const x = i * 0.22;
        box(left + x, 0, back, Math.min(0.216, w - x), 0.006, d, theme.floor, 0.90 + (i % 4) * 0.039);
      }
      box(left, 0, back, w, 0.065, 0.025, theme.trim);
      for (const x of [left, w / 2 - 0.025]) box(x, 0, back, 0.025, 0.065, d, theme.trim);
      if (w >= 2.1 && d >= 2.2) {
        const sofa = Math.min(w * 0.66, 2.6);
        box(-sofa / 2, 0.12, back + 0.18, sofa, 0.25, 0.70, theme.fabric);
        box(-sofa / 2, 0.33, back + 0.17, sofa, 0.44, 0.16, theme.fabric, 0.94);
        for (const x of [-sofa / 2, sofa / 2 - 0.16]) {
          box(x, 0.32, back + 0.27, 0.16, 0.29, 0.56, theme.fabric);
        }
        box(-sofa * 0.43, 0.01, back + 0.91, sofa * 0.86, 0.012, Math.min(d * 0.36, 1.6), theme.rug);
        box(-0.43, 0.36, back + 1.12, 0.86, 0.06, 0.43, theme.wood);
        box(-0.19, 0.02, back + 1.21, 0.38, 0.34, 0.23, theme.wood);
      }
    }
    return new Float32Array(vertices);
  }

  box(-2.25, -0.16, -1.8, 4.5, 0.16, 3.6, theme.floor);
  box(-2.25, 2.8, -1.8, 4.5, 0.12, 3.6, theme.ceiling);
  box(-2.25, 0, -1.9, 4.5, 2.8, 0.1, theme.wall);
  box(-2.25, 0, 1.8, 4.5, 2.8, 0.1, theme.wall);
  // Open passage on the left.
  box(-2.35, 0, -1.8, 0.1, 2.8, 1.05, theme.wall);
  box(-2.35, 0, 0.24, 0.1, 2.8, 1.56, theme.wall);
  box(-2.35, 2.1, -0.75, 0.1, 0.7, 0.99, theme.wall);
  box(-2.7, 0, -1.0, 0.09, 2.8, 1.65, "#ada498");
  box(-2.7, -0.13, -1.0, 0.5, 0.13, 1.65, theme.floor);

  // Recessed glazing and city view to the right.
  box(2.25, 0, -1.8, 0.1, 2.8, 0.35, theme.wall);
  box(2.25, 0, 1.24, 0.1, 2.8, 0.56, theme.wall);
  box(2.25, 0, -1.45, 0.10, 0.26, 2.69, theme.wall);
  box(2.25, 2.54, -1.45, 0.10, 0.26, 2.69, theme.wall);
  box(6.6, -0.45, -8, 0.08, 7, 16, "#c8dce7");
  for (let i = 0; i < 13; i++) {
    const height = 0.7 + (i % 4) * 0.27;
    const z = -5.8 + i * 0.9;
    box(5.3, -1.12, z, 0.55, height, 0.52, i % 2 ? "#adb5be" : "#c4bcb2");
    for (let j = 0; j < 4; j++) {
      if (j * 0.24 >= height - 0.16) break;
      box(5.29, -0.97 + j * 0.24, z + 0.06, 0.015, 0.056, 0.38, "#8295a5");
    }
  }
  for (const z of [-1.45, -0.55, 0.35, 1.20]) box(2.243, 0.26, z, 0.065, 2.28, 0.045, "#282728");
  for (const y of [0.26, 1.37, 2.5]) box(2.243, y, -1.45, 0.065, 0.045, 2.69, "#282728");

  if (finish === "before") {
    for (const x of [-1.13, -0.02, 1.09]) box(x, 0.0005, -1.8, 0.006, 0.001, 3.6, "#908a80");
    for (const x of [-1.1, 0.01, 1.12]) box(x, 0, -1.799, 0.008, 2.8, 0.002, "#9c988f");
    for (const y of [0.91, 1.85]) box(-2.25, y, -1.799, 4.5, 0.008, 0.002, "#a29d95");
    return new Float32Array(vertices);
  }

  for (let i = 0; i < 24; i++) {
    const x = -2.25 + i * 0.1875;
    for (let j = 0; j < 4; j++) {
      const z = -1.8 + j * 0.9 + (i % 2) * 0.23;
      const end = Math.min(1.8, z + 0.896);
      box(x, 0, z, 0.184, 0.005, end - z, theme.floor, 0.92 + ((i * 3 + j * 7) % 11) * 0.014);
    }
  }
  box(-2.22, 0.006, -1.799, 4.44, 0.07, 0.035, theme.trim);
  box(-2.24, 0.006, -1.8, 0.035, 0.07, 1.05, theme.trim);
  box(-2.24, 0.006, 0.24, 0.035, 0.07, 1.56, theme.trim);
  box(-1.01, 0.01, -1.08, 2.24, 0.013, 1.83, theme.rug);
  box(-1.14, 0.10, -1.58, 2.66, 0.27, 0.80, theme.fabric);
  box(-1.14, 0.33, -1.58, 2.66, 0.60, 0.19, theme.fabric, 0.90);
  box(-1.14, 0.34, -1.45, 0.19, 0.24, 0.64, theme.fabric, 0.92);
  box(1.33, 0.34, -1.45, 0.19, 0.24, 0.64, theme.fabric, 0.92);
  for (let i = 0; i < 3; i++) box(-0.94 + i * 0.75, 0.35, -1.36, 0.729, 0.11, 0.56, theme.fabric, 1.07);
  box(-0.81, 0.48, -1.37, 0.34, 0.31, 0.13, "#dac0a1");
  box(0.80, 0.49, -1.37, 0.30, 0.29, 0.13, "#bda689");
  box(-0.45, 0.37, -0.18, 1.10, 0.062, 0.55, theme.wood);
  for (const x of [-0.38, 0.52]) for (const z of [-0.12, 0.28]) box(x, 0.023, z, 0.06, 0.35, 0.06, theme.wood);
  box(0.12, 0.44, -0.04, 0.18, 0.035, 0.18, "#d7c3ad");
  box(-0.82, 1.30, -1.784, 1.86, 0.72, 0.04, theme.wood);
  box(-0.783, 1.335, -1.741, 1.786, 0.65, 0.009, "#dfd0b9");
  box(-0.49, 1.45, -1.73, 0.86, 0.11, 0.004, "#b2a08c");
  box(-1.68, 0, -1.05, 0.30, 0.05, 0.25, theme.wood);
  box(-1.56, 0.04, -0.95, 0.033, 1.50, 0.035, "#594631");
  box(-1.70, 1.54, -1.06, 0.34, 0.22, 0.27, "#f2e2c6");
  for (let i = 0; i < 9; i++) {
    const z = -1.46 + i * 0.052;
    box(2.172 - (i % 2) * 0.032, 0.085, z, 0.046, 2.55, 0.05, "#e6dbcb", i % 2 ? 0.96 : 1.02);
  }
  return new Float32Array(vertices);
}

function aftroProjection(aspect) {
  const range = 0.045 - 22;
  const f = 1 / Math.tan(Math.PI / 5.4);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(22+0.045)/range,-1, 0,0,2*22*0.045/range,0]);
}

function aftroView({ x, y, z, yaw, pitch }) {
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  const sp = Math.sin(pitch), cp = Math.cos(pitch);
  const rx = cy, rz = sy;
  const ux = -sy * sp, uy = cp, uz = cy * sp;
  const bx = -sy * cp, by = -sp, bz = cy * cp;
  return new Float32Array([
    rx, ux, bx, 0, 0, uy, by, 0, rz, uz, bz, 0,
    -(rx*x + rz*z), -(ux*x + uy*y + uz*z), -(bx*x + by*y + bz*z), 1,
  ]);
}

function createAftroScene(canvas, room) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: true, xrCompatible: true });
  if (!gl) return null;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  function program(vertex, fragment) {
    const result = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(result, vs);
    gl.attachShader(result, fs);
    gl.linkProgram(result);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(result, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(result));
    return result;
  }

  const meshProgram = program(`
    attribute vec3 position, normal, color;
    uniform mat4 projection, view;
    varying vec3 baseColor, worldPosition;
    varying float light;
    void main() {
      gl_Position = projection * view * vec4(position, 1.0);
      vec3 key = normalize(vec3(-0.7, 0.92, 0.32));
      light = 0.8 + 0.20 * max(dot(normal, key), 0.0);
      baseColor = color;
      worldPosition = position;
    }`,
    `precision mediump float;
    varying vec3 baseColor, worldPosition;
    varying float light;
    void main() {
      float bounce = 0.91 + 0.09 * smoothstep(0.0, 1.2, worldPosition.y);
      float daylight = 0.94 + 0.06 * smoothstep(-1.7, 2.2, worldPosition.x);
      gl_FragColor = vec4(baseColor * light * bounce * daylight, 1.0);
    }`);
  const panelProgram = program(`
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 projection, view;
    varying vec2 tex;
    void main() {
      gl_Position = projection * view * vec4(position, 1.0);
      tex = uv;
    }`,
    `precision mediump float;
    uniform sampler2D content;
    varying vec2 tex;
    void main() { gl_FragColor = texture2D(content, tex); }`);
  const uniforms = (p) => ({ projection: gl.getUniformLocation(p, "projection"), view: gl.getUniformLocation(p, "view") });
  const meshUniforms = uniforms(meshProgram), panelUniforms = uniforms(panelProgram);
  const meshPositions = ["position", "normal", "color"].map((key) => gl.getAttribLocation(meshProgram, key));
  const panelPosition = gl.getAttribLocation(panelProgram, "position");
  const panelUV = gl.getAttribLocation(panelProgram, "uv");
  const meshBuffer = gl.createBuffer(), panelBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  const hud = document.createElement("canvas");
  hud.width = 512;
  hud.height = 144;
  const hudContext = hud.getContext("2d");
  gl.bindBuffer(gl.ARRAY_BUFFER, panelBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -0.62,1.32,-1.61,0,0, 0.62,1.32,-1.61,1,0, 0.62,1.67,-1.61,1,1,
    -0.62,1.32,-1.61,0,0, 0.62,1.67,-1.61,1,1, -0.62,1.67,-1.61,0,1,
  ]), gl.STATIC_DRAW);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.enable(gl.DEPTH_TEST);
  let meshCount = 0;

  function setFinish(finish) {
    const geometry = aftroMesh(finish, room);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);
    meshCount = geometry.length / 9;
  }

  function setPanel(title, hint) {
    hudContext.fillStyle = "#211a15";
    hudContext.fillRect(0, 0, hud.width, hud.height);
    hudContext.fillStyle = "#ff682a";
    hudContext.fillRect(0, 0, 8, hud.height);
    hudContext.fillStyle = "#fff";
    hudContext.font = "700 43px system-ui";
    hudContext.fillText(title, 29, 60, 454);
    hudContext.fillStyle = "#eadbcd";
    hudContext.font = "600 23px system-ui";
    hudContext.fillText(hint, 29, 110, 454);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hud);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  function clear() {
    gl.clearColor(0.75, 0.82, 0.85, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  function draw(projection, view, withPanel = false) {
    gl.useProgram(meshProgram);
    gl.uniformMatrix4fv(meshUniforms.projection, false, projection);
    gl.uniformMatrix4fv(meshUniforms.view, false, view);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer);
    for (const [index, attribute] of meshPositions.entries()) {
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 36, index * 12);
    }
    gl.drawArrays(gl.TRIANGLES, 0, meshCount);
    meshPositions.forEach((position) => gl.disableVertexAttribArray(position));
    if (!withPanel) return;

    gl.useProgram(panelProgram);
    gl.uniformMatrix4fv(panelUniforms.projection, false, projection);
    gl.uniformMatrix4fv(panelUniforms.view, false, view);
    gl.bindBuffer(gl.ARRAY_BUFFER, panelBuffer);
    gl.enableVertexAttribArray(panelPosition);
    gl.enableVertexAttribArray(panelUV);
    gl.vertexAttribPointer(panelPosition, 3, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(panelUV, 2, gl.FLOAT, false, 20, 12);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(panelPosition);
    gl.disableVertexAttribArray(panelUV);
  }

  return { gl, setFinish, setPanel, draw, clear };
}
