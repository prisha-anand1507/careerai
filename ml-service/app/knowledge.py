"""Static knowledge base: skill taxonomy, soft skills, and career role profiles.

This is reference data (a curated taxonomy), not user data. Extend it freely;
the extractor and recommender read everything from here.
"""

TECH_SKILLS = {
    "languages": {
        "Python": ["python"], "Java": ["java"], "JavaScript": ["javascript", "js", "ecmascript"],
        "TypeScript": ["typescript"], "C++": ["c++", "cpp"], "C": [], "C#": ["c#", "csharp"],
        "Go": ["golang"], "R": [], "SQL": ["sql", "mysql", "postgresql", "postgres", "sqlite", "t-sql"],
        "Scala": ["scala"], "Kotlin": ["kotlin"], "Bash": ["bash", "shell scripting"],
    },
    "ml_ai": {
        "Machine Learning": ["machine learning", "ml"], "Deep Learning": ["deep learning"],
        "NLP": ["nlp", "natural language processing"], "Computer Vision": ["computer vision", "opencv"],
        "TensorFlow": ["tensorflow"], "PyTorch": ["pytorch", "torch"], "Keras": ["keras"],
        "Scikit-learn": ["scikit-learn", "sklearn", "scikit learn"],
        "Transformers": ["transformers", "hugging face", "huggingface", "bert", "gpt"],
        "spaCy": ["spacy"], "NLTK": ["nltk"], "LLMs": ["llm", "llms", "large language model", "large language models"],
        "Statistics": ["statistics", "statistical analysis", "hypothesis testing", "regression"],
        "Feature Engineering": ["feature engineering"], "MLOps": ["mlops", "mlflow", "kubeflow"],
        "Generative AI": ["generative ai", "genai", "rag", "prompt engineering"],
    },
    "data": {
        "Pandas": ["pandas"], "NumPy": ["numpy"], "Data Visualization": ["data visualization", "matplotlib", "seaborn", "plotly"],
        "Tableau": ["tableau"], "Power BI": ["power bi", "powerbi"], "Excel": ["excel", "advanced excel"],
        "Spark": ["spark", "pyspark"], "Hadoop": ["hadoop"], "ETL": ["etl", "data pipelines", "data pipeline"],
        "Data Cleaning": ["data cleaning", "data wrangling", "data preprocessing"],
        "A/B Testing": ["a/b testing", "ab testing"], "Airflow": ["airflow"],
    },
    "web_backend": {
        "React": ["react", "react.js", "reactjs"], "Node.js": ["node.js", "nodejs", "node"],
        "Express": ["express", "express.js"], "Django": ["django"], "Flask": ["flask"], "FastAPI": ["fastapi"],
        "REST APIs": ["rest api", "rest apis", "restful", "rest"], "HTML/CSS": ["html", "css", "html5", "css3"],
        "MongoDB": ["mongodb", "mongo"], "Spring Boot": ["spring boot", "spring"],
        "Microservices": ["microservices"], "GraphQL": ["graphql"],
    },
    "devops_tools": {
        "Git": ["git", "github", "gitlab"], "Docker": ["docker"], "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services"], "Azure": ["azure"], "GCP": ["gcp", "google cloud"],
        "Linux": ["linux", "unix"], "CI/CD": ["ci/cd", "jenkins", "github actions"],
        "Data Structures & Algorithms": ["data structures", "algorithms", "dsa"],
        "OOP": ["oop", "object oriented", "object-oriented"], "Testing": ["unit testing", "pytest", "junit", "testing"],
    },
    "business": {
        "Requirements Gathering": ["requirements gathering", "requirement analysis", "business requirements"],
        "Stakeholder Management": ["stakeholder management", "stakeholder"], "Jira": ["jira"],
        "Agile/Scrum": ["agile", "scrum", "kanban"], "Business Analysis": ["business analysis", "business analyst"],
        "Process Modeling": ["process modeling", "bpmn", "uml"], "Market Research": ["market research"],
    },
}

SOFT_SKILLS = {
    "Communication": ["communication", "presented", "presentation", "presenting", "public speaking"],
    "Leadership": ["leadership", "led a team", "led ", "team lead", "mentored", "mentoring"],
    "Teamwork": ["teamwork", "collaborated", "collaboration", "cross-functional", "team player"],
    "Problem Solving": ["problem solving", "problem-solving", "troubleshooting", "analytical thinking"],
    "Adaptability": ["adaptability", "fast learner", "quick learner", "adapted"],
    "Time Management": ["time management", "prioritization", "deadline", "deadlines"],
    "Critical Thinking": ["critical thinking", "analytical"],
    "Ownership": ["ownership", "initiative", "self-motivated", "end-to-end"],
}

ACTION_VERBS = {
    "built", "developed", "designed", "implemented", "led", "created", "optimized", "improved", "reduced",
    "increased", "automated", "launched", "deployed", "architected", "analyzed", "engineered", "delivered",
    "managed", "migrated", "trained", "integrated", "streamlined", "established", "spearheaded", "refactored",
}

SECTION_HEADERS = {
    "summary": ["summary", "profile", "objective", "about me", "professional summary", "career objective"],
    "education": ["education", "academic", "qualification", "academics"],
    "experience": ["experience", "work history", "employment", "internship", "internships", "professional experience"],
    "projects": ["projects", "project work", "personal projects", "academic projects"],
    "skills": ["skills", "technical skills", "core competencies", "technologies", "tech stack"],
    "certifications": ["certifications", "certificates", "licenses", "courses", "certification"],
    "achievements": ["achievements", "awards", "honors", "accomplishments"],
}

DEGREE_PATTERNS = {
    "phd": r"\b(ph\.?d|doctorate)\b",
    "masters": r"\b(m\.?tech|m\.?sc|m\.?s\b|mba|master'?s?|m\.?e\b|mca)\b",
    "bachelors": r"\b(b\.?tech|b\.?e\b|b\.?sc|b\.?s\b|bca|bachelor'?s?|b\.?com|b\.?a\b)\b",
    "diploma": r"\b(diploma)\b",
}

# Career role profiles. `core` skills weigh more than `nice` skills.
# `education_hint` lists fields that support the role (used in explanations only).
CAREERS = {
    "Data Scientist": {
        "description": "Extracts insight from data using statistics and ML to guide product and business decisions.",
        "core": ["Python", "Statistics", "Machine Learning", "Pandas", "NumPy", "SQL", "Scikit-learn", "Data Visualization"],
        "nice": ["Deep Learning", "Feature Engineering", "A/B Testing", "Spark", "Tableau", "R"],
        "learning_path": [
            "Strengthen statistics and probability (hypothesis testing, regression, Bayesian basics)",
            "Master Pandas/NumPy and SQL on real datasets",
            "Build 3 end-to-end ML projects with clear business framing",
            "Learn experiment design and A/B testing",
            "Publish notebooks and write-ups on GitHub",
        ],
        "certifications": ["IBM Data Science Professional Certificate", "Google Advanced Data Analytics Certificate", "Microsoft Azure Data Scientist Associate (DP-100)"],
    },
    "Machine Learning Engineer": {
        "description": "Designs, trains, and deploys ML models into reliable production systems.",
        "core": ["Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Scikit-learn", "Docker", "Git"],
        "nice": ["MLOps", "Kubernetes", "AWS", "FastAPI", "Spark", "CI/CD", "Data Structures & Algorithms"],
        "learning_path": [
            "Solidify ML fundamentals and deep-learning frameworks",
            "Learn to package models behind APIs (FastAPI/Flask + Docker)",
            "Practice experiment tracking and model versioning (MLflow)",
            "Deploy a model on a cloud provider with monitoring",
            "Study system design for ML pipelines",
        ],
        "certifications": ["TensorFlow Developer Certificate", "AWS Certified Machine Learning – Specialty", "Google Professional ML Engineer"],
    },
    "AI Engineer": {
        "description": "Builds AI-powered products by integrating models, LLMs, and data pipelines into applications.",
        "core": ["Python", "Machine Learning", "LLMs", "Generative AI", "Transformers", "REST APIs", "Git"],
        "nice": ["PyTorch", "FastAPI", "Docker", "NLP", "Deep Learning", "AWS", "MLOps"],
        "learning_path": [
            "Learn LLM APIs, prompt design, and retrieval-augmented generation",
            "Build and ship an AI feature behind a REST API",
            "Learn evaluation techniques for LLM outputs",
            "Containerize and deploy with Docker on a cloud platform",
            "Follow current model/tooling developments and document your builds",
        ],
        "certifications": ["DeepLearning.AI Generative AI specializations", "Microsoft Azure AI Engineer Associate (AI-102)", "Google Cloud Generative AI Leader"],
    },
    "Data Analyst": {
        "description": "Turns raw data into dashboards and recommendations that help teams make decisions.",
        "core": ["SQL", "Excel", "Data Visualization", "Statistics", "Python", "Pandas"],
        "nice": ["Tableau", "Power BI", "Data Cleaning", "A/B Testing", "ETL", "R"],
        "learning_path": [
            "Become fluent in SQL joins, windows, and CTEs",
            "Build dashboards in Tableau or Power BI from public datasets",
            "Practice cleaning messy data with Pandas",
            "Learn to tell a story: insight, evidence, recommendation",
            "Create a portfolio of 3 analysis case studies",
        ],
        "certifications": ["Google Data Analytics Certificate", "Microsoft Power BI Data Analyst (PL-300)", "Tableau Desktop Specialist"],
    },
    "Python Developer": {
        "description": "Builds backend services, automation, and tools using Python and its ecosystem.",
        "core": ["Python", "Git", "REST APIs", "SQL", "OOP", "Data Structures & Algorithms"],
        "nice": ["Django", "Flask", "FastAPI", "Docker", "Testing", "Linux", "MongoDB", "AWS"],
        "learning_path": [
            "Deepen core Python: typing, generators, packaging, async",
            "Build a REST API with FastAPI or Django and a real database",
            "Add automated tests and CI",
            "Containerize and deploy the service",
            "Contribute to an open-source Python project",
        ],
        "certifications": ["PCEP/PCAP – Python Institute", "Microsoft Python certification path", "AWS Cloud Practitioner"],
    },
    "Software Developer": {
        "description": "Designs and builds reliable software across the stack, from APIs to user interfaces.",
        "core": ["Data Structures & Algorithms", "OOP", "Git", "SQL", "REST APIs", "Testing"],
        "nice": ["JavaScript", "Java", "Python", "React", "Node.js", "Docker", "CI/CD", "Microservices", "AWS"],
        "learning_path": [
            "Practice data structures and algorithms regularly",
            "Build a full-stack project with auth, database, and tests",
            "Learn system design fundamentals",
            "Adopt Git workflows and CI/CD",
            "Deploy projects publicly and keep a changelog",
        ],
        "certifications": ["AWS Certified Developer – Associate", "Oracle Certified Professional, Java SE", "Meta Front-End or Back-End Developer certificates"],
    },
    "Business Analyst": {
        "description": "Bridges business needs and technical teams by gathering requirements and analyzing processes and data.",
        "core": ["Requirements Gathering", "Stakeholder Management", "SQL", "Excel", "Business Analysis", "Process Modeling"],
        "nice": ["Agile/Scrum", "Jira", "Power BI", "Tableau", "Data Visualization", "Market Research"],
        "learning_path": [
            "Learn requirement elicitation and documentation (BRD/FRD, user stories)",
            "Practice process modeling (BPMN/UML)",
            "Get comfortable with SQL and dashboards for data-backed analysis",
            "Work in Agile teams; learn Jira workflows",
            "Build a case-study portfolio showing business impact",
        ],
        "certifications": ["IIBA ECBA / CCBA", "PMI Professional in Business Analysis (PMI-PBA)", "Certified Scrum Product Owner"],
    },
    "NLP Engineer": {
        "description": "Builds systems that understand and generate human language, from search to chatbots and extraction.",
        "core": ["Python", "NLP", "Machine Learning", "Deep Learning", "Transformers", "PyTorch", "spaCy"],
        "nice": ["NLTK", "LLMs", "Hugging Face", "TensorFlow", "Generative AI", "FastAPI", "Docker"],
        "learning_path": [
            "Learn text preprocessing, embeddings, and classical NLP (TF-IDF, NER)",
            "Fine-tune a transformer on a text-classification task",
            "Build an information-extraction or search project",
            "Learn evaluation metrics for NLP (F1, BLEU/ROUGE, human eval)",
            "Deploy an NLP model as an API",
        ],
        "certifications": ["DeepLearning.AI NLP Specialization", "Hugging Face course certificates", "Stanford CS224N (self-study)"],
    },
}

# Skills commonly requested across tech job postings (curated list, not live market data).
IN_DEMAND = [
    "Python", "SQL", "Machine Learning", "Docker", "AWS", "Git", "LLMs", "Generative AI",
    "Data Visualization", "REST APIs", "Kubernetes", "TypeScript", "MLOps", "CI/CD",
]
