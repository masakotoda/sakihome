
class Converter {

    static getPixelRGB(image, x, y) {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);

        const pixel = ctx.getImageData(x, y, 1, 1).data;

        return {
            r: pixel[0],
            g: pixel[1],
            b: pixel[2]
        };
    }

    static RGB2CMYK(r, g, b) {
        const c = 1 - (r / 255);
        const m = 1 - (g / 255);
        const y = 1 - (b / 255);
        const k = Math.min(c, m, y);
        return {
            c: (c - k) / (1 - k),
            m: (m - k) / (1 - k),
            y: (y - k) / (1 - k),
            k: k
        };
    }

    static CMYK2RGB(c, m, y, k) {
        const r = 255 * (1 - c) * (1 - k);
        const g = 255 * (1 - m) * (1 - k);
        const b = 255 * (1 - y) * (1 - k);
        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b)
        };
    }

    static RGB2CMY(r, g, b) {
        const c = 1 - (r / 255);
        const m = 1 - (g / 255);
        const y = 1 - (b / 255);
        return {
            c: c,
            m: m,
            y: y
        };
    }

    static CMY2RGB(c, m, y) {
        const r = 255 * (1 - c);
        const g = 255 * (1 - m);
        const b = 255 * (1 - y);
        return {
            r: Math.round(r),
            g: Math.round(g),
            b: Math.round(b)
        };
    }

    // Hue (H)
    //     0–360°, representing the color angle around the cylinder.
    //     0° or 360° = Red, 120° = Green, 240° = Blue
    // Saturation (S)
    //     0–100%, representing color purity 
    //     0% = completely gray (no color)
    //     50% = medium saturation (color mixed with gray)
    //     100% = full, vivid color
    // Value (V): 0–100%, representing brightness
    //     0% = black (no brightness)
    //     50% = normal brightness (neither dark nor bright)
    //     100% = full brightness (brightest color)
    // Lightness (L): 0–100%, representing lightness
    //     0% = black (no light)
    //     50% = normal color (neither dark nor light)
    //     100% = white (full light)

    static RGB2HSV(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        // Calculate hue
        if (max === min) {
            h = 0;
        } else if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else {
            h = (r - g) / d + 4;
        }
        h /= 6;

        return {
            h: h,
            s: s,
            v: v
        };
    }

    static HSV2RGB(h, s, v) {
        let r, g, b;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    static RGB2HSL(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let h = 0;
        const l = (max + min) / 2;
        const d = max - min;

        let s = 0;

        if (d !== 0) {
            s = d / (1 - Math.abs(2 * l - 1));

            if (max === r) {
                h = (g - b) / d + (g < b ? 6 : 0);
            } else if (max === g) {
                h = (b - r) / d + 2;
            } else {
                h = (r - g) / d + 4;
            }

            h /= 6;
        }

        return { h, s, l };
    }

    static HSL2RGB(h, s, l) {
        let r, g, b;

        if (s === 0) {
            // Achromatic (gray)
            r = g = b = l;
        } else {
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const hp = h * 6;
            const x = c * (1 - Math.abs(hp % 2 - 1));
            const m = l - c / 2;

            if (hp < 1) {
                r = c; g = x; b = 0;
            } else if (hp < 2) {
                r = x; g = c; b = 0;
            } else if (hp < 3) {
                r = 0; g = c; b = x;
            } else if (hp < 4) {
                r = 0; g = x; b = c;
            } else if (hp < 5) {
                r = x; g = 0; b = c;
            } else {
                r = c; g = 0; b = x;
            }

            r += m;
            g += m;
            b += m;
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    static RGB2Gray(r, g, b) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        return {
            gray: Math.round(gray)
        };
    }
}


document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0]; // Get the first selected file

    // Validate file existence and type
    if (!file) {
        document.getElementById('photo').src = '';
        return;
    }
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        event.target.value = ''; // Reset input
        return;
    }

    // Create a temporary URL for the file and set it as the image source
    const imgURL = URL.createObjectURL(file);
    const previewImg = document.getElementById('photo');
    previewImg.src = imgURL;

    previewImg.onload = () => {
        // Optional: revoke the object URL after the image loads to free memory
        URL.revokeObjectURL(imgURL);

        //const img = document.getElementById("photo");
        //const canvas = document.getElementById("output");

        //const color = getPixelRGB(img, 100, 50);
        //console.log(color); // { r: ..., g: ..., b: ... }

        applyEffect();
    };
});

const state = {
    selectedEffect: "rgb",
    effects: {
        "rgb": {
            "name": "RGB"
        },
        "cmy": {
            "name": "CMY"
        },
        "cmyk": {
            "name": "CMYK"
        },
        "hsv": {
            "name": "HSV"
        },
        "hsl": {
            "name": "HSL"
        },
        "gray": {
            "name": "Grayscale"
        },
        "step-color": {
            "name": "Limit color palette (RGB)"
        },
        "step-color-hsv": {
            "name": "Limit color palette (HSV)"
        },
        "harmonic-armature": {
            "name": "Harmonic Armature"
        }
    },
    factorR: 100,
    factorG: 100,
    factorB: 100,
    factorC: 100,
    factorM: 100,
    factorY: 100,
    factorK: 100,
    offsetH: 0,
    factorS: 100,
    factorL: 100,
    factorV: 100,
    factorGray: 100,
    colorStep: 16, // 4913 colors
    colorStepHSV: {
        stepH: 20,
        startSV: 10,
        stepSV: 20
    }, // 450 colors - H-step = 20 deg, SV = start at 10%, step by 20%
    maxFactor: 200,
    maxOffsetH: 180,
    highQuality: false
};

const elements = {
    effectSelect: document.getElementById("effectSelect"),
    factorR: document.getElementById("factorR"),
    factorG: document.getElementById("factorG"),
    factorB: document.getElementById("factorB"),
    factorC: document.getElementById("factorC"),
    factorM: document.getElementById("factorM"),
    factorY: document.getElementById("factorY"),
    factorK: document.getElementById("factorK"),
    offsetH: document.getElementById("offsetH"),
    factorS: document.getElementById("factorS"),
    factorL: document.getElementById("factorL"),
    factorV: document.getElementById("factorV"),
    factorGray: document.getElementById("factorGray"),
    colorStepSelect: document.getElementById("colorStepSelect"),
    colorStepHSVSelect: document.getElementById("colorStepHSVSelect"),
    rgbPanel: document.getElementById("rgbPanel"),
    cmykPanel: document.getElementById("cmykPanel"),
    hsvlPanel: document.getElementById("hsvlPanel"),
    grayPanel: document.getElementById("grayPanel"),
    stepColorPanel: document.getElementById("stepColorPanel"),
    stepColorHSVPanel: document.getElementById("stepColorHSVPanel"),
    highQuality: document.getElementById("highQuality"),
    resetAll: document.getElementById("resetAll"),
};

function updateUI() {
    elements.factorB.value = state.factorB;
    elements.factorG.value = state.factorG;
    elements.factorR.value = state.factorR;
    elements.factorB.max = state.maxFactor;
    elements.factorG.max = state.maxFactor;
    elements.factorR.max = state.maxFactor;

    elements.factorC.value = state.factorC;
    elements.factorM.value = state.factorM;
    elements.factorY.value = state.factorY;
    elements.factorK.value = state.factorK;
    elements.factorC.max = state.maxFactor;
    elements.factorM.max = state.maxFactor;
    elements.factorY.max = state.maxFactor;
    elements.factorK.max = state.maxFactor;

    elements.offsetH.value = state.offsetH;
    elements.factorS.value = state.factorS;
    elements.factorL.value = state.factorL;
    elements.factorV.value = state.factorV;
    elements.offsetH.max = state.maxOffsetH;
    elements.offsetH.min = -state.maxOffsetH;
    elements.factorS.max = state.maxFactor;
    elements.factorL.max = state.maxFactor;
    elements.factorV.max = state.maxFactor;

    elements.factorGray.value = state.factorGray;
    elements.factorGray.max = state.maxFactor;

    elements.highQuality.checked = state.highQuality;
}

updateUI();

function applyRGB(data, i) {
    const R = data[i] * state.factorR / 100;
    const G = data[i + 1] * state.factorG / 100;
    const B = data[i + 2] * state.factorB / 100;
    data[i] = Math.min(255, Math.max(0, R));
    data[i + 1] = Math.min(255, Math.max(0, G));
    data[i + 2] = Math.min(255, Math.max(0, B));
}

function applyCMYK(data, i) {
    const cmyk = Converter.RGB2CMYK(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    const C = cmyk.c * state.factorC / 100;
    const M = cmyk.m * state.factorM / 100;
    const Y = cmyk.y * state.factorY / 100;
    const K = cmyk.k * state.factorK / 100;
    const rgb = Converter.CMYK2RGB(C, M, Y, K);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
}

function applyCMY(data, i) {
    const cmyk = Converter.RGB2CMY(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    const C = cmyk.c * state.factorC / 100;
    const M = cmyk.m * state.factorM / 100;
    const Y = cmyk.y * state.factorY / 100;
    const rgb = Converter.CMY2RGB(C, M, Y);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
}

function applyHSV(data, i) {
    const hsv = Converter.RGB2HSV(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    const offsetH = state.offsetH < 0 ? state.offsetH + 360 : state.offsetH;
    var H = hsv.h + offsetH / 360;
    if (H > 1) {
        H -= 1;
    }
    const S = hsv.s * state.factorS / 100;
    const V = hsv.v * state.factorV / 100;
    const rgb = Converter.HSV2RGB(H, S, V);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
}

function applyHSL(data, i) {
    const hsl = Converter.RGB2HSL(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    const offsetH = state.offsetH < 0 ? state.offsetH + 360 : state.offsetH;
    var H = hsl.h + offsetH / 360;
    if (H > 1) {
        H -= 1;
    }
    const S = hsl.s * state.factorS / 100;
    const L = hsl.l * state.factorL / 100;
    const rgb = Converter.HSL2RGB(H, S, L);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
}

function applyGray(data, i) {
    const gray = Converter.RGB2Gray(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    const G = gray.gray * state.factorGray / 100;
    data[i] = Math.min(255, Math.max(0, G));
    data[i + 1] = Math.min(255, Math.max(0, G));
    data[i + 2] = Math.min(255, Math.max(0, G));
}

function applyStepColor(data, i) {
    const step = state.colorStep;
    data[i] = Math.min(255, Math.max(0, step * Math.floor((data[i] + step / 2) / step)));
    data[i + 1] = Math.min(255, Math.max(0, step * Math.floor((data[i + 1] + step / 2) / step)));
    data[i + 2] = Math.min(255, Math.max(0, step * Math.floor((data[i + 2] + step / 2) / step)));
}

function applyStepColorHSV(data, i) {
    const step = state.colorStepHSV;
    const hsv = Converter.RGB2HSV(
        data[i],
        data[i + 1],
        data[i + 2]
    );
    hsv.h *= 360;
    hsv.s *= 100;
    hsv.v *= 100;

    var h = step.stepH * Math.floor((hsv.h + step.stepH / 2) / step.stepH);
    var s = step.startSV + step.stepSV * Math.floor((hsv.s - step.startSV) / step.stepSV);
    var v = step.startSV + step.stepSV * Math.floor((hsv.v - step.startSV) / step.stepSV);
    h = Math.min(360, Math.max(0, h)) / 360;
    s = Math.min(100, Math.max(0, s)) / 100;
    v = Math.min(100, Math.max(0, v)) / 100;

    const rgb = Converter.HSV2RGB(h, s, v);
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
}

function applyEffect() {
    const img = document.getElementById("photo");
    const canvas = document.getElementById("output");
    const ctx = canvas.getContext("2d");

    const scaleRoot = parseFloat(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--scale')
    );

    // Render the original image onto the canvas
    const finalWidth = img.clientWidth * scaleRoot;
    const finalScale = finalWidth / img.naturalWidth;

    if (state.highQuality) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
    }
    else {
        canvas.width = img.clientWidth * scaleRoot;
        canvas.height = img.clientHeight * scaleRoot;
    }
    //canvas.save();
    //canvas.scale(0.5, 0.5);
    //ctx.imageSmoothingEnabled = true;
    //ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    //canvas.restore();

    // Get pixel data
    const imageData = ctx.getImageData(
        0, 0, canvas.width, canvas.height
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        if (state.selectedEffect === "rgb") {
            applyRGB(data, i);
        }
        else if (state.selectedEffect === "cmyk") {
            applyCMYK(data, i);
        }
        else if (state.selectedEffect === "cmy") {
            applyCMY(data, i);
        }
        else if (state.selectedEffect === "hsv") {
            applyHSV(data, i);
        }
        else if (state.selectedEffect === "hsl") {
            applyHSL(data, i);
        }
        else if (state.selectedEffect === "gray") {
            applyGray(data, i);
        }
        else if (state.selectedEffect === "step-color") {
            applyStepColor(data, i);
        }
        else if (state.selectedEffect === "step-color-hsv") {
            applyStepColorHSV(data, i);
        }
    }

    // Render the altered image
    if (state.selectedEffect === "harmonic-armature") {
        drawHarmonicArmature(ctx, canvas.width, canvas.height);
    }
    else {
        ctx.putImageData(imageData, 0, 0);
    }
    if (state.highQuality) {
        canvas.style.transformOrigin = "top left";
        canvas.style.transform = `scale(${finalScale}, ${finalScale})`;
    }
    else {
        canvas.style.transform = "scale(1, 1)";
    }
}

function drawHarmonicArmature(ctx, width, height) {
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.moveTo(width, 0);
    ctx.lineTo(0, height,)
    ctx.stroke();

    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.moveTo(width / 2, 0);
    ctx.lineTo(0, height,)
    ctx.stroke();

    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.moveTo(0, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.moveTo(width, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.moveTo(0, height / 2);
    ctx.lineTo(width / 2, 0);
    ctx.stroke();

    ctx.moveTo(0, height / 2);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.moveTo(width, height / 2);
    ctx.lineTo(width / 2, 0);
    ctx.stroke();

    ctx.moveTo(width, height / 2);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.moveTo(0, 0);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    ctx.moveTo(width, 0);
    ctx.lineTo(0, height / 2);
    ctx.stroke();

    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height);
    ctx.stroke();

    ctx.moveTo(width, height / 2);
    ctx.lineTo(0, height);
    ctx.stroke();
}

function updateColorMode(mode) {
    elements.rgbPanel.style.display = "none";
    elements.cmykPanel.style.display = "none";
    elements.hsvlPanel.style.display = "none";
    elements.grayPanel.style.display = "none";
    elements.stepColorPanel.style.display = "none";
    elements.stepColorHSVPanel.style.display = "none";

    state.selectedEffect = mode;
    if (state.selectedEffect === "rgb") {
        elements.rgbPanel.style.display = "block";
    }
    else if (state.selectedEffect === "cmyk") {
        elements.cmykPanel.style.display = "block";
        elements.factorK.parentElement.style.display = "flex";
    }
    else if (state.selectedEffect === "cmy") {
        elements.cmykPanel.style.display = "block";
        elements.factorK.parentElement.style.display = "none";
    }
    else if (state.selectedEffect === "hsv") {
        elements.hsvlPanel.style.display = "block";
        elements.factorL.parentElement.style.display = "none";
        elements.factorV.parentElement.style.display = "flex";
    }
    else if (state.selectedEffect === "hsl") {
        elements.hsvlPanel.style.display = "block";
        elements.factorL.parentElement.style.display = "flex";
        elements.factorV.parentElement.style.display = "none";
    }
    else if (state.selectedEffect === "gray") {
        elements.grayPanel.style.display = "block";
    }
    else if (state.selectedEffect === "step-color") {
        elements.stepColorPanel.style.display = "block";
    }
    else if (state.selectedEffect === "step-color-hsv") {
        elements.stepColorHSVPanel.style.display = "block";
    }
}

updateColorMode(state.selectedEffect);

elements.effectSelect.addEventListener("change", (event) => {
    updateColorMode(event.target.value);
    applyEffect();
});

elements.colorStepSelect.addEventListener("change", (event) => {
    state.colorStep = event.target.value;
    applyEffect();
});

elements.colorStepHSVSelect.addEventListener("change", (event) => {
    const parts = event.target.value.split(",");
    const stepH = parseFloat(parts[0]);
    const startSV = parseFloat(parts[1]);
    const stepSV = parseFloat(parts[2]);

    state.colorStepHSV.stepH = stepH;
    state.colorStepHSV.startSV = startSV;
    state.colorStepHSV.stepSV = stepSV;

    applyEffect();
});

elements.factorB.addEventListener("input", (event) => {
    state.factorB = parseFloat(event.target.value);
    state.factorB = Math.min(state.maxFactor, Math.max(0, state.factorB));
    applyEffect();
});

elements.factorG.addEventListener("input", (event) => {
    state.factorG = parseFloat(event.target.value);
    state.factorG = Math.min(state.maxFactor, Math.max(0, state.factorG));
    applyEffect();
});

elements.factorR.addEventListener("input", (event) => {
    state.factorR = parseFloat(event.target.value);
    state.factorR = Math.min(state.maxFactor, Math.max(0, state.factorR));
    applyEffect();
});

elements.factorC.addEventListener("input", (event) => {
    state.factorC = parseFloat(event.target.value);
    state.factorC = Math.min(state.maxFactor, Math.max(0, state.factorC));
    applyEffect();
});

elements.factorM.addEventListener("input", (event) => {
    state.factorM = parseFloat(event.target.value);
    state.factorM = Math.min(state.maxFactor, Math.max(0, state.factorM));
    applyEffect();
});

elements.factorY.addEventListener("input", (event) => {
    state.factorY = parseFloat(event.target.value);
    state.factorY = Math.min(state.maxFactor, Math.max(0, state.factorY));
    applyEffect();
});

elements.factorK.addEventListener("input", (event) => {
    state.factorK = parseFloat(event.target.value);
    state.factorK = Math.min(state.maxFactor, Math.max(0, state.factorK));
    applyEffect();
});

elements.offsetH.addEventListener("input", (event) => {
    state.offsetH = parseFloat(event.target.value);
    state.offsetH = Math.min(state.maxOffsetH, Math.max(-state.maxOffsetH, state.offsetH));
    applyEffect();
});

elements.factorS.addEventListener("input", (event) => {
    state.factorS = parseFloat(event.target.value);
    state.factorS = Math.min(state.maxFactor, Math.max(0, state.factorS));
    applyEffect();
});

elements.factorV.addEventListener("input", (event) => {
    state.factorV = parseFloat(event.target.value);
    state.factorV = Math.min(state.maxFactor, Math.max(0, state.factorV));
    applyEffect();
});

elements.factorL.addEventListener("input", (event) => {
    state.factorL = parseFloat(event.target.value);
    state.factorL = Math.min(state.maxFactor, Math.max(0, state.factorL));
    applyEffect();
});

elements.factorGray.addEventListener("input", (event) => {
    state.factorGray = parseFloat(event.target.value);
    state.factorGray = Math.min(state.maxFactor, Math.max(0, state.factorGray));
    applyEffect();
});

elements.highQuality.addEventListener("change", (event) => {
    state.highQuality = event.target.checked;
    applyEffect();
});

elements.resetAll.addEventListener("click", (event) => {
    state.factorR = 100;
    state.factorG = 100;
    state.factorB = 100;
    state.factorC = 100;
    state.factorM = 100;
    state.factorY = 100;
    state.factorK = 100;
    state.offsetH = 0;
    state.factorS = 100;
    state.factorL = 100;
    state.factorV = 100;
    state.factorGray = 100;
    updateUI();
    applyEffect();
});

elements.effectSelect.replaceChildren();
Object.entries(state.effects).forEach(([key, value]) => {
    const option = elements.effectSelect.appendChild(new Option(value.name, key));
    option.selected = key === state.selectedEffect;
});

for (const ele of document.querySelectorAll('.spinner.increment')) {
    ele.addEventListener('click', (event) => {
        const input = event.target.parentElement.querySelector('input[type=number]');
        input.stepUp();
        input.dispatchEvent(new Event('input'));
    });
}

for (const ele of document.querySelectorAll('.spinner.decrement')) {
    ele.addEventListener('click', (event) => {
        const input = event.target.parentElement.querySelector('input[type=number]');
        input.stepDown();
        input.dispatchEvent(new Event('input'));
    });
}