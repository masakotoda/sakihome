
class Storage {

    constructor() {
        this.prefix = "sakicolor";
    }

    safeParse(key, defaultValue) {
        try {
            return JSON.parse(localStorage.getItem(key)) || defaultValue;
        } catch (e) {
            localStorage.removeItem(key);
            return defaultValue;
        }
    }

    lastPaletteKey() {
        return `${this.prefix}-lastpalette`;
    }

    lastCompositionKey() {
        return `${this.prefix}-lastcomposition`;
    }

    lastOrientationKey() {
        return `${this.prefix}-orientation`;
    }

    getLastPalette() {
        return this.safeParse(this.lastPaletteKey(), []);
    }

    setLastPalette(value) {
        localStorage.setItem(this.lastPaletteKey(), JSON.stringify(value));
    }

    getLastComposition() {
        return this.safeParse(this.lastCompositionKey(), []);
    }

    setLastComposition(value) {
        localStorage.setItem(this.lastCompositionKey(), JSON.stringify(value));
    }

    getLastOrientation() {
        return this.safeParse(this.lastOrientationKey(), "");
    }

    setLastOrientation(value) {
        localStorage.setItem(this.lastOrientationKey(), JSON.stringify(value));
    }
}

const allGridIds = [];
const myColors = [];
const lastMyColors = [];
const maxMyColors = 6;
const myColorButtons = [];
const maxGridSize = 8;
let currentColor = "white";
const cells = [];
const storage = new Storage();

function generateColorGrid(TL, TR, BL, BR) {
    const grid = [];

    for (let y = 0; y < 9; y++) {
        const row = [];

        const v = y / 8;

        for (let x = 0; x < 9; x++) {
            const u = x / 8;

            const color = [0, 1, 2].map(i =>
                Math.round(
                    (1 - u) * (1 - v) * TL[i] +
                    u * (1 - v) * TR[i] +
                    (1 - u) * v * BL[i] +
                    u * v * BR[i]
                )
            );

            row.push(color);
        }

        grid.push(row);
    }

    return grid;
}

function interpolateGrids(gridA, gridB, count = 4) {
    const grids = [];

    for (let n = 0; n <= count + 1; n++) {
        const t = n / (count + 1);

        const grid = gridA.map((row, y) =>
            row.map((color, x) =>
                color.map((value, c) =>
                    Math.round(
                        value + (gridB[y][x][c] - value) * t
                    )
                )
            )
        );

        grids.push(grid);
    }

    return grids;
}

function registerColor(colorValue, index = -1) {
    if (index === -1) {
        const firstVacancy = myColors.findIndex(color => color === "");
        if (firstVacancy === -1) {
            alert("The palette is full. Click an unwanted color to make room.")
            return;
        }
        index = firstVacancy;
    }
    myColors[index] = colorValue;
    storage.setLastPalette(myColors);
    setOccupiedStyle(myColorButtons[index], colorValue);
}

function unregisterColor(index) {
    if (myColors[index] === "") { // Undo attempt
        if (lastMyColors[index] !== "") {
            registerColor(lastMyColors[index], index);
            lastMyColors[index] = "";
        }
    } else {
        lastMyColors[index] = myColors[index];
        myColors[index] = "";
        storage.setLastPalette(myColors);
        setVacantStyle(myColorButtons[index]);
    }
}

function setOccupiedStyle(button, color) {
    button.style.backgroundColor = `#${color}`;
    button.innerHTML = "&nbsp;&nbsp;";
    button.className = "mycolor";
}

function setVacantStyle(button) {
    button.className = "mycolor mycolorvacant";
    button.innerHTML = "&nbsp;&nbsp;";
    button.style.setProperty("--color1", "lightgray");
    button.style.setProperty("--color2", "silver");
}

function rgbToHex(rgb) {
    return rgb
        .map(x => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}

function renderColorGrids(colorGridsId, buttonGroupId, TL1, TR1, BL1, BR1, TL2, TR2, BL2, BR2) {
    const grid1 = generateColorGrid(TL1, TR1, BL1, BR1);
    const grid2 = generateColorGrid(TL2, TR2, BL2, BR2);
    const grids = interpolateGrids(grid1, grid2, 4);

    const colorGrids = document.getElementById(colorGridsId);
    for (let i = 0; i < grids.length; i++) {
        const g = grids[i];
        let topRight = [];
        let bottomLeft = [];
        let buttons = [];
        for (let j = 0; j < g.length; j++) {
            const line = g[j];
            for (let k = 0; k < line.length; k++) {
                const hex = rgbToHex(line[k]);
                const button = document.createElement("button");
                button.className = "colorchip";
                button.value = `${hex}`;
                button.style.backgroundColor = `#${hex}`;
                button.innerHTML = "&nbsp;&nbsp;";
                button.addEventListener("click", () => {
                    registerColor(button.value);
                });
                buttons.push(button);
                if (j === 0 && k === line.length - 1)
                    topRight = line[k];
                if (j === g.length - 1 && k === 0)
                    bottomLeft = line[k];
            }
            buttons.push(document.createElement("br"));
        }

        const topRightStr = rgbToHex(topRight);
        const bottomLeftStr = rgbToHex(bottomLeft);

        const grid = document.createElement("div");
        grid.id = `grid${topRightStr}${bottomLeftStr}`;
        grid.style.display = "none";
        colorGrids.appendChild(grid);
        for (const button of buttons) {
            grid.append(button);
        }
        allGridIds.push(grid.id);

        const button = document.createElement("button");
        button.className = "colorgrid";
        button.innerHTML = "&nbsp;&nbsp;";
        button.id = `btn${topRightStr}${bottomLeftStr}`;
        const par = document.getElementById(buttonGroupId);

        button.style.setProperty("--color1", `#${topRightStr}`);
        button.style.setProperty("--color2", `#${bottomLeftStr}`);
        button.addEventListener("click", () => {
            for (const gridId of allGridIds) {
                const grid = document.getElementById(gridId);
                grid.style.display = "none";
            }
            const str = button.id.slice(3);
            const grid = document.getElementById(`grid${str}`);
            grid.style.display = "block";
        });

        par.append(button);
        par.append("\n")
    }
}

function setupShareButton() {
    document.getElementById("shareButton").addEventListener("click", async () => {
        const colors = encodeURIComponent(myColors.join(","));
        const url = `${location.origin}${location.pathname}?colors=${colors}`;

        try {
            await navigator.clipboard.writeText(url);
            alert("Viewer URL copied to clipboard. Paste it in your browser or whatever :)");
        } catch (error) {
            console.error("Failed to copy URL:", error);
            alert("Could not copy the URL.");
        }
    });
}

function setupComposeButton() {
    document.getElementById("composeButton").addEventListener("click", async () => {
        const colors = encodeURIComponent(myColors.join(","));
        const url = `${location.origin}${location.pathname}?colors=${colors}`;
        window.location.href = url;
    });
}

function setupSaveCompositionButton() {
    document.getElementById("saveCompositionButton").addEventListener("click", async () => {
        saveComposition();

        const bubble = document.getElementById("savedBubble");
        bubble.classList.remove("show");
        void bubble.offsetWidth;
        bubble.classList.add("show");
    });
}

function setupEditMyPaletteButton() {
    document.getElementById("editMyPaletteButton").addEventListener("click", async () => {
        saveComposition();
        window.location.href = "./color.html";
    });
}

function saveComposition() {
    const cellcolors = [];

    for (const rows of cells) {
        for (const cell of rows) {
            cellcolors.push(cell.style.backgroundColor);
        }
    }

    storage.setLastComposition(cellcolors);
}

function changeCell(event) {
    const rect = grid.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / (rect.width / maxGridSize));
    const row = Math.floor(y / (rect.height / maxGridSize));

    if (row < 0 || row >= maxGridSize || col < 0 || col >= maxGridSize) {
        // pointermove can theoretically occur at/just beyond an edge, particularly with touch/pointer capture.
        // So, it's possible to fall into here. (rarely)
        console.log(row, col);
        return;
    }

    const cell = cells[row][col];
    cell.style.backgroundColor = currentColor;
}

function setGridOrientation(orientation) {
    const grid = document.getElementById("grid");
    if (orientation === "landscape") {
        grid.style.width = "36vh";
        grid.style.height = "27vh";
    } else {
        grid.style.width = "30vh";
        grid.style.height = "40vh";
    }
}

function initializeColorPicker() {
    // Yellow-Red grid adding blue slowly
    const TL1 = [0x00, 0x00, 0x00];
    const TR1 = [0xFF, 0xFF, 0x00];
    const BL1 = [0xFF, 0x00, 0x00];
    const BR1 = [0xFF, 0xA0, 0x00];

    const TL2 = [0x00, 0x00, 0x80];
    const TR2 = [0x08, 0xFF, 0xFF];
    const BL2 = [0xC0, 0x00, 0xFF];
    const BR2 = [0xFF, 0xFF, 0xFF];

    // Blue-Yellow grid adding red slowly
    const TL3 = [0x00, 0x00, 0x00];
    const TR3 = [0x00, 0x00, 0xFF];
    const BL3 = [0xFF, 0xFF, 0x00];
    const BR3 = [0x08, 0xFF, 0xFF];

    const TL4 = [0x80, 0x00, 0x00];
    const TR4 = [0xC0, 0x00, 0xFF];
    const BL4 = [0xFF, 0xA0, 0x00];
    const BR4 = [0xFF, 0xFF, 0xFF];

    // Red-Blue grid adding yellow slowly
    const TL5 = [0x00, 0x00, 0x00];
    const TR5 = [0xFF, 0x00, 0x00];
    const BL5 = [0x00, 0x00, 0xFF];
    const BR5 = [0xC0, 0x00, 0xFF];

    const TL6 = [0x80, 0x80, 0x00];
    const TR6 = [0xFF, 0xA0, 0x00];
    const BL6 = [0x08, 0xFF, 0xFF];
    const BR6 = [0xFF, 0xFF, 0xFF];

    renderColorGrids("colorGrids1", "colorGridButtons1", TL1, TR1, BL1, BR1, TL2, TR2, BL2, BR2);
    renderColorGrids("colorGrids2", "colorGridButtons2", TL3, TR3, BL3, BR3, TL4, TR4, BL4, BR4);
    renderColorGrids("colorGrids3", "colorGridButtons3", TL5, TR5, BL5, BR5, TL6, TR6, BL6, BR6);

    const lastPalette = storage.getLastPalette();

    for (let i = 0; i < maxMyColors; i++) {
        const button = document.createElement("button");

        myColorButtons.push(button);
        myColors.push("");
        lastMyColors.push("");

        if (i >= lastPalette.length || lastPalette[i] === "") {
            setVacantStyle(button);
        } else {
            setOccupiedStyle(button, lastPalette[i]);
            myColors[i] = lastPalette[i];
        }

        button.addEventListener("click", () => {
            unregisterColor(i);
        });

        const buttons = document.getElementById("myColorsDiv");
        buttons.append(button);
        buttons.append("\n");
    }

    setupShareButton();
    setupComposeButton();
}

function initializeViewer(colorString) {
    // The last line (map) is just to be safe...
    const colors = colorString
        .split(",")
        .slice(0, maxMyColors)
        .map(color => /^[0-9A-Fa-f]{6}$/.test(color) ? color.toUpperCase() : "");

    while (colors.length < maxMyColors) {
        colors.push("");
    }

    let currentColorButton = null;
    const myColorsDiv = document.getElementById("myColorsDiv");
    for (const [index, color] of colors.entries()) {
        const button = document.createElement("button");

        if (index == 0) {
            currentColorButton = button;
            currentColor = `#${color}`;
        }

        button.addEventListener("click", () => {
            document.querySelectorAll("button.selected")
                .forEach(b => b.classList.remove("selected"));
            button.classList.add("selected");
            currentColor = `#${color}`;
        });

        if (color === "") {
            setVacantStyle(button);
        } else {
            setOccupiedStyle(button, color);
        }

        myColorsDiv.append(button);
        myColorsDiv.append("\n");
    }

    if (currentColorButton) {
        currentColorButton.classList.add("selected");
        currentColorButton.focus();
    }

    // Grid to paint with my palette
    const lastComposition = storage.getLastComposition();
    let lastCompIdx = 0;
    const grid = document.getElementById("grid");
    for (let row = 0; row < maxGridSize; row++) {
        cells[row] = [];

        for (let col = 0; col < maxGridSize; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";

            grid.append(cell);
            cells[row][col] = cell;

            if (lastCompIdx < lastComposition.length) {
                cell.style.backgroundColor = lastComposition[lastCompIdx];
                lastCompIdx++;
            }
        }
    }

    grid.addEventListener("pointerdown", event => {
        if (event.pointerType === "touch") {
            grid.setPointerCapture(event.pointerId);
        }

        changeCell(event);
    });

    grid.addEventListener("pointermove", event => {
        if (event.pointerType === "touch") {
            changeCell(event);
        }
    });

    const orientation = storage.getLastOrientation();
    setGridOrientation(orientation);

    document.querySelectorAll('input[name="gridOrientation"]').forEach(radio => {
        if (orientation === radio.value) {
            radio.checked = true;
        }
        radio.addEventListener("change", () => {
            setGridOrientation(radio.value);
            storage.setLastOrientation(radio.value);
        });
    });

    setupSaveCompositionButton();
    setupEditMyPaletteButton();
}

function run() {
    const params = new URLSearchParams(location.search);
    const colorString = params.get("colors");
    const viewerMode = colorString !== null;

    if (viewerMode) {
        initializeViewer(colorString);
    } else {
        initializeColorPicker();
    }

    document.getElementById("viewer").style.display = viewerMode ? "block" : "none";
    document.getElementById("picker").style.display = viewerMode ? "none" : "block";
}

run();
