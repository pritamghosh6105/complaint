import re
import unicodedata
from typing import Set

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which",
    "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves"
}

def clean_text(text: str, remove_stopwords: bool = False) -> str:
    """
    Cleans complaint raw text across English, Bengali, and Hindi:
    - Lowercases text
    - Preserves all Unicode Letters (L), Combining Marks (M - matras/vowel signs), and Numbers (N)
    - Replaces punctuation and special symbols with spaces
    - Normalizes extra whitespace
    - Optionally removes generic English stop words
    """
    if not isinstance(text, str):
        return ""
    
    text = text.lower().strip()
    text = re.sub(r'[\r\n\t]+', ' ', text)
    
    # Unicode-aware filter: keep Letters, Marks (vital for Bengali/Hindi vowel signs), Numbers, and spaces
    chars = []
    for ch in text:
        cat = unicodedata.category(ch)
        if cat.startswith(('L', 'M', 'N')) or ch.isspace():
            chars.append(ch)
        else:
            chars.append(' ')
            
    text = ''.join(chars)
    text = re.sub(r'\s+', ' ', text).strip()
    
    if remove_stopwords:
        tokens = [word for word in text.split() if word not in STOPWORDS and len(word) > 1]
        return " ".join(tokens)
        
    return text
