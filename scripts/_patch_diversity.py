from pathlib import Path

p = Path(r"C:\Users\David\Desktop\Jovian Games\Games\Halfling Night Court\shared\characters.js")
t = p.read_text(encoding="utf-8")

repls = {
    "'Hamfast Hamhock':\n    'burly malehalfling, smoked-ham pink tunic, butcher-apron under counsel coat, thick mustache, work boots'":
    "'Hamfast Hamhock':\n    'burly Black malehalfling, dark brown skin, thick mustache, smoked-ham pink tunic, butcher-apron under counsel coat, work boots'",
}

# Use exact strings from file (with spaces after male/female)
pairs = [
    (
        "burly malehalfling, smoked-ham pink tunic, butcher-apron under counsel coat, thick mustache, work boots",
        "burly Black malehalfling, dark brown skin, thick mustache, smoked-ham pink tunic, butcher-apron under counsel coat, work boots",
    ),
    (
        "precise malehalfling, pince-nez, slate-grey suit with waistcoat, pointing at tiny contract, black dress shoes",
        "precise East Asian malehalfling, light warm skin, black hair, pince-nez, slate-grey suit with waistcoat, pointing at tiny contract, black dress shoes",
    ),
    (
        "cozy malehalfling, creamy bisque-colored coat, soup spoon lapel pin, soft brown shoes, no hat",
        "cozy South Asian malehalfling, medium brown skin, black hair, creamy bisque-colored coat, soup spoon lapel pin, soft brown shoes, no hat",
    ),
    (
        "elegant femalehalfling, silver-streaked dark hair in bun, ink-blue robes, oversized quill, formal shoes",
        "elegant Black femalehalfling, dark brown skin, silver-streaked black hair in bun, ink-blue robes, oversized quill, formal shoes",
    ),
    (
        "decisive femalehalfling, black-and-gold counsel robe, scales pin, confident chin, black formal shoes",
        "decisive East Asian femalehalfling, light warm skin, black hair, black-and-gold counsel robe, scales pin, confident chin, black formal shoes",
    ),
    (
        "sharp femalehalfling, clover pin, emerald jacket, piercing inquisitive stare, polished shoes",
        "sharp Latina femalehalfling, warm olive-brown skin, dark wavy hair, clover pin, emerald jacket, piercing inquisitive stare, polished shoes",
    ),
]

# Fix: file has "malehalfling" with a space: "malehalfling"
pairs = [
    (
        "burly malehalfling, smoked-ham pink tunic, butcher-apron under counsel coat, thick mustache, work boots",
        "burly Black malehalfling, dark brown skin, thick mustache, smoked-ham pink tunic, butcher-apron under counsel coat, work boots",
    ),
]

# Build with explicit spaces
mh = "male" + " " + "halfling"
fh = "female" + " " + "halfling"
pairs = [
    (
        f"burly {mh}, smoked-ham pink tunic, butcher-apron under counsel coat, thick mustache, work boots",
        f"burly Black {mh}, dark brown skin, thick mustache, smoked-ham pink tunic, butcher-apron under counsel coat, work boots",
    ),
    (
        f"precise {mh}, pince-nez, slate-grey suit with waistcoat, pointing at tiny contract, black dress shoes",
        f"precise East Asian {mh}, light warm skin, black hair, pince-nez, slate-grey suit with waistcoat, pointing at tiny contract, black dress shoes",
    ),
    (
        f"cozy {mh}, creamy bisque-colored coat, soup spoon lapel pin, soft brown shoes, no hat",
        f"cozy South Asian {mh}, medium brown skin, black hair, creamy bisque-colored coat, soup spoon lapel pin, soft brown shoes, no hat",
    ),
    (
        f"elegant {fh}, silver-streaked dark hair in bun, ink-blue robes, oversized quill, formal shoes",
        f"elegant Black {fh}, dark brown skin, silver-streaked black hair in bun, ink-blue robes, oversized quill, formal shoes",
    ),
    (
        f"decisive {fh}, black-and-gold counsel robe, scales pin, confident chin, black formal shoes",
        f"decisive East Asian {fh}, light warm skin, black hair, black-and-gold counsel robe, scales pin, confident chin, black formal shoes",
    ),
    (
        f"sharp {fh}, clover pin, emerald jacket, piercing inquisitive stare, polished shoes",
        f"sharp Latina {fh}, warm olive-brown skin, dark wavy hair, clover pin, emerald jacket, piercing inquisitive stare, polished shoes",
    ),
]

for old, new in pairs:
    if old not in t:
        print("MISSING:", old[:60])
    else:
        t = t.replace(old, new)
        print("OK:", new[:60])

p.write_text(t, encoding="utf-8")
print("written")
