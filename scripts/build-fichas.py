"""Convierte los datos de las fichas técnicas (fichas/datos/*.py) en scripts/data/fichas.json.
Uso: python3 scripts/build-fichas.py [carpeta_con_datos]   (por omisión ../../fichas/datos)
Descarta lo que solo sirve para maquetar la ficha (imágenes, colores, tamaños) y deja el contenido."""
import ast, glob, importlib.util, json, os, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "..", "fichas", "datos")
OUT = os.path.join(os.path.dirname(__file__), "data", "fichas.json")

# archivo de datos -> ids de producto en el catálogo de WeNow 360
IDS = {
    "activeburn": ["active-burn"], "antiox": ["antiox"], "collagenman": ["collagen-man"], "collagenwoman": ["collagen-woman"],
    "endo": ["endo"], "greenplus": ["green-plus"], "neurochai": ["neuro-chai"], "nk": ["nk-plus"],
    "nutriday": ["nutriday-red", "nutriday-brown"], "purebody": ["purebody"], "resnad": ["resnad"],
    "synergy": ["synergy"], "transfactor": ["transfactor"],
}
SKIP = {"pack", "logo", "local", "accent", "tint", "dark", "dark_acc", "title_px", "title_html", "slot_eyebrow", "slot_title", "slot_text", "ing_titles", "uso_pack"}

def jsonable(v):
    if isinstance(v, tuple): return [jsonable(x) for x in v]
    if isinstance(v, list): return [jsonable(x) for x in v]
    if isinstance(v, dict): return {k: jsonable(x) for k, x in v.items()}
    return v

out = {}
for path in sorted(glob.glob(os.path.join(SRC, "*.py"))):
    key = os.path.basename(path)[:-3]
    if key not in IDS:
        print("sin mapeo, se omite:", key); continue
    spec = importlib.util.spec_from_file_location(key, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    data = {k: jsonable(v) for k, v in mod.P.items() if k not in SKIP}
    for pid in IDS[key]:
        out[pid] = data

# RegeneREX (la ficha piloto) no tiene archivo en datos/: sus ingredientes están en opcion-A-calida/gen.py
# y el resto del contenido es el de la ficha final "Ficha RegeneREX.pdf".
def regenerex():
    gen = os.path.join(SRC, "..", "opcion-A-calida", "gen.py")
    tree = ast.parse(open(gen, encoding="utf-8").read())
    node = next(n for n in tree.body if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "ING")
    ing = []
    for call in node.value.elts:
        d = {kw.arg: ast.literal_eval(kw.value) for kw in call.keywords}
        d.pop("n", None)
        ing.append(d)
    return {
        "name": "RegeneREX", "family": "NUTRIDAY PLUS", "category": "CAFÉ EPIGENÉTICO",
        "tagline": "Café funcional con colágeno hidrolizado, hongos adaptógenos y antioxidantes que activan tu regeneración desde la primera taza.",
        "about": "Es el café funcional que convierte tu primera taza del día en un ritual de regeneración. Une la energía del café con colágeno hidrolizado, tres hongos funcionales —cordyceps, chaga y shiitake—, alga espirulina, curcumina y resveratrol: ingredientes que activan la vía NRF2, el sistema con el que tus células encienden sus propias defensas.",
        "facts": [["8", "INGREDIENTES ACTIVOS"], ["10 g", "PORCIÓN DIARIA"], ["30", "PORCIONES POR BOLSA"]],
        "strip": "SUPLEMENTO ALIMENTICIO · POLVO · 300 g",
        "ben_title": "Diez beneficios en una sola taza",
        "benefits": [
            ["bolt", "Energía y rendimiento", ["Energía física y recuperación muscular", "Adaptógeno natural"], ["Café", "Cordyceps", "Chaga"], None],
            ["leaf", "Regeneración y piel", ["Reparación de tejidos", "Elasticidad y fortaleza de la piel"], ["Colágeno", "Espirulina", "Resveratrol"], None],
            ["bone", "Huesos y articulaciones", ["Salud osteoarticular", "Estructura de cartílago y hueso"], ["Colágeno", "Curcumina"], None],
            ["heart", "Corazón y circulación", ["Regula la presión alta", "Previene trombosis"], ["Resveratrol", "Curcumina", "Shiitake"], None],
            ["drop", "Equilibrio metabólico", ["Regula niveles de glucosa", "Energía estable durante el día"], ["Cordyceps", "Curcumina", "Resveratrol"], None],
            ["shield", "Ánimo y defensas", ["Antidepresivo", "Coadyuvante en rinitis alérgica"], ["Shiitake", "Chaga", "Curcumina"], None],
        ],
        "science": {"eyebrow": "LA CIENCIA DETRÁS", "title": "¿Qué es NRF2?",
                    "intro": "Una proteína que funciona como interruptor maestro de cada célula: al activarse, enciende cientos de genes de defensa antioxidante y reparación. Por eso hablamos de un café epigenético.",
                    "steps": [["Activadores", "Curcumina, resveratrol y hongos funcionales estimulan NRF2."], ["El interruptor", "NRF2 viaja al núcleo y enciende los genes de protección."], ["Tu defensa", "La célula produce sus propios antioxidantes, como el glutatión."]]},
        "ingredients": ing,
        "synergies": [
            ["Regeneración", ["colageno", "espirulina", "cordyceps"], "Colágeno · Espirulina · Cordyceps", "La estructura que tus tejidos necesitan, los nutrientes para construirla y la energía para hacerlo."],
            ["Escudo NRF2", ["curcumina", "resveratrol", "chaga"], "Curcumina · Resveratrol · Chaga", "Tres activadores naturales que encienden las defensas antioxidantes propias de cada célula."],
            ["Energía en equilibrio", ["cafe", "cordyceps", "shiitake"], "Café · Cordyceps · Shiitake", "El impulso del café, acompañado de hongos que ayudan a tu cuerpo a sostener su ritmo."],
        ],
        "ritual": [["Mide", "1 porción de 10 g."], ["Disuelve", "En 250 ml de agua."], ["Disfruta", "En ayunas o antes del desayuno."]],
        "ritual_note": "Adultos: 1 porción al día. La bolsa de 300 g rinde 30 días.",
        "quick": [["Presentación", "Polvo"], ["Contenido", "300 g"], ["Porción", "10 g"], ["Porciones", "30"], ["Ingredientes activos", "8"]],
        "combo": [["AntiOX", "Complejo antioxidante de frutos y botánicos."], ["Green Plus", "Jugo verde con espirulina, chlorella y noni."], ["NK+", "Adaptógeno para el descanso y el sistema nervioso."], ["Neuro CHAI", "Chai funcional para claridad mental."]],
        "reco": ["Contiene cafeína natural del café.", "No exceder la porción recomendada.", "En embarazo o lactancia, consulta a tu médico.", "Consérvese en un lugar fresco y seco.", "Manténgase fuera del alcance de los niños."],
    }

out["regenerex"] = regenerex()
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(f"{len(out)} productos, {sum(len(v.get('ingredients', [])) for v in out.values())} ingredientes -> {OUT}")
