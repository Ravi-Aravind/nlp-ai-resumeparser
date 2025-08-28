import pdfplumber
import docx
import re
import spacy

nlp = spacy.load('en_core_web_sm')

def parse_resume(file_path: str) -> dict:
	"""
	Parses a resume file (PDF or DOCX) and extracts name, email, phone, and skills.
	Returns a dictionary with extracted information.
	"""
	text = ""
	print('Extracting text...')
	if file_path.lower().endswith('.pdf'):
		with pdfplumber.open(file_path) as pdf:
			for page in pdf.pages:
				text += page.extract_text() or ""
	elif file_path.lower().endswith('.docx'):
		doc = docx.Document(file_path)
		for para in doc.paragraphs:
			text += para.text + "\n"
	else:
		raise ValueError("Unsupported file format")

	# NLP processing
	doc = nlp(text)
	name = None
	for ent in doc.ents:
		if ent.label_ == "PERSON":
			name = ent.text
			break

	# Regex for email and phone
	email = re.search(r'[\w\.-]+@[\w\.-]+', text)
	phone = re.search(r'(\+?\d{1,3}[\s-]?)?(\d{10})', text)
	email = email.group(0) if email else None
	phone = phone.group(0) if phone else None

	# Simple skill extraction (customize with your skill list)
	skills_list = ["python", "java", "sql", "machine learning", "nlp", "excel", "fastapi", "aws", "docker"]
	skills_found = []
	for skill in skills_list:
		if re.search(rf'\b{skill}\b', text, re.IGNORECASE):
			skills_found.append(skill)

	return {
		"name": name,
		"email": email,
		"phone": phone,
		"skills": skills_found,
		"raw_text": text
	}

print(parse_resume("resume.docx"))