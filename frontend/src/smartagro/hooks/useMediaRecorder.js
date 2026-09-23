import { useCallback, useEffect, useRef, useState } from 'react';

export function useMediaRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const releaseStream = useCallback((rec) => {
    if (!rec) return;
    try {
      rec.stream?.getTracks?.().forEach((t) => {
        try { t.stop(); } catch { /* ignore */ }
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      const rec = mediaRecorderRef.current;
      if (rec && rec.state !== 'inactive') {
        try { rec.stop(); } catch { /* ignore */ }
      }
      releaseStream(rec);
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    };
  }, [releaseStream]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone is not supported in this browser.');
    }

    // Stop any previous recorder still active
    const prev = mediaRecorderRef.current;
    if (prev && prev.state !== 'inactive') {
      try { prev.stop(); } catch { /* ignore */ }
      releaseStream(prev);
      mediaRecorderRef.current = null;
      chunksRef.current = [];
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err?.name || 'Error';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new Error('Microphone permission was denied.');
      }
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        throw new Error('No microphone was found on this device.');
      }
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        throw new Error('The microphone is being used by another app.');
      }
      throw new Error('Could not access the microphone.');
    }

    let mimeType = '';
    try {
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }
    } catch {
      mimeType = '';
    }

    let recorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (err) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      throw new Error('Recording is not supported in this browser.');
    }

    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunksRef.current.push(event.data);
    };

    recorder.onerror = () => {
      try { recorder.stop(); } catch { /* ignore */ }
      releaseStream(recorder);
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      if (mountedRef.current) setRecording(false);
    };

    try {
      recorder.start();
    } catch (err) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
      mediaRecorderRef.current = null;
      chunksRef.current = [];
      throw new Error('Could not start recording.');
    }

    if (mountedRef.current) setRecording(true);
  }, [releaseStream]);

  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) return resolve(null);

        if (recorder.state === 'inactive') {
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          if (mountedRef.current) setRecording(false);
          return resolve(null);
        }

        let resolved = false;
        const finish = (blob) => {
          if (resolved) return;
          resolved = true;
          releaseStream(recorder);
          mediaRecorderRef.current = null;
          chunksRef.current = [];
          if (mountedRef.current) setRecording(false);
          resolve(blob);
        };

        recorder.onstop = () => {
          let blob = null;
          try {
            blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            if (!blob.size || blob.size < 500) blob = null;
          } catch {
            blob = null;
          }
          finish(blob);
        };

        try {
          recorder.stop();
        } catch {
          finish(null);
        }

        // Safety timeout in case onstop never fires
        setTimeout(() => finish(null), 5000);
      }),
    [releaseStream],
  );

  return { recording, start, stop };
}