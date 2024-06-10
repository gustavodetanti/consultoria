class PerlinNoise {
    constructor(seed = Math.random()) {
        this.grad3 = [
            [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
            [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
        ];
        this.p = [];
        this.seed(seed);
        this.perm = [];
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
        }
    }

    seed(seed) {
        const random = this.xorshift(seed);
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(random() * 256);
        }
    }

    xorshift(seed) {
        let x = seed ^ 0xDEADBEEF;
        return function() {
            x ^= x << 13;
            x ^= x >> 17;
            x ^= x << 5;
            return (x < 0 ? ~x + 1 : x) / 0xFFFFFFFF + 0.5;
        };
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y, z) {
        let h = hash & 15;
        let u = h < 8 ? x : y;
        let v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
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
        let w = this.fade(z);

        let A = this.perm[X] + Y;
        let AA = this.perm[A] + Z;
        let AB = this.perm[A + 1] + Z;
        let B = this.perm[X + 1] + Y;
        let BA = this.perm[B] + Z;
        let BB = this.perm[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z),
            this.grad(this.perm[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.perm[AB], x, y - 1, z),
                this.grad(this.perm[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1),
                this.grad(this.perm[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1),
                    this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))));
    }

    generate2DNoise(width, height, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2.0) {
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
                row.push((noiseValue + 1) / 2); // Normalize to [0, 1]
            }
            noiseArray.push(row);
        }
        return noiseArray;
    }

    generate3DNoise(width, height, depth, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2.0) {
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
                    row.push((noiseValue + 1) / 2); // Normalize to [0, 1]
                }
                slice.push(row);
            }
            noiseArray.push(slice);
        }
        return noiseArray;
    }

    createNoiseImage(width, height, scale = 0.1, octaves = 1, persistence = 0.5, lacunarity = 2.0) {
        let noiseArray = this.generate2DNoise(width, height, scale, octaves, persistence, lacunarity);
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let context = canvas.getContext('2d');
        let imageData = context.createImageData(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let value = Math.floor(noiseArray[y][x] * 255);
                let index = (x + y * width) * 4;
                if(value>200){
                  imageData.data[index] = value*2;
                imageData.data[index + 1] = value*2;
                imageData.data[index + 2] = value;
 
                }   if(value<65){
                  imageData.data[index] = 180;
                imageData.data[index + 1] = 190;
                imageData.data[index + 2] = 30;
 
                }else {
                imageData.data[index] = value*1;
                imageData.data[index + 1] = value*2;
                imageData.data[index + 2] = value*0.5;
                }
                imageData.data[index + 3] = 255; // Alpha channel
            }
        }
        context.putImageData(imageData, 0, 0);
        return canvas;
    }
}





let w=window.innerWidth;
let h=window.innerHeight;
// Usage Example
let seed = Math.random()*1000000; // You can change this to any number
let perlin = new PerlinNoise(seed);
let noiseImage;// = perlin.createNoiseImage(w, h, 0.05, 4, 0.5, 2.0);
//document.body.appendChild(noiseImage);
 
let ImgDiv=document.querySelector('.image');
 
let textoDiv=document.querySelector('.texto');
 
setInterval(()=>{
  addImage();
},4000);
setInterval(()=>{
  textoDiv.style.opacity=1;
},1000),
addImage();

function addImage(){
  seed = Math.random()*1000;  
 perlin = new PerlinNoise(seed);

let randomScale=0.0023;//Number(`${Math.random()*0.0019+0.0001}`);//ideal 0.002

 noiseImage = perlin.createNoiseImage(w, h, randomScale, 1  , 0.9, 2.0);

noiseImage.style.opacity=0;
ImgDiv.appendChild(noiseImage);

if(ImgDiv.children.length>2){
let fc=ImgDiv.firstChild;
ImgDiv.removeChild(fc); 
}
setTimeout(()=>{
  noiseImage.style.transition='opacity 1.8s ease-in-out';
  noiseImage.style.opacity=1;},500);



}



