import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

MONGO_URI = os.getenv('MONGODB_URI')
if not MONGO_URI:
    raise ValueError("MONGODB_URI is missing from .env")

# Initialize connection
client = MongoClient(MONGO_URI)
# This gets the default database specified in the URI (e.g., esports_db)
db = client.get_database()
