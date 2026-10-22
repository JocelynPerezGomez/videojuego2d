// ============================================
// CEMENTERIO EMBRUJADO - Canvas 2D
// ============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const contadorSpan = document.getElementById("contador");

const TOTAL_OBJETOS = 25;
let contadorClics = 0;

// ------- Carga de imágenes -------
const rutasImagenes = [
  "assets/fantasma.png",
  "assets/calabaza.png",
  "assets/tumba.png",
  "assets/zombie.png",
  "assets/murcielago.png"
];

const imagenes = {};
let imagenesCargadas = 0;

rutasImagenes.forEach((ruta) => {
  const img = new Image();
  img.src = ruta;
  img.onload = () => {
    imagenesCargadas++;
    if (imagenesCargadas === rutasImagenes.length) iniciarJuego();
  };
  img.onerror = () => {
    imagenesCargadas++;
    if (imagenesCargadas === rutasImagenes.length) iniciarJuego();
  };
  imagenes[ruta] = img;
});

// ------- Clase Objeto2D -------
class Objeto2D {
  constructor() {
    this.tamano = 50 + Math.random() * 30;
    this.ruta = rutasImagenes[Math.floor(Math.random() * rutasImagenes.length)];
    this.img = imagenes[this.ruta];

    this.x = Math.random() * (canvas.width - this.tamano);
    this.y = Math.random() * (canvas.height - this.tamano);

    this.velBase = 1.0 + Math.random() * 2.0;
    this.tipoMovimiento = ["arriba", "abajo", "diagonal", "circular"][
      Math.floor(Math.random() * 4)
    ];

    this.angulo = Math.random() * Math.PI * 2;
    this.radioCircular = 60 + Math.random() * 80;
    
    // Para evitar que se queden atorados
    this.framesQuieto = 0; 

    this.configurarVelocidad(this.velBase, true);
    
    this.activo = true;
    this.opacidad = 1;
    this.animacionChoque = 0;
    this.escalaGolpe = 1;
  }

  configurarVelocidad(vel, inicial = false) {
    switch (this.tipoMovimiento) {
      case "arriba":
        this.vx = 0;
        this.vy = -vel;
        break;
      case "abajo":
        this.vx = 0;
        this.vy = vel;
        break;
      case "diagonal":
        this.vx = (Math.random() > 0.5 ? 1 : -1) * vel;
        this.vy = (Math.random() > 0.5 ? 1 : -1) * vel;
        break;
      case "circular":
        this.velAngular = (Math.random() > 0.5 ? 1 : -1) * (vel / this.radioCircular);
        this.vx = 0;
        this.vy = 0;
        if (inicial) {
          this.centroX = this.x;
          this.centroY = this.y;
        }
        break;
    }
  }

  actualizar() {
    if (!this.activo) {
      this.opacidad += 0.05;
      if (this.opacidad >= 1) {
        this.opacidad = 1;
        this.activo = true;
      }
      return;
    }

    // --- DETECCIÓN DE ATASCOS ---
    const xAnterior = this.x;
    const yAnterior = this.y;

    // Movimiento
    if (this.tipoMovimiento === "circular") {
      this.angulo += this.velAngular;
      this.x = this.centroX + Math.cos(this.angulo) * this.radioCircular;
      this.y = this.centroY + Math.sin(this.angulo) * this.radioCircular;
    } else {
      this.x += this.vx;
      this.y += this.vy;
    }

    // Si se movió muy poquito, sumar frames quieto
    if (Math.abs(this.x - xAnterior) < 0.1 && Math.abs(this.y - yAnterior) < 0.1) {
      this.framesQuieto++;
      // Si lleva más de 30 frames atorado, darle un empujón
      if (this.framesQuieto > 30) {
        this.x += (Math.random() - 0.5) * 10;
        this.y += (Math.random() - 0.5) * 10;
        this.configurarVelocidad(this.velBase, true);
        this.framesQuieto = 0;
      }
    } else {
      this.framesQuieto = 0;
    }

    // Rebote con paredes (CORREGIDO, ya no se atasca)
    if (this.x <= 0) { 
      this.x = 0; 
      this.vx = Math.abs(this.vx); // Empujar a la derecha
    }
    if (this.x + this.tamano >= canvas.width) {
      this.x = canvas.width - this.tamano;
      this.vx = -Math.abs(this.vx); // Empujar a la izquierda
    }
    if (this.y <= 0) { 
      this.y = 0; 
      this.vy = Math.abs(this.vy); // Empujar hacia abajo
    }
    if (this.y + this.tamano >= canvas.height) {
      this.y = canvas.height - this.tamano;
      this.vy = -Math.abs(this.vy); // Empujar hacia arriba
    }

    // Animación de choque
    if (this.animacionChoque > 0) {
      this.animacionChoque--;
      if (this.animacionChoque > 10) this.escalaGolpe = 1.2;
      else this.escalaGolpe = 0.9;
    } else {
      this.escalaGolpe = 1;
    }
  }

  reposicionar() {
    this.x = Math.random() * (canvas.width - this.tamano);
    this.y = Math.random() * (canvas.height - this.tamano);
    this.centroX = this.x;
    this.centroY = this.y;
    this.activo = false;
    this.opacidad = 0;
    this.framesQuieto = 0; // Reiniciar contador
  }

  colisionaCon(otro) {
    const dx = (this.x + this.tamano/2) - (otro.x + otro.tamano/2);
    const dy = (this.y + this.tamano/2) - (otro.y + otro.tamano/2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.tamano + otro.tamano) / 2;
  }

  dibujar() {
    ctx.save();
    ctx.globalAlpha = this.opacidad;

    const centroX = this.x + this.tamano / 2;
    const centroY = this.y + this.tamano / 2;
    
    ctx.translate(centroX, centroY);
    ctx.scale(this.escalaGolpe, this.escalaGolpe);
    ctx.translate(-centroX, -centroY);

    if (this.img && this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.tamano, this.tamano);
    } else {
      ctx.fillStyle = "#ff6600";
      ctx.beginPath();
      ctx.arc(centroX, centroY, this.tamano / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.animacionChoque > 8) {
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("¡BUU!", centroX, this.y - 10);
    }

    ctx.restore();
  }

  contienePunto(px, py) {
    return (
      px >= this.x && px <= this.x + this.tamano &&
      py >= this.y && py <= this.y + this.tamano
    );
  }
}

// ------- Estado del juego -------
let objetos = [];

function iniciarJuego() {
  objetos = [];
  for (let i = 0; i < TOTAL_OBJETOS; i++) {
    objetos.push(new Objeto2D());
  }
  bucle();
}

// ------- Bucle principal -------
function bucle() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < objetos.length; i++) {
    for (let j = i + 1; j < objetos.length; j++) {
      if (objetos[i].activo && objetos[j].activo && objetos[i].colisionaCon(objetos[j])) {
        
        const dx = (objetos[j].x + objetos[j].tamano/2) - (objetos[i].x + objetos[i].tamano/2);
        const dy = (objetos[j].y + objetos[j].tamano/2) - (objetos[i].y + objetos[i].tamano/2);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const solapamiento = (objetos[i].tamano + objetos[j].tamano) / 2 - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Separación física (empuje)
        objetos[i].x -= nx * (solapamiento / 2);
        objetos[i].y -= ny * (solapamiento / 2);
        objetos[j].x += nx * (solapamiento / 2);
        objetos[j].y += ny * (solapamiento / 2);

        // Rebote suave (CORREGIDO para no atascarse)
        if (objetos[i].tipoMovimiento !== "circular") {
          objetos[i].vx = -objetos[i].vx;
          objetos[i].vy = -objetos[i].vy;
          objetos[i].animacionChoque = 15;
          objetos[i].framesQuieto = 0;
        }
        if (objetos[j].tipoMovimiento !== "circular") {
          objetos[j].vx = -objetos[j].vx;
          objetos[j].vy = -objetos[j].vy;
          objetos[j].animacionChoque = 15;
          objetos[j].framesQuieto = 0;
        }
      }
    }
  }

  objetos.forEach((o) => { o.actualizar(); o.dibujar(); });

  requestAnimationFrame(bucle);
}

// ------- Clic del mouse -------
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const escalaX = canvas.width / rect.width;
  const escalaY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * escalaX;
  const my = (e.clientY - rect.top) * escalaY;

  for (let i = objetos.length - 1; i >= 0; i--) {
    if (objetos[i].activo && objetos[i].contienePunto(mx, my)) {
      objetos[i].reposicionar();
      contadorClics++;
      contadorSpan.textContent = contadorClics;
      break;
    }
  }
});

// ------- Música de fondo -------
const musica = document.getElementById("musicaFondo");
document.addEventListener("click", () => {
  if (musica.paused) {
    musica.volume = 0.5;
    musica.play().catch(() => {});
  }
}, { once: true });