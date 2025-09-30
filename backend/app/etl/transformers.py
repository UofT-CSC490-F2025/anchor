from typing import Any, Dict
import cv2
import os
import shutil
from tqdm import tqdm

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

def extract_face_frames_from_video(detector, video_path, output_dir, num_frames_to_extract, image_size):
    """
    Extracts a set number of face frames from a single video and saves them.

    This function cleans the output directory, reads the video, extracts frames
    at even intervals, detects the primary face using MTCNN, and saves the
    cropped/resized face to disk.

    Args:
        detector (MTCNN): The initialized MTCNN face detector.
        video_path (str): Path to the video file.
        output_dir (str): Directory to save the extracted face frames.
        num_frames_to_extract (int): The number of frames to sample.
        image_size (tuple): The (width, height) to resize the final face crops to.

    Returns:
        list: A list of file paths to the saved face frames.
    """
    print(f"--- Extracting Frames from {os.path.basename(video_path)} ---")
    
    # Clean the output directory before starting
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Unable to open video {video_path}")
        return []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames == 0:
        print(f"Error: Video {video_path} has zero frames.")
        cap.release()
        return []
        
    # Determine the step size to sample frames evenly
    step = max(1, total_frames // num_frames_to_extract)
    saved_frame_paths = []
    
    for i in tqdm(range(num_frames_to_extract), desc="Extracting Faces"):
        frame_index = i * step
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()
        if not ret:
            break

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = detector.detect_faces(frame_rgb)
        
        # If a face is detected, crop, resize, and save it
        if results:
            x, y, width, height = results[0]['box']
            x, y = max(0, x), max(0, y) # Ensure coordinates are non-negative
            face = frame[y:y+height, x:x+width]
            
            if face.size == 0:
                continue
            
            face_resized = cv2.resize(face, image_size)
            face_path = os.path.join(output_dir, f"frame_{i}.jpg")
            cv2.imwrite(face_path, face_resized)
            saved_frame_paths.append(face_path)

    cap.release()
    print(f"Successfully extracted {len(saved_frame_paths)} face frames.\n")
    return saved_frame_paths
