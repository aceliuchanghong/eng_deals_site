#!/usr/bin/env python3
"""Preprocess ECDICT CSV into static JSON shards for the dictionary website.

Usage:
    python scripts/preprocess.py [path/to/ecdict.csv]

Downloads: https://github.com/skywind3000/ECDICT
"""

import csv
import json
import os
import re
import sys

# ── Constants ────────────────────────────────────────────────────────────────

PUBLIC = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
DICT_DIR = os.path.join(PUBLIC, "dict")
LEMMA_DIR = os.path.join(PUBLIC, "lemma")
STOPWORDS_DIR = os.path.join(PUBLIC, "stopwords")

VALID_TAGS = {"cet4", "cet6", "tem4", "tem8", "toefl", "ielts", "gre"}
WORD_RE = re.compile(r"^[a-zA-Z\-']+$")

# ── Stopwords ────────────────────────────────────────────────────────────────

BASIC_STOPWORDS = [
    "a", "an", "the",
    "i", "me", "my", "mine", "myself",
    "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself",
    "she", "her", "hers", "herself",
    "it", "its", "itself",
    "we", "us", "our", "ours", "ourselves",
    "they", "them", "their", "theirs", "themselves",
    "this", "that", "these", "those",
    "who", "whom", "whose", "which", "what",
    "whoever", "whatever", "whichever",
    "am", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having",
    "do", "does", "did", "doing",
    "will", "would", "shall", "should", "can", "could",
    "may", "might", "must", "ought",
    "in", "on", "at", "to", "for", "of", "with", "from",
    "by", "about", "as", "into", "through", "during",
    "before", "after", "above", "below", "between",
    "out", "off", "over", "under", "again", "further",
    "then", "once",
    "and", "but", "or", "nor", "not", "so", "yet",
    "if", "because", "while", "though", "although",
    "than", "when", "where", "how", "why",
    "no", "each", "every", "both", "all", "any",
    "few", "more", "most", "other", "some", "such",
    "only", "own", "same", "too", "very", "just",
    "also", "even", "else", "here", "there",
    "up", "down",
]

STRONG_EXTRA = [
    # Common verbs
    "say", "said", "says", "saying",
    "get", "got", "gotten", "gets", "getting",
    "make", "made", "makes", "making",
    "go", "went", "gone", "goes", "going",
    "know", "knew", "known", "knows", "knowing",
    "think", "thought", "thinks", "thinking",
    "see", "saw", "seen", "sees", "seeing",
    "want", "wanted", "wants", "wanting",
    "come", "came", "comes", "coming",
    "take", "took", "taken", "takes", "taking",
    "give", "gave", "given", "gives", "giving",
    "use", "used", "uses", "using",
    "find", "found", "finds", "finding",
    "tell", "told", "tells", "telling",
    "ask", "asked", "asks", "asking",
    "work", "worked", "works", "working",
    "seem", "seemed", "seems",
    "feel", "felt", "feels", "feeling",
    "try", "tried", "tries", "trying",
    "leave", "left", "leaves", "leaving",
    "call", "called", "calls", "calling",
    "let", "lets", "letting",
    "keep", "kept", "keeps", "keeping",
    "put", "puts", "putting",
    "mean", "meant", "means", "meaning",
    "need", "needed", "needs", "needing",
    "like", "liked", "likes", "liking",
    "love", "loved", "loves", "loving",
    "look", "looked", "looks", "looking",
    "help", "helped", "helps", "helping",
    "turn", "turned", "turns", "turning",
    "start", "started", "starts", "starting",
    "show", "showed", "shown", "shows", "showing",
    "play", "played", "plays", "playing",
    "move", "moved", "moves", "moving",
    "live", "lived", "lives", "living",
    "believe", "believed", "believes", "believing",
    "hold", "held", "holds", "holding",
    "bring", "brought", "brings", "bringing",
    "happen", "happened", "happens", "happening",
    "write", "wrote", "written", "writes", "writing",
    "provide", "provided", "provides", "providing",
    "sit", "sat", "sits", "sitting",
    "stand", "stood", "stands", "standing",
    "lose", "lost", "loses", "losing",
    "pay", "paid", "pays", "paying",
    "meet", "met", "meets", "meeting",
    "include", "included", "includes", "including",
    "continue", "continued", "continues", "continuing",
    "set", "sets", "setting",
    "learn", "learned", "learnt", "learns", "learning",
    "change", "changed", "changes", "changing",
    "lead", "led", "leads", "leading",
    "understand", "understood", "understands", "understanding",
    "watch", "watched", "watches", "watching",
    "follow", "followed", "follows", "following",
    "stop", "stopped", "stops", "stopping",
    "create", "created", "creates", "creating",
    "speak", "spoke", "spoken", "speaks", "speaking",
    "read", "reads", "reading",
    "allow", "allowed", "allows", "allowing",
    "add", "added", "adds", "adding",
    "spend", "spent", "spends", "spending",
    "grow", "grew", "grown", "grows", "growing",
    "open", "opened", "opens", "opening",
    "walk", "walked", "walks", "walking",
    "win", "won", "wins", "winning",
    "offer", "offered", "offers", "offering",
    "remember", "remembered", "remembers", "remembering",
    "love", "loved", "loves", "loving",
    "consider", "considered", "considers", "considering",
    "appear", "appeared", "appears", "appearing",
    "buy", "bought", "buys", "buying",
    "wait", "waited", "waits", "waiting",
    "serve", "served", "serves", "serving",
    "die", "died", "dies", "dying",
    "send", "sent", "sends", "sending",
    "expect", "expected", "expects", "expecting",
    "build", "built", "builds", "building",
    "stay", "stayed", "stays", "staying",
    "fall", "fell", "fallen", "falls", "falling",
    "cut", "cutting", "cuts",
    "reach", "reached", "reaches", "reaching",
    "kill", "killed", "kills", "killing",
    "remain", "remained", "remains", "remaining",
    "suggest", "suggested", "suggests", "suggesting",
    "raise", "raised", "raises", "raising",
    "pass", "passed", "passes", "passing",
    "sell", "sold", "sells", "selling",
    "require", "required", "requires", "requiring",
    "report", "reported", "reports", "reporting",
    "decide", "decided", "decides", "deciding",
    "pull", "pulled", "pulls", "pulling",
    "break", "broke", "broken", "breaks", "breaking",
    "receive", "received", "receives", "receiving",
    "agree", "agreed", "agrees", "agreeing",
    "hit", "hits", "hitting",
    "wear", "wore", "worn", "wears", "wearing",
    "produce", "produced", "produces", "producing",
    "eat", "ate", "eaten", "eats", "eating",
    "cover", "covered", "covers", "covering",
    "catch", "caught", "catches", "catching",
    "draw", "drew", "drawn", "draws", "drawing",
    "choose", "chose", "chosen", "chooses", "choosing",
    # Common adjectives / quantifiers
    "good", "better", "best",
    "bad", "worse", "worst",
    "big", "bigger", "biggest",
    "small", "smaller", "smallest",
    "new", "newer", "newest",
    "old", "older", "oldest",
    "high", "higher", "highest",
    "low", "lower", "lowest",
    "long", "longer", "longest",
    "great", "greater", "greatest",
    "little", "less", "least",
    "large", "larger", "largest",
    "young", "younger", "youngest",
    "early", "earlier", "earliest",
    "right", "left", "wrong",
    "different", "important",
    "public", "private", "local", "national",
    "possible", "available", "likely",
    "able", "unable",
    "true", "false", "real",
    "full", "empty",
    "sure", "clear", "simple",
    "hard", "easy",
    "happy", "sorry",
    # Common nouns
    "time", "times",
    "year", "years",
    "people", "person", "persons",
    "way", "ways",
    "day", "days",
    "thing", "things",
    "man", "men", "woman", "women",
    "child", "children",
    "world",
    "life", "lives",
    "hand", "hands",
    "part", "parts",
    "place", "places",
    "case", "cases",
    "week", "weeks",
    "company", "companies",
    "group", "groups",
    "number", "numbers",
    "problem", "problems",
    "fact", "facts",
    "money",
    "water",
    "question", "questions",
    "room", "rooms",
    "mother", "father",
    "name", "names",
    "word", "words",
    "family", "families",
    "head", "heads",
    "eye", "eyes",
    "home", "homes",
    "country", "countries",
    "city", "cities",
    "school", "schools",
    "state", "states",
    "business",
    "job", "jobs",
    "government", "governments",
    "lot", "lots",
    "kind", "kinds",
    "end", "ends",
    "house", "houses",
    "friend", "friends",
    "story", "stories",
    "power",
    "door", "doors",
    "car", "cars",
    "food",
    "idea", "ideas",
    "book", "books",
    "point", "points",
    "body", "bodies",
    "today", "tomorrow", "yesterday",
    "thing", "things",
    "top", "bottom",
    "side", "sides",
    "example", "examples",
    "month", "months",
    "minute", "minutes",
    "hour", "hours",
    "night", "nights",
    "morning", "evening",
    # Common adverbs
    "well", "really",
    "back", "still",
    "now", "never", "always",
    "often", "usually", "sometimes",
    "ever", "yet",
    "already", "quite",
    "perhaps", "maybe",
    "together", "rather",
    # Misc
    "mr", "mrs", "ms", "miss", "dr", "st",
    "one", "two", "three",
    "first", "second", "third", "last",
    "much", "many",
    "far", "near",
    "next", "previous",
    "half",
    "please",
    "yes", "yeah", "no", "ok", "okay",
    "hello", "hi", "hey",
    "uh", "um", "er",
    "don", "doesn",
    "ain", "aren", "can", "couldn",
    "didn", "doesn", "hadn", "hasn",
    "haven", "isn", "mightn", "mustn",
    "needn", "shan", "shouldn",
    "wasn", "weren", "won", "wouldn",
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def safe_null(val):
    """Return None for empty/whitespace-only strings, else stripped value."""
    v = val.strip()
    return v if v else None


def parse_exchange(raw, lemma):
    """Parse ECDICT exchange field into {derived_form: lemma} mappings.

    Format: "p:went/d:gone/i:going/3:goes/s:goes"

    Exchange prefixes:
      p  → past tense       (went)
      d  → past participle  (gone)
      i  → present participle (going)
      3  → third person singular (goes)
      r  → comparative      (better)
      t  → superlative      (best)
      s  → plural           (children)
      0  → base lemma       (the value IS the lemma, word IS derived)
      1  → variant marker   (skip — "s"=plural form same, "d"=pp same, etc.)

    For 0: the direction is REVERSED — the current word maps to the value.
    For 1: skip entirely (it marks variant type, not a word form).
    """
    if not raw or not raw.strip():
        return {}
    forward = {}   # derived_form → lemma (normal prefixes)
    reverse = {}   # word → lemma (for 0: prefix)
    for part in raw.split("/"):
        part = part.strip()
        if ":" not in part:
            continue
        prefix, value = part.split(":", 1)
        value = value.strip()
        if not value or not WORD_RE.match(value):
            continue
        if prefix == "0":
            # 0:value means value IS the base lemma, current word derives from it
            reverse[value] = lemma
        elif prefix == "1":
            # variant marker, skip
            continue
        else:
            # Normal prefix: value is derived form, lemma is the current word
            forward[value] = lemma
    return forward, reverse


def ensure_dirs():
    for d in (DICT_DIR, LEMMA_DIR, STOPWORDS_DIR):
        os.makedirs(d, exist_ok=True)


# ── Main processing ──────────────────────────────────────────────────────────

def main():
    default_csv = os.path.join(os.path.dirname(__file__), "ecdict.csv")
    csv_path = sys.argv[1] if len(sys.argv) > 1 else default_csv

    if not os.path.isfile(csv_path):
        print(f"Error: file not found: {csv_path}")
        print("Download ECDICT from: https://github.com/skywind3000/ECDICT")
        print("Usage: python scripts/preprocess.py [path/to/ecdict.csv]")
        sys.exit(1)

    ensure_dirs()

    # ├─ Pass 1: read CSV, collect dict entries and lemma mappings
    shards = {}          # dict_key -> {word: {phonetic, translation, tags}}
    lemma_map = {}       # derived_form -> lemma

    with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        if not header or len(header) < 11:
            print("Error: CSV header missing or too short (expected 11 columns)")
            sys.exit(1)

        for row_num, row in enumerate(reader, start=2):
            if len(row) < 11:
                continue  # skip malformed lines

            word = row[0].strip()
            phonetic = safe_null(row[1])
            translation = safe_null(row[3])
            tag_raw = row[7].strip() if len(row) > 7 else ""
            exchange_raw = row[10].strip() if len(row) > 10 else ""

            # ── Validate word ──
            if not word or not WORD_RE.match(word):
                continue

            # ── Normalize tags ──
            tags = []
            if tag_raw:
                tags = sorted(
                    t for t in tag_raw.lower().split()
                    if t in VALID_TAGS
                )

            # ── Dict shard entry ──
            entry = {
                "phonetic": phonetic,
                "translation": translation,
                "tags": tags,
            }

            key = word[:2].lower()
            if len(key) < 2:
                key = f"_{key}"  # "a" -> "_a", "i" -> "_i"
            shards.setdefault(key, {})[word] = entry

            # ── Lemma map from exchange ──
            if exchange_raw:
                forward, reverse = parse_exchange(exchange_raw, word)
                # Forward: derived forms map TO current word
                for form in forward:
                    if form.lower() != word.lower():
                        lemma_map[form] = word
                # Reverse (0:): current word maps TO the specified lemma
                # But only if it doesn't overwrite an existing mapping
                for base_lemma in reverse:
                    wl = word.lower()
                    bl = base_lemma.lower()
                    if wl != bl and wl not in lemma_map:
                        lemma_map[wl] = base_lemma

    # ── Write dict shards ──
    print(f"Writing {len(shards)} dict shards...")
    for key, entries in shards.items():
        fname = f"{key}.json"
        with open(os.path.join(DICT_DIR, fname), "w", encoding="utf-8") as f:
            json.dump(entries, f, ensure_ascii=False, separators=(",", ":"))

    # ── Write lemma map ──
    print(f"Writing lemma map ({len(lemma_map)} entries)...")
    with open(os.path.join(LEMMA_DIR, "lemma-map.json"), "w", encoding="utf-8") as f:
        json.dump(lemma_map, f, ensure_ascii=False, separators=(",", ":"))

    # ── Write stopwords ──
    print("Writing stopwords...")
    basic = sorted(set(w.lower() for w in BASIC_STOPWORDS))
    with open(os.path.join(STOPWORDS_DIR, "basic.json"), "w", encoding="utf-8") as f:
        json.dump(basic, f, ensure_ascii=False, separators=(",", ":"))

    # ponytail: include single letters a-z so they don't clutter results
    single_letters = [chr(i) for i in range(97, 123)]
    strong = sorted(set(w.lower() for w in BASIC_STOPWORDS + STRONG_EXTRA + single_letters))
    with open(os.path.join(STOPWORDS_DIR, "strong.json"), "w", encoding="utf-8") as f:
        json.dump(strong, f, ensure_ascii=False, separators=(",", ":"))

    # ── Write manifest ──
    total_entries = sum(len(e) for e in shards.values())
    manifest = {
        "version": "2026-08-04",
        "prefixLength": 2,
        "totalEntries": total_entries,
        "totalShards": len(shards),
    }
    with open(os.path.join(DICT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"Manifest: {manifest}")

    print("Done.")


if __name__ == "__main__":
    main()
