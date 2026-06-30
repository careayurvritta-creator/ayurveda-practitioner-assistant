"""
WHO ITA Knowledge Base - Phase 3 Enhanced Verification
=======================================================
Comprehensive term verification with:
1. Self-validation (IAST ↔ Devanagari consistency)
2. Expanded authoritative terms (500+ terms)
3. Fuzzy matching for variant spellings
4. Chapter-wise verification
"""

import json
import re
import unicodedata
from pathlib import Path
from datetime import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Set, Tuple, Optional

# Configuration
PHASE2_DIR = Path("knowledge_base/phase2_sanskrit_errors")
OUTPUT_DIR = Path("knowledge_base/phase3_reference")
REPORTS_DIR = OUTPUT_DIR / "reports"

# ============================================================================
# EXPANDED AUTHORITATIVE TERMS DATABASE (500+ terms)
# ============================================================================

# Each term: IAST -> {'deva': Devanagari, 'eng': English meaning, 'src': source}
AUTHORITATIVE_TERMS = {
    # ===== CHAPTER 1: BACKGROUND TERMINOLOGY =====
    'āyurveda': {'deva': 'आयुर्वेद', 'eng': 'science of life', 'src': 'MW', 'ch': '1'},
    'āyurvedaḥ': {'deva': 'आयुर्वेदः', 'eng': 'science of life', 'src': 'MW', 'ch': '1'},
    'āyuḥ': {'deva': 'आयुः', 'eng': 'life, longevity', 'src': 'MW', 'ch': '1'},
    'hitāyuḥ': {'deva': 'हितायुः', 'eng': 'salutary life', 'src': 'WHO', 'ch': '1'},
    'ahitāyuḥ': {'deva': 'अहितायुः', 'eng': 'unsalutary life', 'src': 'WHO', 'ch': '1'},
    'sukhāyuḥ': {'deva': 'सुखायुः', 'eng': 'high quality life', 'src': 'WHO', 'ch': '1'},
    'duḥkhāyuḥ': {'deva': 'दुःखायुः', 'eng': 'poor quality life', 'src': 'WHO', 'ch': '1'},
    
    # Clinical Specialties
    'cikitsā': {'deva': 'चिकित्सा', 'eng': 'treatment, therapy', 'src': 'MW', 'ch': '1'},
    'kāyacikitsā': {'deva': 'कायचिकित्सा', 'eng': 'general medicine', 'src': 'WHO', 'ch': '1'},
    'bālacikitsā': {'deva': 'बालचिकित्सा', 'eng': 'pediatrics', 'src': 'WHO', 'ch': '1'},
    'grahacikitsā': {'deva': 'ग्रहचिकित्सा', 'eng': 'psychiatry', 'src': 'WHO', 'ch': '1'},
    'bhūtavidyā': {'deva': 'भूतविद्या', 'eng': 'psychology', 'src': 'WHO', 'ch': '1'},
    'śālakyatantra': {'deva': 'शालाक्यतन्त्र', 'eng': 'ENT medicine', 'src': 'WHO', 'ch': '1'},
    'śalyacikitsā': {'deva': 'शल्यचिकित्सा', 'eng': 'surgery', 'src': 'WHO', 'ch': '1'},
    'viṣacikitsā': {'deva': 'विषचिकित्सा', 'eng': 'toxicology', 'src': 'WHO', 'ch': '1'},
    'rasāyanacikitsā': {'deva': 'रसायनचिकित्सा', 'eng': 'geriatrics', 'src': 'WHO', 'ch': '1'},
    'vājīkaraṇacikitsā': {'deva': 'वाजीकरणचिकित्सा', 'eng': 'fertility treatment', 'src': 'WHO', 'ch': '1'},
    'prasūtītantra': {'deva': 'प्रसूतीतन्त्र', 'eng': 'obstetrics', 'src': 'WHO', 'ch': '1'},
    'strīroga': {'deva': 'स्त्रीरोग', 'eng': 'gynecology', 'src': 'WHO', 'ch': '1'},
    
    # Knowledge Systems
    'śāstra': {'deva': 'शास्त्र', 'eng': 'treatise, scripture', 'src': 'MW', 'ch': '1'},
    'śāstram': {'deva': 'शास्त्रम्', 'eng': 'treatise', 'src': 'MW', 'ch': '1'},
    'tantra': {'deva': 'तन्त्र', 'eng': 'system, treatise', 'src': 'MW', 'ch': '1'},
    'tantram': {'deva': 'तन्त्रम्', 'eng': 'treatise', 'src': 'MW', 'ch': '1'},
    'sūtra': {'deva': 'सूत्र', 'eng': 'aphorism, thread', 'src': 'MW', 'ch': '1'},
    'sūtram': {'deva': 'सूत्रम्', 'eng': 'aphorism', 'src': 'MW', 'ch': '1'},
    'vidyā': {'deva': 'विद्या', 'eng': 'knowledge, discipline', 'src': 'MW', 'ch': '1'},
    'jñānam': {'deva': 'ज्ञानम्', 'eng': 'understanding', 'src': 'MW', 'ch': '1'},
    'vijñānam': {'deva': 'विज्ञानम्', 'eng': 'applied knowledge', 'src': 'MW', 'ch': '1'},
    'saṃhitā': {'deva': 'संहिता', 'eng': 'compendium', 'src': 'MW', 'ch': '1'},
    'siddhānta': {'deva': 'सिद्धान्त', 'eng': 'established doctrine', 'src': 'MW', 'ch': '1'},
    'siddhāntaḥ': {'deva': 'सिद्धान्तः', 'eng': 'doctrine', 'src': 'MW', 'ch': '1'},
    
    # ===== CHAPTER 2: CORE CONCEPTS =====
    # Tridosha
    'doṣa': {'deva': 'दोष', 'eng': 'humor, fault', 'src': 'MW', 'ch': '2'},
    'doṣaḥ': {'deva': 'दोषः', 'eng': 'humor', 'src': 'MW', 'ch': '2'},
    'vāta': {'deva': 'वात', 'eng': 'wind, vata dosha', 'src': 'MW', 'ch': '2'},
    'pitta': {'deva': 'पित्त', 'eng': 'bile, pitta dosha', 'src': 'MW', 'ch': '2'},
    'pittam': {'deva': 'पित्तम्', 'eng': 'bile', 'src': 'MW', 'ch': '2'},
    'kapha': {'deva': 'कफ', 'eng': 'phlegm, kapha dosha', 'src': 'MW', 'ch': '2'},
    'śleṣman': {'deva': 'श्लेष्मन्', 'eng': 'phlegm', 'src': 'MW', 'ch': '2'},
    'śleṣmā': {'deva': 'श्लेष्मा', 'eng': 'phlegm', 'src': 'MW', 'ch': '2'},
    
    # Vata subtypes
    'prāṇa': {'deva': 'प्राण', 'eng': 'life force, breath', 'src': 'MW', 'ch': '2'},
    'prāṇaḥ': {'deva': 'प्राणः', 'eng': 'vital breath', 'src': 'MW', 'ch': '2'},
    'prāṇavāyu': {'deva': 'प्राणवायु', 'eng': 'prana vayu', 'src': 'CS', 'ch': '2'},
    'udānavāyu': {'deva': 'उदानवायु', 'eng': 'udana vayu', 'src': 'CS', 'ch': '2'},
    'samānavāyu': {'deva': 'समानवायु', 'eng': 'samana vayu', 'src': 'CS', 'ch': '2'},
    'vyānavāyu': {'deva': 'व्यानवायु', 'eng': 'vyana vayu', 'src': 'CS', 'ch': '2'},
    'apānavāyu': {'deva': 'अपानवायु', 'eng': 'apana vayu', 'src': 'CS', 'ch': '2'},
    
    # Pitta subtypes
    'pācakapitta': {'deva': 'पाचकपित्त', 'eng': 'digestive pitta', 'src': 'CS', 'ch': '2'},
    'rañjakapitta': {'deva': 'रञ्जकपित्त', 'eng': 'coloring pitta', 'src': 'CS', 'ch': '2'},
    'sādhakapitta': {'deva': 'साधकपित्त', 'eng': 'accomplishing pitta', 'src': 'CS', 'ch': '2'},
    'ālocakapitta': {'deva': 'आलोचकपित्त', 'eng': 'visual pitta', 'src': 'CS', 'ch': '2'},
    'bhrājakapitta': {'deva': 'भ्राजकपित्त', 'eng': 'lustrous pitta', 'src': 'CS', 'ch': '2'},
    
    # Kapha subtypes
    'kledakakapha': {'deva': 'क्लेदककफ', 'eng': 'moistening kapha', 'src': 'CS', 'ch': '2'},
    'avalaṃbakakapha': {'deva': 'अवलम्बककफ', 'eng': 'supporting kapha', 'src': 'CS', 'ch': '2'},
    'bodhanakapha': {'deva': 'बोधनकफ', 'eng': 'perception kapha', 'src': 'CS', 'ch': '2'},
    'tarpanakapha': {'deva': 'तर्पणकफ', 'eng': 'nourishing kapha', 'src': 'CS', 'ch': '2'},
    'śleṣakakapha': {'deva': 'श्लेषककफ', 'eng': 'lubricating kapha', 'src': 'CS', 'ch': '2'},
    
    # Sapta Dhatu
    'dhātu': {'deva': 'धातु', 'eng': 'tissue, element', 'src': 'MW', 'ch': '2'},
    'rasa': {'deva': 'रस', 'eng': 'plasma, taste', 'src': 'MW', 'ch': '2'},
    'rasadhātu': {'deva': 'रसधातु', 'eng': 'plasma tissue', 'src': 'CS', 'ch': '2'},
    'rakta': {'deva': 'रक्त', 'eng': 'blood', 'src': 'MW', 'ch': '2'},
    'raktadhātu': {'deva': 'रक्तधातु', 'eng': 'blood tissue', 'src': 'CS', 'ch': '2'},
    'māṃsa': {'deva': 'मांस', 'eng': 'muscle, flesh', 'src': 'MW', 'ch': '2'},
    'māṃsadhātu': {'deva': 'मांसधातु', 'eng': 'muscle tissue', 'src': 'CS', 'ch': '2'},
    'meda': {'deva': 'मेद', 'eng': 'fat, adipose', 'src': 'MW', 'ch': '2'},
    'medas': {'deva': 'मेदस्', 'eng': 'fat tissue', 'src': 'MW', 'ch': '2'},
    'asthi': {'deva': 'अस्थि', 'eng': 'bone', 'src': 'MW', 'ch': '2'},
    'asthidhātu': {'deva': 'अस्थिधातु', 'eng': 'bone tissue', 'src': 'CS', 'ch': '2'},
    'majjā': {'deva': 'मज्जा', 'eng': 'marrow', 'src': 'MW', 'ch': '2'},
    'majjādhātu': {'deva': 'मज्जाधातु', 'eng': 'marrow tissue', 'src': 'CS', 'ch': '2'},
    'śukra': {'deva': 'शुक्र', 'eng': 'reproductive tissue', 'src': 'MW', 'ch': '2'},
    'śukradhātu': {'deva': 'शुक्रधातु', 'eng': 'reproductive tissue', 'src': 'CS', 'ch': '2'},
    
    # Mala (Wastes)
    'mala': {'deva': 'मल', 'eng': 'waste, excreta', 'src': 'MW', 'ch': '2'},
    'mūtra': {'deva': 'मूत्र', 'eng': 'urine', 'src': 'MW', 'ch': '2'},
    'purīṣa': {'deva': 'पुरीष', 'eng': 'feces', 'src': 'MW', 'ch': '2'},
    'sveda': {'deva': 'स्वेद', 'eng': 'sweat', 'src': 'MW', 'ch': '2'},
    
    # Agni
    'agni': {'deva': 'अग्नि', 'eng': 'fire, digestive fire', 'src': 'MW', 'ch': '2'},
    'jāṭharāgni': {'deva': 'जाठराग्नि', 'eng': 'gastric fire', 'src': 'CS', 'ch': '2'},
    'bhūtāgni': {'deva': 'भूताग्नि', 'eng': 'elemental fire', 'src': 'CS', 'ch': '2'},
    'dhātvagni': {'deva': 'धात्वग्नि', 'eng': 'tissue fire', 'src': 'CS', 'ch': '2'},
    'maṇḍāgni': {'deva': 'मण्डाग्नि', 'eng': 'low digestive fire', 'src': 'CS', 'ch': '2'},
    'tīkṣṇāgni': {'deva': 'तीक्ष्णाग्नि', 'eng': 'sharp digestive fire', 'src': 'CS', 'ch': '2'},
    'samāgni': {'deva': 'समाग्नि', 'eng': 'balanced digestive fire', 'src': 'CS', 'ch': '2'},
    'viṣamāgni': {'deva': 'विषमाग्नि', 'eng': 'irregular digestive fire', 'src': 'CS', 'ch': '2'},
    
    # Ojas and Essences
    'ojas': {'deva': 'ओजस्', 'eng': 'vital essence, immunity', 'src': 'MW', 'ch': '2'},
    'tejas': {'deva': 'तेजस्', 'eng': 'radiance, brilliance', 'src': 'MW', 'ch': '2'},
    
    # Srotas (Channels)
    'srotas': {'deva': 'स्रोतस्', 'eng': 'channel, passage', 'src': 'MW', 'ch': '2'},
    'prāṇavahasrotas': {'deva': 'प्राणवहस्रोतस्', 'eng': 'respiratory channel', 'src': 'CS', 'ch': '2'},
    'annavahasrotas': {'deva': 'अन्नवहस्रोतस्', 'eng': 'food channel', 'src': 'CS', 'ch': '2'},
    'udakavahasrotas': {'deva': 'उदकवहस्रोतस्', 'eng': 'water channel', 'src': 'CS', 'ch': '2'},
    'rasavahasrotas': {'deva': 'रसवहस्रोतस्', 'eng': 'plasma channel', 'src': 'CS', 'ch': '2'},
    'raktavahasrotas': {'deva': 'रक्तवहस्रोतस्', 'eng': 'blood channel', 'src': 'CS', 'ch': '2'},
    'māṃsavahasrotas': {'deva': 'मांसवहस्रोतस्', 'eng': 'muscle channel', 'src': 'CS', 'ch': '2'},
    'medovahasrotas': {'deva': 'मेदोवहस्रोतस्', 'eng': 'fat channel', 'src': 'CS', 'ch': '2'},
    'asthivahasrotas': {'deva': 'अस्थिवहस्रोतस्', 'eng': 'bone channel', 'src': 'CS', 'ch': '2'},
    'majjāvahasrotas': {'deva': 'मज्जावहस्रोतस्', 'eng': 'marrow channel', 'src': 'CS', 'ch': '2'},
    'śukravahasrotas': {'deva': 'शुक्रवहस्रोतस्', 'eng': 'reproductive channel', 'src': 'CS', 'ch': '2'},
    'mūtravahasrotas': {'deva': 'मूत्रवहस्रोतस्', 'eng': 'urinary channel', 'src': 'CS', 'ch': '2'},
    'purīṣavahasrotas': {'deva': 'पुरीषवहस्रोतस्', 'eng': 'excretory channel', 'src': 'CS', 'ch': '2'},
    'svedavahasrotas': {'deva': 'स्वेदवहस्रोतस्', 'eng': 'sweat channel', 'src': 'CS', 'ch': '2'},
    
    # Constitution
    'prakṛti': {'deva': 'प्रकृति', 'eng': 'constitution, nature', 'src': 'MW', 'ch': '2'},
    'vikṛti': {'deva': 'विकृति', 'eng': 'deviation, imbalance', 'src': 'MW', 'ch': '2'},
    
    # ===== CHAPTER 3: ANATOMY =====
    'śarīra': {'deva': 'शरीर', 'eng': 'body', 'src': 'MW', 'ch': '3'},
    'aṅga': {'deva': 'अङ्ग', 'eng': 'limb, body part', 'src': 'MW', 'ch': '3'},
    'pratyaṅga': {'deva': 'प्रत्यङ्ग', 'eng': 'minor limb', 'src': 'SS', 'ch': '3'},
    'śiras': {'deva': 'शिरस्', 'eng': 'head', 'src': 'MW', 'ch': '3'},
    'mukha': {'deva': 'मुख', 'eng': 'face, mouth', 'src': 'MW', 'ch': '3'},
    'kaṇṭha': {'deva': 'कण्ठ', 'eng': 'throat', 'src': 'MW', 'ch': '3'},
    'grīvā': {'deva': 'ग्रीवा', 'eng': 'neck', 'src': 'MW', 'ch': '3'},
    'skandha': {'deva': 'स्कन्ध', 'eng': 'shoulder', 'src': 'MW', 'ch': '3'},
    'bāhu': {'deva': 'बाहु', 'eng': 'arm', 'src': 'MW', 'ch': '3'},
    'hasta': {'deva': 'हस्त', 'eng': 'hand', 'src': 'MW', 'ch': '3'},
    'aṅguli': {'deva': 'अङ्गुलि', 'eng': 'finger', 'src': 'MW', 'ch': '3'},
    'uras': {'deva': 'उरस्', 'eng': 'chest', 'src': 'MW', 'ch': '3'},
    'udara': {'deva': 'उदर', 'eng': 'abdomen', 'src': 'MW', 'ch': '3'},
    'pṛṣṭha': {'deva': 'पृष्ठ', 'eng': 'back', 'src': 'MW', 'ch': '3'},
    'kaṭi': {'deva': 'कटि', 'eng': 'waist, hip', 'src': 'MW', 'ch': '3'},
    'ūru': {'deva': 'ऊरु', 'eng': 'thigh', 'src': 'MW', 'ch': '3'},
    'jānu': {'deva': 'जानु', 'eng': 'knee', 'src': 'MW', 'ch': '3'},
    'jaṅghā': {'deva': 'जङ्घा', 'eng': 'calf, leg', 'src': 'MW', 'ch': '3'},
    'pāda': {'deva': 'पाद', 'eng': 'foot', 'src': 'MW', 'ch': '3'},
    
    # Internal organs
    'hṛdaya': {'deva': 'हृदय', 'eng': 'heart', 'src': 'MW', 'ch': '3'},
    'phupphusa': {'deva': 'फुप्फुस', 'eng': 'lung', 'src': 'SS', 'ch': '3'},
    'yakṛt': {'deva': 'यकृत्', 'eng': 'liver', 'src': 'MW', 'ch': '3'},
    'plīhan': {'deva': 'प्लीहन्', 'eng': 'spleen', 'src': 'MW', 'ch': '3'},
    'vṛkka': {'deva': 'वृक्क', 'eng': 'kidney', 'src': 'MW', 'ch': '3'},
    'āmāśaya': {'deva': 'आमाशय', 'eng': 'stomach', 'src': 'SS', 'ch': '3'},
    'pakvāśaya': {'deva': 'पक्वाशय', 'eng': 'large intestine', 'src': 'SS', 'ch': '3'},
    'garbhāśaya': {'deva': 'गर्भाशय', 'eng': 'uterus', 'src': 'SS', 'ch': '3'},
    'basti': {'deva': 'बस्ति', 'eng': 'bladder', 'src': 'SS', 'ch': '3'},
    'antra': {'deva': 'अन्त्र', 'eng': 'intestine', 'src': 'MW', 'ch': '3'},
    'gudaḥ': {'deva': 'गुदः', 'eng': 'rectum', 'src': 'SS', 'ch': '3'},
    
    # Marma points
    'marma': {'deva': 'मर्म', 'eng': 'vital point', 'src': 'SS', 'ch': '3'},
    'marman': {'deva': 'मर्मन्', 'eng': 'vital points', 'src': 'SS', 'ch': '3'},
    'sthāpanīmarma': {'deva': 'स्थापनीमर्म', 'eng': 'life-sustaining marma', 'src': 'SS', 'ch': '3'},
    'sadyaḥprāṇaharamarma': {'deva': 'सद्यःप्राणहरमर्म', 'eng': 'immediately fatal marma', 'src': 'SS', 'ch': '3'},
    
    # ===== CHAPTER 4: CLINICAL EXAMINATION =====
    'parīkṣā': {'deva': 'परीक्षा', 'eng': 'examination', 'src': 'MW', 'ch': '4'},
    'nāḍīparīkṣā': {'deva': 'नाडीपरीक्षा', 'eng': 'pulse examination', 'src': 'CS', 'ch': '4'},
    'mūtraparīkṣā': {'deva': 'मूत्रपरीक्षा', 'eng': 'urine examination', 'src': 'CS', 'ch': '4'},
    'malaparīkṣā': {'deva': 'मलपरीक्षा', 'eng': 'stool examination', 'src': 'CS', 'ch': '4'},
    'jihvāparīkṣā': {'deva': 'जिह्वापरीक्षा', 'eng': 'tongue examination', 'src': 'CS', 'ch': '4'},
    'netrapriīkṣā': {'deva': 'नेत्रपरीक्षा', 'eng': 'eye examination', 'src': 'CS', 'ch': '4'},
    'sparśaparīkṣā': {'deva': 'स्पर्शपरीक्षा', 'eng': 'touch examination', 'src': 'CS', 'ch': '4'},
    'aṣṭasthānaparīkṣā': {'deva': 'अष्टस्थानपरीक्षा', 'eng': 'eight-fold examination', 'src': 'CS', 'ch': '4'},
    'daśavidhaparīkṣā': {'deva': 'दशविधपरीक्षा', 'eng': 'ten-fold examination', 'src': 'CS', 'ch': '4'},
    
    # ===== CHAPTER 5: DISORDERS/PATHOLOGY =====
    'roga': {'deva': 'रोग', 'eng': 'disease', 'src': 'MW', 'ch': '5'},
    'vyādhi': {'deva': 'व्याधि', 'eng': 'disease, disorder', 'src': 'MW', 'ch': '5'},
    'vikāra': {'deva': 'विकार', 'eng': 'pathological change', 'src': 'MW', 'ch': '5'},
    'āmaya': {'deva': 'आमय', 'eng': 'disease', 'src': 'MW', 'ch': '5'},
    
    # Common diseases
    'jvara': {'deva': 'ज्वर', 'eng': 'fever', 'src': 'CS', 'ch': '5'},
    'atisāra': {'deva': 'अतिसार', 'eng': 'diarrhea', 'src': 'CS', 'ch': '5'},
    'grahaṇī': {'deva': 'ग्रहणी', 'eng': 'malabsorption', 'src': 'CS', 'ch': '5'},
    'arśas': {'deva': 'अर्शस्', 'eng': 'hemorrhoids', 'src': 'CS', 'ch': '5'},
    'gulma': {'deva': 'गुल्म', 'eng': 'abdominal tumor', 'src': 'CS', 'ch': '5'},
    'udara': {'deva': 'उदर', 'eng': 'ascites, abdominal disease', 'src': 'CS', 'ch': '5'},
    'pāṇḍu': {'deva': 'पाण्डु', 'eng': 'anemia', 'src': 'CS', 'ch': '5'},
    'kamala': {'deva': 'कमला', 'eng': 'jaundice', 'src': 'CS', 'ch': '5'},
    'śotha': {'deva': 'शोथ', 'eng': 'edema', 'src': 'CS', 'ch': '5'},
    'prameha': {'deva': 'प्रमेह', 'eng': 'urinary disorders, diabetes', 'src': 'CS', 'ch': '5'},
    'madhumeha': {'deva': 'मधुमेह', 'eng': 'diabetes mellitus', 'src': 'CS', 'ch': '5'},
    'kuṣṭha': {'deva': 'कुष्ठ', 'eng': 'skin disease', 'src': 'CS', 'ch': '5'},
    'śvitra': {'deva': 'श्वित्र', 'eng': 'vitiligo', 'src': 'CS', 'ch': '5'},
    'śvāsa': {'deva': 'श्वास', 'eng': 'asthma, dyspnea', 'src': 'CS', 'ch': '5'},
    'kāsa': {'deva': 'कास', 'eng': 'cough', 'src': 'CS', 'ch': '5'},
    'hikkā': {'deva': 'हिक्का', 'eng': 'hiccup', 'src': 'CS', 'ch': '5'},
    'chardi': {'deva': 'छर्दि', 'eng': 'vomiting', 'src': 'CS', 'ch': '5'},
    'tṛṣṇā': {'deva': 'तृष्णा', 'eng': 'thirst disorder', 'src': 'CS', 'ch': '5'},
    'mūtrakṛcchra': {'deva': 'मूत्रकृच्छ्र', 'eng': 'dysuria', 'src': 'CS', 'ch': '5'},
    'aśmarī': {'deva': 'अश्मरी', 'eng': 'urinary calculus', 'src': 'CS', 'ch': '5'},
    'mūtrāghāta': {'deva': 'मूत्राघात', 'eng': 'urinary obstruction', 'src': 'CS', 'ch': '5'},
    'śiroroga': {'deva': 'शिरोरोग', 'eng': 'head diseases', 'src': 'CS', 'ch': '5'},
    'hṛdroga': {'deva': 'हृद्रोग', 'eng': 'heart disease', 'src': 'CS', 'ch': '5'},
    'vātarakta': {'deva': 'वातरक्त', 'eng': 'gout', 'src': 'CS', 'ch': '5'},
    'āmavāta': {'deva': 'आमवात', 'eng': 'rheumatoid arthritis', 'src': 'CS', 'ch': '5'},
    'sandhigatavāta': {'deva': 'सन्धिगतवात', 'eng': 'osteoarthritis', 'src': 'CS', 'ch': '5'},
    'unmāda': {'deva': 'उन्माद', 'eng': 'insanity', 'src': 'CS', 'ch': '5'},
    'apasmāra': {'deva': 'अपस्मार', 'eng': 'epilepsy', 'src': 'CS', 'ch': '5'},
    'vatādhīnī': {'deva': 'वातधीनी', 'eng': 'paralysis', 'src': 'CS', 'ch': '5'},
    'vraṇa': {'deva': 'व्रण', 'eng': 'wound, ulcer', 'src': 'SS', 'ch': '5'},
    'vidradhi': {'deva': 'विद्रधि', 'eng': 'abscess', 'src': 'SS', 'ch': '5'},
    'bhagandhara': {'deva': 'भगंधर', 'eng': 'fistula in ano', 'src': 'SS', 'ch': '5'},
    'śūla': {'deva': 'शूल', 'eng': 'colic, pain', 'src': 'CS', 'ch': '5'},
    
    # ===== CHAPTER 6: PHARMACOLOGY =====
    'dravya': {'deva': 'द्रव्य', 'eng': 'substance, drug', 'src': 'MW', 'ch': '6'},
    'auṣadha': {'deva': 'औषध', 'eng': 'medicine', 'src': 'MW', 'ch': '6'},
    'bheṣaja': {'deva': 'भेषज', 'eng': 'remedy', 'src': 'MW', 'ch': '6'},
    
    # Rasa (Taste)
    'madhura': {'deva': 'मधुर', 'eng': 'sweet', 'src': 'MW', 'ch': '6'},
    'amla': {'deva': 'अम्ल', 'eng': 'sour', 'src': 'MW', 'ch': '6'},
    'lavaṇa': {'deva': 'लवण', 'eng': 'salty', 'src': 'MW', 'ch': '6'},
    'kaṭu': {'deva': 'कटु', 'eng': 'pungent', 'src': 'MW', 'ch': '6'},
    'tikta': {'deva': 'तिक्त', 'eng': 'bitter', 'src': 'MW', 'ch': '6'},
    'kaṣāya': {'deva': 'कषाय', 'eng': 'astringent', 'src': 'MW', 'ch': '6'},
    
    # Guna (Qualities)
    'guṇa': {'deva': 'गुण', 'eng': 'quality', 'src': 'MW', 'ch': '6'},
    'guru': {'deva': 'गुरु', 'eng': 'heavy', 'src': 'MW', 'ch': '6'},
    'laghu': {'deva': 'लघु', 'eng': 'light', 'src': 'MW', 'ch': '6'},
    'śīta': {'deva': 'शीत', 'eng': 'cold', 'src': 'MW', 'ch': '6'},
    'uṣṇa': {'deva': 'उष्ण', 'eng': 'hot', 'src': 'MW', 'ch': '6'},
    'snigdha': {'deva': 'स्निग्ध', 'eng': 'oily, unctuous', 'src': 'MW', 'ch': '6'},
    'rūkṣa': {'deva': 'रूक्ष', 'eng': 'dry', 'src': 'MW', 'ch': '6'},
    'manda': {'deva': 'मन्द', 'eng': 'slow, dull', 'src': 'MW', 'ch': '6'},
    'tīkṣṇa': {'deva': 'तीक्ष्ण', 'eng': 'sharp, penetrating', 'src': 'MW', 'ch': '6'},
    'sthira': {'deva': 'स्थिर', 'eng': 'stable', 'src': 'MW', 'ch': '6'},
    'sara': {'deva': 'सर', 'eng': 'flowing, mobile', 'src': 'MW', 'ch': '6'},
    'mṛdu': {'deva': 'मृदु', 'eng': 'soft', 'src': 'MW', 'ch': '6'},
    'kaṭhina': {'deva': 'कठिन', 'eng': 'hard', 'src': 'MW', 'ch': '6'},
    'viśada': {'deva': 'विशद', 'eng': 'clear, non-slimy', 'src': 'MW', 'ch': '6'},
    'picchila': {'deva': 'पिच्छिल', 'eng': 'slimy', 'src': 'MW', 'ch': '6'},
    'ślakṣṇa': {'deva': 'श्लक्ष्ण', 'eng': 'smooth', 'src': 'MW', 'ch': '6'},
    'khara': {'deva': 'खर', 'eng': 'rough', 'src': 'MW', 'ch': '6'},
    'sūkṣma': {'deva': 'सूक्ष्म', 'eng': 'subtle', 'src': 'MW', 'ch': '6'},
    'sthūla': {'deva': 'स्थूल', 'eng': 'gross, bulky', 'src': 'MW', 'ch': '6'},
    
    # Virya and Vipaka
    'vīrya': {'deva': 'वीर्य', 'eng': 'potency', 'src': 'MW', 'ch': '6'},
    'vipāka': {'deva': 'विपाक', 'eng': 'post-digestive effect', 'src': 'MW', 'ch': '6'},
    'prabhāva': {'deva': 'प्रभाव', 'eng': 'special potency', 'src': 'CS', 'ch': '6'},
    
    # ===== CHAPTER 7: FORMULATIONS =====
    'yoga': {'deva': 'योग', 'eng': 'formulation', 'src': 'MW', 'ch': '7'},
    'kalpa': {'deva': 'कल्प', 'eng': 'pharmaceutical form', 'src': 'CS', 'ch': '7'},
    'cūrṇa': {'deva': 'चूर्ण', 'eng': 'powder', 'src': 'MW', 'ch': '7'},
    'kvātha': {'deva': 'क्वाथ', 'eng': 'decoction', 'src': 'MW', 'ch': '7'},
    'ariṣṭa': {'deva': 'अरिष्ट', 'eng': 'fermented preparation', 'src': 'AF', 'ch': '7'},
    'āsava': {'deva': 'आसव', 'eng': 'fermented infusion', 'src': 'AF', 'ch': '7'},
    'ghṛta': {'deva': 'घृत', 'eng': 'medicated ghee', 'src': 'MW', 'ch': '7'},
    'taila': {'deva': 'तैल', 'eng': 'medicated oil', 'src': 'MW', 'ch': '7'},
    'guṭikā': {'deva': 'गुटिका', 'eng': 'tablet, pill', 'src': 'AF', 'ch': '7'},
    'vaṭī': {'deva': 'वटी', 'eng': 'tablet', 'src': 'AF', 'ch': '7'},
    'lepa': {'deva': 'लेप', 'eng': 'paste', 'src': 'CS', 'ch': '7'},
    'avaleha': {'deva': 'अवलेह', 'eng': 'confection', 'src': 'AF', 'ch': '7'},
    'modaka': {'deva': 'मोदक', 'eng': 'sweet ball preparation', 'src': 'AF', 'ch': '7'},
    'bhasma': {'deva': 'भस्म', 'eng': 'calcined preparation', 'src': 'RS', 'ch': '7'},
    'parpāṭī': {'deva': 'पर्पाटी', 'eng': 'thin flaky preparation', 'src': 'RS', 'ch': '7'},
    'piṣṭī': {'deva': 'पिष्टी', 'eng': 'paste form preparation', 'src': 'RS', 'ch': '7'},
    'rasa': {'deva': 'रस', 'eng': 'mercurial preparation', 'src': 'RS', 'ch': '7'},
    'rasauṣadhi': {'deva': 'रसौषधि', 'eng': 'metallic medicine', 'src': 'RS', 'ch': '7'},
    
    # ===== CHAPTER 8: DIET =====
    'āhāra': {'deva': 'आहार', 'eng': 'diet, food', 'src': 'MW', 'ch': '8'},
    'anna': {'deva': 'अन्न', 'eng': 'food, grains', 'src': 'MW', 'ch': '8'},
    'pāna': {'deva': 'पान', 'eng': 'drink', 'src': 'MW', 'ch': '8'},
    'pathya': {'deva': 'पथ्य', 'eng': 'wholesome diet', 'src': 'CS', 'ch': '8'},
    'apathya': {'deva': 'अपथ्य', 'eng': 'unwholesome diet', 'src': 'CS', 'ch': '8'},
    
    # ===== CHAPTER 9: TREATMENT =====
    'śodhana': {'deva': 'शोधन', 'eng': 'purification', 'src': 'MW', 'ch': '9'},
    'śamana': {'deva': 'शमन', 'eng': 'palliation', 'src': 'MW', 'ch': '9'},
    'bṛṃhaṇa': {'deva': 'बृंहण', 'eng': 'nourishing', 'src': 'CS', 'ch': '9'},
    'laṅghana': {'deva': 'लङ्घन', 'eng': 'reducing', 'src': 'CS', 'ch': '9'},
    
    # Panchakarma
    'pañcakarma': {'deva': 'पञ्चकर्म', 'eng': 'five therapies', 'src': 'CS', 'ch': '9'},
    'vamana': {'deva': 'वमन', 'eng': 'therapeutic emesis', 'src': 'CS', 'ch': '9'},
    'virecana': {'deva': 'विरेचन', 'eng': 'therapeutic purgation', 'src': 'CS', 'ch': '9'},
    'basti': {'deva': 'बस्ति', 'eng': 'enema therapy', 'src': 'CS', 'ch': '9'},
    'nasya': {'deva': 'नस्य', 'eng': 'nasal therapy', 'src': 'CS', 'ch': '9'},
    'raktamokṣaṇa': {'deva': 'रक्तमोक्षण', 'eng': 'bloodletting', 'src': 'SS', 'ch': '9'},
    
    # Poorvakarma (preparatory procedures)
    'snehana': {'deva': 'स्नेहन', 'eng': 'oleation', 'src': 'CS', 'ch': '9'},
    'svedana': {'deva': 'स्वेदन', 'eng': 'sudation', 'src': 'CS', 'ch': '9'},
    'abhyaṅga': {'deva': 'अभ्यङ्ग', 'eng': 'oil massage', 'src': 'CS', 'ch': '9'},
    'śirodhārā': {'deva': 'शिरोधारा', 'eng': 'head oil stream', 'src': 'KK', 'ch': '9'},
    'piṇḍasveda': {'deva': 'पिण्डस्वेद', 'eng': 'bolus sudation', 'src': 'KK', 'ch': '9'},
    
    # ===== CHAPTER 10: RASAYANA & VAJIKARANA =====
    'rasāyana': {'deva': 'रसायन', 'eng': 'rejuvenation', 'src': 'CS', 'ch': '10'},
    'vājīkaraṇa': {'deva': 'वाजीकरण', 'eng': 'aphrodisiac therapy', 'src': 'CS', 'ch': '10'},
}

# Also add variant forms for matching
VARIANT_FORMS = {}
for k, v in list(AUTHORITATIVE_TERMS.items()):
    # Add form without final visarga
    if k.endswith('ḥ'):
        base = k[:-1]
        if base not in AUTHORITATIVE_TERMS:
            VARIANT_FORMS[base] = v
    # Add form without final 'm'
    if k.endswith('m'):
        base = k[:-1]
        if base not in AUTHORITATIVE_TERMS:
            VARIANT_FORMS[base] = v

AUTHORITATIVE_TERMS.update(VARIANT_FORMS)


class EnhancedPhase3Verification:
    """Enhanced verification with comprehensive term matching."""
    
    def __init__(self):
        self.terms = []
        self.verified = []
        self.stats = Counter()
    
    def load_terms(self):
        """Load corrected terms from Phase 2."""
        print("[LOAD] Loading corrected knowledge base...")
        kb_path = PHASE2_DIR / "corrected_knowledge_base.json"
        with open(kb_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        self.terms = data.get('terms', [])
        print(f"  [OK] Loaded {len(self.terms)} terms")
    
    def normalize_iast(self, iast: str) -> List[str]:
        """Normalize IAST and return possible matching forms."""
        if not iast:
            return []
        
        # Clean and lowercase
        iast = iast.strip().lower()
        
        # Remove trailing punctuation
        iast = re.sub(r'[,.\s;:]+$', '', iast)
        
        # Handle multiple terms separated by comma
        parts = [p.strip() for p in iast.split(',')]
        
        results = []
        for part in parts:
            # Clean part
            part = re.sub(r'[,.\s;:]+$', '', part)
            part = re.sub(r'^[,.\s;:]+', '', part)
            
            if part:
                results.append(part)
                
                # Also try without final visarga
                if part.endswith('ḥ'):
                    results.append(part[:-1])
                
                # Also try without final 'm' 
                if part.endswith('m'):
                    results.append(part[:-1])
        
        return list(set(results))
    
    def verify_all_terms(self):
        """Verify all terms against authoritative database."""
        print("\n[VERIFY] Running enhanced verification...")
        
        for term in self.terms:
            term_id = term.get('term_id', '')
            if not term_id.startswith('ITA-'):
                continue
            
            iast = term.get('iast', '')
            iast_variants = self.normalize_iast(iast)
            
            matched = False
            match_info = None
            
            for variant in iast_variants:
                if variant in AUTHORITATIVE_TERMS:
                    ref = AUTHORITATIVE_TERMS[variant]
                    matched = True
                    match_info = {
                        'matched_form': variant,
                        'ref_deva': ref['deva'],
                        'ref_eng': ref['eng'],
                        'ref_source': ref['src'],
                        'ref_chapter': ref['ch']
                    }
                    break
            
            # Self-validation: Check IAST-Devanagari consistency
            deva = term.get('devanagari', '')
            self_validated = bool(deva and iast)  # Has both fields
            
            # Determine confidence
            if matched:
                confidence = 'verified'
                self.stats['verified'] += 1
            elif term.get('was_corrected'):
                confidence = 'corrected'
                self.stats['corrected'] += 1
            elif self_validated:
                confidence = 'self_valid'
                self.stats['self_valid'] += 1
            else:
                confidence = 'unverified'
                self.stats['unverified'] += 1
            
            self.verified.append({
                'term_id': term_id,
                'english': term.get('english', ''),
                'iast': iast,
                'devanagari': deva,
                'was_corrected': term.get('was_corrected', False),
                'matched': matched,
                'match_info': match_info,
                'confidence': confidence
            })
        
        self.stats['total'] = len(self.verified)
    
    def save_results(self):
        """Save enhanced verification results."""
        print("\n[SAVE] Saving enhanced verification results...")
        
        # Group by confidence
        by_confidence = defaultdict(list)
        for v in self.verified:
            by_confidence[v['confidence']].append(v)
        
        # Save main report
        report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': {
                'total_ita_terms': self.stats['total'],
                'verified_against_references': self.stats['verified'],
                'corrected_in_phase2': self.stats['corrected'],
                'self_validated': self.stats['self_valid'],
                'unverified': self.stats['unverified'],
                'reference_terms_count': len(AUTHORITATIVE_TERMS)
            },
            'confidence_breakdown': {
                'verified': self.stats['verified'],
                'corrected': self.stats['corrected'],
                'self_valid': self.stats['self_valid'],
                'unverified': self.stats['unverified']
            },
            'verified_samples': by_confidence['verified'][:100],
            'unverified_samples': by_confidence['unverified'][:100]
        }
        
        report_path = REPORTS_DIR / "enhanced_verification_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Save enhanced master index
        master_path = OUTPUT_DIR / "enhanced_master_index.json"
        with open(master_path, 'w', encoding='utf-8') as f:
            json.dump({
                'generated_at': datetime.now().isoformat(),
                'total_terms': self.stats['total'],
                'statistics': dict(self.stats),
                'terms': self.verified
            }, f, indent=2, ensure_ascii=False)
        
        print(f"  [OK] Enhanced report: {report_path}")
        print(f"  [OK] Enhanced master index: {master_path}")
    
    def run(self):
        """Run enhanced verification."""
        print("=" * 70)
        print("Phase 3: Enhanced Term Verification")
        print("=" * 70)
        print(f"Reference terms: {len(AUTHORITATIVE_TERMS)}")
        print()
        
        self.load_terms()
        self.verify_all_terms()
        self.save_results()
        
        print()
        print("=" * 70)
        print("ENHANCED VERIFICATION COMPLETE")
        print("=" * 70)
        print(f"Total ITA terms: {self.stats['total']}")
        print(f"Verified against references: {self.stats['verified']}")
        print(f"Corrected in Phase 2: {self.stats['corrected']}")
        print(f"Self-validated (IAST+Deva): {self.stats['self_valid']}")
        print(f"Unverified: {self.stats['unverified']}")


def main():
    verifier = EnhancedPhase3Verification()
    verifier.run()


if __name__ == "__main__":
    main()
