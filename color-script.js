
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


class Base {
    constructor() {
        this.myColors = [];
        this.maxMyColors = 6;
        this.myColorButtons = [];
        this.storage = new Storage();
    }

    setOccupiedStyle(button, color) {
        button.style.backgroundColor = this.normalizeColor(color);
        button.innerHTML = "&nbsp;&nbsp;";
        button.className = "mycolor";
    }

    setVacantStyle(button) {
        button.className = "mycolor mycolorvacant";
        button.innerHTML = "&nbsp;&nbsp;";
        button.style.setProperty("--color1", "lightgray");
        button.style.setProperty("--color2", "silver");
    }

    rgbToHex(rgb) {
        return rgb
            .map(x => x.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();
    }

    normalizeColor(color) {
        if (!color)
            return "white";
        else if (/^#[0-9A-Fa-f]{6}$/.test(color))
            return color;
        else if (/^[0-9A-Fa-f]{6}$/.test(color))
            return `#${color}`;
        else
            return color;
    }
}


class Picker extends Base {
    constructor() {
        super();
        this.allGridIds = [];
        this.lastMyColors = [];
    }

    initialize() {
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

        this.renderColorGrids("colorGrids1", "colorGridButtons1", TL1, TR1, BL1, BR1, TL2, TR2, BL2, BR2);
        this.renderColorGrids("colorGrids2", "colorGridButtons2", TL3, TR3, BL3, BR3, TL4, TR4, BL4, BR4);
        this.renderColorGrids("colorGrids3", "colorGridButtons3", TL5, TR5, BL5, BR5, TL6, TR6, BL6, BR6);

        this.setupMyPalette();
        this.setupShareButton();
        this.setupComposeButton();
    }

    setupMyPalette() {
        const lastPalette = this.storage.getLastPalette();

        for (let i = 0; i < this.maxMyColors; i++) {
            const button = document.createElement("button");

            this.myColorButtons.push(button);
            this.myColors.push("");
            this.lastMyColors.push("");

            if (i >= lastPalette.length || lastPalette[i] === "") {
                this.setVacantStyle(button);
            } else {
                this.setOccupiedStyle(button, lastPalette[i]);
                this.myColors[i] = lastPalette[i];
            }

            button.addEventListener("click", () => {
                this.unregisterColor(i);
            });

            const buttons = document.getElementById("myColorsDiv");
            buttons.append(button);
            buttons.append("\n");
        }
    }

    setupShareButton() {
        document.getElementById("shareButton").addEventListener("click", async () => {
            const colors = encodeURIComponent(this.myColors.join(","));
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

    setupComposeButton() {
        document.getElementById("composeButton").addEventListener("click", async () => {
            const colors = encodeURIComponent(this.myColors.join(","));
            const url = `${location.origin}${location.pathname}?colors=${colors}`;
            window.location.href = url;
        });
    }

    generateColorGrid(TL, TR, BL, BR) {
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

    interpolateGrids(gridA, gridB, count = 4) {
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

    registerColor(colorValue, index = -1) {
        if (index === -1) {
            const firstVacancy = this.myColors.findIndex(color => color === "");
            if (firstVacancy === -1) {
                document.getElementById("alertDialog").showModal();
                return;
            }
            index = firstVacancy;
        }
        this.myColors[index] = colorValue;
        this.storage.setLastPalette(this.myColors);
        this.setOccupiedStyle(this.myColorButtons[index], colorValue);
    }

    unregisterColor(index) {
        if (this.myColors[index] === "") { // Undo attempt
            if (this.lastMyColors[index] !== "") {
                this.registerColor(this.lastMyColors[index], index);
                this.lastMyColors[index] = "";
            }
        } else {
            this.lastMyColors[index] = this.myColors[index];
            this.myColors[index] = "";
            this.storage.setLastPalette(this.myColors);
            this.setVacantStyle(this.myColorButtons[index]);
        }
    }

    renderColorGrids(colorGridsId, buttonGroupId, TL1, TR1, BL1, BR1, TL2, TR2, BL2, BR2) {
        const grid1 = this.generateColorGrid(TL1, TR1, BL1, BR1);
        const grid2 = this.generateColorGrid(TL2, TR2, BL2, BR2);
        const grids = this.interpolateGrids(grid1, grid2, 4);

        const colorGrids = document.getElementById(colorGridsId);
        for (let i = 0; i < grids.length; i++) {
            const g = grids[i];
            let topRight = [];
            let bottomLeft = [];
            let buttons = [];
            for (let j = 0; j < g.length; j++) {
                const line = g[j];
                for (let k = 0; k < line.length; k++) {
                    const hex = this.rgbToHex(line[k]);
                    const button = document.createElement("button");
                    button.className = "colorchip";
                    button.value = `${hex}`;
                    button.style.backgroundColor = `#${hex}`;
                    button.innerHTML = "&nbsp;&nbsp;";
                    button.addEventListener("click", () => {
                        this.registerColor(button.value);
                    });
                    buttons.push(button);
                    if (j === 0 && k === line.length - 1)
                        topRight = line[k];
                    if (j === g.length - 1 && k === 0)
                        bottomLeft = line[k];
                }
                buttons.push(document.createElement("br"));
            }

            const topRightStr = this.rgbToHex(topRight);
            const bottomLeftStr = this.rgbToHex(bottomLeft);

            const grid = document.createElement("div");
            grid.id = `grid${topRightStr}${bottomLeftStr}`;
            grid.style.display = "none";
            colorGrids.appendChild(grid);
            for (const button of buttons) {
                grid.append(button);
            }
            this.allGridIds.push(grid.id);

            const button = document.createElement("button");
            button.className = "colorgrid";
            button.innerHTML = "&nbsp;&nbsp;";
            button.id = `btn${topRightStr}${bottomLeftStr}`;
            const par = document.getElementById(buttonGroupId);

            button.style.setProperty("--color1", `#${topRightStr}`);
            button.style.setProperty("--color2", `#${bottomLeftStr}`);
            button.addEventListener("click", () => {
                for (const gridId of this.allGridIds) {
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
}


class Viewer extends Base {
    constructor(colorString) {
        super();

        // The last line (map) is just to be safe...
        this.colors = colorString
            .split(",")
            .slice(0, this.maxMyColors)
            .map(color => /^[0-9A-Fa-f]{6}$/.test(color) ? color.toUpperCase() : "");

        while (this.colors.length < this.maxMyColors) {
            this.colors.push("");
        }

        this.maxGridSize = 8;
        this.currentColor = "white";
        this.cells = [];
    }

    initialize() {
        this.setupMyPalette();
        this.setupDrawingGrid();
        this.setupOrientationOptions();
        this.setupSaveCompositionButton();
        this.setupEditMyPaletteButton();
        this.setupTempColorButton();
    }

    setupMyPalette() {
        let currentColorButton = null;
        const myColorsDiv = document.getElementById("myColorsDiv");
        for (const [index, color] of this.colors.entries()) {
            const button = document.createElement("button");

            if (index == 0) {
                currentColorButton = button;
                this.currentColor = `#${color}`;
            }

            button.addEventListener("click", () => {
                this.setSelectedStyle(button);
                this.currentColor = `#${color}`;
            });

            if (color === "") {
                this.setVacantStyle(button);
            } else {
                this.setOccupiedStyle(button, color);
            }

            myColorsDiv.append(button);
            myColorsDiv.append("\n");
        }

        this.setSelectedStyle(currentColorButton);
        currentColorButton.focus();
    }

    setupDrawingGrid() {

        const lastComposition = this.storage.getLastComposition();
        let lastCompIdx = 0;
        const grid = this.getGrid();
        for (let row = 0; row < this.maxGridSize; row++) {
            this.cells[row] = [];

            for (let col = 0; col < this.maxGridSize; col++) {
                const cell = document.createElement("div");
                cell.className = "cell";

                grid.append(cell);
                this.cells[row][col] = cell;

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

            this.changeCell(event);
        });

        grid.addEventListener("pointermove", event => {
            if (event.pointerType === "touch") {
                this.changeCell(event);
            }
        });
    }

    setupOrientationOptions() {
        const orientation = this.storage.getLastOrientation();
        this.setGridOrientation(orientation);

        document.querySelectorAll('input[name="gridOrientation"]').forEach(radio => {
            if (orientation === radio.value) {
                radio.checked = true;
            }
            radio.addEventListener("change", () => {
                this.setGridOrientation(radio.value);
                this.storage.setLastOrientation(radio.value);
            });
        });
    }

    setupSaveCompositionButton() {
        document.getElementById("saveCompositionButton").addEventListener("click", async () => {
            this.saveComposition();

            const bubble = document.getElementById("savedBubble");
            bubble.classList.remove("show");
            void bubble.offsetWidth;
            bubble.classList.add("show");
        });
    }

    setupEditMyPaletteButton() {
        document.getElementById("editMyPaletteButton").addEventListener("click", async () => {
            this.saveComposition();
            window.location.href = "./color.html";
        });
    }

    setupTempColorButton() {
        const button = this.getTempColorBtn();
        this.setVacantStyle(button);
        button.addEventListener("click", () => {
            this.setSelectedStyle(button);
            this.currentColor = button.style.backgroundColor;
        });
    }

    saveComposition() {
        const cellcolors = [];

        for (const rows of this.cells) {
            for (const cell of rows) {
                cellcolors.push(cell.style.backgroundColor);
            }
        }

        this.storage.setLastComposition(cellcolors);
    }

    changeCell(event) {
        const rect = grid.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const col = Math.floor(x / (rect.width / this.maxGridSize));
        const row = Math.floor(y / (rect.height / this.maxGridSize));

        if (row < 0 || row >= this.maxGridSize || col < 0 || col >= this.maxGridSize) {
            // pointermove can theoretically occur at/just beyond an edge, particularly with touch/pointer capture.
            // So, it's possible to fall into here. (rarely)
            console.log(row, col);
            return;
        }

        const cell = this.cells[row][col];

        const tool = document.querySelector('input[name="tool"]:checked').value;
        if (tool === "paint") {
            cell.style.backgroundColor = this.currentColor;
        } else {
            this.currentColor = this.normalizeColor(cell.style.backgroundColor);
            // Update UI
            const button = this.getTempColorBtn();
            this.setOccupiedStyle(button, this.currentColor);
            this.setSelectedStyle(button);
            button.focus();
            // Immediately switch to paint mode for convenience
            document.getElementById("paintTool").checked = true;
        }
    }

    setGridOrientation(orientation) {
        const grid = this.getGrid();
        if (orientation === "landscape") {
            grid.style.width = "36vh";
            grid.style.height = "27vh";
        } else {
            grid.style.width = "30vh";
            grid.style.height = "40vh";
        }
    }

    setSelectedStyle(button) {
        document.querySelectorAll("button.selected")
            .forEach(b => b.classList.remove("selected"));
        button.classList.add("selected");
    }

    getGrid() {
        return document.getElementById("grid");
    }

    getTempColorBtn() {
        return document.getElementById("tempColorButton");
    }
}


function run() {
    const params = new URLSearchParams(location.search);
    const colorString = params.get("colors");
    const viewerMode = colorString !== null;

    let instance = null;
    if (viewerMode) {
        instance = new Viewer(colorString);
    } else {
        instance = new Picker();
    }
    instance.initialize();

    document.getElementById("viewer").style.display = viewerMode ? "block" : "none";
    document.getElementById("picker").style.display = viewerMode ? "none" : "block";
}

run();
