import { useCallback } from 'react';

export const useAudio = () => {
    const playAudio = useCallback((text: string) => {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8;

        let voices = window.speechSynthesis.getVoices();

        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                speak(text, voices);
            };
        } else {
            speak(text, voices);
        }
    }, []);

    const speak = (text: string, voices: SpeechSynthesisVoice[]) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8;

        // 優先找 Yuna
        const targetVoice = voices.find(v => v.name.includes('Yuna'))
            || voices.find(v => v.lang.includes('ko') || v.lang.includes('KR'));

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        window.speechSynthesis.speak(utterance);
    };

    return { playAudio };
};
