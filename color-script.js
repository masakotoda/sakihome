const allGridIds = [];
const myColors = [];
const lastMyColors = [];
const maxMyColors = 6;
const myColorButtons = [];

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
    myColorButtons[index].style.backgroundColor = `#${colorValue}`;
    myColorButtons[index].className = "mycolor";
    myColors[index] = colorValue;
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
        setVacantStyle(myColorButtons[index]);
    }
}

function setVacantStyle(button) {
    button.className = "mycolor mycolorvacant";
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
        button.innerHTML = "&nbsp;";
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

    for (let i = 0; i < maxMyColors; i++) {
        const button = document.createElement("button");
        button.innerHTML = "&nbsp;";
        setVacantStyle(button);

        button.addEventListener("click", () => {
            unregisterColor(i);
        });

        const buttons = document.getElementById("myColorsDiv");
        buttons.append(button);
        buttons.append("\n");

        myColorButtons.push(button);
        myColors.push("");
        lastMyColors.push("");
    }

    setupShareButton();
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

    const myColorsDiv = document.getElementById("myColorsDiv");

    for (const color of colors) {
        const button = document.createElement("button");
        button.innerHTML = "&nbsp;";
        button.className = "mycolor";
        button.disabled = true;

        if (color === "") {
            setVacantStyle(button);
        } else {
            button.style.backgroundColor = `#${color}`;
        }

        myColorsDiv.append(button);
        myColorsDiv.append("\n");
    }
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
