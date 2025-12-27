from datetime import datetime
import uuid

class Photo:
    def __init__(self, filename):
        self.id = str(uuid.uuid4())
        self.filename = filename
        self.timestamp = datetime.now()
        self.comments = [] # List of {user_hash, content, date, alias_index}
        self.comment_user_map = {} # Map unique_user_id -> alias_index (1, 2, 3...)

    def add_comment(self, user_id, content):
        if user_id not in self.comment_user_map:
            # Assign new alias index
            self.comment_user_map[user_id] = len(self.comment_user_map) + 1
        
        alias_index = self.comment_user_map[user_id]
        
        comment = {
            'alias': f'익명{alias_index}',
            'content': content,
            'timestamp': datetime.now().isoformat()
        }
        self.comments.append(comment)
        return comment

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'timestamp': self.timestamp.isoformat(),
            'comments': self.comments
        }
