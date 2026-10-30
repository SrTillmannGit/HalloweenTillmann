/**
 * Fotos - Avistamentos Halloween
 *
 * Copia para uma pasta do Google Drive SOMENTE as fotos aprovadas na página de
 * moderação. Se uma foto for tirada do mural ou excluída depois, a cópia vai
 * para a lixeira do Drive. Só as fotos: nomes, locais e relatos não são copiados.
 *
 * Como usar (em script.google.com, logado na conta do Drive desejada):
 *   1. Cole este código no lugar do conteúdo de "Código.gs" e salve.
 *   2. Selecione a função "configurar" e clique em Executar. Autorize o acesso.
 *      Ela cria a pasta, copia as fotos que já existem e agenda a cópia
 *      automática a cada 5 minutos.
 *   3. Depois da festa, execute "parar" para desligar o agendamento.
 */

const SUPABASE_URL = "https://smkhiwwbhuppkzmerwkt.supabase.co";
// chave "anon public": a mesma que já está no site, só permite enviar e ver
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNta2hpd3diaHVwcGt6bWVyd2t0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNzc3NjYsImV4cCI6MjEwODk1Mzc2Nn0.AD6Wc5Jwxj1MbVInNjhg0DcLzGgSyGkU9hxisunf15M";
const TABELA = "avistamentos";

const NOME_PASTA = "Fotos - Avistamentos Halloween";
const MINUTOS = 5;
const POR_RODADA = 40; // o Apps Script limita cada execução a 6 minutos

const props = PropertiesService.getScriptProperties();

/** Rode uma vez: cria a pasta, agenda e faz a primeira cópia. */
function configurar() {
  pasta_();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "sincronizar")
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronizar").timeBased().everyMinutes(MINUTOS).create();
  sincronizar();
  Logger.log("Pronto. Pasta: " + pasta_().getUrl());
}

/** Desliga a cópia automática (as fotos já copiadas continuam no Drive). */
function parar() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "sincronizar")
    .forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log("Cópia automática desligada.");
}

// cada cópia guarda na descrição o número do registro no banco
const MARCA = "avistamento:";

/** Deixa a pasta igual às fotos aprovadas: copia as novas e tira as que deixaram de estar aprovadas. */
function sincronizar() {
  const trava = LockService.getScriptLock();
  if (!trava.tryLock(1000)) return; // uma rodada anterior ainda está rodando

  try {
    const url = SUPABASE_URL + "/rest/v1/" + TABELA +
      "?select=id,foto_url&aprovado=eq.true&order=id.asc&limit=5000";
    const resp = UrlFetchApp.fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
      muteHttpExceptions: true,
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error("Supabase respondeu " + resp.getResponseCode() + ": " + resp.getContentText());
    }
    const aprovadas = JSON.parse(resp.getContentText());
    const idsAprovados = new Set(aprovadas.map(r => String(r.id)));

    // o que já está na pasta; arquivos sem a marca vieram da versão antiga do
    // script (que copiava antes da aprovação) e vão para a lixeira
    const pasta = pasta_(), noDrive = new Set();
    const arquivos = pasta.getFiles();
    while (arquivos.hasNext()) {
      const arq = arquivos.next(), desc = arq.getDescription() || "";
      const id = desc.startsWith(MARCA) ? desc.slice(MARCA.length) : null;
      if (id && idsAprovados.has(id) && !noDrive.has(id)) noDrive.add(id);
      else arq.setTrashed(true);
    }

    let copiadas = 0;
    for (const r of aprovadas) {
      if (noDrive.has(String(r.id))) continue;
      if (copiadas >= POR_RODADA) break; // o resto vai na próxima rodada
      const foto = UrlFetchApp.fetch(r.foto_url, { muteHttpExceptions: true });
      if (foto.getResponseCode() !== 200) {
        // tenta de novo na próxima rodada
        Logger.log("Foto indisponível no avistamento " + r.id + ": " + foto.getResponseCode());
        continue;
      }
      const numero = Number(props.getProperty("contador") || 0) + 1;
      pasta.createFile(foto.getBlob().setName("Avistamento " + String(numero).padStart(3, "0") + ".jpg"))
        .setDescription(MARCA + r.id);
      props.setProperty("contador", String(numero));
      copiadas++;
    }
  } finally {
    trava.releaseLock();
  }
}

function pasta_() {
  const id = props.getProperty("pastaId");
  if (id) {
    try {
      const pasta = DriveApp.getFolderById(id);
      if (!pasta.isTrashed()) return pasta;
    } catch (e) { /* pasta apagada: cria outra */ }
  }
  const pasta = DriveApp.createFolder(NOME_PASTA);
  // pasta nova recomeça a numeração e copia todas as fotos aprovadas de novo
  props.setProperties({ pastaId: pasta.getId(), contador: "0" });
  return pasta;
}
