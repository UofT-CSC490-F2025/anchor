from typing import Any, Dict
import cv2
import os

def extract_frames(data: Dict[str, Any], frame_rate: int = 1) -> Dict[str, Any]:
    """
    Extracts frames from videos at specified frame rate.
    Args:
        data (Dict): Contains 'videos' key with list of video paths.
        frame_rate (int): Number of frames per second to extract.
    Returns:
        Dict with extracted frames.
    """
    frames = []
    for video_path in data.get('videos', []):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps // frame_rate) if fps > 0 else 1
        count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if count % frame_interval == 0:
                frames.append(frame)
            count += 1
        cap.release()
    data['frames'] = frames
    return data

def default_transformer(data: Any, **kwargs) -> Any:
    # No-op transformer
    return data
