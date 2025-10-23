import subprocess
import whisper
import os

def extract_audio(video_path: str, audio_path: str = "temp_audio.wav") -> str:
    if os.path.exists(audio_path):
        os.remove(audio_path)

    command = ["ffmpeg", "-i", video_path, "-q:a", "0", "-map", "a", audio_path, "-y"]
    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return audio_path

def transcribe_audio(audio_path: str, model_size: str = "base") -> str:
    model = whisper.load_model(model_size)
    result = model.transcribe(audio_path)
    transcript = result["text"]
    return transcript