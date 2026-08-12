import * as utils from './utils.js';

const state = {
    counter: 0,
    sentences: [],
    currentSentence: null,
    recognition: null
};

const elements = {
    input: document.getElementById("textInput"),
    micBtn: document.getElementById("micBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    countLabel: document.getElementById("countLabel"),
    resultLabel: document.getElementById("resultLabel"),
    nextSentenceLabel: document.getElementById("nextSentenceLabel"),
    japaneseLabel: document.getElementById("japaneseLabel"),
    readOutByGoogleLink: document.getElementById("readOutByGoogle"),
    readOutForm: document.getElementById('readOutForm'),
    translateBtn: document.getElementById("translateBtn"),
    turnOffMicBtn: document.getElementById("turnOffMicBtn"),
    langSelect: document.getElementById("langSelect"),
};

if (location.hostname === 'localhost') {
    window.__state = state;
}

elements.langSelect.addEventListener("change", (event) => {
    const selectedLanguage = event.target.value;
    console.log("Selected language:", selectedLanguage);
    languageSelected(selectedLanguage);
});

elements.micBtn.addEventListener("click", () => {
    elements.input.value = "";
    elements.input.placeholder = "Listening...";
    elements.input.style.borderColor = "blue";
    elements.input.style.backgroundColor = "lightblue";
    state.recognition.start();
});

elements.translateBtn.addEventListener("click", () => {
    elements.japaneseLabel.style.visibility = "visible";
    elements.japaneseLabel.style.display = "inline"
});

elements.turnOffMicBtn.addEventListener("click", () => {
    state.recognition.start();
    state.recognition.abort();
});

elements.prevBtn.addEventListener("click", () => {
    if (state.counter > 1) {
        state.counter--;
        updateSentence();
    }
});

elements.nextBtn.addEventListener("click", () => {
    if (state.counter < state.sentences.length) {
        state.counter++;
        updateSentence();
    }
});

elements.readOutForm.addEventListener('submit', (e) => {
    e.preventDefault(); // prevent page reload

    const selected = elements.readOutForm.elements['accent'].value;
    console.log("Selected accent:", selected);
    utils.readOut(state.currentSentence, selected);
});

languageSelected();

function languageSelected(selectedLanguage = "english") {

    loadSentences(selectedLanguage + ".tsv");

    state.recognition = utils.initSpeechRecognition(selectedLanguage);
    if (!state.recognition) {
        console.error("Speech recognition not supported");
    }
    state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.input.value = transcript;
        checkSentence(transcript, state.currentSentence);
    };
    state.recognition.onerror = (event) => {
        //console.error("Speech recognition error:", event.error);
        elements.input.placeholder = `Speech recognition error: ${event.error}`;
    };

    const inputs = elements.readOutForm.querySelectorAll('label');
    let selected = false;
    inputs.forEach(input => {
        const [language, accent] = input.id.split("_");
        if (language === selectedLanguage) {
            input.style.display = "inline";
            if (!selected) {
                input.querySelector('input').checked = true;
                selected = true;
            } else {
                input.querySelector('input').checked = false;
            }
        } else {
            input.style.display = "none";
            input.querySelector('input').checked = false;
        }
    });
}

//
//  sentences.push({ sen: "The quick brown fox jumps over the lazy dog." });
function loadSentences(filename = 'sentences.tsv') {
    fetch("sentences/" + filename)
        .then(res => {
            if (!res.ok) throw new Error('Failed to load TSV');

            return res.text();
        })
        .then(text => {
            const lines = text.trim().split('\n');

            // Extract headers
            const headers = lines[0].split('\t');

            // Map rows to objects
            const data = lines.slice(1).map(line => {
                const values = line.split('\t');
                const obj = {};

                headers.forEach((header, i) => {
                    obj[header.trim()] = values[i] ?? "";
                });

                return obj;
            });

            // Result
            console.log(data);

            // Optional: attach to window for inspection

            state.sentences = utils.shuffle(data);

            state.counter = 1;
            updateSentence();

        })
        .catch(err => {
            console.error(err);
        });
}

/*
fetch('sentences.tsv')
.then(response => {
    if (!response.ok) {
        throw new Error('Failed to load TSV file');
    }
    return response.text();
})
.then(text => {
    const rows = text.trim().split('\n').map(row => row.split('\t'));
    const table = document.getElementById('tsvTable');

    rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');

        row.forEach(cell => {
            const cellElement = document.createElement(rowIndex === 0 ? 'th' : 'td');
            cellElement.textContent = cell;
            tr.appendChild(cellElement);
        });

        table.appendChild(tr);
    });
})
.catch(error => {
    console.error(error);
    document.body.insertAdjacentHTML('beforeend', '<p>Error loading data.</p>');
});
*/


function updateSentence() {
    console.log(state.sentences[state.counter])

    state.recognition.stop();
    state.currentSentence = utils.getEnglish(state.sentences[state.counter - 1]);
    elements.input.placeholder = "Click mic and speak...";
    elements.input.value = "";

    // elements.nextSentenceLabel.textContent = `${state.sentences[state.counter].sen ?? ""}`;
    elements.nextSentenceLabel.textContent = state.currentSentence + " " + utils.getYomi(state.sentences[state.counter - 1]);
    elements.japaneseLabel.textContent = utils.getJapanese(state.sentences[state.counter - 1]);
    elements.readOutByGoogleLink.href = utils.getGoogleTTSUrl(state.currentSentence);

    elements.countLabel.textContent = `#${state.counter}`;
    elements.resultLabel.textContent = "";
    elements.input.style.borderColor = "gray";
    elements.input.style.backgroundColor = "white";

    elements.japaneseLabel.style.visibility = "hidden";
    elements.japaneseLabel.style.display = "none";
}

function checkSentence(transcript, sentence) {
    const normalizedTranscript = utils.normalize(transcript);
    const normalizedSentence = utils.normalize(sentence);

    //console.log(normalizedSentence);
    //console.log(normalizedTranscript);
    if (normalizedTranscript === normalizedSentence) {
        elements.resultLabel.textContent = "Correct!";
        elements.input.style.borderColor = "green";
        elements.input.style.backgroundColor = "lightgreen";

        showCorrectBubble();
    } else {
        elements.resultLabel.textContent = "Incorrect.";
        elements.input.style.borderColor = "red";
        elements.input.style.backgroundColor = "lightcoral";
    }
}

function showCorrectBubble() {
    const bubble = document.getElementById("correctBubble");

    bubble.classList.remove("show");

    // Force the browser to recognize the removal
    void bubble.offsetWidth;

    bubble.classList.add("show");
}