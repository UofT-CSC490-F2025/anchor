from fastapi import APIRouter, Depends, HTTPException, status
# from app.api.auth import get_current_user
import requests, os, uuid, cv2, yt_dlp, dotenv, pytesseract
import speech_recognition as sr
from moviepy.video.io.VideoFileClip import VideoFileClip
from transformers import pipeline

router = APIRouter()
dotenv.load_dotenv()
pytesseract.pytesseract.tesseract_cmd = r'C:\Users\Hardik\OneDrive - University of Toronto\4th Year\CSC490\lib\tesseract.exe'  # Update this path as needed
try:
    summarization_pipeline = pipeline("summarization", model="facebook/bart-large-cnn")
except Exception as e:
    print(f"Warning: Could not load summarization model: {e}")
    summarization_pipeline = None

@router.post("/predict")
async def predict_tiktok_videos(url: str):#, current_user: dict = Depends(get_current_user)):
    """
    Predict TikTok videos from a given URL.
    """
    # if not current_user:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Not authenticated",
    #         headers={"WWW-Authenticate": "Bearer"},
    #     )
    
    # Placeholder for actual scraping logic
    file_path, file_name = _scrape_tiktok_videos(url)
    print(f"Scraped file path: {file_path}, file name: {file_name}")
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to scrape TikTok videos.",
        )

    # Extract frames from the downloaded video
    frames_output_dir = os.path.join("frames", str(uuid.uuid4()))
    frame_data = _extract_frames_from_video(file_path, frames_output_dir)
    if not frame_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract frames from video.",
        )
    # Perform OCR on the first frame as an example
    ocr_text = ""
    for frame in os.listdir(frames_output_dir):
        try:   
            frame_text = _get_text_from_image(os.path.join(frames_output_dir, frame))
            if frame_text.strip() != "":
                ocr_text += frame_text.strip() + " "    
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to extract text from image.",
        )
    
    # If the video has audio, extract text from it
    audio_text = ""
    try:
        video_clip = VideoFileClip(file_path)
        if video_clip.audio is not None:
            video_clip.audio.write_audiofile("temp_audio.wav")
            audio_text = _get_text_from_audio("temp_audio.wav")
            video_clip.audio.close()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to extract audio from video.",
        )

    full_text = ocr_text + " " + audio_text

    if summarization_pipeline:
        ocr_summary = summarization_pipeline(full_text, max_length=50, min_length=10, do_sample=False)[0]['summary_text']
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Summarization model not available."
        )

    # check_deepfake = _deepware_api_check(file_path)

    # Fact-check the extracted text
    fact_check_results = _claim_buster_api_check(ocr_summary)
    if fact_check_results is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform fact-checking.",
        )
    return {
        "file_name": file_name,
        "deepfake_check": check_deepfake,
        "fact_check_results": fact_check_results
    }

def _scrape_tiktok_videos(url: str):
    # Placeholder for actual TikTok scraping logic
    # This function should return a list of video data dictionaries
    try:
        # Create downloads directory if it doesn't exist
        download_dir = "downloads"
        os.makedirs(download_dir, exist_ok=True)
        
        output_path = download_dir
        file_name = f"{uuid.uuid4()}.mp4"
        # Get the file path of the downloaded video
        file_path = os.path.join(output_path, file_name)
        ydl_opts = {
            'outtmpl': file_path,
            'format': 'mp4',
            'quiet': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        return file_path, file_name

    except Exception as e:
        return None, str(e)
    

def _extract_frames_from_video(video_path: str, output_dir: str, frame_rate: int = 1):
    """
    Extract frames from a video at a specified frame rate.
    """

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    vidcap = cv2.VideoCapture(video_path)
    success, image = vidcap.read()
    count = 0
    fps = vidcap.get(cv2.CAP_PROP_FPS)
    interval = int(fps / frame_rate)

    while success:
        if count % interval == 0:
            frame_filename = os.path.join(output_dir, f"frame{count}.jpg")
            cv2.imwrite(frame_filename, image)
        success, image = vidcap.read()
        count += 1

    vidcap.release()
    return {"frames": output_dir}


def _get_text_from_image(image_path: str):
    """
    Extract text from an image using OCR.
    """
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(thresh)
        return text
    except Exception as e:
        return str(e)

def _google_fact_check(query: str):
    """
    Perform a Google search to fact-check the extracted text.
    """
    try:
        search_url = f"GET https://factchecktools.googleapis.com/v1alpha1/claims:search?query={query}&languageCode=en-US&maxAgeDays=30&pageSize=10"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"}
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        claims = response.json().get("claims", [])
        results = {}
        for claim in claims:
            text = claim.get("text", "")
            claimant = claim.get("claimant", "")
            rating = claim.get("claimReview", [{}])[0].get("textualRating", "")
            return results.setdefault(text, []).append({
                "claimant": claimant,
                "rating": rating
            })
    except Exception as e:
        return str(e)


def _claim_buster_api_check(query: str):
    """Perform fact-checking using the Claim Buster API."""
    api_key = os.getenv('CLAIM_BUSTER_API_KEY')
    
    if not api_key:
        print("Warning: CLAIM_BUSTER_API_KEY not found in environment")
        return None
    
    try:
        url = "https://idir.uta.edu/claimbuster/api/v2/score/text/sentences"
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {"input_text": query}
        
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    
    except Exception as e:
        print(f"ClaimBuster API error: {str(e)}")
        return None


def _get_text_from_audio(audio_path: str):
    """
    Extract text from an audio file using speech recognition.
    """
    try:
        recognizer = sr.Recognizer()
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
        
        # Use Google's free speech recognition (no API key required)
        text = recognizer.recognize_google(audio)
        return text
    
    except sr.UnknownValueError:
        print("Google Speech Recognition could not understand audio")
        return ""
    except sr.RequestError as e:
        print(f"Could not request results from Google Speech Recognition service; {e}")
        return ""
    except Exception as e:
        print(f"Error extracting audio text: {str(e)}")
        return ""

