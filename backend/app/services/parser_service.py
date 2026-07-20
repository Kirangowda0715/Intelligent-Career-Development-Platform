import re
import fitz  # PyMuPDF
import spacy
from typing import Dict, List, Any

# Load spaCy English model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    # Fallback to loading blank model if not installed, though we just installed it
    nlp = spacy.blank("en")

# Predefined standard list of skills to match deterministically
STANDARD_SKILLS = [
    "Python", "FastAPI", "Django", "Flask", "SQLAlchemy", 
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Next.js", "Node.js", "Express", 
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Snowflake", "DynamoDB",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "Ansible", "CI/CD",
    "Git", "GitHub Actions", "Jenkins", "Linux", "Unix",
    "PyTorch", "TensorFlow", "spaCy", "Hugging Face", "LLMs", "RAG", "Machine Learning", 
    "Deep Learning", "NLP", "Transformers", "Data Science", "ETL", "Apache Spark", "Airflow",
    "REST APIs", "GraphQL", "HTML5", "CSS3", "HTML", "CSS", "Sass", "Tailwind CSS",
    "Java", "Spring Boot", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Scala",
    "Selenium", "Jest", "Pytest", "Postman", "Cypress", "Automated Testing",
    "Penetration Testing", "Cryptography", "OWASP", "Network Security", "IAM"
]

# Standard certification terms to match deterministically
STANDARD_CERTIFICATIONS = [
    "AWS Certified", "AWS Cloud Practitioner", "AWS Solutions Architect", "AWS Developer",
    "Google Cloud Certified", "Google Cloud Associate", "Google Cloud Professional",
    "Microsoft Certified", "Azure Fundamentals", "Azure Solutions Architect", "Azure Developer",
    "Certified Kubernetes Administrator", "CKA", "Certified Kubernetes Application Developer", "CKAD",
    "Scrum Master", "PSM", "CSM", "Project Management Professional", "PMP",
    "CompTIA Security+", "CompTIA Network+", "CompTIA A+", "CISSP", "CEH", "CCNA"
]

class ParserService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract text from PDF file bytes using PyMuPDF."""
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text())
        return "\n".join(text_parts)

    @staticmethod
    def parse_resume(raw_text: str) -> Dict[str, Any]:
        """Parse raw text of a resume into standard structured sections."""
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        
        # 1. Extract Name (Use spaCy PERSON entity in the first 5 lines or fallback to first line)
        name = "Unknown candidate"
        lines_to_check = lines[:5]
        found_name = False
        
        for check_line in lines_to_check:
            # Skip lines that look like emails, phone numbers, or links
            if "@" in check_line or any(char.isdigit() for char in check_line if char == "+") or "http" in check_line.lower():
                continue
            doc = nlp(check_line)
            for ent in doc.ents:
                if ent.label_ == "PERSON" and len(ent.text.split()) >= 2:
                    name = ent.text
                    found_name = True
                    break
            if found_name:
                break
                
        if not found_name and lines:
            # Fallback to the first line that is not an email/link
            for line in lines:
                if "@" not in line and "http" not in line.lower() and len(line) < 50:
                    name = line
                    break

        # 2. Section Segmentation
        sections = {
            "skills": [],
            "education": [],
            "certifications": [],
            "projects": []
        }
        
        # Match keywords for sections
        section_headers = {
            "skills": re.compile(r"^(skills|technical\s+skills|core\s+competencies|technologies|tools|skills\s+highlight)", re.IGNORECASE),
            "education": re.compile(r"^(education|academic\s+background|academic\s+profile|degrees|academic\s+history)", re.IGNORECASE),
            "certifications": re.compile(r"^(certifications|licenses|courses\s+&\s+certifications|professional\s+certifications)", re.IGNORECASE),
            "projects": re.compile(r"^(projects|personal\s+projects|academic\s+projects|key\s+projects)", re.IGNORECASE)
        }

        current_section = None
        
        for line in lines:
            # Check if line is a section header
            header_found = False
            for sec_name, regex in section_headers.items():
                if regex.match(line):
                    current_section = sec_name
                    header_found = True
                    break
            
            if header_found:
                continue
                
            # If we are currently inside a section, append the line content
            if current_section:
                # If we encounter another header pattern (e.g. experience), stop capturing for current section
                experience_headers = re.compile(r"^(experience|work\s+experience|professional\s+experience|employment\s+history|history|summary|about\s+me)", re.IGNORECASE)
                if experience_headers.match(line):
                    current_section = None
                    continue
                
                sections[current_section].append(line)

        # 3. Clean and Standardize Skills
        # Extract skills using word boundary matching across the entire text + parsing the skills section
        extracted_skills = set()
        
        # Search entire text for standard skills (case-insensitive with boundaries)
        for skill in STANDARD_SKILLS:
            # Escape regex characters
            escaped_skill = re.escape(skill)
            # Match word boundaries. Handle special characters like C++, C#, .NET, Node.js
            if skill.endswith("++") or skill.endswith("#") or "." in skill:
                pattern = r"(?:\b|\s)" + escaped_skill + r"(?:\b|\s)"
            else:
                pattern = r"\b" + escaped_skill + r"\b"
                
            if re.search(pattern, raw_text, re.IGNORECASE):
                extracted_skills.add(skill)

        # Also parse items in the skills section (split by commas, bullet points, or pipes)
        for line in sections["skills"]:
            # Split line by common separators
            parts = re.split(r"[,|•·\t]|\s{2,}", line)
            for part in parts:
                p = part.strip()
                if p and len(p) < 40:
                    # If it matches case-insensitively one of our standard skills, add the standard casing
                    matched_standard = False
                    for standard_skill in STANDARD_SKILLS:
                        if p.lower() == standard_skill.lower():
                            extracted_skills.add(standard_skill)
                            matched_standard = True
                            break
                    if not matched_standard and len(p) > 2 and not any(c in p for c in ["@", ":", "/"]):
                        # Add custom skill if it looks like a valid short string
                        extracted_skills.add(p)

        # 4. Clean and Standardize Education
        # Capture lines under the education section
        extracted_education = []
        for line in sections["education"]:
            # Basic validation to ensure line contains education-related terms
            if any(term in line.lower() for term in ["university", "college", "institute", "school", "bachelor", "master", "phd", "degree", "b.s", "m.s", "b.t", "m.t", "b.e", "m.e", "diploma", "gpa", "major"]):
                # Clean bullet characters
                cleaned = re.sub(r"^[•·\-\*\s]+", "", line).strip()
                if cleaned:
                    extracted_education.append(cleaned)
                    
        # If education section was empty, scan the entire text for lines matching degrees
        if not extracted_education:
            for line in lines:
                if any(term in line.lower() for term in ["bachelor of", "master of", "university", "college of"]) and len(line) < 100:
                    cleaned = re.sub(r"^[•·\-\*\s]+", "", line).strip()
                    if cleaned and cleaned not in extracted_education:
                        extracted_education.append(cleaned)

        # 5. Clean and Standardize Certifications
        extracted_certifications = set()
        # Scan entire text for standard certifications
        for cert in STANDARD_CERTIFICATIONS:
            if re.search(r"\b" + re.escape(cert) + r"\b", raw_text, re.IGNORECASE):
                extracted_certifications.add(cert)
                
        # Also grab lines from certifications section
        for line in sections["certifications"]:
            cleaned = re.sub(r"^[•·\-\*\s]+", "", line).strip()
            if cleaned and len(cleaned) < 100:
                extracted_certifications.add(cleaned)

        # 6. Clean and Standardize Projects
        # Capture lines from the projects section
        extracted_projects = []
        project_item = ""
        
        for line in sections["projects"]:
            # If a line starts with bullet point or is a clear new item, push the previous and start new
            cleaned = re.sub(r"^[•·\-\*\s]+", "", line).strip()
            if not cleaned:
                continue
                
            # If it starts with a bullet point or looks like a project header (e.g. "Project Title - Tech Stack")
            if line.startswith(("-", "*", "•", "·")) or re.match(r"^[A-Z][a-zA-Z0-9\s]{2,30}\s*[\-\|:]", cleaned):
                if project_item:
                    extracted_projects.append(project_item)
                project_item = cleaned
            else:
                if project_item:
                    project_item += " " + cleaned
                else:
                    project_item = cleaned
                    
        if project_item:
            extracted_projects.append(project_item)
            
        # Clean extracted projects and limit descriptions
        final_projects = []
        for proj in extracted_projects:
            if len(proj) > 5 and not any(term in proj.lower() for term in ["skills", "education", "certifications"]):
                final_projects.append(proj[:200]) # Cap description size per project string

        return {
          "name": name,
          "skills": sorted(list(extracted_skills)),
          "education": extracted_education,
          "certifications": sorted(list(extracted_certifications)),
          "projects": final_projects
        }
