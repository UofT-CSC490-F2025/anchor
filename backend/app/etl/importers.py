from typing import Any, Dict
import os

def import_faceforensicspp(data_dir: str) -> Dict[str, Any]:
    """
    Imports FaceForensics++ dataset metadata.
    Args:
        data_dir (str): Path to FaceForensics++ dataset root.
    Returns:
        Dict with file paths and labels.
    """
    video_files = []
    for root, _, files in os.walk(data_dir):
        for file in files:
            if file.endswith('.mp4'):
                video_files.append(os.path.join(root, file))
    return {"dataset": "FaceForensics++", "videos": video_files}

def import_celebd(data_dir: str) -> Dict[str, Any]:
    """
    Imports Celeb-DF dataset metadata.
        data_dir (str): Path to Celeb-DF dataset root.
    Returns:
        Dict with file paths and labels.
    """
    video_files = []
    for root, _, files in os.walk(data_dir):
        for file in files:
            if file.endswith('.mp4'):
                video_files.append(os.path.join(root, file))
    return {"dataset": "Celeb-DF", "videos": video_files}
