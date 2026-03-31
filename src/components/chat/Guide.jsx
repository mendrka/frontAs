import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { useAuth } from '@context/AuthContext'
import { gamificationAPI } from '@services/api'

const STORAGE_PREFIX = 'eam_guide_v2'

const C = {
  gDark: '#0a5032',
  gMid: '#128c50',
  gBright: '#22c570',
  gLight: '#c8f5de',
  gPale: '#e8faf1',
  gAccent: '#00d97e',
  white: '#ffffff',
  offWhite: '#f5fdf9',
  gray100: '#e8f0eb',
  gray200: '#c8d8ce',
  gray400: '#7a9888',
  gray600: '#3a5044',
  nearBlack: '#0c1e16',
}

const CATEGORY_META = {
  langue: { icon: '📗', label: 'Langue', tag: 'LANGUE', color: C.gBright },
  examen: { icon: '✅', label: 'Examen', tag: 'EXAMEN', color: C.gAccent },
  contrat: { icon: '📝', label: 'Contrat', tag: 'CONTRAT', color: C.gMid },
  admin: { icon: '📋', label: 'Admin', tag: 'ADMIN', color: C.gDark },
  visa: { icon: '🛂', label: 'Visa', tag: 'VISA', color: C.gLight },
  attente: { icon: '⏳', label: 'Attente', tag: 'ATTENTE', color: C.gray200 },
  fop_mae: { icon: '🏛️', label: 'FOP/MAE', tag: 'FOP/MAE', color: C.gDark },
  depart: { icon: '✈️', label: 'Depart', tag: 'DEPART', color: C.gDark },
}

const PHASE_COLORS = {
  langue: { bg: 'rgba(34,197,112,0.7)', border: '#22c570' },
  examen: { bg: 'rgba(0,217,126,0.7)', border: '#00d97e' },
  contrat: { bg: 'rgba(18,140,80,0.7)', border: '#128c50' },
  admin: { bg: 'rgba(10,80,50,0.65)', border: '#0a5032' },
  visa: { bg: 'rgba(200,245,222,0.9)', border: '#22c570' },
  attente: { bg: 'rgba(200,216,206,0.5)', border: '#c8d8ce' },
  depart: { bg: 'rgba(10,80,50,0.85)', border: '#0a5032' },
}

const PROGRAMS = {
  aupair: {
    id: 'aupair',
    label: 'Au Pair',
    emoji: '👨‍👩‍👧',
    age: '18-26 ans',
    duree: '6-12 mois',
    niveauLangue: 'A1 minimum (A2 conseille)',
    certifGoethe: 'Goethe-Zertifikat A1',
    fraisVisa: '75 €',
    coutCGM: '~140 000 Ar',
    delaiVisa: '~3 mois',
    allocation: '260 €/mois',
    description: "Vie en famille allemande avec logement, repas et argent de poche.",
    avantages: ['Logement fourni', 'Immersion culturelle', 'Cours de langue', 'Argent de poche'],
    prerequis: ['18 a 26 ans', 'Goethe A1 minimum', "Pas d'enfant a charge", 'Casier judiciaire vierge'],
    timeline: [
      { phase: 'Cours allemand A1', start: 0, duration: 3, category: 'langue' },
      { phase: 'Examen Goethe A1', start: 3, duration: 1, category: 'examen' },
      { phase: 'Recherche famille', start: 3.5, duration: 2, category: 'contrat' },
      { phase: 'Demande passeport', start: 5, duration: 0.5, category: 'admin' },
      { phase: 'Dossier visa', start: 5.5, duration: 1, category: 'visa' },
      { phase: 'RDV Ambassade', start: 6.5, duration: 0.25, category: 'visa' },
      { phase: 'Attente visa', start: 6.75, duration: 3, category: 'attente' },
      { phase: 'Formalites FOP/MAE', start: 9.5, duration: 0.5, category: 'admin' },
      { phase: 'Billet + depart', start: 10, duration: 0.5, category: 'depart' },
    ],
  },
  fsj: {
    id: 'fsj',
    label: 'FSJ',
    emoji: '🏥',
    age: '16-26 ans',
    duree: '6-18 mois',
    niveauLangue: 'A2 requis',
    certifGoethe: 'Goethe-Zertifikat A2',
    fraisVisa: '75 €',
    coutCGM: '~150 000 Ar',
    delaiVisa: '~3 mois',
    allocation: '300-400 €/mois',
    description: 'Service volontaire social dans un hopital, une maison de retraite ou une structure sociale.',
    avantages: ['Experience pro', 'Logement souvent fourni', 'Indemnite', 'Cadre encadre'],
    prerequis: ['16 a 26 ans', 'Goethe A2 minimum', 'Contrat FSJ', 'Lettre de motivation en allemand'],
    timeline: [
      { phase: 'Cours intensif A1-A2', start: 0, duration: 4, category: 'langue' },
      { phase: 'Examen Goethe A2', start: 4, duration: 0.5, category: 'examen' },
      { phase: 'Candidatures FSJ', start: 3, duration: 2, category: 'contrat' },
      { phase: 'Signature contrat FSJ', start: 5, duration: 0.5, category: 'contrat' },
      { phase: 'Demande passeport', start: 5.5, duration: 0.5, category: 'admin' },
      { phase: 'Dossier visa + RDV', start: 6, duration: 1, category: 'visa' },
      { phase: 'Attente visa', start: 7, duration: 3, category: 'attente' },
      { phase: 'Formalites FOP/MAE', start: 9.5, duration: 0.5, category: 'admin' },
      { phase: 'Billet + depart', start: 10, duration: 0.5, category: 'depart' },
    ],
  },
  bfd: {
    id: 'bfd',
    label: 'BFD',
    emoji: '🤝',
    age: '>= 16 ans',
    duree: '6-18 mois',
    niveauLangue: 'B1 complet',
    certifGoethe: 'Goethe-Zertifikat B1',
    fraisVisa: '75 €',
    coutCGM: '~164 000 Ar',
    delaiVisa: '~3 mois',
    allocation: '300-400 €/mois',
    description: 'Volontariat federal allemand ouvert a tous les ages.',
    avantages: ['Ouvert a tous', 'Reconnaissance officielle', 'Seminaires', 'Experience sociale'],
    prerequis: ['>= 16 ans', 'Goethe B1 complet', 'Contrat BAFzA', 'Casier vierge'],
    timeline: [
      { phase: 'Cours intensif A2-B1', start: 0, duration: 5, category: 'langue' },
      { phase: 'Examen Goethe B1', start: 5, duration: 0.75, category: 'examen' },
      { phase: 'Candidature BFD', start: 4, duration: 2, category: 'contrat' },
      { phase: 'Signature contrat BFD', start: 6, duration: 0.5, category: 'contrat' },
      { phase: 'Demande passeport', start: 6, duration: 0.5, category: 'admin' },
      { phase: 'Dossier visa + RDV', start: 6.5, duration: 1, category: 'visa' },
      { phase: 'Attente visa', start: 7.5, duration: 3, category: 'attente' },
      { phase: 'Formalites FOP/MAE', start: 10, duration: 0.5, category: 'admin' },
      { phase: 'Billet + depart', start: 10.5, duration: 0.5, category: 'depart' },
    ],
  },
  ausbildung: {
    id: 'ausbildung',
    label: 'Ausbildung',
    emoji: '🎓',
    age: '>= 16 ans',
    duree: '2-3 ans',
    niveauLangue: 'B1 requis (B2 sante)',
    certifGoethe: 'Goethe-Zertifikat B1 ou B2',
    fraisVisa: '75 €',
    coutCGM: '~150-200 000 Ar',
    delaiVisa: '1-3 mois',
    allocation: '>= 1 048 €/mois brut',
    description: 'Formation professionnelle duale allemande, entreprise + ecole.',
    avantages: ['Salaire apprenti', 'Diplome reconnu', 'Acces emploi', 'Carriere'],
    prerequis: ['B1 minimum', 'Diplomes traduits', 'Contrat signe', 'Accord BA'],
    timeline: [
      { phase: 'Cours intensif B1/B2', start: 0, duration: 6, category: 'langue' },
      { phase: 'Examen Goethe B1/B2', start: 6, duration: 0.5, category: 'examen' },
      { phase: 'Recherche Ausbildungsplatz', start: 4, duration: 3, category: 'contrat' },
      { phase: 'Signature contrat formation', start: 7, duration: 0.5, category: 'contrat' },
      { phase: 'Traduction + reconnaissance', start: 5, duration: 2, category: 'admin' },
      { phase: 'Demande passeport', start: 7, duration: 0.5, category: 'admin' },
      { phase: 'Accord BA + visa', start: 7.5, duration: 1.5, category: 'visa' },
      { phase: 'Attente visa', start: 9, duration: 2.5, category: 'attente' },
      { phase: 'Formalites FOP/MAE', start: 11, duration: 0.5, category: 'admin' },
      { phase: 'Billet + depart', start: 11.5, duration: 0.5, category: 'depart' },
    ],
  },
}

const PROGRAM_DETAILS = {
  aupair: {
    steps: [
      step('step1', "1. Apprendre l'allemand", '🗣️', 'M+0 -> M+3', 'langue', [
        task('au_lang_1', "S'inscrire au Goethe-Zentrum Antananarivo", true, 'https://goethe.mg'),
        task('au_lang_2', "Pratiquer l'oral chaque jour avec EAM"),
        task('au_lang_3', 'Rejoindre un groupe de conversation'),
        task('au_lang_4', 'Viser A1 solide en 3 mois'),
      ]),
      step('step2', '2. Examen Goethe A1', '📜', 'M+3 -> M+4', 'examen', [
        task('au_ex_1', "S'inscrire a l'examen Goethe A1", true, 'https://goethe.mg'),
        task('au_ex_2', 'Reviser les 4 modules'),
        task('au_ex_3', 'Recuperer le certificat original', true),
      ], 'Sans certificat officiel, le dossier visa est fragile.'),
      step('step3', '3. Trouver une famille Au Pair', '👨‍👩‍👧', 'M+3 -> M+5', 'contrat', [
        task('au_co_1', 'Creer un profil sur AuPairWorld', false, 'https://www.aupairworld.com/'),
        task('au_co_2', 'Preparer un <em>Lebenslauf</em> (CV) en allemand'),
        task('au_co_3', 'Contacter 10 a 15 familles'),
        task('au_co_4', 'Signer le contrat Au Pair bilingue', true),
      ]),
      ...commonSteps(),
    ],
    docs: docsSet('A1', 'Contrat Au Pair signe'),
    tips: tipsSet(
      ['Confirme par ecrit la chambre, les repas et les jours libres.', "Prends le rendez-vous visa des que le contrat est pret.", "Continue l'allemand jusqu'au depart."],
      ["N'achete pas le billet avant le visa.", 'N envoie jamais un dossier incomplet.', 'N oublie pas FOP/MAE.']
    ),
  },
  fsj: {
    steps: [
      step('step1', "1. Apprendre l'allemand", '🗣️', 'M+0 -> M+4', 'langue', [
        task('fs_lang_1', 'Construire un A2 reel avec pratique orale'),
        task('fs_lang_2', "Suivre un rythme intensif au centre ou avec EAM"),
        task('fs_lang_3', 'Apprendre le vocabulaire du soin et du social'),
      ]),
      step('step2', '2. Examen Goethe A2', '📜', 'M+4 -> M+5', 'examen', [
        task('fs_ex_1', "S'inscrire au Goethe A2", true, 'https://goethe.mg'),
        task('fs_ex_2', 'Faire des simulations de comprehension et oral'),
        task('fs_ex_3', 'Recuperer le certificat original', true),
      ]),
      step('step3', '3. Trouver un organisme FSJ', '🏥', 'M+3 -> M+5', 'contrat', [
        task('fs_co_1', 'Postuler sur les plateformes de volontariat', false, 'https://www.freiwilligendienste.de/'),
        task('fs_co_2', 'Adapter CV et lettre de motivation'),
        task('fs_co_3', 'Verifier hebergement et indemnite'),
        task('fs_co_4', 'Signer le contrat FSJ', true),
      ]),
      ...commonSteps(),
    ],
    docs: docsSet('A2', 'Contrat FSJ signe'),
    tips: tipsSet(
      ["Cible les structures qui ont deja accueilli des etrangers.", 'Travaille le vocabulaire relationnel et medical.', "Conserve une version PDF complete du dossier."],
      ['Ne signe pas sans verifier les conditions.', 'Ne sous-estime pas le niveau pratique necessaire.', 'Ne retarde pas le visa.']
    ),
  },
  bfd: {
    steps: [
      step('step1', "1. Apprendre l'allemand", '🗣️', 'M+0 -> M+5', 'langue', [
        task('bf_lang_1', 'Planifier un parcours A2 vers B1 complet'),
        task('bf_lang_2', "Pratiquer l'oral et l'ecrit chaque semaine"),
        task('bf_lang_3', 'Faire corriger ses productions'),
      ]),
      step('step2', '2. Examen Goethe B1', '📜', 'M+5 -> M+6', 'examen', [
        task('bf_ex_1', "S'inscrire au Goethe B1", true, 'https://goethe.mg'),
        task('bf_ex_2', 'Valider les 4 modules'),
        task('bf_ex_3', 'Recuperer le certificat B1', true),
      ], 'Pour BFD, le B1 complet reste la vraie base de securite.'),
      step('step3', '3. Candidature BFD', '🤝', 'M+4 -> M+6', 'contrat', [
        task('bf_co_1', 'Chercher les postes BFD officiels', false, 'https://www.bundesfreiwilligendienst.de/'),
        task('bf_co_2', 'Verifier que le poste accepte les internationaux'),
        task('bf_co_3', 'Confirmer logement et accompagnement'),
        task('bf_co_4', 'Signer le contrat BFD/BAFzA', true),
      ]),
      ...commonSteps(),
    ],
    docs: docsSet('B1 complet', 'Contrat BFD/BAFzA signe'),
    tips: tipsSet(
      ['Vise un B1 propre, pas approximatif.', 'Priorise les offres BFD officielles.', 'Garde toutes les signatures et preuves de paiement.'],
      ['Ne confonds pas BFD et FSJ dans le dossier.', "N arrive pas avec un B1 incomplet.", 'Ne neglige pas les formalites malgaches.']
    ),
  },
  ausbildung: {
    steps: [
      step('step1', "1. Apprendre l'allemand", '🗣️', 'M+0 -> M+6', 'langue', [
        task('as_lang_1', 'Fixer une cible B1 ou B2 selon le metier'),
        task('as_lang_2', 'Renforcer comprehension professionnelle et oral'),
        task('as_lang_3', 'Travailler le lexique du secteur vise'),
      ]),
      step('step2', '2. Examen Goethe B1/B2', '📜', 'M+6 -> M+7', 'examen', [
        task('as_ex_1', "S'inscrire au Goethe adequat", true, 'https://goethe.mg'),
        task('as_ex_2', 'Preparer les productions ecrites formelles'),
        task('as_ex_3', 'Recuperer le certificat original', true),
      ]),
      step('step3', '3. Trouver un Ausbildungsplatz', '🎓', 'M+4 -> M+8', 'contrat', [
        task('as_co_1', 'Postuler sur Make it in Germany', false, 'https://www.make-it-in-germany.com/fr/'),
        task('as_co_2', 'Adapter chaque candidature au metier'),
        task('as_co_3', 'Lancer la reconnaissance des diplomes'),
        task('as_co_4', 'Signer le contrat de formation', true),
      ]),
      ...commonSteps(),
    ],
    docs: docsSet('B1 ou B2', 'Contrat de formation signe'),
    tips: tipsSet(
      ['Choisis un metier cible avant les candidatures.', 'Traduis les diplomes tres tot.', 'Pour la sante, vise B2.'],
      ['Ne confonds pas offre et contrat signe.', 'Ne sous-estime pas la reconnaissance des diplomes.', 'Ne repousse pas le dossier BA/visa.']
    ),
  },
}

const COMPARISON = [
  ['Age', '18-26 ans', '16-26 ans', '>= 16 ans', '>= 16 ans'],
  ['Duree', '6-12 mois', '6-18 mois', '6-18 mois', '2-3 ans'],
  ['Niveau', 'A1', 'A2', 'B1', 'B1/B2'],
  ['Allocation', '260 €/mois', '300-400 €/mois', '300-400 €/mois', '>= 1 048 €/mois'],
  ['Delai', '~10 mois', '~10 mois', '~11 mois', '~12 mois'],
]

const SOURCES = [
  ['Ambassade d Allemagne Antananarivo', 'https://antananarivo.diplo.de/'],
  ['Goethe-Zentrum Antananarivo', 'https://goethe.mg'],
  ['Torolalana Madagascar', 'https://torolalana.gov.mg/fr/services/demande-de-passeport'],
  ['Make it in Germany', 'https://www.make-it-in-germany.com/fr/'],
  ['Bundesfreiwilligendienst', 'https://www.bundesfreiwilligendienst.de/'],
]

function task(id, text, important = false, link = '') {
  return { id, text, important, link }
}

function step(id, title, icon, delay, color, tasks, note = '') {
  return { id, title, icon, delay, color, tasks: tasks.map((item) => ({ ...item, category: color })), note }
}

function commonSteps() {
  return [
    step('step4', '4. Passeport biometrique', '🛂', 'M+5 -> M+7', 'admin', [
      task('co_ad_1', 'Demander le passeport sur Torolalana', true, 'https://torolalana.gov.mg/fr/services/demande-de-passeport'),
      task('co_ad_2', 'Preparer acte de naissance, photos, CNI et residence', true),
      task('co_ad_3', 'Verifier les informations du passeport', true),
    ]),
    step('step5', "5. Dossier visa - Ambassade d'Allemagne", '🏛️', 'M+6 -> M+9', 'visa', [
      task('co_vi_1', 'Prendre rendez-vous des que le dossier est pret', true, 'https://antananarivo.diplo.de/'),
      task('co_vi_2', 'Remplir le formulaire VIDEX'),
      task('co_vi_3', 'Verifier passeport, copies, assurance et photos', true),
      task('co_vi_4', "Ne pas acheter le billet avant la decision", true),
    ]),
    step('step6', '6. Formalites FOP/MAE', '📋', 'M+9 -> M+11', 'fop_mae', [
      task('co_fop_1', 'Preparer les copies legalisees et les chemises'),
      task('co_fop_2', 'Passer au FOP puis a la Police', true),
      task('co_fop_3', 'Recuperer l autorisation officielle de sortie', true),
    ]),
    step('step7', '7. Preparation au depart', '✈️', 'M+10 -> M+12', 'depart', [
      task('co_dep_1', 'Acheter le billet apres visa', true),
      task('co_dep_2', 'Prevoir budget, assurance et copies papier/USB'),
      task('co_dep_3', "Continuer l'allemand jusqu'au depart"),
    ]),
  ]
}

function docsSet(level, contractName) {
  return {
    admin: {
      title: 'Documents administratifs Madagascar',
      items: [
        task(`doc_${level}_1`, 'Acte de naissance recent', true),
        task(`doc_${level}_2`, 'Passeport biometrique valide', true),
        task(`doc_${level}_3`, 'CNI originale + copies certifiees'),
        task(`doc_${level}_4`, 'Casier judiciaire < 3 mois', true),
      ],
    },
    langue: {
      title: 'Langue et examens',
      items: [
        task(`doc_${level}_5`, `Certificat Goethe ${level}`, true),
        task(`doc_${level}_6`, '<em>Lebenslauf</em> (CV) en allemand'),
        task(`doc_${level}_7`, 'Diplomes et traductions assermentees'),
      ],
    },
    visa: {
      title: 'Visa et contrat',
      items: [
        task(`doc_${level}_8`, 'Formulaire VIDEX signe', true),
        task(`doc_${level}_9`, contractName, true),
        task(`doc_${level}_10`, 'Assurance sante Schengen >= 30 000 €', true),
      ],
    },
  }
}

function tipsSet(conseils, erreurs) {
  return { conseils, erreurs }
}

function allItems(programId) {
  const detail = PROGRAM_DETAILS[programId]
  const docs = Object.values(detail.docs).flatMap((group) => group.items)
  return [...detail.steps.flatMap((item) => item.tasks), ...docs]
}

function storageKey(programId, itemId) {
  return `${STORAGE_PREFIX}_${programId}_${itemId}`
}

function readState(programId) {
  const state = {}
  allItems(programId).forEach((item) => {
    state[item.id] = localStorage.getItem(storageKey(programId, item.id)) === '1'
  })
  return state
}

function monthCards(programId, startMonth, startYear) {
  return Array.from({ length: 13 }, (_, offset) => {
    const date = new Date(startYear, startMonth - 1 + offset, 1)
    const tasks = PROGRAMS[programId].timeline.filter((item) => {
      const start = Math.floor(item.start)
      const end = Math.ceil(item.start + item.duration)
      return offset >= start && offset < end
    })
    return {
      id: `month_${offset}`,
      offset,
      label: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      tasks,
    }
  })
}

function currentOffset(startMonth, startYear) {
  const now = new Date()
  const diff = (now.getFullYear() - startYear) * 12 + (now.getMonth() - (startMonth - 1))
  return Math.max(0, Math.min(12, diff))
}

function countDone(items, doneMap) {
  return items.filter((item) => doneMap[item.id]).length
}

function percent(items, doneMap) {
  if (!items.length) return 0
  return Math.round((countDone(items, doneMap) / items.length) * 100)
}

function useVisibility(ref) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || visible) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '120px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, visible])

  return visible
}

function ExternalText({ item }) {
  const content = <span dangerouslySetInnerHTML={{ __html: item.text }} />
  if (!item.link) return content
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-4">
      {content}
    </a>
  )
}

function CheckRow({ checked, onToggle, children, subtle = false }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onToggle()
        }
      }}
      className="flex w-full items-start gap-3 rounded-[1.1rem] px-3 py-3 text-left transition duration-200"
      style={{ backgroundColor: checked ? C.gPale : subtle ? C.offWhite : C.white }}
    >
      <span
        className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border-2 text-xs font-bold"
        style={{
          borderColor: checked ? C.gBright : C.gray200,
          backgroundColor: checked ? C.gBright : C.white,
          color: checked ? C.white : C.gray600,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span className="min-w-0 text-sm leading-6" style={{ color: checked ? C.gDark : C.gray600, textDecoration: checked ? 'line-through' : 'none' }}>
        {children}
      </span>
    </button>
  )
}

function TimelineChart({ program, compareMode }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const visible = useVisibility(wrapRef)

  useEffect(() => {
    if (!visible || !canvasRef.current) return undefined
    if (chartRef.current) chartRef.current.destroy()

    if (compareMode) {
      const ids = Object.keys(PROGRAMS)
      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: ids.map((id) => PROGRAMS[id].label),
          datasets: [
            {
              label: 'Duree estimative',
              data: ids.map((id) => Math.max(...PROGRAMS[id].timeline.map((item) => item.start + item.duration))),
              backgroundColor: [C.gBright, C.gMid, C.gAccent, C.gDark],
              borderColor: [C.gBright, C.gMid, C.gAccent, C.gDark],
              borderWidth: 2,
              borderRadius: 10,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: C.gDark,
              titleColor: C.gLight,
              bodyColor: C.offWhite,
            },
          },
          scales: {
            x: { grid: { color: 'rgba(200,216,206,0.3)' }, ticks: { color: C.gray600, callback: (v) => `M+${v}` } },
            y: { grid: { display: false }, ticks: { color: C.nearBlack } },
          },
        },
      })
    } else {
      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: program.timeline.map((item) => item.phase),
          datasets: [
            {
              data: program.timeline.map((item) => [item.start, item.start + item.duration]),
              backgroundColor: program.timeline.map((item) => PHASE_COLORS[item.category].bg),
              borderColor: program.timeline.map((item) => PHASE_COLORS[item.category].border),
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const [start, end] = ctx.raw
                  const dur = end - start
                  return ` Mois ${start} -> ${end} (${dur < 1 ? `${Math.round(dur * 30)} jours` : `${dur} mois`})`
                },
              },
              backgroundColor: C.gDark,
              titleColor: C.gLight,
              bodyColor: C.offWhite,
              borderColor: C.gBright,
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              min: 0,
              max: 13,
              title: { display: true, text: 'Mois depuis le debut', color: C.gray600 },
              grid: { color: 'rgba(200,216,206,0.3)' },
              ticks: { color: C.gray600, callback: (v) => `M+${v}` },
            },
            y: { grid: { display: false }, ticks: { color: C.nearBlack } },
          },
        },
      })
    }

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [compareMode, program, visible])

  return (
    <div ref={wrapRef} className="rounded-[1.5rem] border p-4 sm:rounded-[2rem] sm:p-5" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: C.gMid }}>
            Timeline globale
          </p>
          <h3 className="font-display text-xl font-semibold" style={{ color: C.gDark }}>
            {compareMode ? 'Comparaison des programmes' : `Planning ${program.label}`}
          </h3>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: C.gPale, color: C.gDark }}>
          Chart.js
        </span>
      </div>
      <div className="h-[280px] sm:h-[340px] md:h-[420px]">
        <canvas ref={canvasRef} />
      </div>
      {!compareMode ? (
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          {['langue', 'examen', 'contrat', 'admin', 'visa', 'attente', 'depart'].map((category) => (
            <span key={category} className="rounded-full border px-3 py-1" style={{ borderColor: CATEGORY_META[category].color, backgroundColor: C.offWhite, color: C.gDark }}>
              {CATEGORY_META[category].icon} {CATEGORY_META[category].label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Doughnut({ values, globalPercent }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const chartRef = useRef(null)
  const visible = useVisibility(wrapRef)

  useEffect(() => {
    if (!visible || !canvasRef.current) return undefined
    if (chartRef.current) chartRef.current.destroy()
    const plugin = {
      id: 'centerText',
      afterDraw(chart) {
        const point = chart.getDatasetMeta(0).data[0]
        if (!point) return
        const { ctx } = chart
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = C.gDark
        ctx.font = '700 26px Outfit, sans-serif'
        ctx.fillText(`${globalPercent}%`, point.x, point.y - 4)
        ctx.font = '500 12px "Source Sans 3", sans-serif'
        ctx.fillStyle = C.gray600
        ctx.fillText('global', point.x, point.y + 18)
        ctx.restore()
      },
    }
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Langue & Examen', 'Contrat', 'Passeport', 'Visa', 'Admin FOP/MAE', 'Depart'],
        datasets: [
          {
            data: values,
            backgroundColor: [C.gBright, C.gMid, C.gAccent, C.gDark, C.gLight, C.gray400],
            borderColor: C.offWhite,
            borderWidth: 3,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { position: 'right', labels: { color: C.nearBlack, font: { size: 12 }, padding: 12 } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}% accompli` } },
        },
      },
      plugins: [plugin],
    })

    return () => {
      if (chartRef.current) chartRef.current.destroy()
    }
  }, [globalPercent, values, visible])

  return (
    <div ref={wrapRef} className="h-[320px]">
      <canvas ref={canvasRef} />
    </div>
  )
}

export default function Guide() {
  const { section } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = new Date()
  const initialProgram = PROGRAMS[section] ? section : 'aupair'
  const [programId, setProgramId] = useState(initialProgram)
  const [startMonth, setStartMonth] = useState(today.getMonth() + 1)
  const [startYear, setStartYear] = useState(today.getFullYear())
  const [doneMap, setDoneMap] = useState(() => readState(initialProgram))
  const [openSteps, setOpenSteps] = useState({ step1: true })
  const [compareMode, setCompareMode] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    if (PROGRAMS[section] && section !== programId) setProgramId(section)
  }, [programId, section])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('p')
    const start = params.get('start')
    const share = params.get('share')
    if (p && PROGRAMS[p]) setProgramId(p)
    if (start && /^\d{4}-\d{2}$/.test(start)) {
      const [year, month] = start.split('-').map(Number)
      setStartYear(year)
      setStartMonth(month)
    }
    if (!share) return
    try {
      const payload = JSON.parse(window.atob(share))
      if (payload.programId && PROGRAMS[payload.programId]) setProgramId(payload.programId)
      if (Array.isArray(payload.done)) payload.done.forEach((id) => localStorage.setItem(storageKey(payload.programId, id), '1'))
    } catch {
      // payload partage invalide: ignore.
    }
  }, [])

  useEffect(() => {
    setDoneMap(readState(programId))
    setOpenSteps({ step1: true })
  }, [programId])

  const program = PROGRAMS[programId]
  const detail = PROGRAM_DETAILS[programId]
  const docs = Object.values(detail.docs).flatMap((group) => group.items)
  const totalItems = [...detail.steps.flatMap((item) => item.tasks), ...docs]
  const globalPercent = percent(totalItems, doneMap)
  const monthsLeft = Math.max(0, Math.ceil(Math.max(...program.timeline.map((item) => item.start + item.duration))) - currentOffset(startMonth, startYear))
  const progressValues = [
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'langue' || item.category === 'examen'), doneMap),
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'contrat'), doneMap),
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'admin'), doneMap),
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'visa'), doneMap),
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'fop_mae'), doneMap),
    percent(detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'depart'), doneMap),
  ]

  async function toggleItem(itemId, next, category) {
    localStorage.setItem(storageKey(programId, itemId), next ? '1' : '0')
    const nextMap = { ...doneMap, [itemId]: next }
    setDoneMap(nextMap)

    const completedStep = detail.steps.find((entry) => entry.tasks.some((taskItem) => taskItem.id === itemId))
    if (completedStep && completedStep.tasks.every((taskItem) => nextMap[taskItem.id])) {
      setFlash(`Etape completee: ${completedStep.title}`)
      window.setTimeout(() => setFlash(''), 1800)
    }

    if (!next || !user) return
    try {
      await gamificationAPI.addXp(5, `guide:${programId}:${itemId}`)
      if (category === 'visa') {
        const visaItems = detail.steps.flatMap((item) => item.tasks).filter((item) => item.category === 'visa')
        if (visaItems.length && visaItems.every((item) => (item.id === itemId ? next : doneMap[item.id]))) {
          await gamificationAPI.addXp(25, `guide:visa-pret:${programId}`)
        }
      }
    } catch {
      // XP best effort.
    }
  }

  async function sharePlan() {
    const payload = {
      programId,
      start: `${startYear}-${String(startMonth).padStart(2, '0')}`,
      done: totalItems.filter((item) => doneMap[item.id]).map((item) => item.id),
    }
    const url = `${window.location.origin}/guide/${programId}?start=${payload.start}&share=${window.btoa(JSON.stringify(payload))}`
    try {
      await navigator.clipboard.writeText(url)
      setFlash('Lien de partage copie')
      window.setTimeout(() => setFlash(''), 1600)
    } catch {
      window.prompt('Copiez ce lien', url)
    }
  }

  return (
    <div className="min-h-screen px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[1.8rem] border p-3 sm:rounded-[2.5rem] sm:p-6 lg:p-8" style={{ borderColor: C.gLight, background: `linear-gradient(180deg, ${C.offWhite} 0%, ${C.white} 42%, ${C.gPale} 100%)`, boxShadow: '0 24px 80px -48px rgba(10,80,50,0.35)' }}>
        <section className="rounded-[1.5rem] p-4 sm:rounded-[2rem] sm:p-7" style={{ backgroundColor: C.gDark }}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em]" style={{ color: C.gLight }}>Partir en Allemagne</p>
              <h1 className="mt-3 font-display text-[clamp(2rem,1.5rem+1.8vw,2.75rem)] font-semibold" style={{ color: C.white }}>Guide interactif EAM</h1>
              <p className="mt-3 text-base leading-7" style={{ color: C.gLight }}>Choisis ton programme, suis chaque etape et imprime ou partage ton planning.</p>
            </div>
            <div className="flex w-full flex-col gap-3 print:hidden sm:w-auto sm:flex-row sm:flex-wrap">
              <button type="button" onClick={() => window.print()} className="w-full rounded-full px-5 py-3 text-sm font-semibold sm:w-auto" style={{ backgroundColor: C.gPale, color: C.gDark }}>Imprimer mon guide</button>
              <button type="button" onClick={sharePlan} className="w-full rounded-full px-5 py-3 text-sm font-semibold sm:w-auto" style={{ backgroundColor: C.gBright, color: C.white }}>Partager mon planning</button>
              <button type="button" onClick={() => setCompareMode((value) => !value)} className="w-full rounded-full border px-5 py-3 text-sm font-semibold sm:w-auto" style={{ borderColor: C.gLight, color: C.white }}>{compareMode ? 'Masquer comparaison' : 'Comparer les 4 programmes'}</button>
            </div>
          </div>
          {flash ? <div className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: C.gAccent, color: C.gDark }}>✨ {flash}</div> : null}
        </section>

        <section className="mt-6 rounded-[2rem] border p-3" style={{ borderColor: C.gLight, backgroundColor: C.offWhite }}>
          <div className="grid gap-3 min-[520px]:grid-cols-2 md:grid-cols-4">
            {Object.values(PROGRAMS).map((item) => {
              const active = item.id === programId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setProgramId(item.id)
                    navigate(`/guide/${item.id}`)
                  }}
                  className="rounded-[1.4rem] border-b-[3px] px-4 py-4 text-left transition duration-200"
                  style={{ backgroundColor: active ? C.gMid : C.gPale, color: active ? C.white : C.gray600, borderColor: active ? C.gBright : C.gLight }}
                >
                  <div className="text-2xl">{item.emoji}</div>
                  <div className="mt-2 text-base font-semibold">{item.label}</div>
                  <div className="mt-1 text-xs opacity-80">{item.niveauLangue}</div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Programme selectionne</p>
                <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl" style={{ color: C.gDark }}>{program.emoji} {program.label}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7" style={{ color: C.gray600 }}>{program.description}</p>
              </div>
              <span className="rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: C.gPale, color: C.gDark }}>{program.certifGoethe}</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Age', program.age], ['Duree', program.duree], ['Allocation', program.allocation], ['Delai visa', program.delaiVisa],
                ['Niveau', program.niveauLangue], ['Frais visa', program.fraisVisa], ['CGM', program.coutCGM], ['Certificat', program.certifGoethe],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border p-4" style={{ borderColor: C.gray100, backgroundColor: C.offWhite }}>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: C.gray400 }}>{label}</div>
                  <div className="mt-2 text-sm font-semibold" style={{ color: C.gDark }}>{value}</div>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Prerequis et avantages</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.gDark }}>Prerequis</h3>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: C.gray600 }}>{program.prerequis.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: C.gDark }}>Avantages</h3>
                <ul className="mt-3 space-y-2 text-sm" style={{ color: C.gray600 }}>{program.avantages.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6">
          <TimelineChart program={program} compareMode={compareMode} />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Calendrier personnalise</p>
                <h3 className="mt-2 font-display text-xl font-semibold sm:text-2xl" style={{ color: C.gDark }}>Planning mois par mois</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm font-semibold" style={{ color: C.gDark }}>
                  Mois
                  <select value={startMonth} onChange={(event) => setStartMonth(Number(event.target.value))} className="mt-2 w-full rounded-[1rem] border px-3 py-2" style={{ borderColor: C.gray200, backgroundColor: C.offWhite }}>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{new Date(2026, month - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>)}
                  </select>
                </label>
                <label className="text-sm font-semibold" style={{ color: C.gDark }}>
                  Annee
                  <select value={startYear} onChange={(event) => setStartYear(Number(event.target.value))} className="mt-2 w-full rounded-[1rem] border px-3 py-2" style={{ borderColor: C.gray200, backgroundColor: C.offWhite }}>
                    {[today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2].map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </label>
                <div className="flex items-end">
                  <button type="button" onClick={() => setFlash('Planning recalcule')} className="w-full rounded-full px-4 py-3 text-sm font-semibold" style={{ backgroundColor: C.gMid, color: C.white }}>Recalculer</button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {monthCards(programId, startMonth, startYear).map((month) => {
                const monthDone = month.tasks.length > 0 && month.tasks.every((item) => doneMap[`${month.id}_${item.phase}`])
                const current = month.offset === currentOffset(startMonth, startYear)
                return (
                  <div key={month.id} className="rounded-[1.5rem] p-4" style={{ backgroundColor: monthDone ? C.gLight : C.white, border: monthDone ? `2px solid ${C.gBright}` : current ? `2px solid ${C.gMid}` : `1px dashed ${C.gray200}` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: C.gray400 }}>M+{month.offset}</div>
                        <div className="mt-1 text-base font-semibold capitalize" style={{ color: C.gDark }}>{month.label}</div>
                      </div>
                      {current ? <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ backgroundColor: C.gMid, color: C.white }}>MAINTENANT</span> : null}
                    </div>
                    <div className="mt-4 space-y-2">
                      {month.tasks.length ? month.tasks.map((item) => {
                        const itemId = `${month.id}_${item.phase}`
                        return (
                          <CheckRow key={itemId} checked={!!doneMap[itemId]} onToggle={() => toggleItem(itemId, !doneMap[itemId], item.category)}>
                            <span className="flex flex-wrap items-center gap-2">
                              <span>{item.phase}</span>
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: C.gPale, color: C.gDark }}>{CATEGORY_META[item.category].tag}</span>
                            </span>
                          </CheckRow>
                        )
                      }) : <p className="text-sm" style={{ color: C.gray400 }}>Aucune action majeure ce mois-la.</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </article>

          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Progression globale</p>
            <div className="mt-4">
              <Doughnut values={progressValues} globalPercent={globalPercent} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ['Taches accomplies', String(countDone(totalItems, doneMap))],
                ['Taches totales', String(totalItems.length)],
                ['Mois restants', String(monthsLeft)],
                ['Progression globale', `${globalPercent}%`],
              ].map(([label, value], index) => (
                <div key={label} className="rounded-[1.4rem] border p-4" style={{ borderColor: index === 3 ? C.gBright : C.gray100, backgroundColor: index === 3 ? C.gPale : C.offWhite }}>
                  <div className="text-2xl font-semibold" style={{ color: C.gDark }}>{value}</div>
                  <div className="mt-1 text-sm" style={{ color: C.gray600 }}>{label}</div>
                </div>
              ))}
            </div>
            {user ? <div className="mt-5 rounded-[1.4rem] border p-4 text-sm" style={{ borderColor: C.gLight, backgroundColor: C.gPale, color: C.gDark }}>XP guide actif: chaque tache cochee tente une synchronisation gamification.</div> : null}
          </article>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Checklist etape par etape</p>
            <div className="mt-5 space-y-4">
              {detail.steps.map((item) => {
                const done = countDone(item.tasks, doneMap)
                const complete = done === item.tasks.length
                const open = !!openSteps[item.id]
                return (
                  <div key={item.id} className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: C.gLight }}>
                    <button type="button" onClick={() => setOpenSteps((state) => ({ ...state, [item.id]: !state[item.id] }))} className="flex w-full flex-col items-start justify-between gap-3 px-4 py-4 text-left transition duration-200 sm:flex-row sm:items-center sm:gap-4" style={{ backgroundColor: complete ? C.gLight : C.gPale }}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <div className="font-semibold" style={{ color: C.gDark }}>{item.title}</div>
                            <div className="text-xs" style={{ color: C.gray600 }}>{item.delay}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: C.gBright, color: C.gMid, backgroundColor: C.white }}>{done}/{item.tasks.length} taches</span>
                        <span style={{ color: C.gDark }}>{open ? '−' : '+'}</span>
                      </div>
                    </button>
                    {open ? (
                      <div className="border-t p-2" style={{ borderColor: C.gPale, backgroundColor: C.white }}>
                        {item.tasks.map((taskItem) => (
                          <div key={taskItem.id} className="border-b last:border-b-0" style={{ borderColor: C.gPale }}>
                            <CheckRow checked={!!doneMap[taskItem.id]} onToggle={() => toggleItem(taskItem.id, !doneMap[taskItem.id], taskItem.category)}>
                              <span className="inline-flex flex-wrap items-center gap-2">
                                <ExternalText item={taskItem} />
                                {taskItem.important ? <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: C.gAccent, color: C.gDark }}>IMPORTANT</span> : null}
                              </span>
                            </CheckRow>
                          </div>
                        ))}
                        {item.note ? <div className="mx-3 mb-3 mt-2 rounded-[1rem] border p-3 text-sm" style={{ borderColor: C.gLight, backgroundColor: C.offWhite, color: C.gDark }}>{item.note}</div> : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </article>

          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Documents requis</p>
            <div className="mt-5 space-y-5">
              {Object.values(detail.docs).map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold" style={{ color: C.gDark }}>{group.title}</h3>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <div key={item.id} className="rounded-[1.2rem] border p-1" style={{ borderColor: item.important ? C.gAccent : C.gray100, backgroundColor: item.important ? 'rgba(0,217,126,0.06)' : C.offWhite }}>
                        <CheckRow checked={!!doneMap[item.id]} onToggle={() => toggleItem(item.id, !doneMap[item.id], 'documents')} subtle>
                          <span className="flex w-full items-center gap-2">
                            <ExternalText item={item} />
                            {item.important ? <span className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: C.gAccent, color: C.gDark }}>CLE</span> : null}
                          </span>
                        </CheckRow>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Conseils et alertes</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-[1.5rem] p-4" style={{ backgroundColor: C.gPale }}>
                <h3 className="text-sm font-semibold" style={{ color: C.gDark }}>Conseils pratiques</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6" style={{ color: C.gray600 }}>{detail.tips.conseils.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
              <div className="rounded-[1.5rem] p-4" style={{ backgroundColor: C.offWhite, border: `1px solid ${C.gray200}` }}>
                <h3 className="text-sm font-semibold" style={{ color: C.gDark }}>Erreurs a eviter</h3>
                <ul className="mt-3 space-y-3 text-sm leading-6" style={{ color: C.gray600 }}>{detail.tips.erreurs.map((item) => <li key={item}>• {item}</li>)}</ul>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
            <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Vue comparative</p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-[13px] sm:text-sm">
                <thead>
                  <tr style={{ color: C.gDark }}>
                    <th className="pb-3 pr-4">Critere</th>
                    <th className="pb-3 pr-4">Au Pair</th>
                    <th className="pb-3 pr-4">FSJ</th>
                    <th className="pb-3 pr-4">BFD</th>
                    <th className="pb-3">Ausbildung</th>
                  </tr>
                </thead>
                <tbody style={{ color: C.gray600 }}>
                  {COMPARISON.map((row) => (
                    <tr key={row[0]} className="border-t" style={{ borderColor: C.gray100 }}>
                      {row.map((cell, index) => <td key={`${row[0]}-${index}`} className="py-3 pr-4">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[2rem] border p-5 sm:p-6" style={{ borderColor: C.gLight, backgroundColor: C.white }}>
          <p className="text-xs font-semibold uppercase tracking-[0.26em]" style={{ color: C.gMid }}>Sources officielles</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {SOURCES.map(([label, href]) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border px-4 py-2 text-sm font-semibold transition" style={{ borderColor: C.gLight, backgroundColor: C.offWhite, color: C.gDark }}>
                {label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
