import pdfplumber
import docx
import re
import spacy
import firebase_admin
from firebase_admin import credentials, firestore, storage
import os

# ----------------- Firebase Setup -----------------
# Initialize Firebase app
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase_key.json")  # your Firebase key
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'parser-de40e.appspot.com'   # replace with your bucket
    })

# Firestore client
db = firestore.client()
bucket = storage.bucket()

# ----------------- NLP Setup -----------------
nlp = spacy.load('en_core_web_sm')

def upload_file_to_firebase(file_path: str):
    try:
        # Get file name
        file_name = os.path.basename(file_path)

        # Create a blob (storage object)
        blob = bucket.blob(f"resumes/{file_name}")

        # Upload file
        blob.upload_from_filename(file_path)

        # Make it public (optional)
        blob.make_public()

        # Save metadata in Firestore
        doc_ref = db.collection("resumes").document(file_name)
        doc_ref.set({
            "file_name": file_name,
            "download_url": blob.public_url
        })

        print(f"File uploaded successfully: {blob.public_url}")
    except Exception as e:
        print("Error uploading file:", e)

def download_from_firebase():
    try:
        resumes_ref = db.collection("resumes")
        docs = resumes_ref.stream()
        data_list = [doc.to_dict() for doc in docs]
        #print("Downloaded data from Firebase:", data_list)
        return data_list
    except Exception as e:
        print("Error downloading from Firebase:", e)
        return []

if __name__ == '__main__':
    upload_file_to_firebase("resume.docx")
    print(download_from_firebase())
    print('Operation completed.')
