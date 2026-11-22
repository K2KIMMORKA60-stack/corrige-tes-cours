"""Télécharge les cours de clôture (1 an, journalier) depuis Yahoo Finance
et écrit data/marche.json. Lancé par GitHub Actions. Aucune clé nécessaire."""
import json, sys, time, datetime, urllib.request, urllib.parse, os
sys.path.insert(0, os.path.dirname(__file__))
from univers import U

def get(sym):
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/" + urllib.parse.quote(sym)
           + "?range=1y&interval=1d&includePrePost=false")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for essai in range(3):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                j = json.load(r)
            res = j["chart"]["result"][0]
            ts = res["timestamp"]; cl = res["indicators"]["quote"][0]["close"]
            off = res["meta"].get("gmtoffset", 0)
            out = {}
            for t, c in zip(ts, cl):
                if c is None: continue
                d = datetime.datetime.utcfromtimestamp(t + off).strftime("%Y-%m-%d")
                out[d] = round(float(c), 6)
            px = res["meta"].get("regularMarketPrice")
            return out, px
        except Exception as e:
            print("  essai", essai + 1, sym, e); time.sleep(2 + essai * 3)
    return None, None

series = {}
for sym, *_ in U:
    s, px = get(sym)
    if s and len(s) > 40:
        series[sym] = s
        print("ok", sym, len(s))
    time.sleep(0.4)

# Calendrier : tous les jours de semaine où au moins un marché a coté
dates = sorted({d for s in series.values() for d in s
                if datetime.date.fromisoformat(d).weekday() < 5})
assets = []
for sym, nom, typ, reg, sect in U:
    s = series.get(sym)
    if not s: continue
    closes, last = [], None
    for d in dates:
        if d in s: last = s[d]
        closes.append(last)
    # remplir le début manquant avec la première valeur connue
    first = next((c for c in closes if c is not None), None)
    closes = [first if c is None else c for c in closes]
    assets.append({"t": sym, "n": nom, "k": typ, "r": reg, "s": sect, "c": closes})

out = {"demo": False, "maj": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"),
       "source": "Yahoo Finance (clôtures journalières)", "dates": dates, "assets": assets}
os.makedirs("data", exist_ok=True)
with open("data/marche.json", "w") as f:
    json.dump(out, f, separators=(",", ":"))
print("écrit", len(assets), "marchés,", len(dates), "jours")
if len(assets) < 20: sys.exit("trop peu de données")

# ---------- Cours courts : bougies de 5 min, 15 min et 1 heure ----------
def get_intra(sym, interval, rng):
    url = ("https://query1.finance.yahoo.com/v8/finance/chart/" + urllib.parse.quote(sym)
           + "?range=" + rng + "&interval=" + interval + "&includePrePost=false")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    for essai in range(2):
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                j = json.load(r)
            res = j["chart"]["result"][0]
            return {t: float(c) for t, c in zip(res.get("timestamp") or [], res["indicators"]["quote"][0]["close"])
                    if c is not None}
        except Exception as e:
            print("  essai", essai + 1, sym, interval, e); time.sleep(2)
    return None

PAS = {"m5": ("5m", "5d", 300, 576), "m15": ("15m", "5d", 900, 480), "h1": ("60m", "1mo", 3600, 480)}
gardes = [a["t"] for a in assets]
for cle, (interval, rng, pas, garder) in PAS.items():
    brut = {}
    for sym in gardes:
        d = get_intra(sym, interval, rng)
        if d and len(d) > 20:
            brut[sym] = {int(t // pas * pas): c for t, c in sorted(d.items())}
        time.sleep(0.25)
    if len(brut) < 20:
        print("cours", cle, ": trop peu de données, fichier non écrit"); continue
    grille = sorted({t for d in brut.values() for t in d})[-garder:]
    sortie = {}
    for sym, d in brut.items():
        avant = [t for t in d if t < grille[0]]
        der = d[max(avant)] if avant else None
        serie = []
        for t in grille:
            if t in d: der = d[t]
            serie.append(der)
        prem = next((v for v in serie if v is not None), None)
        sortie[sym] = [float(f"{(prem if v is None else v):.6g}") for v in serie]
    with open("data/" + cle + ".json", "w") as f:
        json.dump({"maj": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"), "debut": grille[0],
                   "fin": grille[-1], "c": sortie}, f, separators=(",", ":"))
    print("écrit", cle, len(sortie), "marchés,", len(grille), "bougies")
