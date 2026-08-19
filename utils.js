import wordsToNumbers from 'https://cdn.jsdelivr.net/npm/@insomnia-dev/words-to-numbers/+esm';
import { toHiragana } from "https://esm.sh/wanakana";

function shuffle(array) {
    const arr = [...array]; // copy to avoid mutating original

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    //return array;
    return arr;
}

function initSpeechRecognition(language = "english") {

    const languageMap = {
        "english": "en-US",
        "french": "fr-FR",
        "japanese": "ja-JP",
        "italian": "it-IT",
        "german": "de-DE",
    };
    if (language in languageMap) {
        language = languageMap[language];
    } else {
        console.error(`Unsupported language: ${language}`);
        return;
    }
    language = languageMap[language] || language;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser.");
        return null;
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;
        return recognition;
    }
}

function getVoices() {
    return new Promise(resolve => {
        const voices = speechSynthesis.getVoices();

        if (voices.length > 0) {
            resolve(voices);
            return;
        }

        speechSynthesis.addEventListener("voiceschanged", () => {
            resolve(speechSynthesis.getVoices());
        }, { once: true });
    });
}

function readOut(sentence, accent, voiceName) {
    let utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = `${accent}`;

    if (voiceName) {
        const voice = speechSynthesis.getVoices().find(v => v.name === voiceName);
        utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
}

function getGoogleTTSUrl(sentence) {
    return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(sentence)}&tl=en&client=tw-ob`;
}

function getEnglish(item) {
    if (item.sen && item.sen.trim() !== "") {
        return item.sen;
    }
    return "";
}

function getYomi(item) {
    if (item.yomi && item.yomi.trim() !== "") {
        return item.yomi;
    }
    return "";
}

function getTranslation(item) {
    if (item.tr && item.tr.trim() !== "") {
        return item.tr;
    }
    return "";
}

function normalize(text) {
    let cleaned = text.replace(':00', '');
    cleaned = cleaned.replace(/[.,'’"!?;:()-]/g, '');
    cleaned = cleaned.replace('percent', '%');
    cleaned = cleaned.replace('&', 'and');
    cleaned = wordsToNumbers(cleaned);
    cleaned = cleaned.replace(/\s+/g, '');
    return cleaned.trim().toLowerCase();
}

function normalizeJapanese(text, tokenizer) {

    const tokens = tokenizer.tokenize(text);
    // console.log(tokens);

    const result = tokens
        .map(token => token.reading
            ? toHiragana(token.reading)
            : token.surface_form
        )
        .join("");

    // console.log(result);

    let cleaned = result.replace(/[.,'’"!?;:()-]/g, '');
    cleaned = cleaned.replace(/\s+/g, '');
    cleaned = cleaned.replace(/[。、]/g, '');
    return cleaned.trim();
}

export { shuffle, initSpeechRecognition, getVoices, readOut, getGoogleTTSUrl, getEnglish, getYomi, getTranslation, normalize, normalizeJapanese };
