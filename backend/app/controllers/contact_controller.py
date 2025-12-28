from flask import Blueprint, request, jsonify
from app.models.contact_model import Contact

contact_bp = Blueprint('contact', __name__)

# In-memory storage for contacts
contacts = []

@contact_bp.route('/contacts', methods=['GET'])
def get_contacts():
    # Return sorted by newest first
    sorted_contacts = sorted(contacts, key=lambda x: x.timestamp, reverse=True)
    return jsonify([c.to_dict() for c in sorted_contacts]), 200

@contact_bp.route('/contacts', methods=['POST'])
def create_contact():
    data = request.json
    title = data.get('title')
    content = data.get('content')
    email = data.get('email', '익명')
    
    if not title or not content:
        return jsonify({'error': '제목과 내용을 입력해주세요.'}), 400
        
    new_contact = Contact(title, content, email)
    contacts.append(new_contact)
    
    return jsonify(new_contact.to_dict()), 201
