# Charak Samhita Comprehensive Scraping Plan
## carakasamhitaonline.com — Complete Database Build

**Source**: https://www.carakasamhitaonline.com  
**License**: CC BY-NC-SA 4.0  
**MediaWiki API**: Available (https://www.carakasamhitaonline.com/api.php)  
**Total Scope**: 8 Sthanas, 120 Chapters, ~6,300 Shlokas, Devanagari + IAST + Hunterian + English

### Data Structure Per Chapter Page
Each chapter on carakasamhitaonline.com contains:
1. **Metadata Table**: Sthana, Chapter# English Name, Tetrad/Sub-section, Preceding Chapter, Succeeding Chapter, Translators, Reviewer, Editors, Year, Publisher, DOI
2. **Abstract**: Chapter summary with Keywords
3. **Introduction**: Extensive commentary on chapter context
4. **Sanskrit Text Section**: Devanagari shlokas → IAST transliteration → Hunterian transliteration → English Translation (interleaved verse-by-verse)
5. **Tattva Vimarsha**: Fundamental Principles commentary
6. **Vidhi Vimarsha**: Applied Inferences commentary
7. **More Reading**: References for further study
8. **References**: Source citations

---

## STEP 1: Infrastructure & Setup
| # | Task | Description | Status |
|---|------|-------------|--------|
| 1.1 | Create directory structure | `knowledge-base/carak-samhita/` with subdirs: `sutra/`, `nidana/`, `vimana/`, `sharira/`, `indriya/`, `chikitsa/`, `kalpa/`, `siddhi/`, `concepts/` | ⬜ |
| 1.2 | Define TypeScript interfaces | `Shloka`, `ChapterMetadata`, `Chapter`, `Sthana`, `Abstract`, `Section`, `Commentary`, `Keyword` | ⬜ |
| 1.3 | Create HTTP client | Axios with rate limiting (200ms), timeout (30s), retry (3x exponential backoff) | ⬜ |
| 1.4 | Create HTML/text parser | Strip MediaWiki markup, extract structured content from wikitext | ⬜ |
| 1.5 | Create Devanagari normalizer | Unicode NFC normalization, fix common encoding errors, validate Devanagari range | ⬜ |
| 1.6 | Create transliteration validator | Validate IAST diacritics, Hunterian format consistency | ⬜ |
| 1.7 | Create logging system | Progress tracking, error logging, chapter completion status | ⬜ |
| 1.8 | Create checkpoint system | Save progress every 5 chapters, resume from last checkpoint | ⬜ |
| 1.9 | Create JSON schema validator | Validate output structure matches interface definitions | ⬜ |
| 1.10 | Create test suite | Unit tests for parsers, normalizers, validators | ⬜ |

---

## STEP 2: Sthana Index & Master Structure
| # | Task | Description | Status |
|---|------|-------------|--------|
| 2.1 | Scrape Contents page | `https://www.carakasamhitaonline.com/index.php?title=Contents` — extract all 120 chapter URLs | ⬜ |
| 2.2 | Extract chapter metadata | For each chapter: Devanagari name, IAST name, English name, URL slug | ⬜ |
| 2.3 | Scrape Sutra Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Sutra_Sthana` — 30 chapters with tetrad groupings | ⬜ |
| 2.4 | Scrape Nidana Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Nidana_Sthana` — 8 chapters | ⬜ |
| 2.5 | Scrape Vimana Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Vimana_Sthana` — 8 chapters | ⬜ |
| 2.6 | Scrape Sharira Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Sharira_Sthana` — 8 chapters | ⬜ |
| 2.7 | Scrape Indriya Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Indriya_Sthana` — 12 chapters | ⬜ |
| 2.8 | Scrape Chikitsa Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Chikitsa_Sthana` — 30 chapters | ⬜ |
| 2.9 | Scrape Kalpa Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Kalpa_Sthana` — 12 chapters | ⬜ |
| 2.10 | Scrape Siddhi Sthana index | `https://www.carakasamhitaonline.com/index.php?title=Siddhi_Sthana` — 12 chapters; save master index JSON | ⬜ |

---

## STEP 3: Sutra Sthana — Bheshaja Chatushka (Ch 1–4)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 3.1 | Ch1: Deerghanjiviteeya — scrape full page (metadata, abstract, intro, shlokas, tattva/vidhi vimarsha) | `Deerghanjiviteeya_Adhyaya` | ⬜ |
| 3.2 | Ch1: Extract all Devanagari shlokas with verse numbers | — | ⬜ |
| 3.3 | Ch1: Extract IAST + Hunterian transliterations | — | ⬜ |
| 3.4 | Ch1: Extract English translations (verse-by-verse) | — | ⬜ |
| 3.5 | Ch1: Extract Tattva Vimarsha (Fundamental Principles) | — | ⬜ |
| 3.6 | Ch1: Extract Vidhi Vimarsha (Applied Inferences) | — | ⬜ |
| 3.7 | Ch2: Apamarga Tanduliya — full scrape | `Apamarga_Tanduliya_Adhyaya` | ⬜ |
| 3.8 | Ch3: Aragvadhiya — full scrape | `Aragvadhiya_Adhyaya` | ⬜ |
| 3.9 | Ch4: Shadvirechanashatashritiya — full scrape | `Shadvirechanashatashritiya_Adhyaya` | ⬜ |
| 3.10 | Save Bheshaja Chatushka JSON with all 4 chapters complete data | — | ⬜ |

---

## STEP 4: Sutra Sthana — Swastha Chatushka (Ch 5–8)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 4.1 | Ch5: Matrashiteeya — scrape metadata, abstract, shlokas, vimarsha | `Matrashiteeya_Adhyaya` | ⬜ |
| 4.2 | Ch5: Extract dietary quantity guidelines with verse references | — | ⬜ |
| 4.3 | Ch6: Tasyashiteeya — full scrape | `Tasyashiteeya_Adhyaya` | ⬜ |
| 4.4 | Ch6: Extract seasonal regimen (Ritucharya) concepts | — | ⬜ |
| 4.5 | Ch7: Naveganadharaniya — full scrape | `Naveganadharaniya_Adhyaya` | ⬜ |
| 4.6 | Ch7: Extract 13 suppressible urges, 13 non-suppressible urges | — | ⬜ |
| 4.7 | Ch8: Indriyopakramaniya — full scrape | `Indriyopakramaniya_Adhyaya` | ⬜ |
| 4.8 | Ch8: Extract Sadvritta (code of conduct) principles | — | ⬜ |
| 4.9 | Cross-reference Swastha concepts with existing knowledge base | — | ⬜ |
| 4.10 | Save Swastha Chatushka JSON | — | ⬜ |

---

## STEP 5: Sutra Sthana — Nirdesha & Kalpana Chatushkas (Ch 9–16)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 5.1 | Ch9: Khuddakachatushpada — four components of healthcare | `Khuddakachatushpada_Adhyaya` | ⬜ |
| 5.2 | Ch10: Mahachatushpada — classification of diseases by severity | `Mahachatushpada_Adhyaya` | ⬜ |
| 5.3 | Ch11: Tistraishaniya — three desires of life (Dharma, Artha, Kama) | `Tistraishaniya_Adhyaya` | ⬜ |
| 5.4 | Ch12: Vatakalakaliya — merits/demerits of Vata | `Vatakalakaliya_Adhyaya` | ⬜ |
| 5.5 | Ch13: Snehadhyaya — oleation therapy principles | `Sneha_Adhyaya` | ⬜ |
| 5.6 | Ch14: Swedadhyaya — sudation therapy principles | `Sweda_Adhyaya` | ⬜ |
| 5.7 | Ch15: Upakalpaniya — hospital management guidelines | `Upakalpaniya_Adhyaya` | ⬜ |
| 5.8 | Ch16: Chikitsaprabhritiya — Panchakarma assessment protocols | `Chikitsaprabhritiya_Adhyaya` | ⬜ |
| 5.9 | Extract all treatment protocols and procedures from Ch 9-16 | — | ⬜ |
| 5.10 | Save Nirdesha & Kalpana Chatushkas JSON | — | ⬜ |

---

## STEP 6: Sutra Sthana — Roga, Yojana, Annapana Chatushkas & Sangrahadvaya (Ch 17–30)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 6.1 | Ch17: Kiyanta Shiraseeya — diseases of three vital organs/head | `Kiyanta_Shiraseeya_Adhyaya` | ⬜ |
| 6.2 | Ch18: Trishothiya — three types of swellings | `Trishothiya_Adhyaya` | ⬜ |
| 6.3 | Ch19: Ashtodariya — numerical disease classification | `Ashtodariya_Adhyaya` | ⬜ |
| 6.4 | Ch20: Maharoga — dosha-specific disease classification | `Maharoga_Adhyaya` | ⬜ |
| 6.5 | Ch21: Ashtauninditiya — eight undesirable physical constitutions | `Ashtauninditiya_Adhyaya` | ⬜ |
| 6.6 | Ch22: Langhanabrimhaniya — reduction and nourishing therapies | `Langhanabrimhaniya_Adhyaya` | ⬜ |
| 6.7 | Ch23: Santarpaniya — over-nutrition and its disorders | `Santarpaniya_Adhyaya` | ⬜ |
| 6.8 | Ch24: Vidhishonitiya — blood vitiation and disorders | `Vidhishonitiya_Adhyaya` | ⬜ |
| 6.9 | Ch25: Yajjah Purushiya — origin of human beings | `Yajjah_Purushiya_Adhyaya` | ⬜ |
| 6.10 | Ch26: Atreyabhadrakapyiya — pharmacological principles of diet | `Atreyabhadrakapyiya_Adhyaya` | ⬜ |

*(continued for Ch 27-30)*
| 6.11 | Ch27: Annapanavidhi — classification of food and beverages | `Annapanavidhi_Adhyaya` | ⬜ |
| 6.12 | Ch28: Vividhashitapitiya — sequential effects of food | `Vividhashitapitiya_Adhyaya` | ⬜ |
| 6.13 | Ch29: Dashapranayataneeya — ten seats of life forces | `Dashapranayataneeya_Adhyaya` | ⬜ |
| 6.14 | Ch30: Arthedashmahamooliya — ten great vessels from heart | `Arthedashmahamooliya_Adhyaya` | ⬜ |
| 6.15 | Extract all food classifications and dietary guidelines | — | ⬜ |
| 6.16 | Extract all drug classifications (Mahakashaya groups) | — | ⬜ |
| 6.17 | Compile complete Sutra Sthana disease list with Devanagari names | — | ⬜ |
| 6.18 | Save complete Sutra Sthana (30 chapters) to `sutra/sutra-sthana.json` | — | ⬜ |

---

## STEP 7: Nidana Sthana (Ch 31–38)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 7.1 | Ch31: Jwara Nidana — fever etiopathogenesis | `Jwara_Nidana_Adhyaya` | ⬜ |
| 7.2 | Ch32: Raktapitta Nidana — bleeding disorders diagnosis | `Raktapitta_Nidana_Adhyaya` | ⬜ |
| 7.3 | Ch33: Gulma Nidana — abdominal lumps diagnosis | `Gulma_Nidana_Adhyaya` | ⬜ |
| 7.4 | Ch34: Prameha Nidana — urinary disorders/diabetes | `Prameha_Nidana_Adhyaya` | ⬜ |
| 7.5 | Ch35: Kushtha Nidana — skin diseases diagnosis | `Kushtha_Nidana_Adhyaya` | ⬜ |
| 7.6 | Ch36: Shosha Nidana — wasting disease diagnosis | `Shosha_Nidana_Adhyaya` | ⬜ |
| 7.7 | Ch37: Unmada Nidana — psychosis diagnosis | `Unmada_Nidana_Adhyaya` | ⬜ |
| 7.8 | Ch38: Apasmara Nidana — seizure disorders diagnosis | `Apasmara_Nidana_Adhyaya` | ⬜ |
| 7.9 | Extract etiology (Nidana) concepts for each disease | — | ⬜ |
| 7.10 | Save Nidana Sthana (8 chapters) to `nidana/nidana-sthana.json` | — | ⬜ |

---

## STEP 8: Vimana Sthana (Ch 39–46)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 8.1 | Ch39: Rasa Vimana — taste-based disease/drug measurement | `Rasa_Vimana_Adhyaya` | ⬜ |
| 8.2 | Ch40: Trividhakukshiya Vimana — three abdomen parts/diet principles | `Trividhakukshiya_Vimana_Adhyaya` | ⬜ |
| 8.3 | Ch41: Janapadodhvansaniya Vimana — epidemic diseases | `Janapadodhvansaniya_Vimana_Adhyaya` | ⬜ |
| 8.4 | Ch42: Trividha Roga Vishesha Vijnaniya — three methods of disease knowledge | `Trividha_Roga_Vishesha_Vijnaniya_Vimana_Adhyaya` | ⬜ |
| 8.5 | Ch43: Sroto Vimana — channels of transport/transformation | `Sroto_Vimana_Adhyaya` | ⬜ |
| 8.6 | Ch44: Roganika Vimana — disease classification system | `Roganika_Vimana_Adhyaya` | ⬜ |
| 8.7 | Ch45: Vyadhita Rupiya Vimana — patient types and organisms | `Vyadhita_Rupiya_Vimana_Adhyaya` | ⬜ |
| 8.8 | Ch46: Rogabhishagjitiya Vimana — methods of conquering debate/disease | `Rogabhishagjitiya_Vimana_Adhyaya` | ⬜ |
| 8.9 | Extract complete Srotas (channel) system details | — | ⬜ |
| 8.10 | Save Vimana Sthana (8 chapters) to `vimana/vimana-sthana.json` | — | ⬜ |

---

## STEP 9: Sharira Sthana (Ch 47–54)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 9.1 | Ch47: Katidhapurusha Sharira — holistic human being knowledge | `Katidhapurusha_Sharira_Adhyaya` | ⬜ |
| 9.2 | Ch48: Atulyagotriya Sharira — clans and aspects of human birth | `Atulyagotriya_Sharira_Adhyaya` | ⬜ |
| 9.3 | Ch49: Khuddika Garbhavakranti Sharira — factors for embryogenesis | `Khuddika_Garbhavakranti_Sharira_Adhyaya` | ⬜ |
| 9.4 | Ch50: Mahatigarbhavakranti Sharira — embryonic development detail | `Mahatigarbhavakranti_Sharira_Adhyaya` | ⬜ |
| 9.5 | Ch51: Purusha Vichaya Sharira — detailed study of human being | `Purusha_Vichaya_Sharira_Adhyaya` | ⬜ |
| 9.6 | Ch52: Sharira Vichaya Sharira — analytical study of human body | `Sharira_Vichaya_Sharira_Adhyaya` | ⬜ |
| 9.7 | Ch53: Sharira Sankhya Sharira — numerological account of body | `Sharira_Sankhya_Sharira_Adhyaya` | ⬜ |
| 9.8 | Ch54: Jatisutriya Sharira — obstetrics/maternal/neonatal care | `Jatisutriya_Sharira_Adhyaya` | ⬜ |
| 9.9 | Extract Prakriti (constitution) and Garbha (embryo) concepts | — | ⬜ |
| 9.10 | Save Sharira Sthana (8 chapters) to `sharira/sharira-sthana.json` | — | ⬜ |

---

## STEP 10: Indriya Sthana (Ch 55–66)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 10.1 | Ch55: Varnasvariyam — fatal signs in complexion/voice | `Varnasvariyam_Indriyam_Adhyaya` | ⬜ |
| 10.2 | Ch56: Pushpitakam — tactile and olfactory fatal signs | `Pushpitakam_Indriyam_Adhyaya` | ⬜ |
| 10.3 | Ch57: Parimarshaneeyam — palpable signs of imminent death | `Parimarshaneeyam_Indriyam_Adhyaya` | ⬜ |
| 10.4 | Ch58: Indriyaneekam — fatal signs in five sense organs | `Indriyaneekam_Indriyam_Adhyaya` | ⬜ |
| 10.5 | Ch59: Purvarupeeyam — prodromal symptoms for prognosis | `Purvarupeeyam_Indriyam_Adhyaya` | ⬜ |
| 10.6 | Ch60: Katamanisharireeyam — specific fatal clinical features | `Katamanisharireeyam_Indriyam_Adhyaya` | ⬜ |
| 10.7 | Ch61: Pannarupiyam — fatal signs in shadows/complexion/luster | `Pannarupiyam_Indriyam_Adhyaya` | ⬜ |
| 10.8 | Ch62: Avakshiraseeyam — inverted shadow of dying person | `Avakshiraseeyam_Indriyam_Adhyaya` | ⬜ |
| 10.9 | Ch63: Yasyashyavanimittiyam — palliative care signs | `Yasyashyavanimittiyam_Indriyam_Adhyaya` | ⬜ |
| 10.10 | Ch64: Sadyomaraneeyam — signs of instant death | `Sadyomaraneeyam_Indriyam_Adhyaya` | ⬜ |

*(continued for Ch 65-66)*
| 10.11 | Ch65: Anujyotiyam — death signs from diminished Agni | `Anujyotiyam_Indriyam_Adhyaya` | ⬜ |
| 10.12 | Ch66: Gomayachurniyam — auspicious/inauspicious messenger signs | `Gomayachurniyam_Indriyam_Adhyaya` | ⬜ |
| 10.13 | Extract all prognosis indicators with Devanagari terms | — | ⬜ |
| 10.14 | Save Indriya Sthana (12 chapters) to `indriya/indriya-sthana.json` | — | ⬜ |

---

## STEP 11: Chikitsa Sthana — Part 1 (Ch 67–76)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 11.1 | Ch67: Rasayana — rejuvenation therapy (Kutipraveshika/Vatatapika) | `Rasayana_Adhyaya` | ⬜ |
| 11.2 | Ch68: Vajikarana — aphrodisiac therapy/virility | `Vajikarana_Adhyaya` | ⬜ |
| 11.3 | Ch69: Jwara Chikitsa — fever treatment (all types) | `Jwara_Chikitsa_Adhyaya` | ⬜ |
| 11.4 | Ch70: Raktapitta Chikitsa — bleeding disorders treatment | `Raktapitta_Chikitsa_Adhyaya` | ⬜ |
| 11.5 | Ch71: Gulma Chikitsa — abdominal lumps treatment | `Gulma_Chikitsa_Adhyaya` | ⬜ |
| 11.6 | Ch72: Prameha Chikitsa — diabetes/urinary treatment | `Prameha_Chikitsa_Adhyaya` | ⬜ |
| 11.7 | Ch73: Kushtha Chikitsa — skin diseases treatment | `Kushtha_Chikitsa_Adhyaya` | ⬜ |
| 11.8 | Ch74: Rajayakshma Chikitsa — wasting diseases treatment | `Rajayakshma_Chikitsa_Adhyaya` | ⬜ |
| 11.9 | Ch75: Unmada Chikitsa — psychosis treatment | `Unmada_Chikitsa_Adhyaya` | ⬜ |
| 11.10 | Ch76: Apasmara Chikitsa — seizure disorders treatment | `Apasmara_Chikitsa_Adhyaya` | ⬜ |

---

## STEP 12: Chikitsa Sthana — Part 2 (Ch 77–86)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 12.1 | Ch77: Kshatakshina — emaciation due to trauma | `Kshatakshina_Chikitsa_Adhyaya` | ⬜ |
| 12.2 | Ch78: Shvayathu — various types of swellings | `Shvayathu_Chikitsa_Adhyaya` | ⬜ |
| 12.3 | Ch79: Udara — generalized abdominal enlargement | `Udara_Chikitsa_Adhyaya` | ⬜ |
| 12.4 | Ch80: Arsha — hemorrhoids | `Arsha_Chikitsa_Adhyaya` | ⬜ |
| 12.5 | Ch81: Grahani — digestive/metabolic disorders | `Grahani_Chikitsa_Adhyaya` | ⬜ |
| 12.6 | Ch82: Pandu — anemia/blood deficiency | `Pandu_Chikitsa_Adhyaya` | ⬜ |
| 12.7 | Ch83: Hikka Shwasa — hiccups and dyspnea | `Hikka_Shwasa_Chikitsa_Adhyaya` | ⬜ |
| 12.8 | Ch84: Kasa — cough of various origins | `Kasa_Chikitsa_Adhyaya` | ⬜ |
| 12.9 | Ch85: Atisara — diarrhea and associated disorders | `Atisara_Chikitsa_Adhyaya` | ⬜ |
| 12.10 | Ch86: Chhardi — vomiting | `Chhardi_Chikitsa_Adhyaya` | ⬜ |

---

## STEP 13: Chikitsa Sthana — Part 3 (Ch 87–96)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 13.1 | Ch87: Visarpa — acute spreading erysipelas | `Visarpa_Chikitsa_Adhyaya` | ⬜ |
| 13.2 | Ch88: Trishna — morbid thirst | `Trishna_Chikitsa_Adhyaya` | ⬜ |
| 13.3 | Ch89: Visha — various types of poisoning | `Visha_Chikitsa_Adhyaya` | ⬜ |
| 13.4 | Ch90: Madatyaya — intoxication/alcoholism | `Madatyaya_Chikitsa_Adhyaya` | ⬜ |
| 13.5 | Ch91: Dwivraniya — two types of ulcers | `Dwivraniya_Chikitsa_Adhyaya` | ⬜ |
| 13.6 | Ch92: Trimarmiya — diseases of three vital organs | `Trimarmiya_Chikitsa_Adhyaya` | ⬜ |
| 13.7 | Ch93: Urustambha — diseases of thigh and hip | `Urustambha_Chikitsa_Adhyaya` | ⬜ |
| 13.8 | Ch94: Vatavyadhi — diseases caused by Vata dosha | `Vatavyadhi_Chikitsa_Adhyaya` | ⬜ |
| 13.9 | Ch95: Vatarakta — Vata-Rakta disorders | `Vatarakta_Chikitsa_Adhyaya` | ⬜ |
| 13.10 | Ch96: Yonivyapat — genital tract disorders | `Yonivyapat_Chikitsa_Adhyaya` | ⬜ |

---

## STEP 14: Kalpa Sthana (Ch 97–108)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 14.1 | Ch97: Madana Kalpa — Madanaphala pharmaceutical preparations | `Madana_Kalpa_Adhyaya` | ⬜ |
| 14.2 | Ch98: Jimutaka Kalpa — Jimutaka preparations | `Jimutaka_Kalpa_Adhyaya` | ⬜ |
| 14.3 | Ch99: Ikshvaku Kalpa — Ikshvaku preparations | `Ikshvaku_Kalpa_Adhyaya` | ⬜ |
| 14.4 | Ch100: Dhamargava Kalpa — Dhamargava preparations | `Dhamargava_Kalpa_Adhyaya` | ⬜ |
| 14.5 | Ch101: Vatsaka Kalpa — Vatsaka preparations | `Vatsaka_Kalpa_Adhyaya` | ⬜ |
| 14.6 | Ch102: Kritavedhana Kalpa | `Kritavedhana_Kalpa_Adhyaya` | ⬜ |
| 14.7 | Ch103: Shyamatrivrita Kalpa | `Shyamatrivrita_Kalpa_Adhyaya` | ⬜ |
| 14.8 | Ch104: Chaturangula Kalpa | `Chaturangula_Kalpa_Adhyaya` | ⬜ |
| 14.9 | Ch105: Tilvaka Kalpa | `Tilvaka_Kalpa_Adhyaya` | ⬜ |
| 14.10 | Ch106: Sudha Kalpa | `Sudha_Kalpa_Adhyaya` | ⬜ |

*(continued for Ch 107-108)*
| 14.11 | Ch107: Saptalashankhini Kalpa | `Saptalashankhini_Kalpa_Adhyaya` | ⬜ |
| 14.12 | Ch108: Dantidravanti Kalpa | `Dantidravanti_Kalpa_Adhyaya` | ⬜ |
| 14.13 | Extract all formulation recipes with ingredients and dosages | — | ⬜ |
| 14.14 | Save Kalpa Sthana (12 chapters) to `kalpa/kalpa-sthana.json` | — | ⬜ |

---

## STEP 15: Siddhi Sthana (Ch 109–120)
| # | Task | URL Slug | Status |
|---|------|----------|--------|
| 15.1 | Ch109: Kalpana Siddhi — standard purification procedures | `Kalpana_Siddhi_Adhyaya` | ⬜ |
| 15.2 | Ch110: Panchakarmiya Siddhi — Panchakarma therapies | `Panchakarmiya_Siddhi_Adhyaya` | ⬜ |
| 15.3 | Ch111: Bastisutriyam Siddhi — standard Basti practices | `Bastisutriyam_Siddhi_Adhyaya` | ⬜ |
| 15.4 | Ch112: Snehavyapat Siddhi — unctuous enema complications | `Snehavyapat_Siddhi_Adhyaya` | ⬜ |
| 15.5 | Ch113: Netrabastivyapat Siddhi — enema nozzle complications | `Netrabastivyapat_Siddhi_Adhyaya` | ⬜ |
| 15.6 | Ch114: Vamana Virechana Vyapat — emesis/purgation complications | `Vamana_Virechana_Vyapat_Siddhi_Adhyaya` | ⬜ |
| 15.7 | Ch115: Bastivyapat Siddhi — enema complications | `Bastivyapat_Siddhi_Adhyaya` | ⬜ |
| 15.8 | Ch116: Prasrita Yogiyam Siddhi — Prasrita-dose enema formulations | `Prasrita_Yogiyam_Siddhi_Adhyaya` | ⬜ |
| 15.9 | Ch117: Trimarmiya Siddhi — three vital organs treatment | `Trimarmiya_Siddhi_Adhyaya` | ⬜ |
| 15.10 | Ch118: Basti Siddhi — successful Basti administration | `Basti_Siddhi_Adhyaya` | ⬜ |

*(continued for Ch 119-120)*
| 15.11 | Ch119: Phalamatra Siddhi — medicinal fruits in enema | `Phalamatra_Siddhi_Adhyaya` | ⬜ |
| 15.12 | Ch120: Uttar Basti Siddhi — best effective therapeutic enema | `Uttar_Basti_Siddhi_Adhyaya` | ⬜ |
| 15.13 | Extract all Panchakarma protocols with verse references | — | ⬜ |
| 15.14 | Save Siddhi Sthana (12 chapters) to `siddhi/siddhi-sthana.json` | — | ⬜ |

---

## STEP 16: Concepts & Contemporary Practices Section
| # | Task | Description | Status |
|---|------|-------------|--------|
| 16.1 | Scrape Concepts index page | `https://www.carakasamhitaonline.com/index.php?title=Concepts_and_Contemporary_Practices` | ⬜ |
| 16.2 | Extract all monograph topics | List all concept articles available | ⬜ |
| 16.3 | Scrape each concept article | Extract definition, context, contemporary relevance | ⬜ |
| 16.4 | Extract cross-references to chapter shlokas | Link concepts back to source verses | ⬜ |
| 16.5 | Build concept-to-chapter mapping | Which concepts are discussed in which chapters | ⬜ |
| 16.6 | Extract practitioner guidelines | Clinical decision support information | ⬜ |
| 16.7 | Extract modern correlations | Contemporary medical parallels mentioned | ⬜ |
| 16.8 | Save concepts data to `concepts/concepts.json` | — | ⬜ |
| 16.9 | Build unified concept index | Alphabetical concept list with chapter references | ⬜ |
| 16.10 | Validate all concept links resolve correctly | — | ⬜ |

---

## STEP 17: Typography, Sanskrit Processing & Devanagari Normalization
| # | Task | Description | Status |
|---|------|-------------|--------|
| 17.1 | Normalize all Devanagari text | Unicode NFC normalization, consistent rendering | ⬜ |
| 17.2 | Validate IAST diacritics | Check all long vowels (ā, ī, ū), aspirates (kh, gh, etc.), anusvara, visarga | ⬜ |
| 17.3 | Fix Hunterian transliteration format | Consistent capitalization and romanization | ⬜ |
| 17.4 | Build Sanskrit term dictionary | Devanagari → IAST → English mapping for all unique terms | ⬜ |
| 17.5 | Create Devanagari search index | Enable searching by Devanagari terms | ⬜ |
| 17.6 | Extract verse numbering system | Verify sequential verse numbering per chapter | ⬜ |
| 17.7 | Remove HTML/wiki artifacts | Strip `<ref>`, `<sup>`, table markup from text | ⬜ |
| 17.8 | Cross-validate verse counts | Compare with Gita/Datasets Charak verse counts | ⬜ |
| 17.9 | Build cross-reference map | Map term occurrences across all chapters | ⬜ |
| 17.10 | Final typography QA pass | Manual review of sample chapters for accuracy | ⬜ |

---

## STEP 18: Data Enrichment & Cross-Referencing
| # | Task | Description | Status |
|---|------|-------------|--------|
| 18.1 | Link shlokas to commentaries | Each verse → its Tattva/ Vidhi Vimarsha explanation | ⬜ |
| 18.2 | Cross-reference diseases | Link Nidana (etiology) → Chikitsa (treatment) → Siddhi (procedure) | ⬜ |
| 18.3 | Link herbs mentioned to herb database | Match all herb names to HERBS, PLANET_AYURVEDA_HERBS, AMIDHA_HERBS | ⬜ |
| 18.4 | Link formulations to Bhaishajya Kalpana Kosha | Match all formulation names | ⬜ |
| 18.5 | Map Dosha relationships | Extract all Vata/Pitta/Kapha mentions with context | ⬜ |
| 18.6 | Extract Rasa-Guna-Karma attributes | Build pharmacological profile from chapter references | ⬜ |
| 18.7 | Link to Siddhanta Kosha principles | Match fundamental principles to source shlokas | ⬜ |
| 18.8 | Extract all treatment protocols | Formatted protocol: Disease → Nidana → Chikitsa → Siddhi | ⬜ |
| 18.9 | Build concept graph | Tridosha → Rasa → Guna → Karma relationships | ⬜ |
| 18.10 | Create unified search index | Enable cross-chapter search by any term | ⬜ |

---

## STEP 19: Quality Assurance & Validation
| # | Task | Description | Status |
|---|------|-------------|--------|
| 19.1 | Verify all 120 chapters scraped | Check chapter count per Sthana | ⬜ |
| 19.2 | Validate verse counts | Expected ~6,300 total verses | ⬜ |
| 19.3 | Check Devanagari rendering | Verify Unicode is valid and displayable | ⬜ |
| 19.4 | Verify transliteration accuracy | Sample 50 verses, check IAST matches Devanagari | ⬜ |
| 19.5 | Cross-check with Gita/Datasets | Compare same verses across both sources | ⬜ |
| 19.6 | Validate JSON schema | All output files match TypeScript interfaces | ⬜ |
| 19.7 | Check for missing shlokas | Verify no gaps in verse numbering | ⬜ |
| 19.8 | Verify DOI references | All chapter DOIs are valid and resolve | ⬜ |
| 19.9 | Test search functionality | Query by Devanagari, IAST, English, disease, herb | ⬜ |
| 19.10 | Generate quality report | Statistics: total shlokas, terms, chapters, coverage | ⬜ |

---

## STEP 20: TypeScript Integration & Finalization
| # | Task | Description | Status |
|---|------|-------------|--------|
| 20.1 | Create `knowledge-base/carak-samhita-knowledge/index.ts` | Main TypeScript loader with interfaces | ⬜ |
| 20.2 | Implement `searchCharakSamhitaOnline(query)` | Full-text search across all verses | ⬜ |
| 20.3 | Implement `getChapterOnline(sthana, chapter)` | Retrieve specific chapter | ⬜ |
| 20.4 | Implement `searchByVerse(verseText)` | Search by verse content | ⬜ |
| 20.5 | Implement `searchByDisease(disease)` | Disease → Nidana + Chikitsa + Siddhi | ⬜ |
| 20.6 | Implement `searchByHerb(herb)` | Herb → all chapters mentioning it | ⬜ |
| 20.7 | Implement `getSthanaInfo(sthanaNumber)` | Chapter list for a Sthana | ⬜ |
| 20.8 | Update `ayurknowledge/index.ts` | Add imports, search block 27 for carakasamhitaonline | ⬜ |
| 20.9 | Wire into `searchKnowledge()` function | Integrate with existing RAG search | ⬜ |
| 20.10 | Run `npx tsc --noEmit` and fix errors | Verify clean compilation | ⬜ |

---

## Summary Statistics

| Sthana | Name | Chapters | Est. Shlokas | URL Pattern |
|--------|------|----------|--------------|-------------|
| I | Sutra Sthana | 30 | ~1,500 | `Chapter_Name_Adhyaya` |
| II | Nidana Sthana | 8 | ~500 | `Disease_Nidana_Adhyaya` |
| III | Vimana Sthana | 8 | ~600 | `Topic_Vimana_Adhyaya` |
| IV | Sharira Sthana | 8 | ~500 | `Topic_Sharira_Adhyaya` |
| V | Indriya Sthana | 12 | ~400 | `Topic_Indriyam_Adhyaya` |
| VI | Chikitsa Sthana | 30 | ~2,000 | `Disease_Chikitsa_Adhyaya` |
| VII | Kalpa Sthana | 12 | ~300 | `Herb_Kalpa_Adhyaya` |
| VIII | Siddhi Sthana | 12 | ~500 | `Topic_Siddhi_Adhyaya` |
| **Total** | | **120** | **~6,300** | |

## Data Schema Per Chapter
```json
{
  "sthana": "Sutra Sthana",
  "sthanaNumber": 1,
  "chapterNumber": 1,
  "chapterTitle": {
    "english": "Longevity",
    "sanskrit": "Deerghanjiviteeya Adhyaya",
    "devanagari": "दीर्घञ्जीवितीयोऽध्यायः"
  },
  "url": "https://www.carakasamhitaonline.com/index.php?title=Deerghanjiviteeya_Adhyaya",
  "doi": "10.47468/CSNE.2020.e01.s01.003",
  "metadata": {
    "tetrad": "Bheshaja Chatushka",
    "precedingChapter": null,
    "succeedingChapter": "Apamarga Tanduliya",
    "translators": ["Singh R.H.", "Singh G.", "Sodhi J.S.", "Dixit U."],
    "reviewer": "Panse A.",
    "editors": ["Dixit U.", "Deole Y.S.", "Basisht G."],
    "year": 2020,
    "publisher": "Charak Samhita Research, Training and Skill Development Centre"
  },
  "abstract": "...",
  "keywords": ["Longevity", "Ayurveda", ...],
  "introduction": "...",
  "shlokas": [
    {
      "verseNumber": "१",
      "devanagari": "अथातो दीर्घञ्जीवितीयमध्यायं व्याख्यास्यामः||१||",
      "iast": "Athātō dīrghañjīvitīyamadhyāyamvyākhyāsyāmaḥ||1||",
      "hunterian": "athAto dIrgha~jjIvitIyamadhyAyaM vyAkhyAsyAmaH||1||",
      "english": "Now we shall expound the chapter 'Deerghanjiviteeya' (longevity).",
      "section": "Origin of Ayurveda"
    }
  ],
  "sections": [
    {
      "title": "Origin of Ayurveda",
      "subsections": ["Hierarchy of transfer of knowledge", ...]
    }
  ],
  "tattvaVimarsha": "...",
  "vidhiVimarsha": "...",
  "references": [...]
}
```

## Key Technical Notes
- **MediaWiki API**: Use `api.php?action=parse&page=Title&format=json` for structured content
- **Rate Limiting**: 200ms between requests (5 requests/second max)
- **Checkpointing**: Save progress every 5 chapters to resume on failure
- **Devanagari**: All text in Unicode NFC; validate range U+0900–U+097F
- **License**: CC BY-NC-SA 4.0 — attribution required
- **Cross-validation**: Compare scraped data with Gita/Datasets Charak (7,978 verses already loaded)
