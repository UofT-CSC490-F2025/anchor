from typing import Any, Dict
import os

def import_faceforensicspp(data_dir: str) -> Dict[str, Any]:
    """
    Imports FaceForensics++ dataset metadata with hierarchical structure.
    Args:
        data_dir (str): Path to FaceForensics++ dataset root.
    Returns:
        Dict with categorized file paths and labels.
    """
    result = {
        "dataset": "FaceForensics++",
        "downloaded_videos": [],
        "original_sequences": {
            "youtube": {
                "c0_raw": [],
                "c23_hq": [],
                "c40_lq": []
            },
            "actors": []
        },
        "manipulated_sequences": {
            "deepfakes": [],
            "deepfake_detection": [],
            "face2face": [],
            "faceswap": [],
            "neural_textures": []
        }
    }
    
    # Import downloaded videos
    downloaded_videos_path = os.path.join(data_dir, "downloaded_videos")
    if os.path.exists(downloaded_videos_path):
        for root, _, files in os.walk(downloaded_videos_path):
            for file in files:
                if file.endswith(('.mp4', '.avi', '.mov')):
                    result["downloaded_videos"].append(os.path.join(root, file))
    
    # Import original sequences - YouTube
    youtube_path = os.path.join(data_dir, "original_sequences", "youtube")
    if os.path.exists(youtube_path):
        # c0 (raw) sequences
        c0_path = os.path.join(youtube_path, "c0")
        if os.path.exists(c0_path):
            for root, _, files in os.walk(c0_path):
                for file in files:
                    if file.endswith(('.mp4', '.avi', '.mov', '.jpg', '.png')):
                        result["original_sequences"]["youtube"]["c0_raw"].append(os.path.join(root, file))
        
        # c23 (high quality) sequences
        c23_path = os.path.join(youtube_path, "c23")
        if os.path.exists(c23_path):
            for root, _, files in os.walk(c23_path):
                for file in files:
                    if file.endswith(('.mp4', '.avi', '.mov', '.jpg', '.png')):
                        result["original_sequences"]["youtube"]["c23_hq"].append(os.path.join(root, file))
        
        # c40 (low quality) sequences
        c40_path = os.path.join(youtube_path, "c40")
        if os.path.exists(c40_path):
            for root, _, files in os.walk(c40_path):
                for file in files:
                    if file.endswith(('.mp4', '.avi', '.mov', '.jpg', '.png')):
                        result["original_sequences"]["youtube"]["c40_lq"].append(os.path.join(root, file))
    
    # Import original sequences - Actors (DeepFakeDetection dataset)
    actors_path = os.path.join(data_dir, "original_sequences", "actors")
    if os.path.exists(actors_path):
        for root, _, files in os.walk(actors_path):
            for file in files:
                if file.endswith(('.mp4', '.avi', '.mov', '.jpg', '.png')):
                    result["original_sequences"]["actors"].append(os.path.join(root, file))
    
    # Import manipulated sequences
    manipulated_methods = {
        "deepfakes": "Deepfakes",
        "deepfake_detection": "DeepFakeDetection",
        "face2face": "Face2Face",
        "faceswap": "FaceSwap",
        "neural_textures": "NeuralTextures"
    }
    
    for key, folder_name in manipulated_methods.items():
        method_path = os.path.join(data_dir, "manipulated_sequences", folder_name)
        if os.path.exists(method_path):
            for root, _, files in os.walk(method_path):
                for file in files:
                    if file.endswith(('.mp4', '.avi', '.mov', '.jpg', '.png')):
                        result["manipulated_sequences"][key].append(os.path.join(root, file))
    
    return result

# def import_celebd(data_dir: str) -> Dict[str, Any]:
#     """
#     Imports Celeb-DF dataset metadata.
#         data_dir (str): Path to Celeb-DF dataset root.
#     Returns:
#         Dict with file paths and labels.
#     """
#     video_files = []
#     for root, _, files in os.walk(data_dir):
#         for file in files:
#             if file.endswith('.mp4'):
#                 video_files.append(os.path.join(root, file))
#     return {"dataset": "Celeb-DF", "videos": video_files}

def import_celebdfpp(data_dir: str) -> Dict[str, Any]:
    """
    Imports Celeb-DF++ dataset metadata with hierarchical structure.
    Args:
        data_dir (str): Path to Celeb-DF++ dataset root.
    Returns:
        Dict with categorized file paths and labels.
    """
    result = {
        "dataset": "Celeb-DF++",
        "real_videos": {
            "celeb_real": [],
            "youtube_real": []
        },
        "synthetic_videos": {
            "face_swap": {
                "celeb_df": [],
                "blend_face": [],
                "ghost": [],
                "hifi_face": [],
                "in_swapper": [],
                "mobile_face_swap": [],
                "sim_swap": [],
                "uni_face": []
            },
            "face_reenact": {
                "da_gan": [],
                "fsrt": [],
                "hyper_reenact": [],
                "lia": [],
                "live_portrait": [],
                "mcnet": [],
                "tpsmm": []
            },
            "talking_face": {
                "ani_talker": [],
                "echo_mimic": [],
                "ed_talk": [],
                "float": [],
                "ip_lap": [],
                "real3d_portrait": [],
                "sad_talker": []
            }
        },
        "testing_list": None
    }
    
    # Import real videos
    celeb_real_path = os.path.join(data_dir, "Celeb-real")
    if os.path.exists(celeb_real_path):
        for root, _, files in os.walk(celeb_real_path):
            for file in files:
                if file.endswith('.mp4'):
                    result["real_videos"]["celeb_real"].append(os.path.join(root, file))
    
    youtube_real_path = os.path.join(data_dir, "YouTube-real")
    if os.path.exists(youtube_real_path):
        for root, _, files in os.walk(youtube_real_path):
            for file in files:
                if file.endswith('.mp4'):
                    result["real_videos"]["youtube_real"].append(os.path.join(root, file))
    
    # Import synthetic videos - FaceSwap
    face_swap_methods = {
        "celeb_df": "Celeb-DF",
        "blend_face": "BlendFace",
        "ghost": "GHOST",
        "hifi_face": "HifiFace",
        "in_swapper": "InSwapper",
        "mobile_face_swap": "MobileFaceSwap",
        "sim_swap": "SimSwap",
        "uni_face": "UniFace"
    }
    
    for key, folder_name in face_swap_methods.items():
        method_path = os.path.join(data_dir, "Celeb-synthesis", "FaceSwap", folder_name)
        if os.path.exists(method_path):
            for root, _, files in os.walk(method_path):
                for file in files:
                    if file.endswith('.mp4'):
                        result["synthetic_videos"]["face_swap"][key].append(os.path.join(root, file))
    
    # Import synthetic videos - FaceReenact
    face_reenact_methods = {
        "da_gan": "DaGAN",
        "fsrt": "FSRT",
        "hyper_reenact": "HyperReenact",
        "lia": "LIA",
        "live_portrait": "LivePortrait",
        "mcnet": "MCNET",
        "tpsmm": "TPSMM"
    }
    
    for key, folder_name in face_reenact_methods.items():
        method_path = os.path.join(data_dir, "Celeb-synthesis", "FaceReenact", folder_name)
        if os.path.exists(method_path):
            for root, _, files in os.walk(method_path):
                for file in files:
                    if file.endswith('.mp4'):
                        result["synthetic_videos"]["face_reenact"][key].append(os.path.join(root, file))
    
    # Import synthetic videos - TalkingFace
    talking_face_methods = {
        "ani_talker": "AniTalker",
        "echo_mimic": "EchoMimic",
        "ed_talk": "EDTalk",
        "float": "FLOAT",
        "ip_lap": "IP_LAP",
        "real3d_portrait": "Real3DPortrait",
        "sad_talker": "SadTalker"
    }
    
    for key, folder_name in talking_face_methods.items():
        method_path = os.path.join(data_dir, "Celeb-synthesis", "TalkingFace", folder_name)
        if os.path.exists(method_path):
            for root, _, files in os.walk(method_path):
                for file in files:
                    if file.endswith('.mp4'):
                        result["synthetic_videos"]["talking_face"][key].append(os.path.join(root, file))
    
    # Import testing list
    testing_list_path = os.path.join(data_dir, "List_of_testing_videos.txt")
    if os.path.exists(testing_list_path):
        with open(testing_list_path, 'r', encoding='utf-8') as f:
            result["testing_list"] = f.read().strip().split('\n')
    
    return result
