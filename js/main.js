(() => {
  // src/PerlinNoise.js
  var PerlinNoise = class {
    constructor(seed2 = Math.random()) {
      this.grad3 = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1]
      ];
      this.p = [];
      this.seed(seed2);
      this.perm = [];
      for (let i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
      }
    }
    seed(seed2) {
      const random = this.xorshift(seed2);
      this.p = [];
      for (let i = 0; i < 256; i++) {
        this.p[i] = Math.floor(random() * 256);
      }
    }
    xorshift(seed2) {
      let x = seed2 ^ 3735928559;
      return function() {
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        return (x < 0 ? ~x + 1 : x) / 4294967295 + 0.5;
      };
    }
    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }
    lerp(t, a, b) {
      return a + t * (b - a);
    }
    grad(hash, x, y, z) {
      let h2 = hash & 15;
      let u = h2 < 8 ? x : y;
      let v = h2 < 4 ? y : h2 === 12 || h2 === 14 ? x : z;
      return ((h2 & 1) === 0 ? u : -u) + ((h2 & 2) === 0 ? v : -v);
    }
    noise(x, y, z) {
      let X = Math.floor(x) & 255;
      let Y = Math.floor(y) & 255;
      let Z = Math.floor(z) & 255;
      x -= Math.floor(x);
      y -= Math.floor(y);
      z -= Math.floor(z);
      let u = this.fade(x);
      let v = this.fade(y);
      let w2 = this.fade(z);
      let A = this.perm[X] + Y;
      let AA = this.perm[A] + Z;
      let AB = this.perm[A + 1] + Z;
      let B = this.perm[X + 1] + Y;
      let BA = this.perm[B] + Z;
      let BB = this.perm[B + 1] + Z;
      return this.lerp(w2, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z)), this.lerp(u, this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z))), this.lerp(v, this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1)), this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))));
    }
    generate2DNoise(width = 1e3, height = 1e3, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2) {
      let noiseArray = [];
      for (let y = 0; y < height; y++) {
        let row = [];
        for (let x = 0; x < width; x++) {
          let amplitude = 1;
          let frequency = scale;
          let noiseValue = 0;
          for (let o = 0; o < octaves; o++) {
            noiseValue += amplitude * this.noise(x * frequency, y * frequency, 0);
            amplitude *= persistence;
            frequency *= lacunarity;
          }
          row.push((noiseValue + 1) / 2);
        }
        noiseArray.push(row);
      }
      return noiseArray;
    }
    generate3DNoise(width = 1e3, height = 500, depth = 10, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2) {
      let noiseArray = [];
      for (let z = 0; z < depth; z++) {
        let slice = [];
        for (let y = 0; y < height; y++) {
          let row = [];
          for (let x = 0; x < width; x++) {
            let amplitude = 1;
            let frequency = scale;
            let noiseValue = 0;
            for (let o = 0; o < octaves; o++) {
              noiseValue += amplitude * this.noise(x * frequency, y * frequency, z * frequency);
              amplitude *= persistence;
              frequency *= lacunarity;
            }
            row.push((noiseValue + 1) / 2);
          }
          slice.push(row);
        }
        noiseArray.push(slice);
      }
      return noiseArray;
    }
    createNoiseImage(width = 400, height = 400, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2) {
      let noiseArray = this.generate2DNoise(width, height, scale, octaves, persistence, lacunarity);
      let canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      let context = canvas.getContext("2d");
      let imageData = context.createImageData(width, height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let value = Math.floor(noiseArray[y][x] * 255);
          let index = (x + y * width) * 4;
          if (value > 200) {
            imageData.data[index] = value * 2;
            imageData.data[index + 1] = value * 2;
            imageData.data[index + 2] = value;
          }
          if (value < 65) {
            imageData.data[index] = 180;
            imageData.data[index + 1] = 190;
            imageData.data[index + 2] = 30;
          } else {
            imageData.data[index] = value * 1;
            imageData.data[index + 1] = value * 2;
            imageData.data[index + 2] = value * 0.5;
          }
          imageData.data[index + 3] = 255;
        }
      }
      context.putImageData(imageData, 0, 0);
      return canvas;
    }
  };

  // src/index.src.js
  var w = window.innerWidth;
  var h = window.innerHeight;
  var seed = Math.random() * 1e6;
  var perlin;
  var noiseImage;
  var ImgDiv = document.querySelector(".image");
  var textoDiv = document.querySelector(".texto");
  var links = [...document.querySelectorAll(".texto .citem")];
  links.forEach((l) => {
    l.addEventListener("click", clk);
    console.log(l);
  });
  setInterval(() => {
    addImage();
  }, 4e3);
  setInterval(() => {
    textoDiv.style.opacity = 1;
  }, 1e3), addImage();
  function clk(e) {
    console.log("clk", this.getAttribute("data-folder"));
  }
  function addImage() {
    seed = Math.random() * 1e3;
    perlin = new PerlinNoise(seed);
    let randomScale = 23e-4;
    noiseImage = perlin.createNoiseImage(w, h, randomScale, 1, 0.9, 2);
    noiseImage.style.opacity = 0;
    ImgDiv.appendChild(noiseImage);
    if (ImgDiv.children.length > 2) {
      let fc = ImgDiv.firstChild;
      ImgDiv.removeChild(fc);
    }
    setTimeout(() => {
      noiseImage.style.transition = "opacity 1.8s ease-in-out";
      noiseImage.style.opacity = 1;
    }, 500);
  }
  (() => {
    function loadImages() {
      const folderPath = "img";
      fetch("src/getImages.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          folderPath
        })
      }).then((response) => response.json()).then((data) => {
        const imageContainer = document.querySelector(".imgs");
        imageContainer.innerHTML = "";
        if (Array.isArray(data)) {
          data.forEach((image) => {
            const img = document.createElement("img");
            img.src = `src/${folderPath}/${image}`;
            img.style.height = "300px";
            img.style.width = "auto";
            img.style.margin = "0 20px 20px 0";
            img.style.display = "inline-block";
            imageContainer.appendChild(img);
          });
        } else {
          console.error("Error:", data.error);
        }
      }).catch((error) => console.error("Error:", error));
    }
  })();
})();
