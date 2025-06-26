export class SpeechService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = "en-IN";
  }

  async initializeVoices() {
    return new Promise((resolve) => {
      const checkVoices = () => {
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
          resolve();
        } else {
          setTimeout(checkVoices, 100);
        }
      };
      checkVoices();
    });
  }

  getPreferredVoice() {
    const voices = this.synth.getVoices();
    const preferredVoices = [
      { name: "Microsoft Ravi - English (India)", lang: "en-IN" },
      { name: "Google US English", lang: "en-US" },
      { name: "Google UK English Female", lang: "en-GB" },
      { name: "Microsoft David - English (United States)", lang: "en-US" },
      { name: "Microsoft Zira - English (United States)", lang: "en-US" },
    ];

    for (const preferred of preferredVoices) {
      const voice = voices.find(
        (v) => v.name.includes(preferred.name) || v.lang === preferred.lang
      );
      if (voice) return voice;
    }
    return voices[0];
  }

  speak(text) {
    return new Promise((resolve) => {
      if (this.synth.speaking) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.getPreferredVoice();
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = utterance.voice.lang || "en-IN";

      utterance.onend = () => resolve();
      utterance.onerror = (err) => {
        console.error("Speech error:", err);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  startListening(onResult, onError, onEnd) {
    let finalTranscript = "";
    let timeoutId = null;
    const silenceTimeout = 15000; // 15 seconds of silence

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.recognition.stop();
        onEnd && onEnd();
      }, silenceTimeout);
    };

    this.recognition.onresult = (event) => {
      resetTimeout();
      let interimTranscript = "";
      let hasSpeech = false;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
        if (event.results[i][0].confidence > 0.5) {
          hasSpeech = true;
        }
      }

      // Only update if we have speech with reasonable confidence
      if (hasSpeech) {
        onResult(
          (finalTranscript + interimTranscript).trim(),
          interimTranscript === ""
        );
      }
    };

    this.recognition.onerror = (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      onError && onError(event);
    };

    this.recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
      onEnd && onEnd();
    };

    resetTimeout();
    this.recognition.start();
  }

  stopListening() {
    this.recognition.stop();
  }

  cancelAll() {
    this.synth.cancel();
    this.recognition.abort();
  }
}
