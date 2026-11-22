import sys, json, random, math, datetime
sys.path.insert(0, "/mnt/project-files/corrige-tes-cours/scripts")
from univers import U
random.seed(7)
N = 252
d = datetime.date(2026, 11, 20); dates = []
while len(dates) < N:
    if d.weekday() < 5: dates.append(d.isoformat())
    d -= datetime.timedelta(days=1)
dates.reverse()
F = ["o", "m", "g", "d", "c", "r", "cu", "a"]
fac = {f: [random.gauss(0, 1) for _ in range(N)] for f in F}
# derniers jours : pétrole en hausse pour l'exemple
for i in range(N - 5, N): fac["o"][i] = abs(fac["o"][i]) + 0.6
L = {  # secteur -> chargements
 "Pétrole": {"o": .75, "m": .3}, "Services pétroliers": {"o": .65, "m": .4}, "Raffinage": {"o": .35, "m": .45},
 "Énergie": {"o": .3}, "Métaux précieux": {"g": .9, "d": -.2}, "Métaux": {"cu": .7, "m": .3, "o": .15},
 "Agriculture": {"o": .15}, "Indice": {"m": .9}, "Taux": {"r": .8, "o": .15}, "Dollar": {"d": .9},
 "Tech": {"m": .8, "r": -.2}, "Banque": {"m": .6, "r": .35}, "Industrie": {"m": .8}, "Chimie": {"m": .6, "o": .1},
 "Services publics": {"m": .3, "r": -.4}, "Santé": {"m": .4}, "Conso": {"m": .75, "o": -.15}, "Conso de base": {"m": .35, "o": -.05},
 "Aérien": {"o": -.5, "m": .6}, "Croisières": {"o": -.35, "m": .6}, "Transport": {"o": -.2, "m": .6}, "Auto": {"m": .65, "o": -.12},
 "Mines d'or": {"g": .8, "m": .25}, "Mines": {"cu": .6, "m": .4, "o": .2}, "Luxe": {"m": .65}, "Devises": {"d": -.8},
 "Devises pétrole": {"d": .5, "o": -.45}, "Crypto": {"c": .85, "m": .3},
}
special = {"CL=F": {"o": 1}, "BZ=F": {"o": .97}, "GC=F": {"g": 1}, "HG=F": {"cu": 1}, "COPX": {"cu": .75, "m": .3}, "ZC=F": {"o": .15, "a": .7}, "ZS=F": {"o": .15, "a": .6}, "ZW=F": {"o": .15, "a": .7}, "USDJPY=X": {"d": .6, "r": .3},
           "AUDUSD=X": {"d": -.5, "m": .3, "cu": .2}, "USDCHF=X": {"d": .8}, "XLE": {"o": .8, "m": .3}, "2222.SR": {"o": .3, "m": .2}}
vol = {"matiere": .018, "indice": .011, "secteur": .013, "action": .019, "devise": .006, "crypto": .035}
base = {"CL=F": 66, "BZ=F": 70, "NG=F": 3.4, "GC=F": 3300, "SI=F": 38, "HG=F": 4.8, "ZW=F": 5.4, "^GSPC": 6500, "^IXIC": 21500,
        "^DJI": 45000, "^FCHI": 7900, "^GDAXI": 23500, "^FTSE": 9200, "^STOXX50E": 5400, "^N225": 42000, "^HSI": 25000,
        "000001.SS": 3700, "^BSESN": 82000, "^BVSP": 140000, "^GSPTSE": 28000, "^TNX": 4.2, "DX-Y.NYB": 99,
        "EURUSD=X": 1.15, "USDJPY=X": 150, "GBPUSD=X": 1.33, "USDCAD=X": 1.39, "USDNOK=X": 10.2, "AUDUSD=X": .65,
        "USDCHF=X": .81, "SIL": 45, "COPX": 48, "PL=F": 1550, "PA=F": 1300, "ZC=F": 4.3, "ZS=F": 10.6, "BTC-USD": 95000, "ETH-USD": 3500}
assets = []
for t, n, k, r, s in U:
    ld = special.get(t, L.get(s, {"m": .5}))
    idio = math.sqrt(max(0.08, 1 - sum(v * v for v in ld.values())))
    v = vol[k]; p = base.get(t, random.uniform(20, 300)); c = []
    for i in range(N):
        z = sum(w * fac[f][i] for f, w in ld.items()) + idio * random.gauss(0, 1)
        p *= math.exp(v * z + 0.0002); c.append(round(p, 4))
    k2 = base.get(t, c[0]) / c[-1]; c = [round(v * k2, 4) for v in c]
    assets.append({"t": t, "n": n, "k": k, "r": r, "s": s, "c": c})
json.dump({"demo": True, "maj": "2026-11-21T20:00Z", "source": "Données d'exemple (simulées)", "dates": dates, "assets": assets},
          open("/mnt/project-files/corrige-tes-cours/data/marche.json", "w"), separators=(",", ":"))
print("ok", len(assets))
