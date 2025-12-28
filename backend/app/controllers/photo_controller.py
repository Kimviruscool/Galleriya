from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from app.models.photo_model import Photo
from datetime import datetime, timedelta
import os

photo_bp = Blueprint('photo', __name__)

# In-memory storage for MVP
photos = []

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@photo_bp.route('/upload', methods=['POST'])
def upload_photo():
    if 'file' not in request.files:
        return jsonify({'error': '파일이 없습니다.'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': '선택된 파일 없음.'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Rename to avoid collisions
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename))
        
        new_photo = Photo(unique_filename)
        photos.append(new_photo)
        
        return jsonify({'message': '성공적으로 업로드되었습니다.', 'photo': new_photo.to_dict()}), 201
    
    return jsonify({'error': '허용되지 않는 파일 형식입니다.'}), 400

# Initialize photos from disk
def init_photos_from_disk():
    global photos
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'uploads')
    if os.path.exists(upload_folder):
        for filename in os.listdir(upload_folder):
            if allowed_file(filename):
                # Create photo object
                photo = Photo(filename)
                # Try to set timestamp to file modification time
                filepath = os.path.join(upload_folder, filename)
                mtime = os.path.getmtime(filepath)
                photo.timestamp = datetime.fromtimestamp(mtime)
                photos.append(photo)

# Call initialization
init_photos_from_disk()

@photo_bp.route('/photos', methods=['GET'])
def get_photos():
    current_time = datetime.now()
    valid_photos = []
    
    global photos
    
    # Identifiy expired or missing photos
    expired_or_missing = []
    active_photos = []
    
    for p in photos:
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], p.filename)
        
        # Check expiration
        is_expired = current_time - p.timestamp >= timedelta(hours=24)
        
        # Check physical existence
        is_missing = not os.path.exists(file_path)
        
        if is_expired or is_missing:
            expired_or_missing.append(p)
        else:
            active_photos.append(p)
            
    # Update global list
    photos = active_photos
    
    # Physical deletion of expired files (if they exist)
    for photo in expired_or_missing:
        # Only try to delete if it's expired (and presumably exists, or we double check)
        # If it was missing, we just dropped it from memory, no need to delete.
        # But if it was expired, we should try to delete.
        try:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], photo.filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"Expired photo deleted: {photo.filename}")
        except Exception as e:
            print(f"Error deleting file {photo.filename}: {e}")
    
    return jsonify([p.to_dict() for p in photos]), 200

@photo_bp.route('/photos/<photo_id>/comments', methods=['POST'])
def add_comment(photo_id):
    data = request.json
    user_id = data.get('user_id')
    content = data.get('content')
    
    if not user_id or not content:
        return jsonify({'error': '필수 정보가 누락되었습니다.'}), 400
        
    for photo in photos:
        if photo.id == photo_id:
            comment = photo.add_comment(user_id, content)
            return jsonify(comment), 201
            
    return jsonify({'error': '사진을 찾을 수 없습니다.'}), 404

@photo_bp.route('/photos/<photo_id>/like', methods=['POST'])
def like_photo(photo_id):
    global photos
    for photo in photos:
        if photo.id == photo_id:
            new_count = photo.add_like()
            return jsonify({'likes': new_count}), 200
            
    return jsonify({'error': '사진을 찾을 수 없습니다.'}), 404

@photo_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
