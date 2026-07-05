// main.js - funzioni del calcolatore


// Apre e chiude il menu su mobile
document.getElementById('hamburger').addEventListener('click', function () {
  document.getElementById('navLinks').classList.toggle('open');
});


// Compongo l'indirizzo diretto del pdf della guida, così inquadrando il qr si apre subito il documento
if (typeof QRCode !== 'undefined') {
  var urlPagina = 'https://lucianavolpe.github.io/riskfood/guida_rischio_ristorativo.pdf';
  new QRCode(document.getElementById('qrcode'), {
    text: urlPagina,
    width: 150,
    height: 150,
    colorDark: '#0E2317',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });
} else {
  // Se la libreria non c'è mostra un messaggio al posto del qr
  document.getElementById('qrcode').innerHTML =
    '<p>QR non disponibile</p>';
}

// Quando scelgo un rischio dal menu precompilo P e D
function loadRiskPreset() {
  var sel = document.getElementById('riskType');
  var opt = sel.options[sel.selectedIndex];
  var descrizione = opt.getAttribute('data-desc') || '';
  var valP = opt.getAttribute('data-p') || '';
  var valD = opt.getAttribute('data-d') || '';

  document.getElementById('riskDesc').textContent =
    descrizione || 'Seleziona un rischio per vedere la descrizione.';

  if (valP) setSelectValue('prob', valP);
  if (valD) setSelectValue('danno', valD);

  // tengo specchiati anche i campi manuali, sennò uno restava col valore vecchio
  document.getElementById('pManual').value = valP;
  document.getElementById('dManual').value = valD;

}


// la uso sia dal preset che dall'inserimento manuale, così i due canali restano allineati
function setSelectValue(id, val) {
  var sel = document.getElementById(id);
  for (var i = 0; i < sel.options.length; i++) {
    if (sel.options[i].value === val) {
      sel.options[i].selected = true;
      break;
    }
  }
}


// Se scrive il numero a mano aggiorno anche la select
function syncFromManual(campo) {
  var v;
  if (campo === 'p') {
    v = parseInt(document.getElementById('pManual').value);
    if (v >= 1 && v <= 5) setSelectValue('prob', String(v));
  } else {
    v = parseInt(document.getElementById('dManual').value);
    if (v >= 1 && v <= 5) setSelectValue('danno', String(v));
  }
}


// Calcolo principale R = P x D
function calculate() {
  var pDaSelect = parseInt(document.getElementById('prob').value);
  var dDaSelect = parseInt(document.getElementById('danno').value);
  var pManuale = parseInt(document.getElementById('pManual').value);
  var dManuale = parseInt(document.getElementById('dManual').value);

  // regola di precedenza vince la select se compilata, altrimenti il campo manuale.
  // prima i due canali andavano in conflitto tra loro
  var P = !isNaN(pDaSelect) ? pDaSelect : pManuale;
  var D = !isNaN(dDaSelect) ? dDaSelect : dManuale;

  var menuRischi = document.getElementById('riskType');
  var nomeRischio = menuRischi.options[menuRischi.selectedIndex]
    ? menuRischi.options[menuRischi.selectedIndex].text
    : '—';
  if (nomeRischio === '— Seleziona un rischio —') nomeRischio = '(nessuno selezionato)';

  // se manca P o D mi fermo qui, perché nelle prime prove il risultato veniva NaN
  if (isNaN(P) || isNaN(D)) {
    document.getElementById('resType').textContent = nomeRischio;
    return;
  }

  // Blocco i valori fuori scala scritti a mano (es. 7): la scala va da 1 a 5
  if (P < 1 || P > 5 || D < 1 || D > 5) {
    var ind = document.getElementById('riskIndicator');
    ind.textContent = 'Inserisci valori tra 1 e 5';
    ind.className = 'risk-indicator empty';
    return;
  }

  // Allinea i campi manuali
  document.getElementById('pManual').value = P;
  document.getElementById('dManual').value = D;

  // R va da 1 (1x1) a 25 (5x5); le soglie dei quattro livelli sono qui sotto
  var R = P * D;

  // Aggiorna il pannello risultati
  document.getElementById('resType').textContent = nomeRischio;
  document.getElementById('resP').textContent = P;
  document.getElementById('resD').textContent = D;
  document.getElementById('resR').textContent = R;
  document.getElementById('resFormula').textContent = 'R = ' + P + ' × ' + D + ' = ' + R;

  // Determina il livello
  var livello, testo, classeCss;
  if (R <= 4) {
    livello = 'BASSO';
    testo = 'R = ' + R + ' - Rischio BASSO';
    classeCss = 'low';
  } else if (R <= 9) {
    livello = 'MEDIO';
    testo = 'R = ' + R + ' - Rischio MEDIO';
    classeCss = 'med';
  } else if (R <= 16) {
    livello = 'ALTO';
    testo = 'R = ' + R + ' - Rischio ALTO';
    classeCss = 'hi';
  } else {
    livello = 'CRITICO';
    testo = 'R = ' + R + ' - Rischio CRITICO';
    classeCss = 'crit';
  }

  // Aggiorna l'indicatore colorato
  var indicatore = document.getElementById('riskIndicator');
  indicatore.textContent = testo;
  indicatore.className = 'risk-indicator ' + classeCss;

  // Aggiorno le misure di prevenzione e la matrice
  showMeasures(livello);
  buildMatrix(P, D);
}


// Misure di prevenzione per ogni livello di rischio 
var misurePerLivello = {
  BASSO: [
    'Controllare periodicamente che il rischio non aumenti.',
    'Informazione e formazione per i lavoratori.',
    'Mantenimento delle misure preventive esistenti.'
  ],
  MEDIO: [
    'Prendere provvedimenti entro 6 mesi.',
    'Aggiornare il Documento di Valutazione dei Rischi (DVR).',
    'Verificare e aggiornare i DPI (Dispositivi di Protezione Individuale).',
    'Formazione specifica per i lavoratori.'
  ],
  ALTO: [
    'Intervento urgente da eseguire entro 30 giorni.',
    'Rivedere subito le procedure di lavoro.',
    'Nomina del Responsabile del Servizio di Prevenzione e Protezione (RSPP).',
    'Sorveglianza sanitaria periodica obbligatoria.',
    'Aggiornamento schede HACCP e piano di autocontrollo alimentare.'
  ],
  CRITICO: [
    'SOSPENSIONE IMMEDIATA dell\'attività a rischio.',
    'Notifica immediata agli organi di vigilanza (ASL, INAIL).',
    'Intervento del consulente della sicurezza entro 24 ore.',
    'Rivedere come si lavora in azienda.',
    'Nuova valutazione del rischio prima della ripresa dell\'attività.'
  ]
};

// Aggiorna il box delle misure con quelle del livello calcolato
function showMeasures(livello) {
  var lista = document.getElementById('measuresList');
  var box = document.querySelector('.measures-box');

  // Costruisce la lista
  var html = '';
  var voci = misurePerLivello[livello];
  for (var i = 0; i < voci.length; i++) {
    html += '<li>' + voci[i] + '</li>';
  }
  lista.innerHTML = html;

  // Cambia il colore del bordo in base al livello
  var colori = { BASSO: '#4A7C59', MEDIO: '#C9A84C', ALTO: '#B84C2B', CRITICO: '#721C24' };
  box.style.borderLeft = '4px solid ' + colori[livello];
}


// Costruisce la griglia 5x5 nel div #matrixGrid
function buildMatrix(evidenziaP, evidenziaD) {
  var griglia = document.getElementById('matrixGrid');
  griglia.innerHTML = '';

  // Prima riga: angolo + P=1..5
  aggiungiCella(griglia, 'D \\ P', 'header-cell');
  for (var p = 1; p <= 5; p++) {
    aggiungiCella(griglia, 'P=' + p, 'header-cell');
  }

  // Righe: D da 5 (più pericoloso, in alto) a 1
  for (var d = 5; d >= 1; d--) {
    aggiungiCella(griglia, 'D=' + d, 'row-header');
    // uso p2 per evitare conflitto con la variabile p del ciclo sopra
    for (var p2 = 1; p2 <= 5; p2++) {
      var r = p2 * d;
      var classe = getClasseCella(r);
      var attiva = (p2 === evidenziaP && d === evidenziaD);
      aggiungiCella(griglia, r, 'cell ' + classe + (attiva ? ' highlighted-cell' : ''));
    }
  }
}

// Restituisce la classe css in base al valore R
function getClasseCella(r) {
  if (r <= 4)  return 'l'; // verde - basso
  if (r <= 9)  return 'm'; // giallo - medio
  if (r <= 16) return 'h'; // arancio - alto
  return 'c'; // rosso - critico
}

// Crea e aggiunge una cella alla griglia
function aggiungiCella(griglia, testo, classi) {
  var cella = document.createElement('div');
  cella.className = classi;
  cella.textContent = testo;
  griglia.appendChild(cella);
  return cella;
}


// costruisce la matrice vuota quando la pagina viene aperta
// passando 0,0 nessuna cella viene evidenziata
buildMatrix(0, 0)