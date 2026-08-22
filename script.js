import { getTokenizer } from "https://esm.sh/kuromojin";
import * as utils from './utils.js';

const state = {
    counter: 0,
    sentences: [],
    currentSentence: null,
    recognition: null,
    japaneseTokenizer: null,
    selectedLanguage: "english",
    languages: {},
};

const elements = {
    input: document.getElementById("textInput"),
    micBtn: document.getElementById("micBtn"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    countLabel: document.getElementById("countLabel"),
    resultLabel: document.getElementById("resultLabel"),
    nextSentenceLabel: document.getElementById("nextSentenceLabel"),
    translationLabel: document.getElementById("translationLabel"),
    readOutByGoogleLink: document.getElementById("readOutByGoogle"),
    readOutForm: document.getElementById('readOutForm'),
    translateBtn: document.getElementById("translateBtn"),
    turnOffMicBtn: document.getElementById("turnOffMicBtn"),
    langSelect: document.getElementById("langSelect"),
    accentList: document.getElementById("accentList")
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
    elements.translationLabel.style.visibility = "visible";
    elements.translationLabel.style.display = "inline"
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
    const selectedVoice = elements.readOutForm.elements['voiceSelect'].value;
    console.log("Selected accent:", selected);
    console.log("Selected voice:", selectedVoice);
    utils.readOut(state.currentSentence, selected, selectedVoice);
});

elements.readOutForm.addEventListener("change", (event) => {
    // This is more for iPhone's buggy implementation of SpeechSynthesis.
    // Even if we specify lang attribute properly, it doesn't honor it.
    // Heuristically, getVoices() returns a duplicate voice for the best match of the accent,
    // so we can select that voice explicitly.
    if (event.target.name === "accent") {
        if (!event.target.checked) return;

        const accent = event.target.value; // e.g. "en-US", "fr-FR", "ja-JP"
        console.log("Accent changed to:", accent);

        utils.getVoices().then(voices => {
            const voicesFiltered = voices.filter(item => { return item.lang.startsWith(accent) });

            // Find the first duplicate by name, which is likely the best match for the accent
            const duplicate = voicesFiltered.find((item, index) =>
                voicesFiltered.some((other, otherIndex) =>
                    index !== otherIndex && item.name === other.name
                )
            );

            // Remove duplicates by name, keeping the first occurrence
            const voicesCleaned = [...new Map(voicesFiltered.map(item => [item.name, item])).values()];

            const par = document.getElementById("voiceSelect");
            par.replaceChildren();
            voicesCleaned.forEach(voice => {
                const option = par.appendChild(new Option(voice.name, voice.name));
                option.selected = duplicate?.name === voice.name;
            });
        });
    }
});

state.languages = await fetch("languages.json").then(r => r.json());
elements.langSelect.replaceChildren();
Object.entries(state.languages).forEach(([key, value]) => {
    const option = elements.langSelect.appendChild(new Option(value.name, key));
    option.selected = key === state.selectedLanguage;
});

languageSelected(state.selectedLanguage);

function languageSelected(selectedLanguage) {

    state.selectedLanguage = selectedLanguage;

    loadSentences(selectedLanguage + ".tsv");

    state.recognition = utils.initSpeechRecognition(state.languages, selectedLanguage);
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

    const language = state.languages[selectedLanguage];
    elements.accentList.replaceChildren();
    Object.entries(language.accents).forEach(([key, value], index) => {

        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "accent";
        radio.value = key;
        radio.checked = index === 0;

        const img = document.createElement("img");
        img.src = "images/" + value;
        img.className = "flag";
        img.alt = key;

        label.append(radio, " ", img);
        elements.accentList.append(" ", label);
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
    elements.translationLabel.textContent = utils.getTranslation(state.sentences[state.counter - 1]);
    elements.readOutByGoogleLink.href = utils.getGoogleTTSUrl(state.currentSentence);

    elements.countLabel.textContent = `#${state.counter}`;
    elements.resultLabel.textContent = "";
    elements.input.style.borderColor = "gray";
    elements.input.style.backgroundColor = "white";

    elements.translationLabel.style.visibility = "hidden";
    elements.translationLabel.style.display = "none";
}

async function checkSentence(transcript, sentence) {
    let normalizedTranscript = "";
    let normalizedSentence = "";
    if (state.selectedLanguage === "japanese") {
        if (!state.japaneseTokenizer) {
            state.japaneseTokenizer = await getTokenizer({
                //dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/"
                dicPath: "./kuromoji@0.1.2/dict/"
            });
        }
        normalizedTranscript = utils.normalizeJapanese(transcript, state.japaneseTokenizer);
        normalizedSentence = utils.normalizeJapanese(sentence, state.japaneseTokenizer);
    } else {
        normalizedTranscript = utils.normalize(transcript);
        normalizedSentence = utils.normalize(sentence);
    }

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