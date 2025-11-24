"""
DeepFace Emotion Analysis Microservice
Analyzes facial emotions from base64-encoded image frames
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2
from deepface import DeepFace
import logging
import os
from collections import deque

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===================== Configuration =====================
# Weights for confidence derivation (can be tuned via env vars)
CONF_WEIGHT_ASSERTIVENESS = float(os.getenv('CONF_WEIGHT_ASSERTIVENESS', '0.5'))
CONF_WEIGHT_CALMNESS = float(os.getenv('CONF_WEIGHT_CALMNESS', '0.3'))
CONF_WEIGHT_COMPOSURE = float(os.getenv('CONF_WEIGHT_COMPOSURE', '0.3'))
CONF_WEIGHT_RESILIENCE = float(os.getenv('CONF_WEIGHT_RESILIENCE', '0.2'))
CONF_BOOST_THRESHOLD_ANGRY = float(os.getenv('CONF_BOOST_THRESHOLD_ANGRY', '0.15'))
CONF_BOOST_THRESHOLD_FEAR = float(os.getenv('CONF_BOOST_THRESHOLD_FEAR', '0.3'))
CONF_BOOST_MULTIPLIER = float(os.getenv('CONF_BOOST_MULTIPLIER', '1.3'))

# Weights for nervous derivation
NERV_WEIGHT_FEAR = float(os.getenv('NERV_WEIGHT_FEAR', '1.8'))
NERV_WEIGHT_WORRY = float(os.getenv('NERV_WEIGHT_WORRY', '0.6'))
NERV_WEIGHT_TENSION = float(os.getenv('NERV_WEIGHT_TENSION', '0.3'))
NERV_WEIGHT_STARTLE = float(os.getenv('NERV_WEIGHT_STARTLE', '0.4'))
NERV_BOOST_FEAR_THRESHOLD = float(os.getenv('NERV_BOOST_FEAR_THRESHOLD', '0.2'))
NERV_BOOST_MULTIPLIER = float(os.getenv('NERV_BOOST_MULTIPLIER', '1.2'))

# Dominance thresholds
DOM_THRESHOLD_CONFIDENT = float(os.getenv('DOM_THRESHOLD_CONFIDENT', '0.25'))
DOM_THRESHOLD_NERVOUS = float(os.getenv('DOM_THRESHOLD_NERVOUS', '0.20'))

# Smoothing configuration
SMOOTHING_WINDOW = int(os.getenv('SMOOTHING_WINDOW', '12'))  # last N frames
SMOOTHING_EMA_ALPHA = float(os.getenv('SMOOTHING_EMA_ALPHA', '0.4'))  # EMA weight

# Per-interview session state for smoothing (in-memory ephemeral)
session_state = {}

def _get_session_emotion_deque(interview_id):
    if interview_id not in session_state:
        session_state[interview_id] = {
            'history': deque(maxlen=SMOOTHING_WINDOW),  # list of {confident, nervous, base:{...}}
            'ema': {
                'confident': None,
                'nervous': None
            }
        }
    return session_state[interview_id]
def process_emotions(emotions_raw, dominant_emotion, interview_id=None):
    """
    Process raw emotion data from DeepFace and derive interview-relevant emotions
    (confident, nervous) with improved detection logic
    
    Args:
        emotions_raw: Dict of emotion scores from DeepFace (0-100 scale)
        dominant_emotion: The dominant emotion from DeepFace
        
    Returns:
        Tuple of (emotions_normalized dict, updated_dominant_emotion string, confidence float)
    """
    # Convert all emotion values to 0-1 scale
    emotions_normalized = {}
    for k, v in emotions_raw.items():
        emotions_normalized[str(k)] = float(round(float(v) / 100.0, 4))
    
    # DERIVE CONFIDENT emotion for interview context
    angry_score = emotions_normalized.get('angry', 0.0)
    fear_score = emotions_normalized.get('fear', 0.0)
    sad_score = emotions_normalized.get('sad', 0.0)
    neutral_score = emotions_normalized.get('neutral', 0.0)
    happy_score = emotions_normalized.get('happy', 0.0)
    surprise_score = emotions_normalized.get('surprise', 0.0)
    
    # Confident formula: assertiveness + calmness + composure
    confident_base = angry_score * CONF_WEIGHT_ASSERTIVENESS
    confident_calm = (1.0 - fear_score) * CONF_WEIGHT_CALMNESS
    confident_composure = (neutral_score + happy_score * 0.5) * CONF_WEIGHT_COMPOSURE
    confident_positive = (1.0 - sad_score) * CONF_WEIGHT_RESILIENCE
    
    confident_score = min(1.0, confident_base + confident_calm + confident_composure + confident_positive)
    
    # Boost confidence if showing assertive but calm demeanor
    if angry_score > CONF_BOOST_THRESHOLD_ANGRY and fear_score < CONF_BOOST_THRESHOLD_FEAR:
        confident_score = min(1.0, confident_score * CONF_BOOST_MULTIPLIER)
    
    emotions_normalized['confident'] = float(round(confident_score, 4))
    
    # Remove angry from emotions dict
    if 'angry' in emotions_normalized:
        del emotions_normalized['angry']
    
    # Update dominant emotion if it was angry
    if dominant_emotion == 'angry':
        dominant_emotion = 'confident'
    
    # DERIVE NERVOUS emotion for interview context
    nervous_primary = fear_score * NERV_WEIGHT_FEAR
    nervous_worry = sad_score * NERV_WEIGHT_WORRY
    nervous_tense = (1.0 - happy_score) * NERV_WEIGHT_TENSION
    nervous_startled = surprise_score * NERV_WEIGHT_STARTLE
    
    nervous_score = min(1.0, nervous_primary + nervous_worry + nervous_tense + nervous_startled)
    
    # Boost nervousness if fear is significant
    if fear_score > NERV_BOOST_FEAR_THRESHOLD:
        nervous_score = min(1.0, nervous_score * NERV_BOOST_MULTIPLIER)
    
    emotions_normalized['nervous'] = float(round(nervous_score, 4))
    
    # Update dominant emotion if confident/nervous scores are high enough
    max_base_emotion_score = max([emotions_normalized.get(e, 0) for e in ['happy', 'sad', 'fear', 'surprise', 'neutral']])
    
    # Confident becomes dominant if it's > 0.25 AND higher than current max
    if confident_score > DOM_THRESHOLD_CONFIDENT and confident_score > max_base_emotion_score:
        dominant_emotion = 'confident'
        max_base_emotion_score = confident_score
    
    # Nervous becomes dominant if it's > 0.20 AND higher than the current max
    if nervous_score > DOM_THRESHOLD_NERVOUS and nervous_score > max_base_emotion_score:
        dominant_emotion = 'nervous'
    
    # Calculate confidence as the score of dominant emotion
    confidence = float(emotions_normalized.get(dominant_emotion, 0.0))

    # Contributions breakdown for frontend transparency
    contributions = {
        'confident': {
            'assertiveness': round(confident_base, 4),
            'calmness': round(confident_calm, 4),
            'composure': round(confident_composure, 4),
            'resilience': round(confident_positive, 4)
        },
        'nervous': {
            'fear': round(nervous_primary, 4),
            'worry': round(nervous_worry, 4),
            'tension': round(nervous_tense, 4),
            'startle': round(nervous_startled, 4)
        }
    }

    # Smoothing logic (EMA + window average) if interview_id provided
    smoothed_emotions = emotions_normalized.copy()
    if interview_id:
        state = _get_session_emotion_deque(interview_id)
        state['history'].append({'confident': confident_score, 'nervous': nervous_score})
        # EMA
        prev_conf_ema = state['ema']['confident']
        prev_nerv_ema = state['ema']['nervous']
        if prev_conf_ema is None:
            conf_ema = confident_score
        else:
            conf_ema = prev_conf_ema * (1 - SMOOTHING_EMA_ALPHA) + confident_score * SMOOTHING_EMA_ALPHA
        if prev_nerv_ema is None:
            nerv_ema = nervous_score
        else:
            nerv_ema = prev_nerv_ema * (1 - SMOOTHING_EMA_ALPHA) + nervous_score * SMOOTHING_EMA_ALPHA
        state['ema']['confident'] = conf_ema
        state['ema']['nervous'] = nerv_ema
        # Window average
        window_conf_avg = sum(h['confident'] for h in state['history']) / len(state['history'])
        window_nerv_avg = sum(h['nervous'] for h in state['history']) / len(state['history'])
        # Combine EMA and window average for final smoothed value
        smoothed_confident = min(1.0, (conf_ema * 0.6) + (window_conf_avg * 0.4))
        smoothed_nervous = min(1.0, (nerv_ema * 0.6) + (window_nerv_avg * 0.4))
        smoothed_emotions['confident'] = round(smoothed_confident, 4)
        smoothed_emotions['nervous'] = round(smoothed_nervous, 4)

    return emotions_normalized, dominant_emotion, confidence, contributions, smoothed_emotions


def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64
        img_data = base64.b64decode(base64_string)
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        
        # Decode image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return img
    except Exception as e:
        logger.error(f"Error converting base64 to image: {str(e)}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'emotion-analysis'}), 200

@app.route('/analyze', methods=['POST'])
def analyze_emotion():
    """
    Analyze emotion from base64-encoded image frame
    
    Expected JSON body:
    {
        "frame": "base64_encoded_image_string",
        "timestamp": 1234567890
    }
    
    Returns:
    {
        "success": true,
        "emotion": "happy",
        "emotions": {
            "angry": 0.01,
            "disgust": 0.0,
            "fear": 0.02,
            "happy": 0.85,
            "sad": 0.01,
            "surprise": 0.05,
            "neutral": 0.06
        },
        "timestamp": 1234567890,
        "dominant_emotion": "happy",
        "confidence": 0.85
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing frame data'
            }), 400
        
        # Convert base64 frame to image
        img = base64_to_image(data['frame'])
        
        if img is None:
            return jsonify({
                'success': False,
                'error': 'Invalid image data'
            }), 400
        
        # Check if image is valid
        if img.size == 0:
            return jsonify({
                'success': False,
                'error': 'Empty image'
            }), 400
        
        # Analyze emotion using DeepFace
        # actions=['emotion'] analyzes only emotion (faster)
        # enforce_detection=False allows analysis even if face detection fails
        # detector_backend='opencv' is faster than default 'retinaface'
        logger.info(f"Analyzing frame with shape: {img.shape}")
        
        result = DeepFace.analyze(
            img_path=img,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv',
            silent=True
        )
        
        logger.info(f"DeepFace result type: {type(result)}")
        
        # Extract emotion data (DeepFace returns list even for single face)
        if isinstance(result, list) and len(result) > 0:
            emotion_data = result[0]
        else:
            emotion_data = result
        
        # Get emotion scores (convert numpy types to native Python types)
        emotions = emotion_data.get('emotion', {})
        dominant_emotion = str(emotion_data.get('dominant_emotion', 'neutral'))
        
        # Process emotions using helper function
        interview_id = data.get('interviewId')
        emotions_normalized, dominant_emotion, confidence, contributions, smoothed_emotions = process_emotions(emotions, dominant_emotion, interview_id)
            # Log confident and nervous scores for debugging
            logger.info(f"Confident raw: {emotions_normalized.get('confident', 0):.3f} smoothed: {smoothed_emotions.get('confident', 0):.3f}; Nervous raw: {emotions_normalized.get('nervous', 0):.3f} smoothed: {smoothed_emotions.get('nervous', 0):.3f}")
        
        
        response = {
            'success': True,
            'emotion': dominant_emotion,
            'emotions': smoothed_emotions,  # use smoothed for primary consumption
            'raw_emotions': emotions_normalized,  # raw derived (post-processing, pre-smoothing)
            'timestamp': int(data.get('timestamp', 0)),
            'dominant_emotion': dominant_emotion,
            'confidence': float(round(confidence, 4)),
            'contributions': contributions,
            'smoothing': {
                'enabled': bool(interview_id),
                'window': SMOOTHING_WINDOW,
                'alpha': SMOOTHING_EMA_ALPHA
            }
        }
        
        logger.info(f"Analysis successful: {dominant_emotion} ({confidence:.2%})")
        
        return jsonify(response), 200
        
    except Exception as e:
        import traceback
        logger.error(f"Error analyzing emotion: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'message': 'Failed to analyze emotion'
        }), 500

@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """
    Analyze emotions from multiple frames
    
    Expected JSON body:
    {
        "frames": [
            {"frame": "base64_string", "timestamp": 123},
            {"frame": "base64_string", "timestamp": 456}
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'frames' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing frames data'
            }), 400
        
        frames = data['frames']
        results = []
        
        for frame_data in frames:
            try:
                img = base64_to_image(frame_data['frame'])
                
                if img is None or img.size == 0:
                    continue
                
                result = DeepFace.analyze(
                    img_path=img,
                    actions=['emotion'],
                    enforce_detection=False,
                    detector_backend='opencv',
                    silent=True
                )
                
                if isinstance(result, list) and len(result) > 0:
                    emotion_data = result[0]
                else:
                    emotion_data = result
                
                emotions = emotion_data.get('emotion', {})
                dominant_emotion = str(emotion_data.get('dominant_emotion', 'neutral'))
                interview_id_frame = frame_data.get('interviewId')

                emotions_normalized, dominant_emotion, confidence, contributions, smoothed_emotions = process_emotions(emotions, dominant_emotion, interview_id_frame)

                results.append({
                    'success': True,
                    'emotion': dominant_emotion,
                    'emotions': smoothed_emotions,
                    'raw_emotions': emotions_normalized,
                    'timestamp': int(frame_data.get('timestamp', 0)),
                    'confidence': float(round(confidence, 4)),
                    'contributions': contributions
                })
                
            except Exception as e:
                logger.error(f"Error in batch frame: {str(e)}")
                results.append({
                    'success': False,
                    'error': str(e),
                    'timestamp': frame_data.get('timestamp', 0)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'analyzed': len([r for r in results if r.get('success')])
        }), 200
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Run on port 5001 to avoid conflicts with React dev server (3000) and Express (5000)
    app.run(host='0.0.0.0', port=5001, debug=False)
