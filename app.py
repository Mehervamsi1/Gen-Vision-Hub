import os
import logging
import json
import time
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
CORS(app)

# Mock video generation models with their capabilities
MODELS = {
    "pika": {
        "name": "Pika Labs",
        "description": "Excellent for character-driven narratives and smooth motion. Best for cinematic scenes with realistic lighting.",
        "capabilities": ["Character Animation", "Cinematic Quality", "Realistic Lighting"]
    },
    "runway": {
        "name": "RunwayML",
        "description": "Great for creative and artistic video generation. Excels at abstract and stylized content.",
        "capabilities": ["Creative Effects", "Style Transfer", "Abstract Art"]
    },
    "sora": {
        "name": "Sora",
        "description": "OpenAI's advanced model for high-quality, coherent video generation with complex scenes.",
        "capabilities": ["Complex Scenes", "High Quality", "Long Duration"]
    }
}

# In-memory storage for prompt history (in production, use a database)
prompt_history = []

@app.route('/')
def index():
    """Main page route"""
    return render_template('index.html', models=MODELS)

@app.route('/api/generate', methods=['POST'])
def generate_video():
    """Generate video based on prompt and selected models"""
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        selected_models = data.get('models', [])
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        if not selected_models:
            return jsonify({'error': 'At least one model must be selected'}), 400
        
        # Validate selected models
        invalid_models = [model for model in selected_models if model not in MODELS]
        if invalid_models:
            return jsonify({'error': f'Invalid models: {", ".join(invalid_models)}'}), 400
        
        # Simulate processing time
        time.sleep(2)
        
        # Generate mock video results
        results = []
        placeholder_videos = ['placeholder1.mp4', 'placeholder2.mp4', 'placeholder3.mp4']
        
        for i, model_id in enumerate(selected_models):
            model_info = MODELS[model_id]
            video_file = placeholder_videos[i % len(placeholder_videos)]
            
            result = {
                'model_id': model_id,
                'model_name': model_info['name'],
                'video_url': f'/static/videos/{video_file}',
                'prompt': prompt,
                'generation_time': f'{2 + i}s',
                'timestamp': datetime.now().isoformat(),
                'likes': 0
            }
            results.append(result)
        
        # Add to prompt history
        history_entry = {
            'prompt': prompt,
            'models': [MODELS[model_id]['name'] for model_id in selected_models],
            'timestamp': datetime.now().isoformat(),
            'results': len(results)
        }
        prompt_history.insert(0, history_entry)
        
        # Keep only last 10 entries
        if len(prompt_history) > 10:
            prompt_history.pop()
        
        return jsonify({
            'success': True,
            'results': results,
            'message': f'Generated {len(results)} videos successfully'
        })
        
    except Exception as e:
        logging.error(f"Error generating video: {str(e)}")
        return jsonify({'error': 'Failed to generate video. Please try again.'}), 500

@app.route('/api/history')
def get_history():
    """Get prompt history"""
    return jsonify({'history': prompt_history})

@app.route('/api/models')
def get_models():
    """Get available models information"""
    return jsonify({'models': MODELS})

@app.route('/api/like', methods=['POST'])
def like_video():
    """Like a video (mock implementation)"""
    try:
        data = request.get_json()
        video_id = data.get('video_id')
        
        # In a real implementation, this would update the database
        # For now, just return success
        return jsonify({'success': True, 'message': 'Video liked successfully'})
        
    except Exception as e:
        logging.error(f"Error liking video: {str(e)}")
        return jsonify({'error': 'Failed to like video'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
