import uuid
from datetime import datetime

class Contact:
    def __init__(self, title, content, email="익명"):
        self.id = str(uuid.uuid4())
        self.title = title
        self.content = content
        self.email = email
        self.timestamp = datetime.now()
        
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'email': self.email,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        }
