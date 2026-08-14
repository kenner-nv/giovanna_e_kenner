/* =========================================================
   FIREBASE — Lista de Presentes (Giovanna & Kenner)
   Camada de integração com Firebase Authentication (anônimo)
   e Cloud Firestore. Este arquivo NÃO altera o HTML/CSS/JS de
   apresentação existentes: ele apenas lê o "GiftsRegistry"
   exposto por js/lista-presentes.js e conversa com o Firestore.

   Requisitos: Firebase Web SDK modular (v10), sem Cloud
   Functions. Carregado como <script type="module">.
   ========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/* ---------------------------------------------------------
   1) CONFIGURAÇÃO DO FIREBASE
   Substitua pelos valores do seu projeto (Configurações do
   projeto > Seus apps > SDK do Firebase, no console). Estas
   chaves são públicas por natureza no Firebase Web SDK — a
   segurança real vem das Security Rules do Firestore, não
   deste arquivo.
   --------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyDW02Hy-EDMovxuZ2FUgp-G4shVY6_pV5Q",
  authDomain: "site-casamento-keg.firebaseapp.com",
  projectId: "site-casamento-keg",
  storageBucket: "site-casamento-keg.firebasestorage.app",
  messagingSenderId: "329553657252",
  appId: "1:329553657252:web:28ff8f84f529853ddc5531"
};

/* ---------------------------------------------------------
   ESTADO EM MEMÓRIA (nunca é a fonte de verdade — apenas
   cache para evitar leituras redundantes; toda operação de
   escrita revalida no Firestore antes de confirmar).
   --------------------------------------------------------- */
let app = null;
let auth = null;
let db = null;
let currentUid = null;
let reservationsUnsubscribe = null;
let dataReady = false;

/* ---------------------------------------------------------
   BOOTSTRAP
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", boot);

async function boot() {
  buildFloatingUI();
  window.GiftsRegistry.onGiftActivate(handleGiftActivate);
  setLoadingState(true);

  try {
    initializeFirebase();
    await initializeAnonymousAuth();
    await initializeUserDocument(currentUid);
    await loadGifts();
    await loadReservations();
    listenToReservations();
    setLoadingState(false);
    showHint();
  } catch (err) {
    console.error("[lista-presentes] Falha ao iniciar Firebase:", err);
    setLoadingState(false, true);
    showErrorMessage("Não foi possível carregar a lista de presentes agora. Atualize a página para tentar novamente.");
  }
}

/* ---------------------------------------------------------
   2) INICIALIZAÇÃO
   --------------------------------------------------------- */
function initializeFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "SUA_API_KEY") {
    throw new Error("firebase-config-missing");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

function initializeAnonymousAuth() {
  return new Promise((resolve, reject) => {
    let settled = false;
    onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUid = user.uid;
        if (!settled) {
          settled = true;
          resolve(currentUid);
        }
      }
    });
    signInAnonymously(auth).catch((err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

async function initializeUserDocument(uid) {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { possui_reserva: false, pode_cancelar: true });
  }
}

/* ---------------------------------------------------------
   3) CARREGAMENTO DOS PRESENTES E RESERVAS
   --------------------------------------------------------- */
async function loadGifts() {
  // Fonte de verdade EXCLUSIVA do catálogo (nome/foto) é a
  // coleção "presentes" no Firestore. Não há mais catálogo
  // local: se a coleção estiver vazia ou inacessível, a lista
  // simplesmente fica vazia (o erro é tratado pelo chamador).
  const snap = await getDocs(collection(db, "presentes"));
  const gifts = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    gifts.push({ id: docSnap.id, nome: data.nome, foto: data.foto });
  });

  if (!gifts.length) {
    console.warn("[lista-presentes] A coleção 'presentes' está vazia no Firestore.");
  }

  window.GiftsRegistry.renderGifts(gifts);
}

async function loadReservations() {
  const snap = await getDocs(collection(db, "reservas"));
  const reservedIds = new Set();
  snap.forEach((docSnap) => reservedIds.add(docSnap.id));

  window.GiftsRegistry.getAllIds().forEach((id) => {
    if (reservedIds.has(id)) {
      window.GiftsRegistry.markReserved(id);
    } else {
      window.GiftsRegistry.markAvailable(id);
    }
  });

  dataReady = true;
}

function listenToReservations() {
  if (reservationsUnsubscribe) return; // evita listeners duplicados

  reservationsUnsubscribe = onSnapshot(collection(db, "reservas"), (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      if (change.type === "removed") {
        window.GiftsRegistry.markAvailable(id);
      } else {
        window.GiftsRegistry.markReserved(id);
      }
    });
  }, (err) => {
    console.error("[lista-presentes] onSnapshot(reservas) falhou:", err);
  });
}

/* ---------------------------------------------------------
   4) INTERAÇÃO — clique num presente
   --------------------------------------------------------- */
function handleGiftActivate(id) {
  if (!dataReady) return;
  const item = window.GiftsRegistry.getItem(id);
  if (!item) return;

  hideHint();

  if (item.reserved) {
    openCancelFlow(id, item);
  } else {
    openReserveFlow(id, item);
  }
}

/* ---------------------------------------------------------
   5) RESERVAR UM PRESENTE
   --------------------------------------------------------- */
function openReserveFlow(id, item) {
  showConfirmSheet({
    titleHtml: `Deseja reservar <span class="lp-sheet__highlight">${escapeHtml(item.desc)}</span> como seu presente para os noivos?`,
    confirmLabel: "Sim",
    cancelLabel: "Cancelar",
    onConfirm: () => continueReserveFlow(id, item)
  });
}

async function continueReserveFlow(id, item) {
  if (!auth || !auth.currentUser) {
    showErrorMessage("Não foi possível confirmar sua sessão. Atualize a página e tente novamente.");
    return;
  }
  const uid = auth.currentUser.uid;

  let userState;
  try {
    userState = await getUserState(uid);
  } catch (err) {
    showErrorMessage("Não foi possível concluir a reserva. Tente novamente.");
    return;
  }

  if (userState.possui_reserva) {
    showErrorMessage("Você já possui uma reserva ativa. Cancele-a antes de reservar outro presente.");
    return;
  }

  showNameSheet({
    title: "Digite o seu nome para a reserva:",
    confirmLabel: "Reservar",
    onConfirm: async (rawName) => {
      const nome = normalizeName(rawName);
      if (!nome) {
        showErrorMessage("Por favor, digite um nome válido.");
        return false; // mantém o sheet aberto
      }
      const ok = await reserveGift(id, uid, nome);
      return ok;
    }
  });
}

async function reserveGift(id, uid, nome) {
  const reservaRef = doc(db, "reservas", id);
  const userRef = doc(db, "usuarios", uid);

  try {
    await runTransaction(db, async (tx) => {
      const reservaSnap = await tx.get(reservaRef);
      if (reservaSnap.exists()) {
        throw new Error("gift-already-reserved");
      }
      const userSnap = await tx.get(userRef);
      const possuiReserva = userSnap.exists() ? !!userSnap.data().possui_reserva : false;
      if (possuiReserva) {
        throw new Error("user-already-has-reservation");
      }

      tx.set(reservaRef, {
        id_presente: id,
        nome: nome,
        timestamp: serverTimestamp()
      });
      tx.set(userRef, { possui_reserva: true, pode_cancelar: true }, { merge: true });
    });

    await createLog("reserva_criada", { uid, id_presente: id, nome });
    window.GiftsRegistry.markReserved(id);
    closeSheet();
    showSuccessMessage("Presente reservado com sucesso! Muito obrigado pelo carinho. 💜");
    return true;
  } catch (err) {
    console.error("[lista-presentes] Erro ao reservar:", err);
    if (err && err.message === "gift-already-reserved") {
      window.GiftsRegistry.markReserved(id);
      showErrorMessage("Esse presente acabou de ser reservado por outro convidado. Escolha outro, por favor.");
    } else if (err && err.message === "user-already-has-reservation") {
      showErrorMessage("Você já possui uma reserva ativa. Cancele-a antes de reservar outro presente.");
    } else {
      showErrorMessage("Não foi possível concluir a reserva. Tente novamente.");
    }
    return false;
  }
}

/* ---------------------------------------------------------
   6) CANCELAR UMA RESERVA
   --------------------------------------------------------- */
function openCancelFlow(id, item) {
  showConfirmSheet({
    title: "Esse presente já foi reservado!",
    subtitleHtml: 'Se foi você quem fez a reserva, você pode <span class="lp-sheet__link" data-role="start-cancel">cancelar essa reserva</span>.',
    confirmLabel: null,
    cancelLabel: "Fechar",
    onLinkClick: () => continueCancelFlow(id, item)
  });
}

function continueCancelFlow(id, item) {
  showNameSheet({
    title: "Qual o nome utilizado para fazer a reserva?",
    confirmLabel: "Continuar",
    onConfirm: async (rawName) => {
      const nome = normalizeName(rawName);
      if (!nome) {
        showErrorMessage("Por favor, digite um nome válido.");
        return false;
      }
      const ok = await cancelReservation(id, nome);
      return ok;
    }
  });
}

async function cancelReservation(id, nomeInformado) {
  if (!auth || !auth.currentUser) {
    showErrorMessage("Não foi possível confirmar sua sessão. Atualize a página e tente novamente.");
    return false;
  }
  const uid = auth.currentUser.uid;
  const reservaRef = doc(db, "reservas", id);

  let reservaSnap;
  try {
    reservaSnap = await getDoc(reservaRef);
  } catch (err) {
    showErrorMessage("Não foi possível concluir o cancelamento. Tente novamente.");
    return false;
  }

  if (!reservaSnap.exists()) {
    // já foi cancelada por outra pessoa / outra aba
    window.GiftsRegistry.markAvailable(id);
    showErrorMessage("Esse presente já está disponível novamente.");
    return true;
  }

  const nomeArmazenado = reservaSnap.data().nome;
  if (nomeArmazenado !== nomeInformado) {
    await createLog("tentativa_cancelamento", { uid, id_presente: id, nome: nomeInformado, resultado: "nome_incorreto" });
    showErrorMessage("O nome informado não corresponde ao nome usado nesta reserva.");
    return false;
  }

  let userState;
  try {
    userState = await getUserState(uid);
  } catch (err) {
    showErrorMessage("Não foi possível concluir o cancelamento. Tente novamente.");
    return false;
  }

  if (!userState.pode_cancelar) {
    showErrorMessage("Você não pode realizar esse cancelamento agora. Faça uma nova reserva para liberar essa ação novamente.");
    return false;
  }

  const userRef = doc(db, "usuarios", uid);
  try {
    await runTransaction(db, async (tx) => {
      const freshReserva = await tx.get(reservaRef);
      if (!freshReserva.exists() || freshReserva.data().nome !== nomeInformado) {
        throw new Error("reservation-changed");
      }
      const freshUser = await tx.get(userRef);
      const podeCancelar = freshUser.exists() && freshUser.data().pode_cancelar !== undefined
        ? !!freshUser.data().pode_cancelar
        : true;
      if (!podeCancelar) {
        throw new Error("no-cancel-rights");
      }
      tx.delete(reservaRef);
      tx.set(userRef, { possui_reserva: false, pode_cancelar: false }, { merge: true });
    });

    await createLog("reserva_cancelada", { uid, id_presente: id, nome: nomeInformado });
    window.GiftsRegistry.markAvailable(id);
    closeSheet();
    showSuccessMessage("Reserva cancelada com sucesso.");
    return true;
  } catch (err) {
    console.error("[lista-presentes] Erro ao cancelar:", err);
    if (err && err.message === "reservation-changed") {
      showErrorMessage("Essa reserva já foi alterada. Atualize a página e tente novamente.");
    } else if (err && err.message === "no-cancel-rights") {
      showErrorMessage("Você não pode realizar esse cancelamento agora. Faça uma nova reserva para liberar essa ação novamente.");
    } else {
      showErrorMessage("Não foi possível concluir o cancelamento. Tente novamente.");
    }
    return false;
  }
}

/* ---------------------------------------------------------
   7) HELPERS DE DADOS
   --------------------------------------------------------- */
async function getUserState(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return { possui_reserva: false, pode_cancelar: true };
  const data = snap.data();
  return {
    possui_reserva: !!data.possui_reserva,
    pode_cancelar: data.pode_cancelar !== undefined ? !!data.pode_cancelar : true
  };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeName(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  // remove tudo que não for letra (com acentos) ou espaço — descarta números e caracteres especiais
  s = s.replace(/[^\p{L}\s]/gu, "");
  s = s.replace(/\s+/g, " ").trim();
  return s.toUpperCase();
}

async function createLog(tipo, data) {
  try {
    await addDoc(collection(db, "logs"), {
      tipo,
      ...data,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    // Logs não devem travar o fluxo do usuário caso as regras
    // de segurança impeçam leitura de confirmação, etc.
    console.warn("[lista-presentes] Falha ao registrar log:", err);
  }
}

/* ---------------------------------------------------------
   8) ESTADO DE CARREGAMENTO
   --------------------------------------------------------- */
function setLoadingState(isLoading, hasError) {
  window.GiftsRegistry.setInteractionEnabled(!isLoading && !hasError);
  document.querySelectorAll(".lp__grid").forEach((grid) => {
    grid.classList.toggle("lp__grid--loading", !!isLoading);
  });
}

/* ---------------------------------------------------------
   9) UI FLUTUANTE (sheet + toast)
   Criada dinamicamente em JS para não alterar o HTML original.
   --------------------------------------------------------- */
let sheetOverlayEl, sheetEl, sheetTitleEl, sheetSubtitleEl, sheetInputWrapEl, sheetInputEl, sheetActionsEl;
let toastEl, toastTimer;
let hintEl, hintDismissed = false;
let activeSheetHandlers = {};

function buildFloatingUI() {
  sheetOverlayEl = document.createElement("div");
  sheetOverlayEl.className = "lp-sheet-overlay";
  sheetOverlayEl.innerHTML = `
    <div class="lp-sheet" role="dialog" aria-modal="true">
      <p class="lp-sheet__title"></p>
      <p class="lp-sheet__subtitle" hidden></p>
      <div class="lp-sheet__input-wrap" hidden>
        <input type="text" class="lp-sheet__input" maxlength="80" autocomplete="off" />
      </div>
      <div class="lp-sheet__actions"></div>
    </div>`;
  document.body.appendChild(sheetOverlayEl);

  sheetEl = sheetOverlayEl.querySelector(".lp-sheet");
  sheetTitleEl = sheetOverlayEl.querySelector(".lp-sheet__title");
  sheetSubtitleEl = sheetOverlayEl.querySelector(".lp-sheet__subtitle");
  sheetInputWrapEl = sheetOverlayEl.querySelector(".lp-sheet__input-wrap");
  sheetInputEl = sheetOverlayEl.querySelector(".lp-sheet__input");
  sheetActionsEl = sheetOverlayEl.querySelector(".lp-sheet__actions");

  sheetOverlayEl.addEventListener("click", (ev) => {
    if (ev.target === sheetOverlayEl) closeSheet();
  });
  sheetSubtitleEl.addEventListener("click", (ev) => {
    if (ev.target && ev.target.dataset.role === "start-cancel" && activeSheetHandlers.onLinkClick) {
      activeSheetHandlers.onLinkClick();
    }
  });

  toastEl = document.createElement("div");
  toastEl.className = "lp-toast";
  toastEl.setAttribute("role", "status");
  toastEl.innerHTML = '<p class="lp-toast__msg"></p>';
  document.body.appendChild(toastEl);

  hintEl = document.createElement("div");
  hintEl.className = "lp-hint";
  hintEl.setAttribute("role", "status");
  hintEl.innerHTML = '<p class="lp-hint__msg">Você pode reservar um presente clicando nele</p>';
  document.body.appendChild(hintEl);
}

function showHint() {
  if (hintDismissed) return;
  hintEl.classList.add("is-open");
}

function hideHint() {
  if (hintDismissed) return;
  hintDismissed = true;
  hintEl.classList.remove("is-open");
}

function closeSheet() {
  sheetOverlayEl.classList.remove("is-open");
  activeSheetHandlers = {};
}

function showConfirmSheet({ title, titleHtml, subtitleHtml, confirmLabel, cancelLabel, onConfirm, onLinkClick }) {
  activeSheetHandlers = { onLinkClick };

  if (titleHtml) {
    sheetTitleEl.innerHTML = titleHtml;
  } else {
    sheetTitleEl.textContent = title;
  }

  if (subtitleHtml) {
    sheetSubtitleEl.innerHTML = subtitleHtml;
    sheetSubtitleEl.hidden = false;
  } else {
    sheetSubtitleEl.hidden = true;
  }
  sheetInputWrapEl.hidden = true;

  sheetActionsEl.innerHTML = "";
  if (confirmLabel) {
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "lp-sheet__btn lp-sheet__btn--ghost";
    cancelBtn.textContent = cancelLabel || "Cancelar";
    cancelBtn.addEventListener("click", closeSheet);

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "lp-sheet__btn lp-sheet__btn--primary";
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener("click", () => {
      closeSheet();
      onConfirm && onConfirm();
    });

    sheetActionsEl.appendChild(cancelBtn);
    sheetActionsEl.appendChild(confirmBtn);
  } else {
    const closeBtn = document.createElement("button");
    closeBtn.className = "lp-sheet__btn lp-sheet__btn--ghost lp-sheet__btn--single";
    closeBtn.textContent = cancelLabel || "Fechar";
    closeBtn.addEventListener("click", closeSheet);
    sheetActionsEl.appendChild(closeBtn);
  }

  sheetOverlayEl.classList.add("is-open");
}

function showNameSheet({ title, confirmLabel, onConfirm }) {
  sheetTitleEl.textContent = title;
  sheetSubtitleEl.hidden = true;
  sheetInputWrapEl.hidden = false;
  sheetInputEl.value = "";

  sheetActionsEl.innerHTML = "";
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "lp-sheet__btn lp-sheet__btn--ghost";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.addEventListener("click", closeSheet);

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "lp-sheet__btn lp-sheet__btn--primary";
  confirmBtn.textContent = confirmLabel;
  const submit = async () => {
    confirmBtn.disabled = true;
    const value = sheetInputEl.value;
    const shouldClose = await onConfirm(value);
    confirmBtn.disabled = false;
    if (shouldClose !== false) {
      // o próprio onConfirm já fecha o sheet em caso de sucesso
    }
  };
  confirmBtn.addEventListener("click", submit);
  sheetInputEl.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      submit();
    }
  });

  sheetActionsEl.appendChild(cancelBtn);
  sheetActionsEl.appendChild(confirmBtn);

  sheetOverlayEl.classList.add("is-open");
  setTimeout(() => sheetInputEl.focus(), 50);
}

function showToast(message, variant) {
  clearTimeout(toastTimer);
  toastEl.className = "lp-toast is-open lp-toast--" + variant;
  toastEl.querySelector(".lp-toast__msg").textContent = message;
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("is-open");
  }, 4200);
}

function showSuccessMessage(message) {
  showToast(message, "success");
}

function showErrorMessage(message) {
  showToast(message, "error");
}
