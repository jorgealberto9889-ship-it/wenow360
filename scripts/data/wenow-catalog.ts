import type { Ficha, ProductHighlights } from "../../db/schema";
import fichasJson from "./fichas.json";

// Catálogo WeNow 360. Fuente: "Catálogo WENOW.pdf" (PROYECTO WENOW/).
//  - `catalogBenefits`: viñetas de BENEFICIOS textuales del catálogo (fuente de verdad del cliente).
//  - `ingredients`: ingredientes etiquetados en las imágenes de cada página del catálogo.
//  - `usage`: "Modo de empleo" del catálogo.
// Precios: lista MX 2026 (MXN). publicPrice = precio público; distributorPrice = precio Miembro Club WeNow.
// Colombia y Perú (USD) quedan para una fase posterior.
// Cuando lleguen las fichas técnicas, ajustar aquí miligramos, ingredientes y copy; nada más.

export type CatalogProduct = {
  id: string;
  line: "nutriday_plus" | "club_wenow";
  type: "suplemento";
  name: string;
  eyebrow: string;
  benefit: string;
  ingredients: string;
  ingredientSupport: string;
  usage: string;
  note: string;
  publicPrice: number;
  distributorPrice: number;
  imageUrl: string;
  // Afinidad por objetivo (0–5). Alimenta el motor (lib/engine/engine.ts).
  goals: Record<string, number>;
  highlights: ProductHighlights;
};

const PRICE = { publicPrice: 990, distributorPrice: 760 };
const ENDO_PRICE = { publicPrice: 1350, distributorPrice: 960 };
const img = (id: string) => `/assets/products/${id}.webp`;

const BASE_PRODUCTS: CatalogProduct[] = [
  {
    id: "green-plus",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Green Plus",
    eyebrow: "Jugo verde · Depuración y alcalinidad",
    benefit: "Jugo verde con algas, noni y clorofila para acompañar la depuración, la digestión y la energía celular.",
    ingredients: "Noni, perejil deshidratado, apio en polvo, chía molida, alga espirulina, alga chlorella y clorofila cúprica.",
    ingredientSupport:
      "Combina superalimentos verdes —espirulina, chlorella y clorofila— con noni, apio, perejil y chía para aportar un perfil nutricional completo en una sola bebida.",
    usage: "Disolver 10 g en 250 ml de agua. Tomar una vez al día en ayunas o entre comidas. En programas detox intensivos: 2 veces al día por 7–10 días.",
    note: "Suplemento alimenticio. No es un medicamento. Si tomas anticoagulantes o tienes padecimiento renal o hepático, consúltalo con tu profesional de salud.",
    ...PRICE,
    imageUrl: img("green-plus"),
    goals: { detox: 5, digestion: 3.5, metabolic: 1.5, immune: 1, energy: 1, longevity: 1 },
    highlights: {
      summary:
        "Green Plus es tu jugo verde diario: espirulina, chlorella, clorofila y noni en una bebida que acompaña la depuración, la digestión y la energía celular.",
      catalogBenefits: [
        "Desintoxicación hepática y renal.",
        "Estimulación digestiva y regulación intestinal.",
        "Poder antioxidante y antienvejecimiento.",
        "Energía celular y desmineralización.",
        "Alcalinización del medio interno.",
        "Apoyo inmunológico y reducción del estrés oxidativo.",
        "Oxigenador celular.",
        "Reduce colesterol y triglicéridos.",
      ],
      benefits: [
        { title: "Depuración y ligereza", detail: "Acompaña los procesos naturales de depuración del hígado y los riñones." },
        { title: "Digestión y regularidad", detail: "Estimula la digestión y contribuye a la regulación intestinal." },
        { title: "Antioxidante y energía celular", detail: "Aporta poder antioxidante y apoya la energía de tus células." },
        { title: "Equilibrio del medio interno", detail: "Pensado para contribuir a la alcalinización del medio interno." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Un vaso verde en ayunas se vuelve un ritual de arranque para tu día." },
        { label: "Con constancia", text: "El uso diario suma antioxidantes y fibra a tu alimentación." },
        { label: "Programa detox", text: "Para un reinicio intensivo, puedes tomarlo 2 veces al día durante 7 a 10 días." },
      ],
    },
  },
  {
    id: "purebody",
    line: "nutriday_plus",
    type: "suplemento",
    name: "PureBody",
    eyebrow: "Cápsulas · Control de peso y digestión",
    benefit: "Cápsulas con L-carnitina, alcachofa y botánicos para acompañar tu programa de reducción de peso y tu digestión.",
    ingredients: "Alcachofa, vitamina C, semilla de papaya, mango africano, calcio, hoja de tejocote y L-carnitina.",
    ingredientSupport:
      "La L-carnitina participa en el transporte de ácidos grasos a la mitocondria; la alcachofa, la semilla de papaya y el tejocote son botánicos tradicionales para la digestión y el control de apetito.",
    usage: "1 cápsula al día, preferentemente en ayunas o antes de dormir. Ingerir con abundante agua.",
    note: "Suplemento alimenticio. No es un medicamento. No se recomienda con trastornos de la conducta alimentaria ni padecimientos gastrointestinales sin valoración.",
    ...PRICE,
    imageUrl: img("purebody"),
    goals: { weight: 5, digestion: 3.5, detox: 2.5, metabolic: 1.5 },
    highlights: {
      summary:
        "PureBody acompaña tu programa de control de peso con L-carnitina, alcachofa y botánicos que apoyan el metabolismo de las grasas y la digestión.",
      catalogBenefits: [
        "Regula el apetito y apoya el control del metabolismo lipídico.",
        "Coadyuvante en programas de reducción de peso.",
        "Favorece el transporte de ácidos grasos a la mitocondria, mejorando el metabolismo energético.",
        "Brinda soporte al sistema óseo y neuromuscular.",
        "Participa en procesos de lipólisis (quema de grasa).",
        "Posee propiedades digestivas y antiparasitarias.",
        "Contribuye a una mejor salud intestinal.",
        "Tradicionalmente utilizada como laxante suave y eliminador de grasa residual.",
        "Mejora la digestión y depuración natural del organismo.",
      ],
      benefits: [
        { title: "Control de apetito", detail: "Regula el apetito y apoya el metabolismo de los lípidos." },
        { title: "Metabolismo energético", detail: "Favorece el transporte de ácidos grasos a la mitocondria y participa en la lipólisis." },
        { title: "Digestión y depuración", detail: "Mejora la digestión y la depuración natural, y contribuye a una mejor salud intestinal." },
        { title: "Soporte de tu programa", detail: "Coadyuvante en programas de reducción de peso, junto con alimentación y movimiento." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Una sola cápsula al día, fácil de integrar a tu rutina." },
        { label: "Con constancia", text: "Funciona mejor como parte de un plan: alimentación, movimiento y descanso." },
        { label: "Como hábito", text: "Tómala en ayunas o antes de dormir, con abundante agua." },
      ],
    },
  },
  {
    id: "active-burn",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Active Burn+",
    eyebrow: "Café termogénico · Energía y enfoque",
    benefit: "Café funcional con L-carnitina y hongos adaptógenos para energía, enfoque y metabolismo de grasas.",
    ingredients: "Café, L-carnitina, hongo reishi, cocoa, hongo chaga, ganoderma lucidum, shiitake, maitake y melena de león.",
    ingredientSupport:
      "El café aporta estimulación natural; la L-carnitina acompaña el metabolismo de las grasas; reishi, chaga, shiitake, maitake y melena de león son hongos adaptógenos tradicionales.",
    usage: "Disolver 1 cucharada dosificadora (10 g) en 250 ml de agua caliente. Tomar 1 vez al día, preferentemente por la mañana o media mañana. Puede combinarse con leche vegetal o agua.",
    note: "Contiene cafeína. Suplemento alimenticio, no es un medicamento. Si eres sensible a la cafeína, tienes hipertensión o enfermedad cardiaca, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("active-burn"),
    goals: { energy: 4, weight: 3.5, focus: 2.5, metabolic: 1 },
    highlights: {
      summary:
        "Active Burn+ convierte tu café de la mañana en una fórmula funcional: estimulante natural con L-carnitina y hongos adaptógenos para energía, enfoque y metabolismo.",
      catalogBenefits: [
        "Estimulante natural, lipólisis, aumento de energía y enfoque.",
        "Adaptógenos e inmunomoduladores (apoyo al sistema inmune y estrés oxidativo).",
        "Neurotrófico natural (estimulación cognitiva, enfoque, memoria).",
        "Control de apetito, metabolismo de grasa.",
        "Antioxidantes, mejora del estado de ánimo.",
      ],
      benefits: [
        { title: "Energía y enfoque", detail: "Estimulante natural que aumenta la energía y favorece la concentración." },
        { title: "Metabolismo de grasa", detail: "Apoya la lipólisis y el control del apetito." },
        { title: "Hongos adaptógenos", detail: "Reishi, chaga, shiitake, maitake y melena de león apoyan al sistema inmune y al estrés oxidativo." },
        { title: "Estímulo cognitivo", detail: "Favorece el enfoque, la memoria y el estado de ánimo." },
      ],
      timeline: [
        { label: "Desde la primera taza", text: "Un arranque de mañana con energía y enfoque." },
        { label: "Con constancia", text: "Tu café diario suma antioxidantes y adaptógenos a tu rutina." },
        { label: "Como hábito", text: "Una vez al día, por la mañana o media mañana, con agua caliente o leche vegetal." },
      ],
    },
  },
  {
    id: "nutriday-red",
    line: "nutriday_plus",
    type: "suplemento",
    name: "NutriDay Plus Red",
    eyebrow: "Proteína sabor fresa · 500 g",
    benefit: "Proteína de suero de leche con aminoácidos, vitaminas y 4 cepas probióticas para recuperación y nutrición completa.",
    ingredients:
      "Proteína de suero de leche, goma guar, avena, estevia, L-arginina, L-cisteína, vitamina K, complejo B y 4 cepas probióticas (Lactobacillus acidophilus, Bifidobacterium lactis, Lactobacillus rhamnosus y Lactobacillus plantarum; 14 billones en cada cepa).",
    ingredientSupport:
      "Aporta proteína y aminoácidos esenciales para la síntesis muscular y la recuperación, con probióticos para el bienestar intestinal.",
    usage: "Mezclar 1 porción (20 g) con 250–300 ml de agua o bebida vegetal. Tomar 1 a 2 veces al día, según necesidades nutricionales. Ideal después del ejercicio o como desayuno/cena funcional.",
    note: "Contiene derivados de leche y avena. Suplemento alimenticio, no es un medicamento. Con padecimiento renal o anticoagulantes, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("nutriday-red"),
    goals: { muscle: 4, immune: 1.5, digestion: 1.5, weight: 1.5, energy: 1 },
    highlights: {
      summary:
        "NutriDay Plus Red es una proteína de fresa con aminoácidos esenciales y 4 cepas probióticas, pensada para recuperarte después del ejercicio o completar una comida.",
      catalogBenefits: [
        "Aporte proteico y de aminoácidos esenciales para síntesis muscular y recuperación.",
        "Apoyo en déficits nutricionales o alimentación incompleta.",
        "Complemento en dietas de bajo contenido calórico o hipocalóricas.",
        "Fortalecimiento del sistema inmunológico.",
        "Soporte para adultos mayores y deportistas.",
      ],
      benefits: [
        { title: "Músculo y recuperación", detail: "Proteína y aminoácidos esenciales para la síntesis muscular y la recuperación." },
        { title: "Nutrición completa", detail: "Apoya cuando la alimentación está incompleta o en dietas hipocalóricas." },
        { title: "Probióticos", detail: "4 cepas probióticas con 14 billones en cada una." },
        { title: "Para deportistas y adultos mayores", detail: "Soporte nutricional para distintas etapas y niveles de actividad." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Una porción de 20 g que se prepara en segundos con agua o bebida vegetal." },
        { label: "Con constancia", text: "Complementa tu proteína diaria, sobre todo después de entrenar." },
        { label: "Como hábito", text: "1 a 2 veces al día, como desayuno o cena funcional." },
      ],
    },
  },
  {
    id: "nutriday-brown",
    line: "nutriday_plus",
    type: "suplemento",
    name: "NutriDay Plus Brown",
    eyebrow: "Proteína sabor avellana · 500 g",
    benefit: "Proteína de suero de leche sabor avellana con aminoácidos, vitaminas y 4 cepas probióticas.",
    ingredients:
      "Proteína de suero de leche, goma guar, avena, estevia, L-arginina, L-cisteína, vitamina K, complejo B y 4 cepas probióticas (Lactobacillus acidophilus, Bifidobacterium lactis, Lactobacillus rhamnosus y Lactobacillus plantarum; 14 billones en cada cepa).",
    ingredientSupport:
      "Misma fórmula que NutriDay Plus Red, en sabor avellana: proteína, aminoácidos esenciales y probióticos para recuperación y nutrición completa.",
    usage: "Mezclar 1 porción (20 g) con 250–300 ml de agua o bebida vegetal. Tomar 1 a 2 veces al día, según necesidades nutricionales. Ideal después del ejercicio o como desayuno/cena funcional.",
    note: "Contiene derivados de leche, avena y sabor avellana. Suplemento alimenticio, no es un medicamento. Con padecimiento renal o anticoagulantes, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("nutriday-brown"),
    goals: { muscle: 4, immune: 1.5, digestion: 1.5, weight: 1.5, energy: 1 },
    highlights: {
      summary:
        "NutriDay Plus Brown es la misma proteína funcional en sabor avellana: aminoácidos esenciales y 4 cepas probióticas para recuperarte y nutrirte mejor.",
      catalogBenefits: [
        "Aporte proteico y de aminoácidos esenciales para síntesis muscular y recuperación.",
        "Apoyo en déficits nutricionales o alimentación incompleta.",
        "Complemento en dietas de bajo contenido calórico o hipocalóricas.",
        "Fortalecimiento del sistema inmunológico.",
        "Soporte para adultos mayores y deportistas.",
      ],
      benefits: [
        { title: "Músculo y recuperación", detail: "Proteína y aminoácidos esenciales para la síntesis muscular y la recuperación." },
        { title: "Nutrición completa", detail: "Apoya cuando la alimentación está incompleta o en dietas hipocalóricas." },
        { title: "Probióticos", detail: "4 cepas probióticas con 14 billones en cada una." },
        { title: "Para deportistas y adultos mayores", detail: "Soporte nutricional para distintas etapas y niveles de actividad." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Una porción de 20 g que se prepara en segundos con agua o bebida vegetal." },
        { label: "Con constancia", text: "Complementa tu proteína diaria, sobre todo después de entrenar." },
        { label: "Como hábito", text: "1 a 2 veces al día, como desayuno o cena funcional." },
      ],
    },
  },
  {
    id: "antiox",
    line: "nutriday_plus",
    type: "suplemento",
    name: "AntiOX",
    eyebrow: "Jugo antioxidante · Longevidad celular",
    benefit: "Mezcla de frutos y botánicos ricos en antioxidantes para el rescate mitocondrial y la salud antienvejecimiento.",
    ingredients: "Betacaroteno, semilla de uva, licopeno, amalaki, borojó, mangostán, noni, goji berry y acai berry.",
    ingredientSupport:
      "Reúne antioxidantes de frutos como acai, goji, mangostán y amalaki, junto con licopeno, betacaroteno y semilla de uva, para apoyar a tus células frente al estrés oxidativo.",
    usage: "Adultos: 1 porción al día (10 g). Tomar en ayunas o antes del desayuno con 250 ml de agua.",
    note: "Suplemento alimenticio. No es un medicamento. Si tomas anticoagulantes o tienes padecimiento hepático o renal, consúltalo con tu profesional de salud.",
    ...PRICE,
    imageUrl: img("antiox"),
    goals: { longevity: 4, immune: 2, skin: 1.5, energy: 1.5, metabolic: 1, detox: 1 },
    highlights: {
      summary:
        "AntiOX concentra frutos y botánicos antioxidantes en una bebida diaria para cuidar tus células y acompañar tu longevidad.",
      catalogBenefits: [
        "Antioxidante profundo y anti-inflamatorio celular.",
        "Soporte cardiovascular.",
        "Mejora la circulación.",
        "Inmunomodulador natural.",
        "Energía vital y recuperación metabólica.",
        "Longevidad y salud antienvejecimiento.",
        "Rescate mitocondrial, reducción de radicales libres.",
      ],
      benefits: [
        { title: "Antioxidante profundo", detail: "Ayuda a reducir el estrés oxidativo y los radicales libres." },
        { title: "Rescate mitocondrial", detail: "Apoya la energía vital y la recuperación metabólica de tus células." },
        { title: "Corazón y circulación", detail: "Soporte cardiovascular y apoyo a la circulación." },
        { title: "Longevidad", detail: "Pensado para la salud antienvejecimiento y el apoyo inmunológico." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Una porción de 10 g en ayunas, con 250 ml de agua." },
        { label: "Con constancia", text: "Los antioxidantes aportan más como parte de un hábito diario." },
        { label: "Como hábito", text: "Se integra fácil a tu rutina de mañana." },
      ],
    },
  },
  {
    id: "regenerex",
    line: "nutriday_plus",
    type: "suplemento",
    name: "RegeneREX",
    eyebrow: "Café funcional con NRF2 · Regeneración",
    benefit: "Café funcional con colágeno, hongos adaptógenos, curcumina y resveratrol para energía y regeneración.",
    ingredients: "Resveratrol, curcumina, café, cordyceps, alga espirulina, hongo chaga, shiitake y colágeno hidrolizado.",
    ingredientSupport:
      "Combina café con colágeno hidrolizado, cordyceps, shiitake y chaga, más curcumina y resveratrol, antioxidantes asociados a la activación de la vía NRF2.",
    usage: "Adultos: 1 porción al día (10 g). Tomar en ayunas o antes del desayuno con 250 ml de agua.",
    note: "Contiene cafeína y colágeno de origen animal. Suplemento alimenticio, no es un medicamento. Si tomas anticoagulantes o tienes cirugía programada, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("regenerex"),
    goals: { energy: 3.5, muscle: 3.5, mobility: 3, metabolic: 3, skin: 2, longevity: 2.5, immune: 1.5, focus: 1 },
    highlights: {
      summary:
        "RegeneREX convierte tu primera taza del día en un ritual de regeneración: café con colágeno, hongos adaptógenos, curcumina y resveratrol.",
      catalogBenefits: [
        "Energía física, recuperación muscular.",
        "Reparación de tejidos.",
        "Salud osteoarticular.",
        "Elasticidad y fortaleza de la piel.",
        "Regula niveles de glucosa.",
        "Coadyuvante en rinitis alérgica.",
        "Adaptógeno.",
        "Regula la presión alta.",
        "Previene trombosis.",
        "Antidepresivo.",
      ],
      benefits: [
        { title: "Energía y recuperación", detail: "Energía física y recuperación muscular desde la primera taza." },
        { title: "Reparación de tejidos", detail: "Colágeno hidrolizado para tejidos, huesos y articulaciones." },
        { title: "Piel firme", detail: "Contribuye a la elasticidad y fortaleza de la piel." },
        { title: "Adaptógeno y antioxidante", detail: "Curcumina, resveratrol y hongos que acompañan al cuerpo frente al desgaste." },
      ],
      timeline: [
        { label: "Desde la primera taza", text: "Un café con propósito para empezar el día." },
        { label: "Con constancia", text: "El uso diario suma colágeno, adaptógenos y antioxidantes." },
        { label: "Como hábito", text: "Un ritual de mañana: 10 g en ayunas o antes del desayuno." },
      ],
    },
  },
  {
    id: "resnad",
    line: "nutriday_plus",
    type: "suplemento",
    name: "ResNAD",
    eyebrow: "Cápsulas · Longevidad y energía mitocondrial",
    benefit: "Cápsulas con NAD, resveratrol y coenzima Q10 para la energía mitocondrial y la longevidad celular.",
    ingredients: "Coenzima Q10, NAD, resveratrol, piperina, curcumina y verbascósido.",
    ingredientSupport:
      "NAD y coenzima Q10 participan en la energía de la mitocondria; resveratrol y curcumina son antioxidantes, y la piperina ayuda a su absorción.",
    usage: "1 a 2 cápsulas al día, por la mañana. Ingerir con alimentos ricos en grasas saludables para mejorar absorción. Uso recomendado por ciclos de 3 a 6 meses.",
    note: "Suplemento alimenticio. No es un medicamento. Si tomas anticoagulantes, tienes cirugía programada o padecimiento hepático, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("resnad"),
    goals: { longevity: 5, energy: 3, immune: 2, metabolic: 1.5, focus: 1 },
    highlights: {
      summary:
        "ResNAD apoya la energía desde tus mitocondrias: NAD, coenzima Q10, resveratrol y curcumina en cápsulas para ciclos de longevidad celular.",
      catalogBenefits: [
        "Antioxidante universal, regenerador de glutatión.",
        "Cofactor esencial en energía mitocondrial y reparación celular.",
        "Activación de sirtuinas, longevidad, acción antiinflamatoria.",
        "Potente antiinflamatorio, neuroprotector.",
        "Producción de ATP.",
        "Apoyo inmunológico y celular.",
        "Salud cardiovascular.",
        "Modulador del estrés oxidativo.",
        "Cofactor esencial para las reacciones metabólicas que generan energía.",
      ],
      benefits: [
        { title: "Energía mitocondrial", detail: "Cofactor para la producción de ATP y para las reacciones que generan energía." },
        { title: "Longevidad celular", detail: "Activación de sirtuinas y apoyo a la reparación celular." },
        { title: "Antioxidante", detail: "Regenera glutatión y modula el estrés oxidativo." },
        { title: "Corazón e inmunidad", detail: "Apoyo cardiovascular, inmunológico y celular." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "1 a 2 cápsulas por la mañana, con alimentos que incluyan grasas saludables." },
        { label: "Con constancia", text: "Se recomienda por ciclos de 3 a 6 meses." },
        { label: "Como hábito", text: "Un ciclo constante es la base para sentir sus efectos." },
      ],
    },
  },
  {
    id: "nk-plus",
    line: "nutriday_plus",
    type: "suplemento",
    name: "NK+",
    eyebrow: "Cápsulas · Sueño y manejo del estrés",
    benefit: "Cápsulas con valeriana, L-triptófano y hongos adaptógenos para el descanso, la calma y el equilibrio del estrés.",
    ingredients: "Vitamina D, shiitake, maitake, L-triptófano, té verde, valeriana y guanábana.",
    ingredientSupport:
      "El L-triptófano es precursor de serotonina y melatonina; la valeriana es un relajante tradicional; shiitake y maitake son hongos adaptógenos, y la vitamina D acompaña al sistema inmune.",
    usage: "1 a 2 cápsulas al día, por la tarde o noche. Se recomienda iniciar con 1 cápsula e incrementar según tolerancia. Uso cíclico: 8 semanas mínimo.",
    note: "Contiene té verde (cafeína en pequeña cantidad) y valeriana. Suplemento alimenticio, no es un medicamento. Si tienes cirugía programada o tomas medicamentos de uso regular, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("nk-plus"),
    goals: { sleep: 5, stress: 4.5, metabolic: 1, immune: 1, focus: 0.5 },
    highlights: {
      summary:
        "NK+ es tu aliado de la tarde-noche: valeriana, L-triptófano y adaptógenos para bajar el ritmo, manejar el estrés y descansar mejor.",
      catalogBenefits: [
        "Adaptógeno potente, regulador de cortisol.",
        "Neurotransmisor inhibidor, reduce ansiedad.",
        "Precursor de serotonina y melatonina.",
        "Mejora el sueño.",
        "Energizante natural.",
        "Estabilizador de glucosa.",
        "Soporte neuroendocrino.",
        "Coadyuvante en el sistema nervioso.",
        "Relajante natural (anti estrés).",
      ],
      benefits: [
        { title: "Mejor descanso", detail: "Precursor de serotonina y melatonina que acompaña un sueño más reparador." },
        { title: "Manejo del estrés", detail: "Adaptógeno que apoya la regulación del cortisol." },
        { title: "Calma natural", detail: "Relajante natural para el final del día." },
        { title: "Soporte neuroendocrino", detail: "Acompaña al sistema nervioso y al equilibrio general." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Empieza con 1 cápsula por la tarde o noche y ajusta según tu tolerancia." },
        { label: "Con constancia", text: "Su uso es cíclico: mínimo 8 semanas." },
        { label: "Como hábito", text: "Una rutina fija de noche ayuda a que tu cuerpo reconozca la hora de descansar." },
      ],
    },
  },
  {
    id: "transfactor",
    line: "nutriday_plus",
    type: "suplemento",
    name: "TransFactor",
    eyebrow: "Cápsulas · Inmunidad y regeneración celular",
    benefit: "Cápsulas con calostro, lactoferrina, glutatión y aminoácidos para apoyar la respuesta inmune.",
    ingredients: "Glutatión, calostro de caprino, calostro de bovino, L-cisteína, yema de huevo, L-lisina y lactoferrina.",
    ingredientSupport:
      "El calostro, la lactoferrina y la yema de huevo aportan factores de transferencia que estimulan la respuesta inmune; el glutatión y los aminoácidos acompañan la regeneración celular.",
    usage: "Adultos: 2 cápsulas al día. Puede tomarse en ayunas o junto con alimentos.",
    note: "Contiene derivados de leche y huevo. Suplemento alimenticio, no es un medicamento. Con enfermedad autoinmune o inmunosupresores, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("transfactor"),
    goals: { immune: 5, longevity: 1.5, energy: 1.5, focus: 1 },
    highlights: {
      summary:
        "TransFactor refuerza tus defensas con calostro, lactoferrina y glutatión, en dos cápsulas al día.",
      catalogBenefits: [
        "Inmunomodulador: estimula la respuesta inmune innata y adaptativa (calostro, lactoferrina, yema de huevo).",
        "Antioxidante celular.",
        "Neuroprotector y cognitivo.",
        "Regeneración celular y tejidos.",
        "Aminoácidos esenciales.",
        "Energía y bienestar general.",
      ],
      benefits: [
        { title: "Defensas", detail: "Estimula la respuesta inmune innata y adaptativa." },
        { title: "Antioxidante celular", detail: "Glutatión y aminoácidos que acompañan a tus células." },
        { title: "Regeneración", detail: "Apoya la regeneración celular y de tejidos." },
        { title: "Bienestar general", detail: "Contribuye a la energía y al bienestar del día a día." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "2 cápsulas al día, en ayunas o con alimentos." },
        { label: "Con constancia", text: "Un apoyo constante para tu sistema inmune, sobre todo en temporadas de desgaste." },
        { label: "Como hábito", text: "Se integra fácil a tu rutina matutina." },
      ],
    },
  },
  {
    id: "neuro-chai",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Neuro CHAI",
    eyebrow: "Chai funcional · Cerebro y ánimo",
    benefit: "Chai con hongos adaptógenos, ashwagandha, L-teanina y magnesio para el enfoque, el ánimo y el descanso.",
    ingredients:
      "Ganoderma, hongo chaga, hongo cola de pavo, shiitake, maitake, GABA, citrato de magnesio, L-triptófano, jengibre, cardamomo, toronjil, L-teanina, aceite de coco, ashwagandha y valeriana.",
    ingredientSupport:
      "Combina hongos funcionales con ashwagandha, L-teanina, magnesio y GABA, e incorpora especias de chai (jengibre y cardamomo) para una bebida cálida de rendimiento mental y descanso.",
    usage: "Agrega un scoop en 250 ml de agua caliente, disolver perfectamente. Tomar una vez al día.",
    note: "Contiene valeriana, ashwagandha y hongos. Suplemento alimenticio, no es un medicamento. Si tomas medicamentos de uso regular o tienes cirugía programada, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("neuro-chai"),
    goals: { focus: 4.5, stress: 3.5, sleep: 3, longevity: 1, immune: 1, metabolic: 1 },
    highlights: {
      summary:
        "Neuro CHAI es un chai caliente para tu cerebro: hongos adaptógenos, ashwagandha, L-teanina y magnesio para pensar con claridad y descansar mejor.",
      catalogBenefits: [
        "Mejora del rendimiento intelectual.",
        "Adaptógeno, inmunomodulador.",
        "Ayuda en dolores de cabeza y migrañas.",
        "Precursor de la serotonina, clave para regular el estado de ánimo y el sueño.",
        "Favorecen el descanso y reducen el insomnio.",
        "Regula los niveles de glucosa en sangre y posee propiedades antioxidantes.",
        "Reduce cortisol.",
        "Apoyo en condiciones neurodegenerativas.",
        "Coadyuvante en ansiedad y depresión.",
        "Mejora funciones cerebrales.",
        "Anti-inflamatorio y antiviral.",
      ],
      benefits: [
        { title: "Rendimiento intelectual", detail: "Mejora el rendimiento intelectual y las funciones cerebrales." },
        { title: "Estado de ánimo y sueño", detail: "Precursor de serotonina, clave para regular el ánimo y el descanso." },
        { title: "Menos cortisol", detail: "Adaptógenos que ayudan a reducir el cortisol y la tensión." },
        { title: "Antioxidante", detail: "Propiedades antioxidantes y antiinflamatorias." },
      ],
      timeline: [
        { label: "Desde la primera taza", text: "Un ritual cálido y aromático para pausar y enfocarte." },
        { label: "Con constancia", text: "El uso diario suma adaptógenos y minerales a tu rutina." },
        { label: "Como hábito", text: "Un scoop al día en agua caliente, a la hora que mejor te funcione." },
      ],
    },
  },
  {
    id: "collagen-woman",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Collagen Woman",
    eyebrow: "Colágeno sabor mora azul · Belleza desde dentro",
    benefit: "Colágeno hidrolizado con ácido hialurónico, biotina, astaxantina y coenzima Q10 para piel, cabello, uñas y equilibrio femenino.",
    ingredients:
      "Colágeno hidrolizado (tipo I y III), ácido hialurónico, coenzima Q10, resveratrol, biotina, isoflavonas de soya, extracto de granada, astaxantina e inositol.",
    ingredientSupport:
      "Colágeno y ácido hialurónico para la estructura e hidratación de la piel; biotina para cabello y uñas; astaxantina, granada y resveratrol como antioxidantes; inositol e isoflavonas para el equilibrio hormonal femenino.",
    usage: "Agrega un scoop en 250 ml, disolver perfectamente. Tomar una vez al día.",
    note: "Contiene colágeno de origen animal y soya. Suplemento alimenticio, no es un medicamento. Si tomas tratamiento hormonal o estás en embarazo o lactancia, consúltalo con tu profesional de salud.",
    ...PRICE,
    imageUrl: img("collagen-woman"),
    goals: { skin: 5, female: 5, mobility: 2, energy: 1.5, digestion: 1, longevity: 1 },
    highlights: {
      summary:
        "Collagen Woman cuida tu belleza desde dentro: colágeno, ácido hialurónico, biotina y antioxidantes para tu piel, tu cabello y tu equilibrio.",
      catalogBenefits: [
        "Disminuye líneas de expresión, arrugas y flacidez.",
        "Mejora la hidratación y elasticidad de la piel.",
        "Fortalece cabello y uñas.",
        "Aporta potente acción antioxidante antiedad.",
        "Ayuda al equilibrio hormonal femenino.",
        "Incrementa la energía y la vitalidad diaria.",
        "Mejora la digestión y el equilibrio intestinal.",
        "Fortalece huesos y articulaciones.",
        "Aumenta la firmeza y densidad de la piel.",
        "Contribuye al bienestar integral y la belleza desde dentro.",
      ],
      benefits: [
        { title: "Piel firme e hidratada", detail: "Mejora la hidratación, la elasticidad y la firmeza de la piel." },
        { title: "Cabello y uñas", detail: "Fortalece cabello y uñas con colágeno y biotina." },
        { title: "Equilibrio femenino", detail: "Acompaña el equilibrio hormonal femenino." },
        { title: "Huesos y articulaciones", detail: "Contribuye a fortalecer huesos y articulaciones." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Un scoop en 250 ml de agua, una vez al día." },
        { label: "Con constancia", text: "El colágeno suma con el uso diario sostenido." },
        { label: "Como hábito", text: "Un ritual de belleza que se integra a tu mañana o tarde." },
      ],
    },
  },
  {
    id: "collagen-man",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Collagen Man",
    eyebrow: "Colágeno sabor mora azul · Vitalidad masculina",
    benefit: "Colágeno hidrolizado con maca negra, coenzima Q10 y antioxidantes para energía, fuerza y vitalidad masculina.",
    ingredients:
      "Colágeno hidrolizado (tipo I y II), coenzima Q10, resveratrol, mora azul, L-teanina, curcumina, maca negra, semilla de calabaza, licopeno y bayas de arándano.",
    ingredientSupport:
      "Colágeno para piel, músculo y articulaciones; maca negra y semilla de calabaza como botánicos tradicionales de vitalidad masculina; antioxidantes como licopeno, resveratrol y curcumina; L-teanina para el enfoque.",
    usage: "Agrega un scoop en 250 ml de agua, disolver perfectamente. Tomar una vez al día.",
    note: "Contiene colágeno de origen animal. Suplemento alimenticio, no es un medicamento. Si tomas anticoagulantes o tienes padecimiento hepático, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("collagen-man"),
    goals: { male: 5, skin: 2.5, muscle: 3, mobility: 2.5, energy: 3, focus: 1.5, longevity: 1 },
    highlights: {
      summary:
        "Collagen Man combina colágeno, maca negra y antioxidantes para sostener tu energía, tu fuerza y tu vitalidad.",
      catalogBenefits: [
        "Reduce líneas de expresión y mejora la firmeza de la piel.",
        "Aumenta la energía, vitalidad y rendimiento físico.",
        "Mejora el deseo y desempeño sexual.",
        "Favorece el aumento de masa muscular y fuerza.",
        "Potencia el sistema inmunológico.",
        "Brinda acción antioxidante avanzada y protección celular.",
        "Mejora la salud cardiovascular y la circulación.",
        "Incrementa el enfoque, la claridad mental y el estado de ánimo.",
        "Reduce la inflamación y mejora el bienestar articular.",
        "Contribuye al equilibrio hormonal y bienestar general.",
      ],
      benefits: [
        { title: "Energía y rendimiento", detail: "Aumenta la energía, la vitalidad y el rendimiento físico." },
        { title: "Músculo y articulaciones", detail: "Favorece la masa muscular, la fuerza y el bienestar articular." },
        { title: "Vitalidad masculina", detail: "Contribuye al equilibrio hormonal y al bienestar general." },
        { title: "Enfoque y ánimo", detail: "Incrementa el enfoque, la claridad mental y el estado de ánimo." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Un scoop en 250 ml de agua, una vez al día." },
        { label: "Con constancia", text: "El colágeno y los adaptógenos suman con el uso diario." },
        { label: "Como hábito", text: "Se integra fácil a tu rutina de entrenamiento o de mañana." },
      ],
    },
  },
  {
    id: "synergy",
    line: "nutriday_plus",
    type: "suplemento",
    name: "Synergy",
    eyebrow: "Energía y bienestar integral · Sabor guaraná",
    benefit: "Fórmula con guaraná, ginseng, té verde y complejo B para energía, enfoque y metabolismo.",
    ingredients: "Guaraná, ginseng, kiwi, semilla de uva, shisandra, té verde, damiana de California, moringa, complejo B y jengibre.",
    ingredientSupport:
      "Guaraná, té verde y ginseng aportan estimulación natural; el complejo B y la moringa apoyan el metabolismo energético; la shisandra y la damiana son botánicos adaptógenos tradicionales.",
    usage: "Agrega un scoop en 250 ml de agua caliente, disolver perfectamente. Tomar una vez al día.",
    note: "Contiene fuentes de cafeína (guaraná y té verde). Suplemento alimenticio, no es un medicamento. Si eres sensible a la cafeína, tienes hipertensión o enfermedad cardiaca, consúltalo antes de usarlo.",
    ...PRICE,
    imageUrl: img("synergy"),
    goals: { energy: 5, focus: 3.5, weight: 2.5, metabolic: 2, immune: 1.5, digestion: 1 },
    highlights: {
      summary:
        "Synergy es tu bebida de energía y enfoque: guaraná, ginseng, té verde y complejo B para rendir durante el día.",
      catalogBenefits: [
        "Aumenta la energía y reduce el cansancio.",
        "Mejora el enfoque, la claridad mental y la concentración.",
        "Potencia el metabolismo y ayuda en el control de peso.",
        "Refuerza el sistema inmunológico.",
        "Aumenta la resistencia física y el rendimiento diario.",
        "Brinda poderosa acción antioxidante y protección celular.",
        "Mejora la digestión y el bienestar intestinal.",
        "Contribuye al equilibrio hormonal y al bienestar emocional.",
        "Promueve la salud cardiovascular y la circulación.",
        "Reduce la inflamación y favorece el bienestar general.",
      ],
      benefits: [
        { title: "Energía sin cansancio", detail: "Aumenta la energía y reduce la sensación de cansancio." },
        { title: "Enfoque", detail: "Mejora el enfoque, la claridad mental y la concentración." },
        { title: "Metabolismo", detail: "Potencia el metabolismo y ayuda en el control de peso." },
        { title: "Resistencia", detail: "Aumenta la resistencia física y el rendimiento diario." },
      ],
      timeline: [
        { label: "Desde la primera toma", text: "Una bebida caliente con sabor guaraná para arrancar el día." },
        { label: "Con constancia", text: "Complementa tu rutina de energía y alimentación." },
        { label: "Como hábito", text: "Un scoop al día en 250 ml de agua caliente." },
      ],
    },
  },
  {
    id: "endo",
    line: "club_wenow",
    type: "suplemento",
    name: "ENDO CBD Oil",
    eyebrow: "Extracto de cáñamo · Relajación y descanso",
    benefit: "Extracto de cáñamo de espectro completo (2,000 mg, 30 ml, sabor menta) para la relajación, el descanso y el equilibrio.",
    ingredients: "Full Spectrum Hemp Extract (2,000 mg en 30 ml). Sabor menta. Gluten Free · Non GMO · GMP Certified.",
    ingredientSupport:
      "Fórmula de espectro completo diseñada para favorecer el equilibrio y el bienestar integral, con respaldo de manufactura GMP.",
    // PENDIENTE: confirmar la dosis y frecuencia con Alejandro (CEO de WeNow). Por ahora: gotero sublingual, porción de 1 ml.
    usage: "Uso sublingual con el gotero: coloca una porción (1 ml) debajo de la lengua. Sigue las indicaciones del empaque.",
    note: "Suplemento alimenticio. No es un medicamento. No usar en embarazo ni lactancia. Si tomas medicamentos de uso regular o tienes padecimiento hepático, consúltalo con tu profesional de salud.",
    ...ENDO_PRICE,
    imageUrl: img("endo"),
    goals: { stress: 4, sleep: 3.5, muscle: 2, digestion: 1 },
    highlights: {
      summary:
        "ENDO es un extracto de cáñamo de espectro completo en gotero, pensado para favorecer la relajación y un descanso de mayor calidad.",
      catalogBenefits: [
        "Favorece la relajación y el manejo del estrés.",
        "Apoya un descanso de mayor calidad.",
        "Contribuye al confort físico y la recuperación muscular.",
        "Favorece el equilibrio del sistema nervioso.",
        "Brinda apoyo antioxidante y al bienestar digestivo.",
      ],
      benefits: [
        { title: "Relajación", detail: "Favorece la relajación y el manejo del estrés." },
        { title: "Descanso", detail: "Apoya un descanso de mayor calidad." },
        { title: "Confort físico", detail: "Contribuye al confort físico y a la recuperación muscular." },
        { title: "Equilibrio", detail: "Favorece el equilibrio del sistema nervioso." },
      ],
      timeline: [
        { label: "Desde el inicio", text: "Un gotero de 30 ml con sabor menta, fácil de integrar a tu rutina de noche." },
        { label: "Con constancia", text: "El uso constante acompaña tus hábitos de relajación." },
        { label: "Como hábito", text: "Pausas conscientes y descanso regular potencian su aporte." },
      ],
    },
  },
];

// Las fichas técnicas (scripts/data/fichas.json) completan cada producto: ingredientes con su ciencia,
// advertencias y datos de uso. Mandan sobre mi primera lectura del catálogo.
const FICHAS = fichasJson as unknown as Record<string, Ficha>;
export const WENOW_PRODUCTS: CatalogProduct[] = BASE_PRODUCTS.map((p) => {
  const f = FICHAS[p.id];
  if (!f) throw new Error(`Falta la ficha técnica de ${p.id}`);
  return {
    ...p,
    ingredients: `${f.ingredients.map((i) => i.name).join(", ")}.`,
    ingredientSupport: f.about,
    note: `${f.reco.join(" ")} Suplemento alimenticio, no es un medicamento.`,
    highlights: { ...p.highlights, ficha: f },
  };
});

export const CORPORATE_DISTRIBUTOR = {
  slug: "wenow",
  displayName: "WeNow",
  // WhatsApp: teléfono corporativo temporal. PENDIENTE: correo de avisos, tienda y registro.
  email: "",
  whatsapp: "525563970355",
  storeUrl: "https://wenow.global",
  registrationUrl: "",
  active: true,
};
