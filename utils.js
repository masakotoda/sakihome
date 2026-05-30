import wordsToNumbers from 'https://cdn.jsdelivr.net/npm/@insomnia-dev/words-to-numbers/+esm';

function shuffle(array) {
    const arr = [...array]; // copy to avoid mutating original

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in this browser.");
        return null;
    } else {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        return recognition;
    }
}

function readOut(sentence, accent) {
    let utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = `en-${accent}`;
    window.speechSynthesis.speak(utterance);
}

function getGoogleTTSUrl(sentence) {
  return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(sentence)}&tl=en&client=tw-ob`;
}

function getEnglish(item) {
    if (item.sen && item.sen.trim() !== "") {
        return item.sen;
    }
    if (item.en && item.en.trim() !== "") {
        return item.en;
    }
    return "";
}

function getJapanese(item) {
    var jp = item.jp || item.ja || item.japanese;
    if (item.syno1 && item.syno1.trim() !== "") {
        jp += ` ${item.syno1}`;
    }
    if (item.syno2 && item.syno2.trim() !== "") {
        jp += ` ${item.syno2}`;
    }
    return jp;
}

function normalize(text) {
    let cleaned = text.replace(/[.,'"!?;:()-]/g, '')
    cleaned = cleaned.replace('percent', '%');
    cleaned = cleaned.replace('&', 'and');
    cleaned = cleaned.replace(/\s+/g, '');
    cleaned = wordsToNumbers(cleaned);
    return cleaned.trim().toLowerCase();
}

export { shuffle, initSpeechRecognition, readOut, getGoogleTTSUrl, getEnglish, getJapanese, normalize };
