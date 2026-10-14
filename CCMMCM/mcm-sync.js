import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Public Firebase app identifiers, copied from MCM; authorization is enforced by Firestore rules.
const app = initializeApp({
  apiKey: "AIzaSyDf7l23Q9tz0eOQupzkUlnMQtSHDvs14QA",
  authDomain: "mcm-reposteria.firebaseapp.com",
  projectId: "mcm-reposteria",
  appId: "1:563376696410:web:deb011d387a85fc7d8bc63"
});
const auth = getAuth(app);
const cloud = getFirestore(app);
const allowedEmails = ["osvillat@gmail.com", "calderamoralesmarisol@gmail.com"];
let stop = null;
const status = text => { document.getElementById("mcmStatus").textContent = text; };

function listen(user) {
  if (stop) { stop(); stop = null; }
  document.getElementById("mcmDisconnect").hidden = !user;
  if (!user) { status("Sin conectar. Las cotizaciones locales siguen disponibles."); return; }
  if (!user.emailVerified || !allowedEmails.includes(user.email)) {
    status("Esta cuenta no está autorizada para recibir pedidos de MCM.");
    return;
  }
  status("Recibiendo solicitudes de MCM…");
  // ponytail: Scan the immutable inbox on reconnect; use a paginated cursor if its history grows large.
  stop = onSnapshot(collection(cloud, "orderRequests"), {includeMetadataChanges: true}, snapshot => {
    try {
      if (snapshot.metadata.fromCache) {
        status("Sin confirmación del servidor. Esperando conexión para recibir solicitudes.");
        return;
      }
      // The full snapshot also retries any local save that previously failed.
      const result = window.receiveMCMRequests(snapshot.docs.map(doc => ({id: doc.id, data: doc.data()})));
      status("Conectado: " + user.email + ". " + result.pending + " vistas previas pendientes. " +
        (result.imported ? result.imported + " nuevas guardadas en este navegador. " : "") +
        (result.invalid ? result.invalid + " solicitudes inválidas sin importar." : ""));
    } catch (e) { status(e.message + " Pulsa Conectar con Google para reintentar."); }
  }, () => status("No se pudieron recibir pedidos. Revisa las reglas de Firebase y vuelve a conectar."));
}

onAuthStateChanged(auth, listen);

export async function connect() {
  if (auth.currentUser && auth.currentUser.emailVerified && allowedEmails.includes(auth.currentUser.email)) listen(auth.currentUser);
  else await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function disconnect() {
  if (stop) { stop(); stop = null; }
  await signOut(auth);
}
