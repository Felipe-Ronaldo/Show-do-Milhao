/* ============================================================
   CENA 3D - fundo espacial feito com Three.js (WebGL)
   Mostra uma nave que avança em direção a um planeta com anéis
   a cada resposta certa. O script.js controla a cena pelo
   objeto global Cena3D (acertou, errou, vitoria, reiniciar).
   Se o navegador não tiver WebGL, o jogo funciona sem o 3D.
   ============================================================ */
(function () {
  if (!window.THREE) return;
  const canvas = document.getElementById("cena3d");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // sem WebGL: continua só com o fundo em CSS
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const calmo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x14163f, 0.0035);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 700);
  camera.position.set(0, 2, 8);

  /* ---------- Luzes ---------- */
  scene.add(new THREE.AmbientLight(0x8890ff, 0.55));
  const sol = new THREE.DirectionalLight(0xfff4dc, 1.2);
  sol.position.set(20, 15, 25);
  scene.add(sol);
  const luzMagenta = new THREE.PointLight(0xc2417a, 1.2);
  luzMagenta.position.set(-30, 5, -60);
  scene.add(luzMagenta);
  const alarme = new THREE.PointLight(0xff3030, 0, 30); // acende quando o jogador erra
  scene.add(alarme);

  /* ---------- Estrelas ---------- */
  const N = 2500, posEstrelas = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    posEstrelas[i * 3] = (Math.random() - 0.5) * 320;
    posEstrelas[i * 3 + 1] = (Math.random() - 0.5) * 200;
    posEstrelas[i * 3 + 2] = -300 + Math.random() * 360;
  }
  const geoEstrelas = new THREE.BufferGeometry();
  geoEstrelas.setAttribute("position", new THREE.BufferAttribute(posEstrelas, 3));
  const estrelas = new THREE.Points(geoEstrelas,
    new THREE.PointsMaterial({ color: 0xfff4dc, size: 0.9, fog: false }));
  scene.add(estrelas);

  /* ---------- Planetas (listras coloridas feitas com cores nos vértices) ---------- */
  function criarPlaneta(raio, corA, corB) {
    const g = new THREE.SphereGeometry(raio, 64, 64);
    const pos = g.attributes.position, cores = [];
    const a = new THREE.Color(corA), b = new THREE.Color(corB), c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / raio, y = pos.getY(i) / raio;
      const k = (Math.sin(y * 9 + Math.sin(x * 3) * 1.2) + 1) / 2;
      c.copy(a).lerp(b, k);
      cores.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
    const corpo = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
    const brilho = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.12, 32, 32),
      new THREE.MeshBasicMaterial({ color: corB, side: THREE.BackSide, transparent: true,
        opacity: 0.25, blending: THREE.AdditiveBlending, fog: false }));
    const grupo = new THREE.Group();
    grupo.add(corpo, brilho);
    return grupo;
  }
  const destino = criarPlaneta(28, 0xf2b632, 0xc2417a);
  destino.position.set(40, 10, -200);
  scene.add(destino);
  const anel = new THREE.Mesh(new THREE.RingGeometry(42, 62, 128),
    new THREE.MeshBasicMaterial({ color: 0xfff4dc, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
  anel.position.copy(destino.position);
  anel.rotation.x = Math.PI / 2.4;
  scene.add(anel);
  const lua = criarPlaneta(6, 0x3fd0c9, 0x1f2260);
  lua.position.set(-22, -4, -70);
  scene.add(lua);

  /* ---------- Asteroides ---------- */
  const asteroides = [];
  const matAst = new THREE.MeshStandardMaterial({ color: 0x6b5b7b, flatShading: true, roughness: 1 });
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), matAst);
    const lado = Math.random() < 0.5 ? -1 : 1;
    m.position.set(lado * (5 + Math.random() * 25), (Math.random() - 0.5) * 18, -Math.random() * 180);
    m.scale.setScalar(0.3 + Math.random() * 1.2);
    m.userData.giro = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.6);
    scene.add(m);
    asteroides.push(m);
  }

  /* ---------- Nave (montada com formas simples) ---------- */
  const nave = new THREE.Group();     // posição no espaço
  const foguete = new THREE.Group();  // modelo (a ponta aponta para -z)
  const mat = (cor, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.4, metalness: 0.5 }, extra));
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.8, 24), mat(0xfff4dc));
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 24), mat(0xc2417a));
  ponta.position.y = 1.3;
  const janela = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), mat(0x3fd0c9, { emissive: 0x3fd0c9, emissiveIntensity: 0.6 }));
  janela.position.set(0, 0.35, 0.36);
  foguete.add(corpo, ponta, janela);
  for (let i = 0; i < 3; i++) {
    const asa = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.55), mat(0xf2b632));
    const ang = (i / 3) * Math.PI * 2;
    asa.position.set(Math.sin(ang) * 0.5, -0.75, Math.cos(ang) * 0.5);
    asa.rotation.y = ang;
    foguete.add(asa);
  }
  const chama = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 16),
    new THREE.MeshBasicMaterial({ color: 0xffa630, transparent: true, opacity: 0.85 }));
  chama.rotation.x = Math.PI;
  chama.position.y = -1.5;
  foguete.add(chama);
  foguete.rotation.x = -Math.PI / 2; // deita o foguete: ponta para a frente (-z)
  nave.add(foguete);
  nave.add(alarme);
  scene.add(nave);

  /* ---------- Estado e controle ---------- */
  let alvoZ = 0, impulso = 0, erroT = 0, mx = 0, my = 0;
  window.addEventListener("pointermove", (e) => {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  function ajustar() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", ajustar);
  ajustar();

  // API usada pelo script.js
  window.Cena3D = {
    acertou(n) { alvoZ = -n * 10; if (!calmo) impulso = 1; },       // avança um trecho
    errou() { erroT = calmo ? 0 : 2.2; },                           // nave gira e luz vermelha
    vitoria() { alvoZ = -172; if (!calmo) impulso = 1.5; },         // chega ao planeta
    reiniciar() {
      alvoZ = 0; impulso = 0; erroT = 0;
      nave.position.set(0, 0, 0);
      foguete.rotation.y = 0;
      camera.position.set(0, 2, 8);
    },
  };

  /* ---------- Animação (60 quadros por segundo) ---------- */
  const relogio = new THREE.Clock();
  function animar() {
    requestAnimationFrame(animar);
    const dt = Math.min(relogio.getDelta(), 0.05);
    const t = relogio.elapsedTime;

    nave.position.z += (alvoZ - nave.position.z) * Math.min(1, dt * 1.6);
    impulso = Math.max(0, impulso - dt * 0.6);
    if (erroT > 0) {
      erroT -= dt;
      foguete.rotation.y += dt * 14;             // giro descontrolado
      nave.position.x = Math.sin(t * 40) * 0.12;  // tremor
      alarme.intensity = 3 * Math.max(0, erroT / 2.2);
      if (erroT <= 0) { foguete.rotation.y = 0; nave.position.x = 0; alarme.intensity = 0; }
    }
    if (!calmo) nave.position.y = Math.sin(t * 1.5) * 0.15;
    chama.scale.set(1, 1 + impulso * 2.5 + Math.sin(t * 30) * 0.15, 1);

    // câmera segue a nave, com leve efeito de mouse e "dobra" de velocidade
    const px = calmo ? 0 : mx, py = calmo ? 0 : my;
    camera.position.x += (nave.position.x + px * 2.5 - camera.position.x) * 0.05;
    camera.position.y += (nave.position.y + 2 - py * 1.5 - camera.position.y) * 0.05;
    camera.position.z += (nave.position.z + 8 - camera.position.z) * 0.08;
    camera.lookAt(nave.position.x * 0.5, nave.position.y * 0.5, nave.position.z - 25);
    camera.fov = 60 + impulso * 18;
    camera.updateProjectionMatrix();

    destino.rotation.y += dt * 0.05;
    lua.rotation.y += dt * 0.15;
    anel.rotation.z += dt * 0.01;
    if (!calmo) asteroides.forEach((a) => {
      a.rotation.x += a.userData.giro.x * dt;
      a.rotation.y += a.userData.giro.y * dt;
    });
    renderer.render(scene, camera);
  }
  animar();
})();
