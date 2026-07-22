// Control de versión de Base de Datos para pruebas automáticas limpias
const DB_VERSION = '2.2';
if (localStorage.getItem('arkantos_db_version') !== DB_VERSION) {
  localStorage.clear();
  localStorage.setItem('arkantos_db_version', DB_VERSION);
}

// Datos de prueba de profesionales integrados directamente
const initialProfessionals = [
  {
    id: 1,
    name: "Test Provider",
    category: "Abogados",
    specialty: "Abogado Penalista General",
    bio: "Perfil de prueba inicial listo para usar. Ofrezco asesoramiento integral.",
    rating: 5.0,
    reviewsCount: 0,
    positiveReviewsPercent: 100,
    acceptanceStars: 5.0,
    acceptancePercent: 100,
    location: { lat: -27.3670, lng: -55.8960, neighborhood: "Microcentro" },
    price: 15000,
    atHome: false,
    hasLocal: true,
    address: "Av. Uruguay 1234, Posadas",
    verified: true,
    active: true,
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120&h=120",
    phone: "+54 376 422-2222",
    email: "test@provider.com",
    portfolio: [
      { id: 1, title: "Asesoramiento Penal Exitoso", desc: "Defensa penal integral en caso de siniestro vial con resolución favorable.", img: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=150&h=120" },
      { id: 2, title: "Redacción de Contratos", desc: "Redacción de contratos de alquiler comerciales para locales céntricos.", img: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=150&h=120" }
    ],
    agenda: {
      Lunes: ["08:00", "09:00", "10:00", "11:00", "15:00", "17:00"],
      Martes: ["08:00", "09:00", "10:00", "11:00", "15:00", "17:00"],
      Miercoles: ["08:00", "09:00", "10:00", "11:00", "15:00", "17:00"],
      Jueves: ["08:00", "09:00", "10:00", "11:00", "15:00", "17:00"],
      Viernes: ["08:00", "09:00", "10:00", "11:00"],
      Sabado: [],
      Domingo: []
    }
  }
];

// Usuarios Base por Defecto
const defaultUsers = [
  { name: "Test Client", email: "test@client.com", password: "123", phone: "+54 376 411-1111", role: "client" },
  { name: "Test Provider", email: "test@provider.com", password: "123", phone: "+54 376 422-2222", role: "provider", hasLocal: true, address: "Av. Uruguay 1234, Posadas" }
];

// Estado global
const state = {
  userLocation: { lat: -27.36708, lng: -55.89608 },
  users: [],
  professionals: [],
  selectedCategory: 'all',
  searchTerm: '',
  searchRange: 100.0,
  onlyAtHome: false,
  activeView: 'client',
  activeClientSubview: 'explore',
  
  // Autenticación
  isAuthenticated: false,
  currentUser: null,
  selectedRegisterRole: 'client',

  generatedVerificationCode: null,
  pendingUserToVerify: null,

  // SMS Celular
  generatedSmsCode: null,
  pendingPhoneToVerify: null,
  phoneRegisterRole: 'client',

  // Recuperación
  generatedRecoveryCode: null,
  pendingRecoveryEmail: null,



  activeChatId: null,
  activeClientChatId: null,
  chats: [],
  bookings: [],
  favorites: [],
  showOnlyFavorites: false,
  activeSosRequest: null,
  receivedEmergency: null,
  
  selectedBooking: {
    proId: null,
    day: null,
    time: null
  },

  activeReviewBookingId: null,
  pendingQualityRating: 5,
  pendingAcceptanceRating: 5
};

let map;
let geofenceCircle;
let markersGroup = [];
let userMarker;
let proEditMap;
let proEditMarker;
let clientBookingsMap;
let clientBookingsMarker;
let clientMapMarkers = [];
let pendingPortfolioImage = null;
let profileEditing = false;
let activePortfolioWorkId = null;
let pendingEditPortfolioImage = null;
let currentCalendarStartOfWeek = null;
let clientProfileEditing = false;
let pendingClientAvatarImage = null;

document.addEventListener('DOMContentLoaded', () => {
  try {
    loadFromLocalStorage(); // Carga de datos persistidos
    currentCalendarStartOfWeek = getStartOfWeek(new Date());
  } catch (e) {
    console.error("Error al cargar de localStorage o inicializar fecha:", e);
  }

  try {
    lucide.createIcons();
  } catch (e) {
    console.error("Error al crear iconos de Lucide:", e);
  }

  try {
    initMap();
  } catch (e) {
    console.error("Error al inicializar mapa:", e);
  }

  try {
    initAuthLogic();
  } catch (e) {
    console.error("Error al inicializar lógica de Auth:", e);
  }

  try {
    initClientEventListeners();
  } catch (e) {
    console.error("Error al inicializar oyentes de Cliente:", e);
  }

  try {
    initProfessionalEventListeners();
  } catch (e) {
    console.error("Error al inicializar oyentes de Socio:", e);
  }

  try {
    initMissionVisionLogic();
  } catch (e) {
    console.error("Error al inicializar oyentes de Misión/Visión:", e);
  }

  try {
    initPhoneAndRecoveryLogic(); 
  } catch (e) {
    console.error("Error al inicializar oyentes de Celular/Recuperación:", e);
  }

  try {
    initPortfolioDetailListeners();
  } catch (e) {
    console.error("Error al inicializar oyentes de Detalle de Portafolio:", e);
  }
  
  // Si el usuario ya estaba autenticado, saltar la pantalla de login
  try {
    if (state.isAuthenticated && state.currentUser) {
      const authScreen = document.getElementById('auth-screen');
      if (authScreen) {
        authScreen.classList.add('hidden');
      }
      switchView(state.currentUser.role === 'provider' ? 'professional' : 'client');
    }
  } catch (e) {
    console.error("Error al restaurar sesión activa:", e);
  }

  try {
    renderProfessionals();
  } catch (e) {
    console.error("Error al renderizar profesionales:", e);
  }

  try {
    renderInstantProviders();
  } catch (e) {
    console.error("Error al renderizar prestadores instantáneos:", e);
  }

  try {
    updateChatBadges();
    checkForUnratedBookings();
  } catch (e) {
    console.error("Error al actualizar badges o verificar calificaciones pendientes:", e);
  }
});

function getCurrentPro() {
  if (state.currentUser && state.currentUser.role === 'provider') {
    const pro = state.professionals.find(p => p.email.toLowerCase() === state.currentUser.email.toLowerCase());
    if (pro) return pro;
  }
  return state.professionals.find(p => p.id === 3) || state.professionals[0];
}

function getStartOfWeek(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDayNameInSpanish(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  return days[date.getDay()];
}

function formatBookingDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    const dayName = getDayNameInSpanish(dateStr);
    return `${dayName} ${day}/${month}/${year}`;
  }
  return dateStr;
}

window.finalizeBooking = (bookingId) => {
  const booking = state.bookings.find(b => String(b.id) === String(bookingId));
  if (!booking) return;

  booking.status = "Finalizado";
  saveToLocalStorage();

  showToast(
    "🎉 Servicio Completado",
    "¡Buen trabajo! El servicio ha sido marcado como completado y movido al historial.",
    "success"
  );

  updateDashboardMetrics();
  renderProCalendar();
  renderProfessionals();
};

function renderProHistory() {
  const listContainer = document.getElementById('pro-history-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const pro = getCurrentPro();
  if (!pro) return;

  const finishedBookings = state.bookings.filter(b => 
    b.proId === pro.id && 
    (b.status === "Finalizado" || b.status === "Calificado")
  );

  finishedBookings.sort((a, b) => b.id - a.id);

  const count = finishedBookings.length;
  const historyBtnCount = document.getElementById('lbl-pro-history-count');
  if (historyBtnCount) historyBtnCount.innerText = count;

  const summaryCount = document.getElementById('lbl-pro-history-summary-count');
  if (summaryCount) summaryCount.innerText = `${count} trabajo${count === 1 ? '' : 's'}`;

  const totalEarned = finishedBookings.reduce((sum, b) => sum + b.price, 0);
  const summaryAmount = document.getElementById('lbl-pro-history-summary-amount');
  if (summaryAmount) summaryAmount.innerText = `$${totalEarned.toLocaleString('es-AR')}`;

  if (finishedBookings.length === 0) {
    listContainer.innerHTML = `<div class="text-center text-xs text-slate-550 py-8 italic font-sans">Aún no tienes trabajos completados en tu historial.</div>`;
    return;
  }

  finishedBookings.forEach(b => {
    const card = document.createElement('div');
    card.className = "bg-slate-950/60 border border-slate-850/80 rounded-xl p-3 flex flex-col gap-2";

    let ratingHTML = '';
    if (b.status === "Calificado") {
      ratingHTML = `
        <div class="flex items-center gap-1 text-[9px] font-bold text-brand-gold-500 mt-1">
          <i data-lucide="star" class="w-3 h-3 fill-current"></i>
          <span>Servicio Calificado</span>
        </div>
      `;
    } else {
      ratingHTML = `
        <div class="flex items-center gap-1 text-[9px] font-bold text-emerald-450 mt-1">
          <i data-lucide="check" class="w-3 h-3"></i>
          <span>Completado</span>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-[8px] font-extrabold uppercase bg-brand-gold-500/10 text-brand-gold-500 px-1.5 py-0.5 rounded">Trabajo #${b.id}</span>
          <h4 class="text-xs font-bold text-white mt-1">Cliente Particular</h4>
          <p class="text-[10px] text-slate-450 flex items-center gap-0.5 mt-0.5">
            <i data-lucide="calendar" class="w-3 h-3 text-brand-gold-500"></i>
            ${formatBookingDate(b.date)} a las ${b.time} hs
          </p>
        </div>
        <div class="text-right">
          <span class="text-[9px] text-slate-500 block">Cobrado</span>
          <span class="text-xs font-extrabold text-white">$${b.price.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <div class="border-t border-slate-900/60 pt-1.5 flex justify-between items-center">
        ${ratingHTML}
      </div>
    `;
    listContainer.appendChild(card);
  });

  lucide.createIcons();
}

// --- PERSISTENCIA LOCAL EN LOCALSTORAGE ---
function loadFromLocalStorage() {
  // Cargar usuarios
  const storedUsers = localStorage.getItem('arkantos_users');
  if (storedUsers) {
    state.users = JSON.parse(storedUsers);
  } else {
    state.users = [...defaultUsers];
    localStorage.setItem('arkantos_users', JSON.stringify(state.users));
  }

  // Cargar profesionales
  const storedPros = localStorage.getItem('arkantos_professionals');
  if (storedPros) {
    state.professionals = JSON.parse(storedPros);
  } else {
    state.professionals = [...initialProfessionals];
    localStorage.setItem('arkantos_professionals', JSON.stringify(state.professionals));
  }

  // Cargar reservas (bookings)
  const storedBookings = localStorage.getItem('arkantos_bookings');
  if (storedBookings) {
    state.bookings = JSON.parse(storedBookings);
  } else {
    state.bookings = [
      {
        id: Date.now() - 100000,
        proId: 1,
        clientEmail: "test@client.com",
        day: "Lunes",
        time: "09:00",
        status: "Aceptado",
        price: 15000,
        neighborhood: "Microcentro"
      }
    ];
    localStorage.setItem('arkantos_bookings', JSON.stringify(state.bookings));
  }

  // Cargar chats unificados (Matias y Laura mapeados a sus correos exactos)
  const storedChats = localStorage.getItem('arkantos_chats');
  if (storedChats) {
    state.chats = JSON.parse(storedChats);
  } else {
    state.chats = [];
    localStorage.setItem('arkantos_chats', JSON.stringify(state.chats));
  }

  // Cargar favoritos
  const storedFavorites = localStorage.getItem('arkantos_favorites');
  if (storedFavorites) {
    state.favorites = JSON.parse(storedFavorites);
  } else {
    state.favorites = [];
    localStorage.setItem('arkantos_favorites', JSON.stringify(state.favorites));
  }

  // Cargar emergencia recibida
  const storedEmerg = localStorage.getItem('arkantos_received_emergency');
  if (storedEmerg) {
    state.receivedEmergency = JSON.parse(storedEmerg);
  } else {
    state.receivedEmergency = null;
  }

  // Cargar sesión activa
  const storedAuth = localStorage.getItem('arkantos_is_authenticated');
  if (storedAuth === 'true') {
    state.isAuthenticated = true;
    state.currentUser = JSON.parse(localStorage.getItem('arkantos_current_user'));
  }
}

function saveToLocalStorage() {
  localStorage.setItem('arkantos_users', JSON.stringify(state.users));
  localStorage.setItem('arkantos_professionals', JSON.stringify(state.professionals));
  localStorage.setItem('arkantos_bookings', JSON.stringify(state.bookings));
  localStorage.setItem('arkantos_chats', JSON.stringify(state.chats));
  localStorage.setItem('arkantos_favorites', JSON.stringify(state.favorites || []));
  localStorage.setItem('arkantos_received_emergency', JSON.stringify(state.receivedEmergency));
  localStorage.setItem('arkantos_is_authenticated', state.isAuthenticated ? 'true' : 'false');
  localStorage.setItem('arkantos_current_user', JSON.stringify(state.currentUser));
  updateChatBadges();
}

// --- LÓGICA DE CELULAR Y RECUPERACIÓN DE CONTRASEÑA ---
function initPhoneAndRecoveryLogic() {
  const btnAuthSms = document.getElementById('btn-auth-sms');
  const phoneAuthModal = document.getElementById('phone-auth-modal');
  const btnClosePhoneModal = document.getElementById('btn-close-phone-modal');
  const btnSendSmsCode = document.getElementById('btn-send-sms-code');
  const btnVerifySmsCode = document.getElementById('btn-verify-sms-code');
  const phoneAuthNumber = document.getElementById('phone-auth-number');
  const phoneSmsInput = document.getElementById('phone-sms-input');
  
  const phoneStepEnter = document.getElementById('phone-step-enter');
  const phoneStepVerify = document.getElementById('phone-step-verify');
  const phoneRoleSelectorContainer = document.getElementById('phone-role-selector-container');
  const phoneRoleClient = document.getElementById('phone-role-client');
  const phoneRolePro = document.getElementById('phone-role-pro');

  const btnForgotPasswordLink = document.getElementById('btn-forgot-password-link');
  const recoveryPasswordModal = document.getElementById('recovery-password-modal');
  const btnCloseRecoveryModal = document.getElementById('btn-close-recovery-modal');
  
  const btnSendRecoveryCode = document.getElementById('btn-send-recovery-code');
  const btnVerifyRecoveryCode = document.getElementById('btn-verify-recovery-code');
  const btnSubmitNewPassword = document.getElementById('btn-submit-new-password');
  
  const recoveryEmailInput = document.getElementById('recovery-email-input');
  const recoveryCodeVerifyInput = document.getElementById('recovery-code-verify-input');
  const recoveryNewPassword = document.getElementById('recovery-new-password');
  const recoveryConfirmPassword = document.getElementById('recovery-confirm-password');
  
  const recoveryStepEmail = document.getElementById('recovery-step-email');
  const recoveryStepCode = document.getElementById('recovery-step-code');
  const recoveryStepPassword = document.getElementById('recovery-step-password');

  // --- LÓGICA INGRESO POR CELULAR ---
  btnAuthSms.addEventListener('click', () => {
    phoneAuthModal.classList.remove('hidden');
    phoneAuthModal.classList.add('flex');
    
    phoneStepEnter.classList.remove('hidden');
    phoneStepVerify.classList.add('hidden');
    phoneRoleSelectorContainer.classList.add('hidden');
    phoneAuthNumber.value = '';
    phoneSmsInput.value = '';
  });

  btnClosePhoneModal.addEventListener('click', () => {
    phoneAuthModal.classList.add('hidden');
    phoneAuthModal.classList.remove('flex');
  });

  btnSendSmsCode.addEventListener('click', () => {
    const number = phoneAuthNumber.value.trim();
    if (!number || number.length < 7) {
      showToast("⚠️ Número Inválido", "Por favor ingresa un número de celular válido.", "warning");
      return;
    }

    const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
    state.generatedSmsCode = secureCode;
    state.pendingPhoneToVerify = number;

    showToast(
      "💬 Código SMS Enviado",
      `Mensaje enviado a ${number}. Tu código de activación es: ${secureCode}`,
      "info"
    );

    phoneStepEnter.classList.add('hidden');
    phoneStepVerify.classList.remove('hidden');

    const matched = state.users.find(u => u.phone === number);
    if (!matched) {
      phoneRoleSelectorContainer.classList.remove('hidden');
      phoneRoleSelectorContainer.classList.add('flex');
    } else {
      phoneRoleSelectorContainer.classList.add('hidden');
    }
  });

  phoneRoleClient.addEventListener('click', () => {
    state.phoneRegisterRole = 'client';
    phoneRoleClient.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-md text-slate-950 bg-brand-gold-500 transition-all focus:outline-none";
    phoneRolePro.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-md text-slate-455 hover:text-slate-205 transition-all focus:outline-none";
  });

  phoneRolePro.addEventListener('click', () => {
    state.phoneRegisterRole = 'provider';
    phoneRolePro.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-md text-slate-955 bg-brand-gold-500 transition-all focus:outline-none";
    phoneRoleClient.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-md text-slate-455 hover:text-slate-205 transition-all focus:outline-none";
  });

  btnVerifySmsCode.addEventListener('click', () => {
    const entered = phoneSmsInput.value.trim();
    if (entered === state.generatedSmsCode) {
      phoneAuthModal.classList.add('hidden');
      phoneAuthModal.classList.remove('flex');
      
      const number = state.pendingPhoneToVerify;
      const isPro = number.includes("4222222") || number.includes("422-2222");
      
      let matched = state.users.find(u => u.phone === number);
      if (!matched) {
        matched = {
          name: isPro ? "Test Provider" : `Usuario ${number.slice(-4)}`,
          email: isPro ? "test@provider.com" : `celular.${Date.now()}@arkantos.com`,
          phone: number,
          password: "123",
          role: isPro ? 'provider' : state.phoneRegisterRole
        };
        state.users.push(matched);
        saveToLocalStorage();
      }

      state.generatedSmsCode = null;
      state.pendingPhoneToVerify = null;

      triggerAuthTransition(matched, 1500);
    } else {
      showToast("⚠️ Código SMS incorrecto", "El código ingresado no coincide con el enviado a tu celular.", "warning");
    }
  });

  // --- LÓGICA RECUPERACIÓN DE CONTRASEÑA ---
  btnForgotPasswordLink.addEventListener('click', () => {
    recoveryPasswordModal.classList.remove('hidden');
    recoveryPasswordModal.classList.add('flex');
    
    recoveryStepEmail.classList.remove('hidden');
    recoveryStepCode.classList.add('hidden');
    recoveryStepPassword.classList.add('hidden');
    recoveryEmailInput.value = '';
    recoveryCodeVerifyInput.value = '';
    recoveryNewPassword.value = '';
    recoveryConfirmPassword.value = '';
  });

  btnCloseRecoveryModal.addEventListener('click', () => {
    recoveryPasswordModal.classList.add('hidden');
    recoveryPasswordModal.classList.remove('flex');
  });

  btnSendRecoveryCode.addEventListener('click', () => {
    const email = recoveryEmailInput.value.trim();
    if (!email || !email.includes('@')) {
      showToast("⚠️ Correo Inválido", "Ingresa una dirección de correo válida.", "warning");
      return;
    }

    const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
    state.generatedRecoveryCode = secureCode;
    state.pendingRecoveryEmail = email;

    showToast(
      "🔑 Código de Recuperación",
      `Código enviado a ${email}. Tu código es: ${secureCode}`,
      "info"
    );

    recoveryStepEmail.classList.add('hidden');
    recoveryStepCode.classList.remove('hidden');
  });

  btnVerifyRecoveryCode.addEventListener('click', () => {
    const entered = recoveryCodeVerifyInput.value.trim();
    if (entered === state.generatedRecoveryCode) {
      state.generatedRecoveryCode = null;

      recoveryStepCode.classList.add('hidden');
      recoveryStepPassword.classList.remove('hidden');
      
      showToast("🔑 Código validado", "Define tu nueva contraseña de acceso.", "success");
    } else {
      showToast("⚠️ Código incorrecto", "Revisa tus notificaciones y vuelve a intentar.", "warning");
    }
  });

  btnSubmitNewPassword.addEventListener('click', () => {
    const pass1 = recoveryNewPassword.value;
    const pass2 = recoveryConfirmPassword.value;

    if (!pass1 || pass1.length < 4) {
      showToast("⚠️ Contraseña Corta", "La contraseña debe tener al menos 4 caracteres.", "warning");
      return;
    }

    if (pass1 !== pass2) {
      showToast("⚠️ Contraseñas diferentes", "Ambas contraseñas deben ser idénticas.", "warning");
      return;
    }

    const userToUpdate = state.users.find(u => u.email.toLowerCase() === state.pendingRecoveryEmail.toLowerCase());
    if (userToUpdate) {
      userToUpdate.password = pass1;
      saveToLocalStorage();
    }

    document.getElementById('login-email').value = state.pendingRecoveryEmail;
    document.getElementById('login-password').value = pass1;

    state.pendingRecoveryEmail = null;

    recoveryPasswordModal.classList.add('hidden');
    recoveryPasswordModal.classList.remove('flex');

    showToast(
      "🔒 Contraseña Reestablecida",
      "Tu cuenta ha sido actualizada. Ya puedes ingresar con tu nueva clave.",
      "success"
    );
  });
}

// --- LÓGICA DE MISIÓN Y VISIÓN ---
function initMissionVisionLogic() {
  const btnShowMision = document.getElementById('btn-show-mision');
  const btnShowVision = document.getElementById('btn-show-vision');
  const txtMisionContent = document.getElementById('txt-mision-content');
  const txtVisionContent = document.getElementById('txt-vision-content');

  btnShowMision.addEventListener('click', () => {
    btnShowMision.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-lg text-slate-950 bg-brand-gold-500 transition-all focus:outline-none";
    btnShowVision.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-lg text-slate-455 hover:text-slate-205 transition-all focus:outline-none";

    txtMisionContent.classList.remove('hidden');
    setTimeout(() => {
      txtMisionContent.className = "text-[10.5px] text-slate-300 leading-relaxed text-center transition-all duration-300 transform scale-100 opacity-100";
    }, 50);

    txtVisionContent.className = "text-[10.5px] text-slate-300 leading-relaxed text-center transition-all duration-300 transform scale-95 opacity-0 absolute";
    setTimeout(() => {
      txtVisionContent.classList.add('hidden');
    }, 300);
  });

  btnShowVision.addEventListener('click', () => {
    btnShowVision.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-lg text-slate-955 bg-brand-gold-500 transition-all focus:outline-none";
    btnShowMision.className = "flex-1 py-1.5 text-[9px] font-extrabold rounded-lg text-slate-455 hover:text-slate-205 transition-all focus:outline-none";

    txtVisionContent.classList.remove('hidden');
    setTimeout(() => {
      txtVisionContent.className = "text-[10.5px] text-slate-300 leading-relaxed text-center transition-all duration-300 transform scale-100 opacity-100";
    }, 50);

    txtMisionContent.className = "text-[10.5px] text-slate-300 leading-relaxed text-center transition-all duration-300 transform scale-95 opacity-0 absolute";
    setTimeout(() => {
      txtMisionContent.classList.add('hidden');
    }, 300);
  });
}

// --- LÓGICA DE AUTENTICACIÓN ---
function initAuthLogic() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const roleClient = document.getElementById('role-client');
  const roleProvider = document.getElementById('role-provider');
  
  const btnAuthGoogle = document.getElementById('btn-auth-google');
  const googleAuthModal = document.getElementById('google-auth-modal');
  const btnCloseGoogleModal = document.getElementById('btn-close-google-modal');
  const btnGoogleAccount1 = document.getElementById('btn-google-account-1');
  const btnGoogleAccount2 = document.getElementById('btn-google-account-2');

  const emailVerificationModal = document.getElementById('email-verification-modal');
  const btnCloseVerification = document.getElementById('btn-close-verification');
  const btnSubmitVerification = document.getElementById('btn-submit-verification');
  const verificationCodeInput = document.getElementById('verification-code-input');
  const verificationEmailLabel = document.getElementById('verification-email-label');
  const verificationError = document.getElementById('verification-error');
  const btnResendCode = document.getElementById('btn-resend-code');

  tabLogin.addEventListener('click', () => {
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-white bg-slate-850 shadow";
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-200";
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-white bg-slate-850 shadow";
    tabLogin.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-slate-200";
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  });

  roleClient.addEventListener('click', () => {
    state.selectedRegisterRole = 'client';
    roleClient.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-slate-950 bg-brand-gold-500 transition-all";
    roleProvider.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-slate-400 hover:text-slate-200 transition-all";
  });

  roleProvider.addEventListener('click', () => {
    state.selectedRegisterRole = 'provider';
    roleProvider.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-slate-950 bg-brand-gold-500 transition-all";
    roleClient.className = "flex-1 py-1.5 text-[10px] font-extrabold rounded-lg text-slate-400 hover:text-slate-200 transition-all";
  });

  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    const matchedUser = state.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

    if (matchedUser) {
      triggerAuthTransition(matchedUser, 1500);
    } else {
      const isProEmail = email.toLowerCase().includes('abogado') || email.toLowerCase().includes('socio') || email.toLowerCase().includes('hugo');
      const newUser = {
        name: isProEmail ? "Dr. Hugo Benítez" : email.split('@')[0],
        email: email,
        password: pass,
        phone: "+54 376 400-0000",
        role: isProEmail ? 'provider' : 'client'
      };
      
      state.users.push(newUser);
      saveToLocalStorage();
      triggerAuthTransition(newUser, 1500);
    }
  });

  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const pass = document.getElementById('register-password').value;

    if (name && email && phone && pass) {
      const existing = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        showToast("⚠️ Cuenta Existente", "Este correo electrónico ya está registrado.", "warning");
        return;
      }

      const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
      state.generatedVerificationCode = secureCode;
      state.pendingUserToVerify = {
        name: name,
        email: email,
        phone: phone,
        password: pass,
        role: state.selectedRegisterRole
      };

      verificationEmailLabel.innerText = email;
      verificationCodeInput.value = '';
      verificationError.classList.add('hidden');
      emailVerificationModal.classList.remove('hidden');
      emailVerificationModal.classList.add('flex');

      showToast(
        "🔑 Código de Seguridad Enviado",
        `Tu código de activación para ${email} es: ${secureCode}`,
        "info"
      );
    }
  });

  btnSubmitVerification.addEventListener('click', () => {
    verifyRegistrationCode();
  });

  verificationCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      verifyRegistrationCode();
    }
  });

  btnCloseVerification.addEventListener('click', () => {
    emailVerificationModal.classList.add('hidden');
    emailVerificationModal.classList.remove('flex');
    state.generatedVerificationCode = null;
    state.pendingUserToVerify = null;
  });

  btnResendCode.addEventListener('click', () => {
    if (state.pendingUserToVerify) {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      state.generatedVerificationCode = newCode;
      showToast(
        "🔑 Nuevo Código de Seguridad",
        `Tu nuevo código de activación es: ${newCode}`,
        "info"
      );
    }
  });

  function verifyRegistrationCode() {
    const entered = verificationCodeInput.value.trim();
    if (entered === state.generatedVerificationCode) {
      emailVerificationModal.classList.add('hidden');
      emailVerificationModal.classList.remove('flex');
      
      const user = state.pendingUserToVerify;
      state.generatedVerificationCode = null;
      state.pendingUserToVerify = null;

      state.users.push(user);
      saveToLocalStorage();

      triggerAuthTransition(user, 1600);
    } else {
      verificationError.classList.remove('hidden');
      showToast("⚠️ Código Incorrecto", "El código ingresado no coincide con el enviado a tu correo.", "warning");
    }
  }

  btnAuthGoogle.addEventListener('click', () => {
    googleAuthModal.classList.remove('hidden');
    googleAuthModal.classList.add('flex');
  });

  btnCloseGoogleModal.addEventListener('click', () => {
    googleAuthModal.classList.add('hidden');
    googleAuthModal.classList.remove('flex');
  });

  btnGoogleAccount1.addEventListener('click', () => {
    googleAuthModal.classList.add('hidden');
    googleAuthModal.classList.remove('flex');
    triggerAuthTransition({
      name: "Jonatan",
      email: "jonatan@gmail.com",
      role: 'client',
      phone: "+54 376 499-1122"
    }, 1200);
  });

  btnGoogleAccount2.addEventListener('click', () => {
    googleAuthModal.classList.add('hidden');
    googleAuthModal.classList.remove('flex');
    showToast("Google Auth", "Redirigiendo a ventana externa de Google Accounts...", "info");
    
    setTimeout(() => {
      triggerAuthTransition({
        name: "Nuevo Usuario Google",
        email: "nuevo.google@gmail.com",
        role: 'client',
        phone: "+54 376 400-9988"
      }, 1200);
    }, 1500);
  });
}

function triggerAuthTransition(user, delayMs) {
  const loader = document.getElementById('auth-loader-overlay');
  const title = document.getElementById('auth-loader-title');
  const subtitle = document.getElementById('auth-loader-subtitle');

  if (user.role === 'provider') {
    title.innerText = "Cargando Portal Socio...";
    subtitle.innerText = "Configurando panel de servicios";
  } else {
    title.innerText = "Preparando tu espacio...";
    subtitle.innerText = "Buscando profesionales en la zona";
  }

  loader.classList.remove('hidden');

  setTimeout(() => {
    state.currentUser = user;
    state.isAuthenticated = true;

    if (user.role === 'provider') {
      const exists = state.professionals.some(p => p.email === user.email);
      if (!exists) {
        // Encontrar un ID único libre
        const maxId = state.professionals.reduce((max, p) => p.id > max ? p.id : max, 0);
        const newPro = {
          id: maxId + 1,
          name: user.name,
          email: user.email,
          category: "Abogados", // Categoría por defecto
          specialty: "Asesoría Legal y Consultas",
          bio: "Sin biografía redactada aún. Puedes agregarla desde tu sección de Perfil.",
          rating: 5.0, // 5 estrellas por defecto
          reviewsCount: 0,
          positiveReviewsPercent: 100,
          acceptanceStars: 5.0,
          acceptancePercent: 100,
          location: { 
            lat: -27.36708 + (Math.random() - 0.5) * 0.02, 
            lng: -55.89608 + (Math.random() - 0.5) * 0.02, 
            neighborhood: "Villa Sarita" 
          },
          price: 20000,
          atHome: true,
          verified: false,
          active: false,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120",
          phone: user.phone || "+54 376 400-0000",
          agenda: {
            Lunes: ["09:00", "11:00", "15:00", "17:00"],
            Martes: ["09:00", "10:00", "15:00", "16:00"],
            Miercoles: ["11:00", "15:00", "17:00"],
            Jueves: ["09:00", "10:00", "17:00"],
            Viernes: ["09:00", "11:00", "15:00", "16:00", "17:00"],
            Sabado: [],
            Domingo: []
          }
        };
        state.professionals.push(newPro);
      }
    }

    saveToLocalStorage(); // Guardar sesión activa y nuevo profesional si aplica

    loader.classList.add('hidden');

    showToast(
      "¡Acceso Concedido!", 
      `Bienvenido a Arkantos, ${user.name}.`, 
      "success"
    );

    const authScreen = document.getElementById('auth-screen');
    authScreen.classList.add('fade-out-custom');

    setTimeout(() => {
      authScreen.classList.add('hidden');
      authScreen.classList.remove('fade-out-custom');
      
      if (user.role === 'provider') {
        switchView('professional');
      } else {
        switchView('client');
      }
    }, 600);

  }, delayMs);
}

// --- GEOLOCALIZACIÓN Y MAPAS ---
function initMap() {
  try {
    if (typeof L === 'undefined' || !document.getElementById('map')) {
      console.warn("La librería Leaflet no está cargada o el contenedor #map no existe. Se omite la inicialización del mapa.");
      return;
    }
    map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([state.userLocation.lat, state.userLocation.lng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    const userIcon = L.divIcon({
      className: 'relative flex items-center justify-center',
      html: `
        <div class="relative flex items-center justify-center w-5 h-5">
          <span class="absolute inline-flex h-full w-full rounded-full bg-brand-gold-500 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-gold-500 border border-slate-950"></span>
        </div>
      `,
      iconSize: [20, 20]
    });

    userMarker = L.marker([state.userLocation.lat, state.userLocation.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup('<b class="text-slate-955">Tu Ubicación Actual</b><br><span class="text-xs text-slate-500">Plaza 9 de Julio, Posadas</span>');

    geofenceCircle = L.circle([state.userLocation.lat, state.userLocation.lng], {
      color: '#D4AF37',
      fillColor: '#D4AF37',
      fillOpacity: 0.08,
      radius: state.searchRange * 1000,
      weight: 2,
      dashArray: '5, 8'
    }).addTo(map);

    map.fitBounds(geofenceCircle.getBounds(), { padding: [10, 10] });
  } catch (err) {
    console.error("Error al inicializar el mapa de Leaflet:", err);
  }
}

function updateGeofence(radiusKm) {
  state.searchRange = radiusKm;
  
  if (typeof L !== 'undefined' && map && geofenceCircle) {
    try {
      geofenceCircle.setRadius(radiusKm * 1000);
      map.flyToBounds(geofenceCircle.getBounds(), {
        padding: [15, 15],
        duration: 1.2
      });
    } catch (err) {
      console.error("Error al actualizar geocerca:", err);
    }
  }

  renderProfessionals();
}

function matchCategory(proCategory, filterValue) {
  if (!filterValue || filterValue === 'all') return true;
  if (!proCategory) return false;
  const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/s$/, '');
  return normalize(proCategory) === normalize(filterValue);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// --- RENDERIZACIÓN DE PROFESIONALES ---
function renderProfessionals() {
  const container = document.getElementById('professionals-list');
  if (!container) return;
  container.innerHTML = '';

  if (typeof L !== 'undefined' && map) {
    try {
      markersGroup.forEach(m => map.removeLayer(m));
    } catch (e) {
      console.error("Error clearing Leaflet markers:", e);
    }
  }
  markersGroup = [];

  const filtered = state.professionals.filter(pro => {
    pro.distance = calculateDistance(
      state.userLocation.lat,
      state.userLocation.lng,
      pro.location.lat,
      pro.location.lng
    );

    if (pro.distance > state.searchRange) return false;
    if (!matchCategory(pro.category, state.selectedCategory)) return false;
    if (state.onlyAtHome && !pro.atHome) return false;
    if (state.showOnlyFavorites && !state.favorites.includes(pro.id)) return false;

    if (state.searchTerm.trim() !== '') {
      const term = state.searchTerm.toLowerCase();
      const matchName = pro.name.toLowerCase().includes(term);
      const matchSpecialty = pro.specialty.toLowerCase().includes(term);
      const matchNeighborhood = pro.location.neighborhood.toLowerCase().includes(term);
      if (!matchName && !matchSpecialty && !matchNeighborhood) return false;
    }

    return true;
  });

  const getWeightedScore = (p) => {
    const qualityNorm = p.rating; 
    const acceptanceNorm = p.acceptanceStars; 
    return (qualityNorm * 0.6) + (acceptanceNorm * 0.4);
  };

  filtered.sort((a, b) => {
    return getWeightedScore(b) - getWeightedScore(a);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center py-8 px-4 text-slate-600">
        <i data-lucide="info" class="w-8 h-8 mb-2 text-slate-750"></i>
        <p class="text-sm font-semibold">No se encontraron profesionales</p>
        <p class="text-xs">Prueba cambiando tu radio o categoría.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(pro => {
    if (typeof L !== 'undefined' && map) {
      try {
        const customPin = L.divIcon({
          className: 'relative',
          html: `
            <button class="relative flex items-center justify-center w-8 h-8 rounded-full bg-black border-2 border-brand-gold-500 shadow-lg shadow-brand-gold-500/20 transition-transform transform active:scale-110">
              <img src="${pro.avatar}" class="w-full h-full rounded-full object-cover">
              ${pro.verified ? `
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-brand-gold-500 border border-black rounded-full flex items-center justify-center">
                  <svg class="w-2.5 h-2.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              ` : ''}
              ${pro.active ? `
                <span class="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border border-black rounded-full animate-pulse"></span>
              ` : ''}
            </button>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([pro.location.lat, pro.location.lng], { icon: customPin }).addTo(map);
        
        const popupContent = `
          <div class="p-3 flex flex-col gap-1 text-slate-200 bg-slate-955 border border-brand-gold-500/20 rounded-xl min-w-[170px]">
            <div class="flex items-center gap-1.5">
              <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-gold-500/10 text-brand-gold-500">${pro.category}</span>
              ${pro.active ? '<span class="text-[8px] font-bold text-green-500 flex items-center gap-0.5"><span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>En Línea</span>' : ''}
            </div>
            <h4 class="font-bold text-sm text-white">${pro.name}</h4>
            <p class="text-[10px] text-slate-400 -mt-0.5">${pro.specialty}</p>
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900">
              <span class="text-xs font-extrabold text-brand-gold-500">$${(pro.price * 1.15).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
              <button onclick="window.openBookingSheetFromGlobal(${pro.id})" class="text-[9px] bg-brand-gold-500 font-extrabold text-slate-950 px-2 py-1 rounded hover:bg-brand-gold-600 transition">Agendar</button>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { closeButton: false });
        markersGroup.push(marker);
      } catch (e) {
        console.error("Error drawing marker for pro id " + pro.id, e);
      }
    }

    const finalPrice = Math.round(pro.price * 1.15);

    const card = document.createElement('div');
    card.className = "bg-slate-900/90 border border-slate-850 hover:border-brand-gold-500/30 rounded-2xl p-3.5 flex gap-3.5 transition-all shadow-md relative overflow-hidden group";
    
    card.innerHTML = `
      <div class="relative w-14 h-14 rounded-full bg-slate-850 border border-slate-700 flex-shrink-0">
        <img src="${pro.avatar}" alt="${pro.name}" class="w-full h-full rounded-full object-cover bg-slate-950">
        ${pro.verified ? `
          <div class="absolute -bottom-1 -right-1 bg-brand-gold-500 rounded-full border border-black p-0.5">
            <svg class="w-2.5 h-2.5 text-slate-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ` : ''}
        ${pro.active ? `
          <div class="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse" title="En línea ahora"></div>
        ` : ''}
      </div>

      <div class="flex-1 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-center mb-0.5">
            <span class="text-[9px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-brand-gold-500/10 text-brand-gold-500 border border-brand-gold-500/15">
              ${pro.category}
            </span>
            <div class="flex items-center gap-1.5">
              ${pro.verified ? `
                <button type="button" class="btn-verified-badge text-green-400 hover:text-green-300 transition-colors cursor-pointer" title="Verificado por Arkantos">
                  <i data-lucide="check-circle-2" class="w-3.5 h-3.5 fill-green-950/20"></i>
                </button>
              ` : ''}
              <button onclick="window.openProProfileModal(${pro.id})" type="button" class="btn-view-pro-profile text-[9px] font-extrabold text-brand-gold-500 hover:text-brand-gold-600 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                <i data-lucide="user" class="w-2.5 h-2.5"></i>
                Ver perfil
              </button>
            </div>
          </div>

          <h3 class="font-bold text-white text-base leading-tight">${pro.name}</h3>
          <p class="text-xs text-slate-400 font-medium">${pro.specialty}</p>
          <p class="text-[10px] text-slate-500 font-semibold mt-0.5">${pro.location.neighborhood}</p>

          <div class="flex flex-col gap-0.5 mt-2 bg-slate-955/40 p-2 rounded-xl border border-slate-850/60">
            <div class="flex items-center gap-1.5 text-[9px] font-bold text-brand-gold-500">
              <span class="flex items-center gap-0.5"><i data-lucide="star" class="w-2.5 h-2.5 fill-current"></i> Calidad:</span>
              <span class="text-white">${pro.rating.toFixed(1)}</span>
              <span class="text-slate-550">(${pro.reviewsCount} reseñas • ${pro.positiveReviewsPercent}% pos)</span>
            </div>
            <div class="flex items-center gap-1.5 text-[9px] font-bold text-red-400">
              <span class="flex items-center gap-0.5"><i data-lucide="percent" class="w-2.5 h-2.5"></i> Aceptación:</span>
              <span class="text-white">${pro.acceptancePercent}%</span>
            </div>
          </div>

          ${pro.acceptancePercent < 90 ? `
            <div class="mt-2 text-[8px] bg-red-950/30 text-red-400 border border-red-900/20 rounded p-1 font-bold flex items-center gap-1">
              <i data-lucide="alert-triangle" class="w-3 h-3 shrink-0"></i>
              Tasa de aceptación reducida por cancelaciones recientes
            </div>
          ` : ''}

          <div class="flex gap-1.5 mt-2">
            ${pro.atHome ? `
              <span class="text-[9px] font-bold text-brand-gold-500 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i data-lucide="truck" class="w-2.5 h-2.5"></i>
                A Domicilio
              </span>
            ` : `
              <span class="text-[9px] font-bold text-slate-455 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-full flex items-center gap-1">
                <i data-lucide="map-pin" class="w-2.5 h-2.5 text-slate-500"></i>
                En Local
              </span>
            `}
          </div>
        </div>

        <div class="flex justify-between items-center mt-3.5 pt-2.5 border-t border-slate-850">
          <span class="text-xs font-bold text-slate-500">Valor Final</span>
          
          <div class="flex items-center gap-1.5">
            <!-- BOTÓN DE FAVORITOS (CORAZÓN) -->
            <button onclick="window.toggleFavorite(${pro.id})" class="btn-favorite-pro bg-slate-955 border border-slate-800 p-2 rounded-xl text-xs transition flex items-center justify-center ${state.favorites.includes(pro.id) ? 'text-red-500 border-red-500/30' : 'text-slate-400 hover:text-red-400 hover:border-red-500/20'}" title="Guardar en Favoritos">
              <i data-lucide="heart" class="w-4 h-4 ${state.favorites.includes(pro.id) ? 'fill-current' : ''}"></i>
            </button>
            
            <!-- BOTÓN DE CHAT INTEGRADO -->
            <button class="btn-chat-with-pro bg-slate-955 border border-slate-800 text-slate-400 hover:border-brand-gold-500/50 hover:text-brand-gold-500 p-2 rounded-xl text-xs transition flex items-center justify-center" data-pro-id="${pro.id}" title="Chatear con prestador">
              <i data-lucide="message-square" class="w-4 h-4"></i>
            </button>
            
            <button class="btn-book-now bg-brand-gold-500 hover:bg-brand-gold-600 active:scale-[0.96] text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-md shadow-brand-gold-500/10" data-pro-id="${pro.id}">
              <span>Agendar</span>
              <i data-lucide="chevron-right" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();

  document.querySelectorAll('.btn-book-now').forEach(btn => {
    btn.addEventListener('click', () => {
      const proId = parseInt(btn.getAttribute('data-pro-id'));
      openBookingSheet(proId);
    });
  });

  document.querySelectorAll('.btn-chat-with-pro').forEach(btn => {
    btn.addEventListener('click', () => {
      const proId = parseInt(btn.getAttribute('data-pro-id'));
      openClientChat(proId);
    });
  });

  document.querySelectorAll('.btn-verified-badge').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openVerificationModal();
    });
  });
}

// --- RENDERIZACIÓN DE CONECTADOS AL INSTANTE ---
function renderInstantProviders() {
  const carousel = document.getElementById('instant-providers-carousel');
  if (!carousel) return;
  carousel.innerHTML = '';

  const connected = state.professionals.filter(p => p.active);

  if (connected.length === 0) {
    carousel.innerHTML = `
      <div class="flex items-center gap-1.5 py-2 px-3 bg-slate-900/40 rounded-xl border border-slate-900/60 w-full justify-center">
        <span class="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></span>
        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">A la espera de prestadores en línea...</span>
      </div>
    `;
    return;
  }

  connected.forEach(pro => {
    const card = document.createElement('div');
    card.className = "bg-slate-900 border border-red-500/25 hover:border-red-500/40 p-2.5 rounded-xl flex items-center gap-2.5 min-w-[200px] max-w-[220px] transition-all relative overflow-hidden shrink-0";
    
    card.innerHTML = `
      <div class="absolute -right-2 -bottom-2 opacity-5 text-red-500">
        <i data-lucide="zap" class="w-10 h-10 fill-current"></i>
      </div>

      <div class="relative w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0">
        <img src="${pro.avatar}" class="w-full h-full rounded-full object-cover bg-slate-950">
        <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border border-black flex items-center justify-center text-[7px] text-white font-extrabold">⚡</span>
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-white truncate leading-tight">${pro.name}</h4>
        <span class="text-[9px] text-brand-gold-500 font-extrabold block truncate uppercase mt-0.5">${pro.category}</span>
        <span class="text-[8px] text-slate-455 font-bold block mt-0.5 flex items-center gap-0.5">
          <i data-lucide="navigation" class="w-2 h-2 text-red-500"></i> A ${pro.distance.toFixed(1)} km
        </span>
      </div>
      
      <button onclick="window.instantCallProvider('${pro.name}')" class="bg-red-600 hover:bg-red-700 active:scale-95 text-white p-2 rounded-lg transition shrink-0" title="Contactar de Urgencia">
        <i data-lucide="phone-call" class="w-3.5 h-3.5"></i>
      </button>
    `;
    
    carousel.appendChild(card);
  });

  lucide.createIcons();
}

window.instantCallProvider = (name) => {
  showToast(
    "⚡ Contacto de Urgencia",
    `Llamando a ${name} para servicio inmediato...`,
    "info"
  );
};

// --- CHAT INTERACTIVO CLIENTE ---
function openClientChat(proId) {
  if (!state.isAuthenticated || !state.currentUser) {
    showToast("⚠️ Acceso Requerido", "Inicia sesión para poder chatear con los prestadores.", "warning");
    return;
  }

  const pro = state.professionals.find(p => p.id === proId);
  if (!pro) return;

  const chatId = `chat-${state.currentUser.email}-${proId}`;
  let chat = state.chats.find(c => c.id === chatId);
  
  if (!chat) {
    chat = {
      id: chatId,
      clientEmail: state.currentUser.email,
      clientName: state.currentUser.name,
      proId: proId,
      proName: pro.name,
      unreadByPro: true,
      unreadByClient: false,
      clientDeleted: false,
      proDeleted: false,
      messages: [
        { sender: "pro", text: `¡Hola ${state.currentUser.name}! Gracias por contactarme. ¿En qué puedo ayudarte hoy?` }
      ]
    };
    state.chats.push(chat);
    saveToLocalStorage();
  } else {
    chat.clientDeleted = false;
    saveToLocalStorage();
  }

  switchClientSubview('chat');
  
  document.querySelectorAll('#client-nav-bar .nav-tab').forEach((t, i) => {
    if (i === 2) { 
      t.classList.remove('text-slate-500');
      t.classList.add('text-brand-gold-500', 'active');
    } else {
      t.classList.remove('text-brand-gold-500', 'active');
      t.classList.add('text-slate-500');
    }
  });

  openClientChatWindow(chat);
}

function renderClientChatsList() {
  updateChatBadges();
  const container = document.getElementById('client-conversations-list');
  if (!container) return;
  container.innerHTML = '';

  const clientChats = state.chats.filter(c => c.clientEmail === state.currentUser.email && !c.clientDeleted);

  if (clientChats.length === 0) {
    container.innerHTML = `
      <div class="text-center text-xs text-slate-550 py-8 italic">No tienes conversaciones activas.</div>
    `;
    return;
  }

  clientChats.forEach(chat => {
    const lastMsg = chat.messages[chat.messages.length - 1];
    const pro = state.professionals.find(p => p.id === chat.proId);

    const item = document.createElement('div');
    item.className = `w-full bg-slate-900/60 hover:bg-slate-850 border border-slate-850 rounded-xl p-3 flex items-center justify-between transition cursor-pointer relative group ${chat.unreadByClient ? 'border-brand-gold-500/20' : ''}`;
    
    item.innerHTML = `
      <div class="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
        <img src="${pro ? pro.avatar : ''}" class="w-8 h-8 rounded-full object-cover border border-slate-700 bg-slate-950 flex-shrink-0">
        <div class="min-w-0 flex-1">
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            ${chat.proName}
            ${chat.unreadByClient ? '<span class="w-1.5 h-1.5 bg-brand-gold-500 rounded-full animate-ping"></span>' : ''}
          </h4>
          <p class="text-[10px] text-slate-455 truncate mt-0.5">${lastMsg ? lastMsg.text : ''}</p>
        </div>
      </div>
      <div class="flex items-center gap-2.5 flex-shrink-0">
        <div class="text-right flex flex-col items-end gap-1">
          <span class="text-[8px] text-slate-500">Reciente</span>
          ${chat.unreadByClient ? '<span class="text-[8px] bg-brand-gold-500/10 text-brand-gold-500 font-extrabold px-1.5 py-0.5 rounded">Nuevo</span>' : ''}
        </div>
        <button type="button" class="btn-delete-chat text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors hover:bg-red-950/20" title="Borrar Conversación">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-chat')) return;
      
      chat.unreadByClient = false;
      saveToLocalStorage();
      openClientChatWindow(chat);
    });

    const deleteBtn = item.querySelector('.btn-delete-chat');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar la conversación con ${chat.proName}?`);
        if (confirmDelete) {
          chat.clientDeleted = true;
          saveToLocalStorage();
          showToast("Conversación Eliminada", "El chat ha sido eliminado de tu bandeja de entrada.", "info");
          renderClientChatsList();
        }
      });
    }

    container.appendChild(item);
  });
  
  lucide.createIcons();
}

function openClientChatWindow(chat) {
  state.activeClientChatId = chat.id;
  document.getElementById('client-chat-list-container').classList.add('hidden');
  const box = document.getElementById('client-active-chat-box');
  box.classList.remove('hidden');
  
  document.getElementById('client-chat-box-name').innerText = chat.proName;
  const pro = state.professionals.find(p => p.id === chat.proId);
  document.getElementById('client-chat-box-avatar').innerHTML = pro 
    ? `<img src="${pro.avatar}" class="w-full h-full rounded-full object-cover">`
    : chat.proName.charAt(0);

  renderClientChatMessages();
}

function renderClientChatMessages() {
  const container = document.getElementById('client-chat-messages-bubble-container');
  container.innerHTML = '';

  const chat = state.chats.find(c => c.id === state.activeClientChatId);
  if (!chat) return;

  chat.messages.forEach((msg, index) => {
    const bubble = document.createElement('div');
    if (msg.type === 'offer') {
      bubble.className = "max-w-[80%] rounded-2xl p-3 leading-snug my-1 w-fit mr-auto rounded-tl-none bg-slate-900 border border-brand-gold-500/30 flex flex-col gap-2 shadow-lg";
      
      let statusHtml = '';
      if (msg.status === 'pending') {
        statusHtml = `
          <div class="flex gap-1.5 mt-1.5 justify-end">
            <button onclick="window.respondToOffer('${chat.id}', ${index}, 'rejected')" class="bg-red-955/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 px-2 py-1 rounded-lg text-[9px] font-bold transition">Rechazar</button>
            <button onclick="window.promptCounterOffer('${chat.id}', ${index})" class="bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded-lg text-[9px] font-bold transition">Contrapuesta</button>
            <button onclick="window.respondToOffer('${chat.id}', ${index}, 'accepted')" class="bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 px-2 py-1 rounded-lg text-[9px] font-bold transition">Aceptar</button>
          </div>
        `;
      } else if (msg.status === 'accepted') {
        statusHtml = `
          <div class="text-green-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Presupuesto Aceptado
          </div>
        `;
      } else if (msg.status === 'countered') {
        statusHtml = `
          <div class="text-slate-500 font-bold text-[9px] mt-1.5">
            Enviada Contrapuesta
          </div>
        `;
      } else {
        statusHtml = `
          <div class="text-red-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Presupuesto Rechazado
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-brand-gold-500">
          <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
          Propuesta de Presupuesto
        </div>
        <div class="text-[15px] font-extrabold text-white mt-1">$${msg.price.toLocaleString('es-AR')}</div>
        ${statusHtml}
      `;
    } else if (msg.type === 'counteroffer') {
      bubble.className = "max-w-[80%] rounded-2xl p-3 leading-snug my-1 w-fit ml-auto rounded-tr-none bg-slate-900 border border-brand-gold-500/20 flex flex-col gap-2 shadow-lg";
      
      let statusHtml = '';
      if (msg.status === 'pending') {
        statusHtml = `
          <div class="text-amber-500 font-extrabold text-[10px] mt-1 flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            Pendiente de respuesta...
          </div>
        `;
      } else if (msg.status === 'accepted') {
        statusHtml = `
          <div class="text-green-500 font-extrabold text-[10px] mt-1 flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Contrapuesta Aceptada
          </div>
        `;
      } else {
        statusHtml = `
          <div class="text-red-500 font-extrabold text-[10px] mt-1 flex items-center gap-1">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Contrapuesta Rechazada
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-brand-gold-500">
          <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
          Tu Contrapuesta
        </div>
        <div class="text-[15px] font-extrabold text-white mt-1">$${msg.price.toLocaleString('es-AR')}</div>
        ${statusHtml}
      `;
    } else {
      bubble.className = `max-w-[75%] rounded-2xl p-2.5 leading-snug my-1 w-fit ${
        msg.sender === 'client' 
          ? 'bg-brand-gold-500 text-slate-950 ml-auto rounded-tr-none font-medium' 
          : 'bg-slate-800 text-slate-200 mr-auto rounded-tl-none'
      }`;
      bubble.innerText = msg.text;
    }
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

function sendClientChatMessage() {
  const input = document.getElementById('client-chat-input-text');
  const text = input.value.trim();
  if (text === '') return;

  const chat = state.chats.find(c => c.id === state.activeClientChatId);
  if (!chat) return;

  chat.messages.push({
    sender: 'client',
    text: text
  });
  chat.unreadByPro = true;
  chat.clientDeleted = false;
  chat.proDeleted = false;

  input.value = '';
  renderClientChatMessages();
  saveToLocalStorage();

  // Si es chat de soporte, procesar con IA
  if (state.activeClientChatId === 'chat-support') {
    setTimeout(() => {
      const aiReply = getSupportAIResponse(text);
      chat.messages.push({
        sender: 'pro',
        text: aiReply
      });
      renderClientChatMessages();
      saveToLocalStorage();
    }, 1000);
  }
}

// --- SOPORTE INTELIGENTE CON IA ---
function openSupportChat(role) {
  if (!state.currentUser) return;

  if (role === 'client') {
    const chatId = 'chat-support';
    let chat = state.chats.find(c => c.id === chatId);
    if (!chat) {
      chat = {
        id: chatId,
        clientEmail: state.currentUser.email,
        clientName: "Soporte Arkantos AI",
        proId: 9999,
        proName: "Soporte Arkantos AI",
        unreadByPro: false,
        unreadByClient: false,
        messages: [
          { sender: 'pro', text: `¡Hola ${state.currentUser.name}! Bienvenido al Soporte de Arkantos. Soy tu asistente virtual inteligente. ¿En qué puedo ayudarte hoy?` }
        ]
      };
      state.chats.push(chat);
      saveToLocalStorage();
    }
    
    switchClientSubview('chat');
    openClientChatWindow(chat);
  } else {
    // Para el prestador/socio
    const chatId = 'chat-support-pro';
    let chat = state.chats.find(c => c.id === chatId);
    if (!chat) {
      chat = {
        id: chatId,
        clientEmail: "soporte@arkantos.com",
        clientName: "Soporte Arkantos AI",
        proId: 3,
        proName: "Soporte Arkantos AI",
        unreadByPro: false,
        unreadByClient: false,
        messages: [
          { sender: 'client', text: `¡Hola Dr. Hugo Benítez! Bienvenido a Soporte Arkantos para Socios. ¿En qué puedo asistirte con respecto a tus turnos, DNI o balance de ganancias hoy?` }
        ]
      };
      state.chats.push(chat);
      saveToLocalStorage();
    }

    switchProSubView('chat');
    openChatWindow(chat);
  }
}

function getSupportAIResponse(text) {
  const query = text.toLowerCase();
  
  if (query.match(/(dni|verif|valid|identidad)/)) {
    return "🛡️ Para verificar tu DNI, ve a la pestaña 'Perfil' de tu portal. Ingresa tu número de DNI y tu Nombre exacto del DNI. Recuerda que ambos nombres deben coincidir de forma idéntica para activar el radar Rayo y publicar tus trabajos.";
  }
  if (query.match(/(cancel|rechaz|reputac|estrella)/)) {
    return "⚠️ Si rechazas un turno confirmado, tu Tasa de Aceptación se penalizará disminuyendo una estrella y tu porcentaje global. Esto bajará la visibilidad de tu perfil en las búsquedas de clientes cercanos.";
  }
  if (query.match(/(pago|comision|cobro|ganancia|balance|saldo|deuda)/)) {
    return "💵 Arkantos descuenta el 15% de comisión por cada reserva gestionada. En tu panel de Facturación puedes ver tus ingresos acumulados y tu saldo de comisión adeudada. Pronto habilitaremos más medios de cobro.";
  }
  if (query.match(/(rayo|wifi|conect|linea|radar|uber)/)) {
    return "⚡ El rayo rojo es el radar inmediato de urgencias (estilo Uber). Al encenderlo, apareces activo al instante para los clientes cercanos en el mapa. Debes estar verificado con DNI para usarlo.";
  }
  if (query.match(/(hola|buen|saludo|ayuda)/)) {
    return `¡Hola! Soy tu asistente inteligente de Soporte Arkantos. Puedes consultarme sobre DNI, reputación y estrellas, comisiones o el radar de urgencia "Rayo".`;
  }
  
  return "Recibí tu consulta. Por favor ten en cuenta que tus datos de chat y consultas están guardados. Habilitaremos la sección de soporte humano con agentes de atención muy pronto.";
}

// --- MODAL DE AGENDAS Y TURNOS ---
function openBookingSheet(proId) {
  if (!state.isAuthenticated || !state.currentUser) {
    showToast("⚠️ Acceso Requerido", "Inicia sesión para poder agendar turnos con los profesionales.", "warning");
    return;
  }

  const pro = state.professionals.find(p => p.id === proId);
  if (!pro) return;

  state.selectedBooking.proId = proId;
  state.selectedBooking.day = null;
  state.selectedBooking.time = null;

  document.getElementById('booking-pro-name').innerText = pro.name;
  document.getElementById('booking-pro-specialty').innerText = pro.specialty;
  document.getElementById('booking-pro-avatar').src = pro.avatar;

  // Cargar biografía en la ficha de agendamiento
  document.getElementById('booking-pro-description').innerText = pro.bio || "Este profesional aún no ha redactado su biografía.";

  const basePrice = pro.price;
  const commission = Math.round(basePrice * 0.15);
  const total = basePrice + commission;

  document.getElementById('booking-base-price').innerText = `$${basePrice.toLocaleString('es-AR')}`;
  document.getElementById('booking-commission').innerText = `$${commission.toLocaleString('es-AR')}`;
  document.getElementById('booking-total-price').innerText = `$${total.toLocaleString('es-AR')}`;

  // Configurar input de fecha
  const dateInput = document.getElementById('booking-date-input');
  if (dateInput) {
    const todayStr = new Date().toISOString().split('T')[0];
    dateInput.min = todayStr;
    dateInput.value = todayStr;
    
    // Clonar para limpiar oyentes de eventos anteriores
    const newDateInput = dateInput.cloneNode(true);
    dateInput.parentNode.replaceChild(newDateInput, dateInput);
    
    newDateInput.addEventListener('change', (e) => {
      updateBookingTimeSlots(e.target.value, pro);
    });
    
    updateBookingTimeSlots(todayStr, pro);
  }

  const sheet = document.getElementById('booking-sheet');
  sheet.classList.remove('hidden');
}

window.openBookingSheetFromGlobal = (proId) => {
  openBookingSheet(proId);
};

function updateBookingTimeSlots(dateStr, pro) {
  state.selectedBooking.day = dateStr;
  state.selectedBooking.time = null;

  const timeSlotsContainer = document.getElementById('time-slots');
  timeSlotsContainer.innerHTML = '';

  const warningEl = document.getElementById('booking-day-warning');
  const warningDayName = document.getElementById('booking-warning-day-name');

  if (!dateStr) {
    timeSlotsContainer.innerHTML = '<p class="col-span-4 text-center text-[10px] text-slate-500 py-2">Selecciona una fecha primero</p>';
    if (warningEl) warningEl.classList.add('hidden');
    return;
  }

  const dayName = getDayNameInSpanish(dateStr);
  const slots = pro.agenda[dayName] || [];

  if (slots.length === 0) {
    timeSlotsContainer.innerHTML = '<p class="col-span-4 text-center text-[10px] text-slate-500 py-2">El profesional no atiende este día</p>';
    if (warningEl) {
      warningDayName.innerText = dayName + "s";
      warningEl.classList.remove('hidden');
    }
    return;
  }

  if (warningEl) warningEl.classList.add('hidden');

  slots.forEach(time => {
    const isOccupied = state.bookings.some(b => 
      b.proId === pro.id && 
      b.date === dateStr && 
      b.time === time && 
      (b.status === "Aceptado" || b.status === "Calificado" || b.status === "Finalizado")
    );

    const btn = document.createElement('button');
    
    if (isOccupied) {
      btn.className = "bg-slate-900 text-slate-655 font-semibold py-2 px-3 rounded-lg text-xs border border-slate-955 cursor-not-allowed relative flex items-center justify-center gap-1";
      btn.innerHTML = `<span>${time}</span><span class="text-[9px] text-red-500 font-extrabold">Ocupado</span>`;
      btn.disabled = true;
    } else {
      btn.className = "bg-slate-850 hover:bg-slate-850/80 text-slate-200 font-semibold py-2 px-3 rounded-lg text-xs border border-slate-800 transition text-center";
      btn.innerText = time;

      btn.addEventListener('click', () => {
        document.querySelectorAll('#time-slots button').forEach(b => {
          if (!b.disabled) {
            b.classList.remove('bg-brand-gold-500', 'text-slate-950', 'border-brand-gold-500');
            b.classList.add('bg-slate-850', 'text-slate-200');
          }
        });

        btn.classList.remove('bg-slate-850', 'text-slate-200');
        btn.classList.add('bg-brand-gold-500', 'text-slate-950', 'border-brand-gold-500');
        state.selectedBooking.time = time;
      });
    }

    timeSlotsContainer.appendChild(btn);
  });
}

function closeBookingSheet() {
  const sheet = document.getElementById('booking-sheet');
  sheet.classList.add('hidden');
  state.selectedBooking = { proId: null, day: null, time: null };
}

function confirmBooking() {
  const { proId, day, time } = state.selectedBooking;

  if (!proId || !day || !time) {
    showToast("⚠️ Selección incompleta", "Por favor elige un día y horario antes de continuar.", "warning");
    return;
  }

  const pro = state.professionals.find(p => p.id === proId);
  const basePrice = pro.price;
  const commission = Math.round(basePrice * 0.15);
  const total = basePrice + commission;

  const newBooking = {
    id: Date.now(),
    proId: proId,
    proName: pro.name,
    category: pro.category,
    date: day,
    time: time,
    price: basePrice,
    total: total,
    status: "Pendiente"
  };

  state.bookings.push(newBooking);
  saveToLocalStorage();
  closeBookingSheet();

  showToast(
    "¡Turno Agendado con éxito!", 
    `Tu turno con ${pro.name} el día ${day} a las ${time} hs fue enviado para confirmación.`, 
    "success"
  );

  const currentPro = getCurrentPro();
  if (proId === currentPro.id) {
    renderPendingBookings();
    renderProCalendar();
  }
}

// --- PORTAL SOCIO (PROFESIONAL) ---
function initProfessionalEventListeners() {
  document.getElementById('btn-pro-switch-to-client').addEventListener('click', () => {
    switchView('client');
  });

  document.getElementById('btn-pro-logout').addEventListener('click', () => {
    logoutUser();
  });

  const proEditHasLocal = document.getElementById('pro-edit-has-local');
  if (proEditHasLocal) {
    proEditHasLocal.addEventListener('change', (e) => {
      const detailsContainer = document.getElementById('pro-local-details-container');
      if (detailsContainer) {
        if (e.target.checked) {
          detailsContainer.classList.remove('hidden');
          const pro = getCurrentPro();
          setTimeout(() => {
            initProEditMap(pro);
          }, 100);
        } else {
          detailsContainer.classList.add('hidden');
        }
      }
    });
  }

  document.querySelectorAll('.pro-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pro-nav-tab').forEach(t => {
        t.classList.remove('text-brand-gold-500', 'active');
        t.classList.add('text-slate-500');
      });
      tab.classList.remove('text-slate-500');
      tab.classList.add('text-brand-gold-500', 'active');

      const view = tab.getAttribute('data-view');
      switchProSubView(view);
    });
  });

  const btnRayoConnect = document.getElementById('btn-rayo-connect');
  const uberConnectModal = document.getElementById('uber-connect-modal');
  const btnCloseUberModal = document.getElementById('btn-close-uber-modal');
  const btnCancelUber = document.getElementById('btn-cancel-uber');
  const btnConfirmUber = document.getElementById('btn-confirm-uber');
  const rayoPulseBg = document.getElementById('rayo-pulse-bg');
  
  const dniConnectLockModal = document.getElementById('dni-connect-lock-modal');
  const btnCloseDniLockModal = document.getElementById('btn-close-dni-lock-modal');
  const btnGoToProfileDni = document.getElementById('btn-go-to-profile-dni');

  btnRayoConnect.addEventListener('click', () => {
    const pro = getCurrentPro();

    if (!pro.verified) {
      dniConnectLockModal.classList.remove('hidden');
      dniConnectLockModal.classList.add('flex');
      return;
    }

    const active = pro.active;
    const modalTitle = document.getElementById('uber-modal-title');
    const modalMessage = document.getElementById('uber-modal-message');

    if (active) {
      modalTitle.innerText = "¿Quieres Desconectarte?";
      modalMessage.innerText = "Dejarás de figurar disponible en el radar de atención rápida para clientes cercanos.";
      btnConfirmUber.innerText = "Sí, Desconectar";
    } else {
      modalTitle.innerText = "¿Quieres Conectarte?";
      modalMessage.innerText = "Activarás tu estado de atención rápida. Figurarás disponible de inmediato en la lista de los clientes cercanos.";
      btnConfirmUber.innerText = "Sí, Conectar";
    }

    uberConnectModal.classList.remove('hidden');
    uberConnectModal.classList.add('flex');
  });

  btnCloseDniLockModal.addEventListener('click', () => {
    dniConnectLockModal.classList.add('hidden');
    dniConnectLockModal.classList.remove('flex');
  });

  btnGoToProfileDni.addEventListener('click', () => {
    dniConnectLockModal.classList.add('hidden');
    dniConnectLockModal.classList.remove('flex');
    
    document.querySelectorAll('.pro-nav-tab').forEach(t => {
      t.classList.remove('text-brand-gold-500', 'active');
      t.classList.add('text-slate-500');
    });
    const profileTab = document.querySelector('.pro-nav-tab[data-view="profile"]');
    profileTab.classList.remove('text-slate-500');
    profileTab.classList.add('text-brand-gold-500', 'active');
    
    switchProSubView('profile');
  });

  const closeUberModal = () => {
    uberConnectModal.classList.add('hidden');
    uberConnectModal.classList.remove('flex');
  };

  btnCloseUberModal.addEventListener('click', closeUberModal);
  btnCancelUber.addEventListener('click', closeUberModal);

  btnConfirmUber.addEventListener('click', () => {
    const pro = getCurrentPro();
    const newActiveState = !pro.active;
    
    pro.active = newActiveState;
    saveToLocalStorage();
    
    const actToggle = document.getElementById('pro-activity-toggle');
    if (actToggle) actToggle.checked = newActiveState;

    const dashDot = document.getElementById('dash-status-dot');
    const dashLabel = document.getElementById('dash-status-label');
    const dashBorder = document.getElementById('dash-status-indicator-border');

    const chatPulseDot = document.getElementById('chat-pulse-dot');
    const chatStaticDot = document.getElementById('chat-static-dot');
    const chatStatusText = document.getElementById('chat-activity-status-text');

    const headerBadge = document.getElementById('pro-status-header-badge');

    if (newActiveState) {
      rayoPulseBg.classList.remove('hidden');
      btnRayoConnect.classList.add('bg-red-700');
      
      if (chatPulseDot) chatPulseDot.classList.remove('hidden');
      if (chatStaticDot) chatStaticDot.className = "relative inline-flex rounded-full h-3 w-3 bg-brand-gold-500";
      if (chatStatusText) {
        chatStatusText.innerText = "En Línea (Disponible)";
        chatStatusText.className = "text-[9px] text-brand-gold-500 font-extrabold uppercase";
      }

      dashDot.className = "w-2.5 h-2.5 rounded-full bg-brand-gold-500 animate-pulse";
      dashLabel.innerText = "En Línea";
      dashLabel.className = "text-[9px] text-brand-gold-500 font-extrabold uppercase";
      dashBorder.className = "absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-brand-gold-500/30";

      headerBadge.classList.remove('hidden');
      headerBadge.classList.add('inline-flex');

      showToast("⚡ Radar Activado", "Te has conectado al instante. Estás visible en la lista rápida del cliente.", "success");
    } else {
      rayoPulseBg.classList.add('hidden');
      btnRayoConnect.classList.remove('bg-red-700');

      if (chatPulseDot) chatPulseDot.classList.add('hidden');
      if (chatStaticDot) chatStaticDot.className = "relative inline-flex rounded-full h-3 w-3 bg-slate-655";
      if (chatStatusText) {
        chatStatusText.innerText = "Desconectado (Fuera de línea)";
        chatStatusText.className = "text-[9px] text-slate-500 font-semibold uppercase";
      }

      dashDot.className = "w-2.5 h-2.5 rounded-full bg-slate-655";
      dashLabel.innerText = "Desconectado";
      dashLabel.className = "text-[9px] text-slate-455 font-bold uppercase";
      dashBorder.className = "absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800";

      headerBadge.classList.add('hidden');
      headerBadge.classList.remove('inline-flex');

      showToast("⚡ Radar Desactivado", "Te has desconectado de la lista de atención inmediata.", "info");
    }

    renderProfessionals();
    renderInstantProviders();
    closeUberModal();
  });

  document.getElementById('pro-status-header-badge').addEventListener('click', () => {
    showToast(
      "⚡ Transmisión Activa",
      "Estás conectado en tiempo real. Los clientes en Posadas pueden ver tu perfil y llamarte al instante.",
      "success"
    );
  });

  // --- CARGA DE FOTO DE PERFIL ---
  const btnTriggerAvatarFile = document.getElementById('btn-trigger-avatar-file');
  const proFileAvatarInput = document.getElementById('pro-file-avatar-input');
  const proContactAvatarPreview = document.getElementById('pro-contact-avatar-preview');

  btnTriggerAvatarFile.addEventListener('click', () => {
    proFileAvatarInput.click();
  });

  proFileAvatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      runImageSafetyScan(file.name).then(() => {
        const reader = new FileReader();
        reader.onload = function(evt) {
          const base64Img = evt.target.result;
          
          const pro = getCurrentPro();
          pro.avatar = base64Img;
          saveToLocalStorage();

          proContactAvatarPreview.src = base64Img;
          document.getElementById('pro-dash-avatar').src = base64Img;

          renderProfessionals();
          renderInstantProviders();

          showToast(
            "📸 Foto Actualizada",
            "Tu foto de perfil ha sido seleccionada de la galería con éxito.",
            "success"
          );
        };
        reader.readAsDataURL(file);
      }).catch(() => {
        proFileAvatarInput.value = '';
      });
    }
  });

  // --- ACTIVAR DIRECTO SERVICIO A DOMICILIO ---
  const proEditAtHomeCheckbox = document.getElementById('pro-edit-athome');
  if (proEditAtHomeCheckbox) {
    proEditAtHomeCheckbox.addEventListener('change', (e) => {
      const pro = getCurrentPro();
      pro.atHome = e.target.checked;
      
      // Sincronizar en la lista global de usuarios si es el usuario actual
      if (state.currentUser && state.currentUser.role === 'provider') {
        state.currentUser.atHome = e.target.checked;
      }
      
      saveToLocalStorage();
      renderProfessionals();
      renderInstantProviders();
      
      showToast(
        "🏠 Servicio a Domicilio",
        e.target.checked ? "Servicio a domicilio activado." : "Servicio a domicilio desactivado.",
        "success"
      );
    });
  }

  // --- CARGA DE FOTOS DE DNI (FRENTE Y DORSO) ---
  const btnDniUploadFront = document.getElementById('btn-dni-upload-front');
  const dniFileFront = document.getElementById('dni-file-front');
  const dniFrontPlaceholder = document.getElementById('dni-front-placeholder');
  const dniFrontPreview = document.getElementById('dni-front-preview');

  const btnDniUploadBack = document.getElementById('btn-dni-upload-back');
  const dniFileBack = document.getElementById('dni-file-back');
  const dniBackPlaceholder = document.getElementById('dni-back-placeholder');
  const dniBackPreview = document.getElementById('dni-back-preview');

  if (btnDniUploadFront) {
    btnDniUploadFront.addEventListener('click', () => dniFileFront.click());
    dniFileFront.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        runImageSafetyScan(file.name).then(() => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            state.dniFrontImage = evt.target.result;
            dniFrontPreview.src = evt.target.result;
            dniFrontPreview.classList.remove('hidden');
            dniFrontPlaceholder.classList.add('hidden');
            showToast("📁 DNI Frente Cargado", "La foto frontal fue seleccionada correctamente.", "success");
          };
          reader.readAsDataURL(file);
        }).catch(() => {
          dniFileFront.value = '';
        });
      }
    });
  }

  if (btnDniUploadBack) {
    btnDniUploadBack.addEventListener('click', () => dniFileBack.click());
    dniFileBack.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        runImageSafetyScan(file.name).then(() => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            state.dniBackImage = evt.target.result;
            dniBackPreview.src = evt.target.result;
            dniBackPreview.classList.remove('hidden');
            dniBackPlaceholder.classList.add('hidden');
            showToast("📁 DNI Dorso Cargado", "La foto posterior fue seleccionada correctamente.", "success");
          };
          reader.readAsDataURL(file);
        }).catch(() => {
          dniFileBack.value = '';
        });
      }
    });
  }

  // --- LÓGICA DE DNI CON VALIDACIÓN DE NOMBRE CRUZADO Y FOTOS ---
  const btnVerifyDni = document.getElementById('btn-verify-dni');
  const dniInputNumber = document.getElementById('dni-input-number');
  const dniInputName = document.getElementById('dni-input-name');
  const dniErrorMessage = document.getElementById('dni-error-message');

  btnVerifyDni.addEventListener('click', () => {
    const dni = dniInputNumber.value.trim();
    const typedName = dniInputName.value.trim();
    const profileName = document.getElementById('pro-edit-name').value.trim();

    // Validar foto frente
    if (!state.dniFrontImage) {
      dniErrorMessage.innerText = "⚠️ Debes cargar la foto de adelante de tu DNI.";
      dniErrorMessage.classList.remove('hidden');
      showToast("⚠️ Foto Faltante", "Carga la foto frontal del DNI.", "warning");
      return;
    }

    // Validar foto dorso
    if (!state.dniBackImage) {
      dniErrorMessage.innerText = "⚠️ Debes cargar la foto de atrás de tu DNI.";
      dniErrorMessage.classList.remove('hidden');
      showToast("⚠️ Foto Faltante", "Carga la foto del dorso del DNI.", "warning");
      return;
    }

    const isNumeric = /^\d+$/.test(dni);
    const hasValidLength = dni.length === 7 || dni.length === 8;

    if (!isNumeric || !hasValidLength) {
      dniErrorMessage.innerText = "⚠️ El DNI debe ser numérico y tener 7 u 8 dígitos.";
      dniErrorMessage.classList.remove('hidden');
      showToast("⚠️ DNI Inválido", "Revisa el número ingresado.", "warning");
      return;
    }

    if (!typedName) {
      dniErrorMessage.innerText = "⚠️ Debes ingresar el nombre y apellido completo de tu DNI.";
      dniErrorMessage.classList.remove('hidden');
      return;
    }

    const normalizedTypedName = typedName.toLowerCase().replace(/\s+/g, ' ');
    const normalizedProfileName = profileName.toLowerCase().replace(/\s+/g, ' ');

    if (normalizedTypedName !== normalizedProfileName) {
      dniErrorMessage.innerText = `⚠️ El nombre del DNI ("${typedName}") no coincide con el registrado en tu perfil ("${profileName}"). Ambos nombres deben ser idénticos.`;
      dniErrorMessage.classList.remove('hidden');
      showToast("⚠️ Error de Suplantación", "El nombre de identidad no coincide con el perfil registrado.", "warning");
      return;
    }

    dniErrorMessage.classList.add('hidden');
    btnVerifyDni.disabled = true;
    btnVerifyDni.innerText = "Validando...";

    setTimeout(() => {
      getCurrentPro().verified = true;
      saveToLocalStorage();
      showToast(
        "🛡️ Identidad Validada", 
        "DNI verificado con éxito en RENAPER. Ya eres un socio verificado.", 
        "success"
      );
      
      updateProVerificationUI();
    }, 1800);
  });

  // --- MODAL LEY ADVERTENCIA DE DNI ---
  const btnDniLegalInfo = document.getElementById('btn-dni-legal-info');
  const dniLegalModal = document.getElementById('dni-legal-modal');
  const btnCloseLegalModal = document.getElementById('btn-close-legal-modal');
  const btnUnderstandLegal = document.getElementById('btn-understand-legal');

  btnDniLegalInfo.addEventListener('click', () => {
    dniLegalModal.classList.remove('hidden');
    dniLegalModal.classList.add('flex');
  });

  const closeLegal = () => {
    dniLegalModal.classList.add('hidden');
    dniLegalModal.classList.remove('flex');
  };

  btnCloseLegalModal.addEventListener('click', closeLegal);
  btnUnderstandLegal.addEventListener('click', closeLegal);

  // --- DETALLE DE FACTURACIÓN INTERACTIVO ---
  const btnOpenBillingSheet = document.getElementById('btn-open-billing-sheet');
  const billingDetailSheet = document.getElementById('billing-detail-sheet');
  const btnCloseBillingDetail = document.getElementById('btn-close-billing-detail');

  btnOpenBillingSheet.addEventListener('click', () => {
    billingDetailSheet.classList.remove('hidden');
  });

  btnCloseBillingDetail.addEventListener('click', () => {
    billingDetailSheet.classList.add('hidden');
  });

  billingDetailSheet.addEventListener('click', (e) => {
    if (e.target.id === 'billing-detail-sheet') {
      billingDetailSheet.classList.add('hidden');
    }
  });

  // --- CARGA DE FOTO DE PORTAFOLIO LOCAL ---
  const btnTriggerPortfolioFile = document.getElementById('btn-trigger-portfolio-file');
  const portFileImage = document.getElementById('port-file-image');
  const btnRemovePortfolioFile = document.getElementById('btn-remove-portfolio-file');
  const portImagePreviewContainer = document.getElementById('port-image-preview-container');
  const portImagePreview = document.getElementById('port-image-preview');

  if (btnTriggerPortfolioFile) {
    btnTriggerPortfolioFile.addEventListener('click', () => portFileImage.click());
  }

  if (portFileImage) {
    portFileImage.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        runImageSafetyScan(file.name).then(() => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            pendingPortfolioImage = evt.target.result;
            portImagePreview.src = evt.target.result;
            portImagePreviewContainer.classList.remove('hidden');
            btnRemovePortfolioFile.classList.remove('hidden');
            showToast("📸 Foto de Trabajo Cargada", "La imagen se cargó correctamente y pasó los filtros AI.", "success");
          };
          reader.readAsDataURL(file);
        }).catch(() => {
          portFileImage.value = '';
          pendingPortfolioImage = null;
          portImagePreviewContainer.classList.add('hidden');
          btnRemovePortfolioFile.classList.add('hidden');
        });
      }
    });
  }

  if (btnRemovePortfolioFile) {
    btnRemovePortfolioFile.addEventListener('click', () => {
      pendingPortfolioImage = null;
      portFileImage.value = '';
      portImagePreviewContainer.classList.add('hidden');
      btnRemovePortfolioFile.classList.add('hidden');
      showToast("🗑️ Foto Eliminada", "Se quitó la foto del trabajo actual.", "info");
    });
  }

  // --- FORMULARIO DE PORTAFOLIO ---
  const portfolioForm = document.getElementById('pro-portfolio-form');
  portfolioForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('port-title').value;
    const desc = document.getElementById('port-desc').value;

    const newWork = {
      id: Date.now(),
      title,
      desc,
      img: pendingPortfolioImage
    };

    const pro = getCurrentPro();
    if (!pro.portfolio) pro.portfolio = [];
    pro.portfolio.unshift(newWork);
    saveToLocalStorage();
    portfolioForm.reset();

    // Resetear estados de previsualización
    pendingPortfolioImage = null;
    if (portImagePreviewContainer) portImagePreviewContainer.classList.add('hidden');
    if (btnRemovePortfolioFile) btnRemovePortfolioFile.classList.add('hidden');
    
    renderPortfolioGallery();
    showToast("🎉 Trabajo Publicado", "Se ha añadido tu nuevo trabajo a la galería.", "success");
  });

  // --- FORMULARIO DE CONTACTO ---
  const contactForm = document.getElementById('pro-contact-form');
  const btnProSaveContact = document.getElementById('btn-pro-save-contact');
  const proEditName = document.getElementById('pro-edit-name');
  const proEditPhone = document.getElementById('pro-edit-phone');
  const proEditEmail = document.getElementById('pro-edit-email');
  const proEditCategory = document.getElementById('pro-edit-category');
  const proEditSpecialty = document.getElementById('pro-edit-specialty');
  const proEditNeighborhood = document.getElementById('pro-edit-neighborhood');
  const proEditBio = document.getElementById('pro-edit-bio');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const proAtHomeEl = document.getElementById('pro-edit-athome');
    const proHasLocalEl = document.getElementById('pro-edit-has-local');
    const proAddressEl = document.getElementById('pro-edit-address');
    const proEditMapOverlay = document.getElementById('pro-edit-map-overlay');

    if (!profileEditing) {
      // Entrar en modo edición
      profileEditing = true;
      proEditName.disabled = false;
      proEditPhone.disabled = false;
      proEditEmail.disabled = false;
      if (proEditCategory) proEditCategory.disabled = false;
      proEditSpecialty.disabled = false;
      proEditNeighborhood.disabled = false;
      proEditBio.disabled = false;
      if (proHasLocalEl) proHasLocalEl.disabled = false;
      if (proAddressEl) proAddressEl.disabled = false;
      if (proEditMapOverlay) proEditMapOverlay.classList.add('hidden');

      if (btnTriggerAvatarFile) {
        btnTriggerAvatarFile.classList.remove('opacity-50', 'pointer-events-none');
      }

      if (btnProSaveContact) {
        btnProSaveContact.className = "w-full bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 font-bold py-2 rounded-xl transition text-xs shadow-md shadow-brand-gold-500/10 active:scale-95 flex items-center justify-center gap-1.5";
        btnProSaveContact.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Guardar Datos de Contacto</span>`;
        lucide.createIcons();
      }
    } else {
      // Bloquear campos para simular el guardado
      proEditName.disabled = true;
      proEditPhone.disabled = true;
      proEditEmail.disabled = true;
      if (proEditCategory) proEditCategory.disabled = true;
      proEditSpecialty.disabled = true;
      proEditNeighborhood.disabled = true;
      proEditBio.disabled = true;
      if (proHasLocalEl) proHasLocalEl.disabled = true;
      if (proAddressEl) proAddressEl.disabled = true;
      if (proEditMapOverlay) proEditMapOverlay.classList.remove('hidden');

      if (btnTriggerAvatarFile) {
        btnTriggerAvatarFile.classList.add('opacity-50', 'pointer-events-none');
      }

      if (btnProSaveContact) {
        btnProSaveContact.disabled = true;
        btnProSaveContact.innerHTML = `<span class="animate-spin inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full"></span><span>Guardando...</span>`;
      }

      setTimeout(() => {
        const name = proEditName.value;
        const phone = proEditPhone.value;
        const email = proEditEmail.value;
        const category = proEditCategory ? proEditCategory.value : "Abogados";
        const specialty = proEditSpecialty.value;
        const neighborhood = proEditNeighborhood.value;
        const bio = proEditBio.value;
        const atHome = proAtHomeEl ? proAtHomeEl.checked : false;
        const hasLocal = proHasLocalEl ? proHasLocalEl.checked : false;
        const address = proAddressEl ? proAddressEl.value.trim() : "";
        const lat = parseFloat(document.getElementById('pro-edit-lat').value);
        const lng = parseFloat(document.getElementById('pro-edit-lng').value);

        const pro = getCurrentPro();
        pro.name = name;
        pro.phone = phone;
        pro.email = email;
        pro.category = category;
        pro.specialty = specialty;
        pro.location.neighborhood = neighborhood;
        pro.bio = bio;
        pro.atHome = atHome;
        pro.hasLocal = hasLocal;
        pro.address = address;
        pro.location.lat = lat;
        pro.location.lng = lng;
        
        // Sincronizar en la lista global de usuarios si es el usuario actual
        if (state.currentUser && state.currentUser.role === 'provider') {
          state.currentUser.name = name;
          state.currentUser.phone = phone;
          state.currentUser.email = email;
          state.currentUser.atHome = atHome;
          state.currentUser.hasLocal = hasLocal;
          state.currentUser.address = address;
        }

        saveToLocalStorage();

        document.getElementById('pro-dash-name').innerText = name;
        const specialtyEl = document.getElementById('pro-dash-specialty');
        if (specialtyEl) {
          specialtyEl.innerText = `${specialty} • ${neighborhood}, Posadas`;
        }
        renderProfessionals();
        renderInstantProviders();

        profileEditing = false;
        
        if (btnProSaveContact) {
          btnProSaveContact.disabled = false;
          btnProSaveContact.className = "w-full bg-slate-950 hover:bg-slate-900 border border-brand-gold-500/35 hover:border-brand-gold-500 text-brand-gold-500 font-bold py-2 rounded-xl transition text-xs shadow-md active:scale-95 flex items-center justify-center gap-1.5";
          btnProSaveContact.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4"></i><span>Modificar Datos de Contacto</span>`;
          lucide.createIcons();
        }

        showToast("¡Datos Actualizados!", "Tus datos de contacto han sido guardados con éxito.", "success");
      }, 700);
    }
  });

  // --- INTERRUPTOR DE ACTIVIDAD ---
  const activityToggle = document.getElementById('pro-activity-toggle');
  const chatPulseDot = document.getElementById('chat-pulse-dot');
  const chatStaticDot = document.getElementById('chat-static-dot');
  const chatStatusText = document.getElementById('chat-activity-status-text');

  if (activityToggle) {
    activityToggle.addEventListener('change', (e) => {
      const active = e.target.checked;
      const pro = getCurrentPro();
      
      if (active && !pro.verified) {
        activityToggle.checked = false;
        document.getElementById('dni-connect-lock-modal').classList.remove('hidden');
        document.getElementById('dni-connect-lock-modal').classList.add('flex');
        return;
      }

      pro.active = active;
      saveToLocalStorage();

      const dashDot = document.getElementById('dash-status-dot');
      const dashLabel = document.getElementById('dash-status-label');
      const dashBorder = document.getElementById('dash-status-indicator-border');

      const headerBadge = document.getElementById('pro-status-header-badge');

      if (active) {
        rayoPulseBg.classList.remove('hidden');
        btnRayoConnect.classList.add('bg-red-700');

        if (chatPulseDot) chatPulseDot.classList.remove('hidden');
        if (chatStaticDot) chatStaticDot.className = "relative inline-flex rounded-full h-3 w-3 bg-brand-gold-500";
        if (chatStatusText) {
          chatStatusText.innerText = "En Línea (Disponible)";
          chatStatusText.className = "text-[9px] text-brand-gold-500 font-extrabold uppercase";
        }

        dashDot.className = "w-2.5 h-2.5 rounded-full bg-brand-gold-500 animate-pulse";
        dashLabel.innerText = "En Línea";
        dashLabel.className = "text-[9px] text-brand-gold-500 font-extrabold uppercase";
        dashBorder.className = "absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-brand-gold-500/30";
        
        headerBadge.classList.remove('hidden');
        headerBadge.classList.add('inline-flex');

        showToast("Estado de Actividad", "Ahora apareces como 'Activo' en el mapa.", "success");
      } else {
        rayoPulseBg.classList.add('hidden');
        btnRayoConnect.classList.remove('bg-red-700');

        if (chatPulseDot) chatPulseDot.classList.add('hidden');
        if (chatStaticDot) chatStaticDot.className = "relative inline-flex rounded-full h-3 w-3 bg-slate-655";
        if (chatStatusText) {
          chatStatusText.innerText = "Desconectado (Fuera de línea)";
          chatStatusText.className = "text-[9px] text-slate-500 font-semibold uppercase";
        }

        dashDot.className = "w-2.5 h-2.5 rounded-full bg-slate-655";
        dashLabel.innerText = "Desconectado";
        dashLabel.className = "text-[9px] text-slate-455 font-bold uppercase";
        dashBorder.className = "absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800";

        headerBadge.classList.add('hidden');
        headerBadge.classList.remove('inline-flex');

        showToast("Estado de Actividad", "Apareces como 'Fuera de línea'.", "info");
      }

      renderProfessionals();
      renderInstantProviders();
    });
  }

  document.getElementById('btn-back-to-chat-list').addEventListener('click', () => {
    document.getElementById('active-chat-box').classList.add('hidden');
    document.getElementById('pro-chat-list-container').classList.remove('hidden');
    state.activeChatId = null;
    renderChatsList();
  });

  document.getElementById('btn-send-chat-msg').addEventListener('click', sendChatMessage);
  document.getElementById('chat-input-text').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });

  // Listener para el botón de Soporte Pro
  document.getElementById('btn-pro-support').addEventListener('click', () => {
    openSupportChat('pro');
  });

  // Inicializar selects del calendario por semanas/meses/años
  const monthSelect = document.getElementById('pro-calendar-month-select');
  const yearSelect = document.getElementById('pro-calendar-year-select');

  if (monthSelect && yearSelect) {
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthSelect.innerHTML = '';
    months.forEach((m, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = m;
      monthSelect.appendChild(opt);
    });

    const years = [2026, 2027, 2028];
    yearSelect.innerHTML = '';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.innerText = y;
      yearSelect.appendChild(opt);
    });

    monthSelect.addEventListener('change', () => {
      const selectedMonth = parseInt(monthSelect.value);
      const selectedYear = parseInt(yearSelect.value);
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
      currentCalendarStartOfWeek = getStartOfWeek(firstDayOfMonth);
      renderProCalendar();
    });

    yearSelect.addEventListener('change', () => {
      const selectedMonth = parseInt(monthSelect.value);
      const selectedYear = parseInt(yearSelect.value);
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
      currentCalendarStartOfWeek = getStartOfWeek(firstDayOfMonth);
      renderProCalendar();
    });
  }

  // Botones de navegación de semanas
  const btnPrevWeek = document.getElementById('btn-pro-prev-week');
  const btnNextWeek = document.getElementById('btn-pro-next-week');

  if (btnPrevWeek) {
    btnPrevWeek.addEventListener('click', () => {
      const start = new Date(currentCalendarStartOfWeek);
      start.setDate(start.getDate() - 7);
      currentCalendarStartOfWeek = start;
      renderProCalendar();
    });
  }

  if (btnNextWeek) {
    btnNextWeek.addEventListener('click', () => {
      const start = new Date(currentCalendarStartOfWeek);
      start.setDate(start.getDate() + 7);
      currentCalendarStartOfWeek = start;
      renderProCalendar();
    });
  }

  // Botón Historial de Trabajos
  const btnProHistory = document.getElementById('btn-pro-history');
  const btnCloseHistoryModal = document.getElementById('btn-close-history-modal');
  const historyModal = document.getElementById('pro-history-modal');

  if (btnProHistory) {
    btnProHistory.addEventListener('click', () => {
      renderProHistory();
      if (historyModal) {
        historyModal.classList.remove('hidden');
        historyModal.classList.add('flex');
      }
    });
  }

  if (btnCloseHistoryModal) {
    btnCloseHistoryModal.addEventListener('click', () => {
      if (historyModal) {
        historyModal.classList.add('hidden');
        historyModal.classList.remove('flex');
      }
    });
  }
}

function switchProSubView(view) {
  document.querySelectorAll('.pro-content-view').forEach(v => {
    v.classList.add('hidden');
  });

  if (view === 'dashboard') {
    document.getElementById('pro-view-dashboard').classList.remove('hidden');
    
    // Actualizar datos del prestador en la cabecera
    const pro = getCurrentPro();
    document.getElementById('pro-dash-name').innerText = pro.name;
    document.getElementById('pro-dash-avatar').src = pro.avatar;
    const specialtyEl = document.getElementById('pro-dash-specialty');
    if (specialtyEl) {
      specialtyEl.innerText = `${pro.specialty} • ${pro.location.neighborhood}, Posadas`;
    }
    
    updateDashboardMetrics();
    renderPendingBookings();
  } else if (view === 'bookings') {
    document.getElementById('pro-view-bookings').classList.remove('hidden');
    renderProCalendar();
    renderAvailabilityEditor();
  } else if (view === 'chat') {
    document.getElementById('pro-view-chat').classList.remove('hidden');
    document.getElementById('pro-chat-list-container').classList.remove('hidden');
    document.getElementById('active-chat-box').classList.add('hidden');
    renderChatsList();
  } else if (view === 'profile') {
    document.getElementById('pro-view-profile').classList.remove('hidden');
    
    const pro = getCurrentPro();
    document.getElementById('pro-edit-name').value = pro.name;
    document.getElementById('pro-edit-phone').value = pro.phone;
    document.getElementById('pro-edit-email').value = pro.email || "";
    const categorySelect = document.getElementById('pro-edit-category');
    if (categorySelect) {
      categorySelect.value = pro.category || "Abogados";
    }
    document.getElementById('pro-edit-specialty').value = pro.specialty || "";
    document.getElementById('pro-edit-neighborhood').value = pro.location.neighborhood || "";
    document.getElementById('pro-edit-bio').value = pro.bio || "";
    document.getElementById('pro-contact-avatar-preview').src = pro.avatar;
    
    const proAtHomeEl = document.getElementById('pro-edit-athome');
    if (proAtHomeEl) {
      proAtHomeEl.checked = pro.atHome || false;
    }

    const proHasLocalEl = document.getElementById('pro-edit-has-local');
    const proAddressEl = document.getElementById('pro-edit-address');
    const proDetailsContainer = document.getElementById('pro-local-details-container');
    const proEditMapOverlay = document.getElementById('pro-edit-map-overlay');

    if (proHasLocalEl) {
      proHasLocalEl.checked = pro.hasLocal || false;
    }
    if (proAddressEl) {
      proAddressEl.value = pro.address || "";
    }
    document.getElementById('pro-edit-lat').value = (pro.location && pro.location.lat) ? pro.location.lat : -27.3670;
    document.getElementById('pro-edit-lng').value = (pro.location && pro.location.lng) ? pro.location.lng : -55.8960;

    if (pro.hasLocal) {
      if (proDetailsContainer) proDetailsContainer.classList.remove('hidden');
      setTimeout(() => {
        initProEditMap(pro);
      }, 100);
    } else {
      if (proDetailsContainer) proDetailsContainer.classList.add('hidden');
    }

    // Reiniciar estado de edición y bloqueo
    profileEditing = false;
    document.getElementById('pro-edit-name').disabled = true;
    document.getElementById('pro-edit-phone').disabled = true;
    document.getElementById('pro-edit-email').disabled = true;
    if (categorySelect) categorySelect.disabled = true;
    document.getElementById('pro-edit-specialty').disabled = true;
    document.getElementById('pro-edit-neighborhood').disabled = true;
    document.getElementById('pro-edit-bio').disabled = true;
    if (proHasLocalEl) proHasLocalEl.disabled = true;
    if (proAddressEl) proAddressEl.disabled = true;
    if (proEditMapOverlay) proEditMapOverlay.classList.remove('hidden');
    
    const btnTriggerAvatarFile = document.getElementById('btn-trigger-avatar-file');
    if (btnTriggerAvatarFile) {
      btnTriggerAvatarFile.classList.add('opacity-50', 'pointer-events-none');
    }

    const saveBtn = document.getElementById('btn-pro-save-contact');
    if (saveBtn) {
      saveBtn.className = "w-full bg-slate-950 hover:bg-slate-900 border border-brand-gold-500/35 hover:border-brand-gold-500 text-brand-gold-500 font-bold py-2 rounded-xl transition text-xs shadow-md active:scale-95 flex items-center justify-center gap-1.5";
      saveBtn.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4"></i><span>Modificar Datos de Contacto</span>`;
    }

    updateProVerificationUI();
    renderPortfolioGallery();
    lucide.createIcons();
  }
  updateChatBadges();
  checkIncomingEmergency();
}

function updateProVerificationUI() {
  const pro = getCurrentPro();
  const badge = document.getElementById('dni-status-badge');
  const dashBadge = document.getElementById('pro-dash-verified-badge');
  const verifiedBox = document.getElementById('dni-verified-box');
  const unverifiedBox = document.getElementById('dni-unverified-box');
  const lockOverlay = document.getElementById('portfolio-lock-overlay');

  if (pro.verified) {
    badge.className = "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-500 border border-brand-gold-500/40";
    badge.innerText = "Verificado";

    dashBadge.classList.remove('hidden');
    verifiedBox.classList.remove('hidden');
    unverifiedBox.classList.add('hidden');
    lockOverlay.classList.add('hidden');
  } else {
    badge.className = "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-955/40 text-red-400 border border-red-900/30";
    badge.innerText = "Sin Verificar";

    dashBadge.classList.add('hidden');
    verifiedBox.classList.add('hidden');
    unverifiedBox.classList.remove('hidden');
    lockOverlay.classList.remove('hidden');
  }
}

// --- RENDERIZADORES SOCIO ---
function renderPortfolioGallery() {
  const gallery = document.getElementById('pro-portfolio-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';

  const pro = getCurrentPro();
  const portfolio = pro.portfolio || [];

  if (portfolio.length === 0) {
    gallery.innerHTML = `<p class="col-span-2 text-center text-[10px] text-slate-500 py-3">No has publicado trabajos aún.</p>`;
    return;
  }

  portfolio.forEach(work => {
    const card = document.createElement('div');
    card.className = "bg-slate-955/80 border border-slate-850 rounded-xl overflow-hidden flex flex-col cursor-pointer hover:border-brand-gold-500/40 transition-colors";
    
    const mediaHTML = work.img 
      ? `<img src="${work.img}" class="w-full h-24 object-cover border-b border-slate-900">`
      : `<div class="w-full h-24 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center gap-1 border-b border-slate-900 text-brand-gold-500/50">
           <i data-lucide="briefcase" class="w-5 h-5 text-brand-gold-500/70"></i>
           <span class="text-[8px] font-extrabold uppercase text-slate-500 tracking-wider">Publicación Narrativa</span>
         </div>`;

    card.innerHTML = `
      ${mediaHTML}
      <div class="p-2 flex flex-col gap-0.5">
        <h4 class="font-bold text-[11px] text-white truncate">${work.title}</h4>
        <p class="text-[9px] text-slate-400 line-clamp-2 leading-tight">${work.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      openPortfolioDetailModal(work.id);
    });
    gallery.appendChild(card);
  });
  lucide.createIcons();
}

function renderChatsList() {
  const container = document.getElementById('pro-conversations-list');
  if (!container) return;
  container.innerHTML = '';

  const pro = getCurrentPro();
  const proChats = state.chats.filter(c => c.proId === pro.id && !c.proDeleted);

  updateChatBadges();

  if (proChats.length === 0) {
    container.innerHTML = `
      <div class="text-center text-xs text-slate-550 py-8 italic">No tienes conversaciones activas.</div>
    `;
    return;
  }

  proChats.forEach(chat => {
    const lastMsg = chat.messages[chat.messages.length - 1];
    
    const item = document.createElement('div');
    item.className = `w-full bg-slate-900/60 hover:bg-slate-850 border border-slate-850 rounded-xl p-3 flex items-center justify-between transition cursor-pointer relative group ${chat.unreadByPro ? 'border-brand-gold-500/20' : ''}`;
    
    item.innerHTML = `
      <div class="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
        <div class="w-8 h-8 rounded-full bg-brand-gold-500/10 border border-brand-gold-500/35 flex items-center justify-center text-brand-gold-500 font-bold text-xs flex-shrink-0">
          ${chat.clientName.charAt(0)}
        </div>
        <div class="min-w-0 flex-1">
          <h4 class="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            ${chat.clientName}
            ${chat.unreadByPro ? '<span class="w-1.5 h-1.5 bg-brand-gold-500 rounded-full animate-ping"></span>' : ''}
          </h4>
          <p class="text-[10px] text-slate-455 truncate mt-0.5">${lastMsg ? lastMsg.text : ''}</p>
        </div>
      </div>
      <div class="flex items-center gap-2.5 flex-shrink-0">
        <div class="text-right flex flex-col items-end gap-1">
          <span class="text-[8px] text-slate-500">Reciente</span>
          ${chat.unreadByPro ? '<span class="text-[8px] bg-brand-gold-500/10 text-brand-gold-500 font-extrabold px-1.5 py-0.5 rounded">Nuevo</span>' : ''}
        </div>
        <button type="button" class="btn-delete-chat text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors hover:bg-red-950/20" title="Borrar Conversación">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-chat')) return;
      
      chat.unreadByPro = false;
      saveToLocalStorage();
      openChatWindow(chat);
    });

    const deleteBtn = item.querySelector('.btn-delete-chat');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar la conversación con ${chat.clientName}?`);
        if (confirmDelete) {
          chat.proDeleted = true;
          saveToLocalStorage();
          showToast("Conversación Eliminada", "El chat ha sido eliminado de tu bandeja de entrada.", "info");
          renderChatsList();
        }
      });
    }

    container.appendChild(item);
  });
  
  lucide.createIcons();
}

function openChatWindow(chat) {
  state.activeChatId = chat.id;
  document.getElementById('pro-chat-list-container').classList.add('hidden');
  const box = document.getElementById('active-chat-box');
  box.classList.remove('hidden');
  document.getElementById('chat-box-name').innerText = chat.clientName;
  document.getElementById('chat-box-avatar').innerText = chat.clientName.charAt(0);
  renderChatMessages();
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages-bubble-container');
  container.innerHTML = '';

  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) return;

  chat.messages.forEach((msg, index) => {
    const bubble = document.createElement('div');
    if (msg.type === 'offer') {
      bubble.className = "max-w-[80%] rounded-2xl p-3 leading-snug my-1 w-fit ml-auto rounded-tr-none bg-slate-900 border border-brand-gold-500/30 flex flex-col gap-2 shadow-lg";
      
      let statusHtml = '';
      if (msg.status === 'pending') {
        statusHtml = `
          <div class="text-amber-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            Pendiente de respuesta...
          </div>
        `;
      } else if (msg.status === 'accepted') {
        statusHtml = `
          <div class="text-green-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Presupuesto Aceptado
          </div>
        `;
      } else if (msg.status === 'countered') {
        statusHtml = `
          <div class="text-amber-500 font-extrabold text-[9px] mt-1.5 flex items-center gap-1">
            <i data-lucide="alert-circle" class="w-3 h-3 text-amber-500"></i> Recibida Contrapuesta
          </div>
        `;
      } else {
        statusHtml = `
          <div class="text-red-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Presupuesto Rechazado
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-brand-gold-500">
          <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
          Propuesta Enviada
        </div>
        <div class="text-[15px] font-extrabold text-white mt-1">$${msg.price.toLocaleString('es-AR')}</div>
        ${statusHtml}
      `;
    } else if (msg.type === 'counteroffer') {
      bubble.className = "max-w-[80%] rounded-2xl p-3 leading-snug my-1 w-fit mr-auto rounded-tl-none bg-slate-900 border border-brand-gold-500/30 flex flex-col gap-2 shadow-lg";
      
      let statusHtml = '';
      if (msg.status === 'pending') {
        statusHtml = `
          <div class="flex gap-1.5 mt-1.5 justify-end">
            <button onclick="window.respondToCounterOffer('${chat.id}', ${index}, 'rejected')" class="bg-red-955/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 px-2.5 py-1 rounded-lg text-[9px] font-bold transition">Rechazar</button>
            <button onclick="window.respondToCounterOffer('${chat.id}', ${index}, 'accepted')" class="bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 px-2.5 py-1 rounded-lg text-[9px] font-bold transition">Aceptar</button>
          </div>
        `;
      } else if (msg.status === 'accepted') {
        statusHtml = `
          <div class="text-green-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Contrapuesta Aceptada
          </div>
        `;
      } else {
        statusHtml = `
          <div class="text-red-500 font-extrabold text-[10px] mt-1.5 flex items-center gap-1">
            <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Contrapuesta Rechazada
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-brand-gold-500">
          <i data-lucide="badge-dollar-sign" class="w-3.5 h-3.5"></i>
          Contrapuesta del Cliente
        </div>
        <div class="text-[15px] font-extrabold text-white mt-1">$${msg.price.toLocaleString('es-AR')}</div>
        ${statusHtml}
      `;
    } else {
      bubble.className = `max-w-[75%] rounded-2xl p-2.5 leading-snug my-1 w-fit ${
        msg.sender === 'pro' 
          ? 'bg-brand-gold-500 text-slate-950 ml-auto rounded-tr-none font-medium' 
          : 'bg-slate-800 text-slate-200 mr-auto rounded-tl-none'
      }`;
      bubble.innerText = msg.text;
    }
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input-text');
  const text = input.value.trim();
  if (text === '') return;

  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) return;

  chat.messages.push({
    sender: 'pro',
    text: text
  });
  chat.unreadByClient = true;
  chat.clientDeleted = false;
  chat.proDeleted = false;

  input.value = '';
  renderChatMessages();
  saveToLocalStorage();

  // Si es chat de soporte para socio, contestar con IA
  if (state.activeChatId === 'chat-support-pro') {
    setTimeout(() => {
      const aiReply = getSupportAIResponse(text);
      chat.messages.push({
        sender: 'client',
        text: aiReply
      });
      renderChatMessages();
      saveToLocalStorage();
    }, 1000);
  }
}

// --- REDISEÑO DE CALENDARIO DE RESERVAS ---
function renderProCalendar() {
  const container = document.getElementById('pro-calendar-weekly-list');
  if (!container) return;
  container.innerHTML = '';

  const pro = getCurrentPro();
  if (!pro) return;

  if (!currentCalendarStartOfWeek) {
    currentCalendarStartOfWeek = getStartOfWeek(new Date());
  }

  const startOfWeek = getStartOfWeek(new Date(currentCalendarStartOfWeek));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Actualizar etiqueta de la semana
  const formatShortDate = (d) => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };
  const weekLabel = document.getElementById('pro-calendar-week-label');
  if (weekLabel) {
    weekLabel.innerText = `Semana: ${formatShortDate(startOfWeek)} - ${formatShortDate(endOfWeek)}`;
  }

  // Actualizar selects de mes y año
  const monthSelect = document.getElementById('pro-calendar-month-select');
  const yearSelect = document.getElementById('pro-calendar-year-select');
  if (monthSelect) monthSelect.value = startOfWeek.getMonth();
  if (yearSelect) yearSelect.value = startOfWeek.getFullYear();

  // Actualizar recuento de historial en el botón
  const finishedBookings = state.bookings.filter(b => 
    b.proId === pro.id && 
    (b.status === "Finalizado" || b.status === "Calificado")
  );
  const historyBtnCount = document.getElementById('lbl-pro-history-count');
  if (historyBtnCount) historyBtnCount.innerText = finishedBookings.length;

  const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

  dias.forEach((day, index) => {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + index);
    const dateStr = currentDate.toISOString().split('T')[0];

    const slots = pro.agenda[day] || [];
    const dayCard = document.createElement('div');
    dayCard.className = "bg-slate-955/60 border border-slate-850 rounded-xl p-3 flex flex-col gap-2";

    const dayBookings = state.bookings.filter(b => 
      b.proId === pro.id && 
      b.date === dateStr && 
      (b.status === "Aceptado" || b.status === "Calificado" || b.status === "Finalizado")
    );
    
    const dayLabel = `${day} ${currentDate.getDate()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    dayCard.innerHTML = `
      <div class="flex justify-between items-center border-b border-slate-900 pb-1.5">
        <h4 class="font-bold text-white text-xs">${dayLabel}</h4>
        <span class="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
          dayBookings.length > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-900 text-slate-500'
        }">
          ${dayBookings.length} Contratados
        </span>
      </div>
      <div class="space-y-2 mt-1.5" id="pro-cal-slots-${day}"></div>
    `;

    container.appendChild(dayCard);

    const slotsContainer = document.getElementById(`pro-cal-slots-${day}`);
    
    if (slots.length === 0) {
      slotsContainer.innerHTML = `<span class="text-[9px] text-slate-655 italic">Sin horarios en agenda</span>`;
      return;
    }

    slots.forEach(time => {
      const activeBooking = dayBookings.find(b => b.time === time);
      const row = document.createElement('div');
      
      if (activeBooking) {
        let statusBadgeHTML = '';
        let actionButtonsHTML = '';

        if (activeBooking.status === "Aceptado") {
          statusBadgeHTML = `<span class="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Confirmado</span>`;
          actionButtonsHTML = `
            <div class="flex gap-2">
              <button type="button" onclick="window.rejectAcceptedBooking('${activeBooking.id}')" class="bg-slate-900 hover:bg-red-900/25 border border-red-900/40 text-red-400 font-bold px-2 py-1 rounded text-[10px] transition flex items-center gap-1 active:scale-95" title="Rechazar y cancelar el servicio">
                <i data-lucide="x-circle" class="w-3.5 h-3.5"></i>
                Rechazar
              </button>
              <button type="button" onclick="window.finalizeBooking('${activeBooking.id}')" class="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded text-[10px] transition flex items-center gap-1 active:scale-95" title="Marcar como finalizado">
                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                Finalizar
              </button>
            </div>
          `;
        } else if (activeBooking.status === "Finalizado") {
          statusBadgeHTML = `<span class="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">Finalizado</span>`;
        } else if (activeBooking.status === "Calificado") {
          statusBadgeHTML = `<span class="text-[9px] bg-brand-gold-500/10 text-brand-gold-500 px-1.5 py-0.5 rounded border border-brand-gold-500/20">Calificado</span>`;
        }

        row.className = "bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 shadow-sm";
        row.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-slate-200 flex items-center gap-1">
              <span>✔️ ${time} hs</span>
              ${statusBadgeHTML}
            </span>
            <span class="text-[9px] text-slate-500 font-semibold">Reserva #${activeBooking.id}</span>
          </div>
          <div class="flex justify-between items-end">
            <div>
              <p class="text-[10px] text-white font-bold">Cliente Particular</p>
              <p class="text-[9px] text-slate-455 mt-0.5">${pro.specialty}</p>
              <p class="text-[9px] text-brand-gold-500 font-extrabold mt-0.5">Cobro: $${activeBooking.price.toLocaleString('es-AR')}</p>
            </div>
            ${actionButtonsHTML}
          </div>
        `;
      } else {
        row.className = "bg-slate-955 border border-slate-900 rounded-lg p-2 flex justify-between items-center text-[10px]";
        row.innerHTML = `
          <span class="text-slate-455 font-medium">🔓 ${time} hs</span>
          <span class="text-[8px] text-slate-600 font-bold uppercase">Libre para Agendar</span>
        `;
      }
      slotsContainer.appendChild(row);
    });
  });

  lucide.createIcons();
}

window.rejectAcceptedBooking = (bookingId) => {
  const confirmCancel = confirm("⚠️ ¿Estás seguro de que deseas rechazar este servicio ya aceptado? \n\nEsto reducirá tu Tasa de Aceptación y bajará tu posicionamiento en las búsquedas del cliente.");
  
  if (!confirmCancel) return;

  const booking = state.bookings.find(b => String(b.id) === String(bookingId));
  if (!booking) return;

  booking.status = "Rechazado";

  const pro = getCurrentPro();
  
  pro.acceptancePercent = Math.max(20, pro.acceptancePercent - 10);
  pro.acceptanceStars = Math.max(1.0, pro.acceptanceStars - 0.5);

  saveToLocalStorage();

  showToast(
    "⚠️ Penalización Aplicada",
    `Tasa de aceptación reducida a ${pro.acceptancePercent}% por rechazo.`,
    "warning"
  );

  updateDashboardMetrics();
  renderProCalendar();
  renderProfessionals();
};

function updateDashboardMetrics() {
  const pro = getCurrentPro();
  const bookingsFiltered = state.bookings.filter(b => b.proId === pro.id && (b.status === "Aceptado" || b.status === "Calificado" || b.status === "Finalizado"));
  const earned = bookingsFiltered.reduce((sum, b) => sum + b.price, 0);
  const comision = Math.round(earned * 0.15);

  document.getElementById('total-earnings').innerText = `$${earned.toLocaleString('es-AR')}`;
  document.getElementById('total-comision').innerText = `$${comision.toLocaleString('es-AR')}`;

  document.getElementById('app-balance-status').innerText = `- $${comision.toLocaleString('es-AR')}`;
  document.getElementById('lbl-balance-debt').innerText = `-$${comision.toLocaleString('es-AR')}`;
  document.getElementById('lbl-pro-dash-rating').innerText = pro.rating.toFixed(1);
  document.getElementById('lbl-pro-dash-percent-pos').innerText = `${pro.positiveReviewsPercent}%`;
  document.getElementById('lbl-pro-dash-acceptance-percent').innerText = `${pro.acceptancePercent}%`;
  
  try {
    renderProHistory();
  } catch (e) {
    console.error("Error al renderizar historial del socio:", e);
  }
}

function renderPendingBookings() {
  const container = document.getElementById('pending-bookings-container');
  if (!container) return;
  container.innerHTML = '';

  const pro = getCurrentPro();
  const pending = state.bookings.filter(b => b.proId === pro.id && b.status === "Pendiente");
  document.getElementById('pending-count').innerText = pending.length;

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="text-center text-xs text-slate-550 py-3.5 italic">No tienes reservas pendientes de aprobación.</div>
    `;
    return;
  }

  pending.forEach(b => {
    const card = document.createElement('div');
    card.className = "bg-slate-955/80 rounded-xl p-3 border border-slate-850 flex flex-col gap-2.5";
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-[8px] font-extrabold uppercase bg-brand-gold-500/10 text-brand-gold-500 px-1.5 py-0.5 rounded">Reserva #${b.id}</span>
          <h4 class="text-xs font-bold text-white mt-1">Cliente Particular</h4>
          <p class="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
            <i data-lucide="clock" class="w-3 h-3 text-brand-gold-500"></i>
            ${formatBookingDate(b.date)} a las ${b.time} hs
          </p>
        </div>
        <div class="text-right">
          <span class="text-[9px] text-slate-500 block">Tu Ganancia</span>
          <span class="text-xs font-extrabold text-white">$${b.price.toLocaleString('es-AR')}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="flex-1 bg-slate-900 border border-slate-805 hover:bg-slate-850 text-red-400 font-bold py-1.5 rounded-lg text-[10px] transition btn-reject-booking" data-booking-id="${b.id}">
          Rechazar
        </button>
        <button class="flex-1 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 font-bold py-1.5 rounded-lg text-[10px] transition btn-accept-booking" data-booking-id="${b.id}">
          Confirmar Turno
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();

  document.querySelectorAll('.btn-accept-booking').forEach(btn => {
    btn.addEventListener('click', () => {
      const bId = parseInt(btn.getAttribute('data-booking-id'));
      const booking = state.bookings.find(b => b.id === bId);
      if (booking) {
        booking.status = "Aceptado";
        
        const pro = getCurrentPro();
        pro.acceptancePercent = Math.min(100, pro.acceptancePercent + 2);
        pro.acceptanceStars = Math.min(5.0, pro.acceptanceStars + 0.1);
        
        saveToLocalStorage();
        showToast("Reserva Aceptada", "El turno se ha confirmado. El cliente será notificado.", "success");
        renderPendingBookings();
        updateDashboardMetrics();
        renderProCalendar();
      }
    });
  });

  document.querySelectorAll('.btn-reject-booking').forEach(btn => {
    btn.addEventListener('click', () => {
      const bId = parseInt(btn.getAttribute('data-booking-id'));
      const booking = state.bookings.find(b => b.id === bId);
      if (booking) {
        booking.status = "Rechazado";
        
        const pro = getCurrentPro();
        pro.acceptancePercent = Math.max(20, pro.acceptancePercent - 10);
        pro.acceptanceStars = Math.max(1.0, pro.acceptanceStars - 0.5);
        
        saveToLocalStorage();
        showToast("Reserva Rechazada", "Has cancelado la solicitud de servicio. Tu tasa de aceptación ha disminuido.", "info");
        renderPendingBookings();
        updateDashboardMetrics();
        renderProCalendar();
      }
    });
  });
}

// --- CONFIGURACIÓN DE DISPONIBILIDAD (OPCIONAL) ---
function renderAvailabilityEditor() {
  const container = document.getElementById('availability-days-editor');
  if (!container) return;
  container.innerHTML = '';

  const pro = getCurrentPro();
  if (!pro) return;

  const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

  dias.forEach(day => {
    const activeHours = pro.agenda[day] || [];
    const div = document.createElement('div');
    div.className = "bg-slate-955/60 border border-slate-850 p-2.5 rounded-xl flex flex-col gap-2";

    div.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-xs font-bold text-white">${day}</span>
        <span class="text-[9px] text-slate-500 font-semibold uppercase">${activeHours.length} Horarios</span>
      </div>
      <div class="flex flex-wrap gap-1.5" id="avail-hours-${day}"></div>
    `;

    container.appendChild(div);

    const hoursContainer = document.getElementById(`avail-hours-${day}`);
    const availableSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

    availableSlots.forEach(time => {
      const isActive = activeHours.includes(time);
      const hourBtn = document.createElement('button');
      hourBtn.className = `px-2 py-1 text-[10px] font-bold rounded-lg border transition ${
        isActive 
          ? 'bg-brand-gold-500/10 text-brand-gold-500 border-brand-gold-500/40' 
          : 'bg-slate-900 text-slate-550 border-slate-850'
      }`;
      hourBtn.innerText = time;

      hourBtn.addEventListener('click', () => {
        if (isActive) {
          pro.agenda[day] = pro.agenda[day].filter(h => h !== time);
        } else {
          pro.agenda[day].push(time);
          pro.agenda[day].sort();
        }
        saveToLocalStorage();
        renderAvailabilityEditor();
        renderProCalendar();
        showToast("Agenda Actualizada", `Disponibilidad de ${day} modificada.`, "success");
      });

      hoursContainer.appendChild(hourBtn);
    });
  });
}

// --- EVENT LISTENERS GENERALES DEL CLIENTE ---
function initClientEventListeners() {
  document.getElementById('btn-toggle-portal').addEventListener('click', () => {
    switchView('professional');
  });

  document.getElementById('search-input').addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderProfessionals();
  });

  const professionFilter = document.getElementById('client-profession-filter');
  if (professionFilter) {
    professionFilter.addEventListener('change', (e) => {
      state.selectedCategory = e.target.value;
      renderProfessionals();
    });
  }

  const slider = document.getElementById('range-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      const rangeValEl = document.getElementById('range-value');
      if (rangeValEl) rangeValEl.innerText = `${val.toFixed(1)} km`;
      updateGeofence(val);
    });
  }

  const btnToggleFilters = document.getElementById('btn-client-toggle-filters');
  const filtersPanel = document.getElementById('client-filters-panel');
  if (btnToggleFilters && filtersPanel) {
    btnToggleFilters.addEventListener('click', () => {
      filtersPanel.classList.toggle('hidden');
    });
  }

  const btnToggleFavorites = document.getElementById('btn-client-toggle-favorites');
  if (btnToggleFavorites) {
    btnToggleFavorites.addEventListener('click', () => {
      state.showOnlyFavorites = !state.showOnlyFavorites;
      const icon = document.getElementById('icon-toggle-favorites');
      if (state.showOnlyFavorites) {
        btnToggleFavorites.className = "bg-red-950/20 hover:bg-red-900/35 border border-red-500/30 text-red-400 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center gap-1 active:scale-95";
        if (icon) icon.classList.add('fill-current', 'text-red-500');
      } else {
        btnToggleFavorites.className = "bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center gap-1 active:scale-95";
        if (icon) icon.classList.remove('fill-current', 'text-red-500');
      }
      renderProfessionals();
    });
  }

  const domCheckbox = document.getElementById('domicilio-checkbox');
  if (domCheckbox) {
    domCheckbox.addEventListener('change', (e) => {
      state.onlyAtHome = e.target.checked;
      renderProfessionals();
    });
  }

  const btnClientSos = document.getElementById('btn-client-sos');
  if (btnClientSos) {
    btnClientSos.addEventListener('click', () => {
      document.querySelectorAll('.client-subview').forEach(v => v.classList.add('hidden'));
      document.getElementById('client-subview-sos').classList.remove('hidden');
      
      // Desactivar pestaña activa en menú
      document.querySelectorAll('#client-nav-bar .nav-tab').forEach(t => {
        t.classList.remove('text-brand-gold-500', 'active');
        t.classList.add('text-slate-500');
      });
      
      renderClientSosList();
    });
  }

  const btnClientSosBack = document.getElementById('btn-client-sos-back');
  if (btnClientSosBack) {
    btnClientSosBack.addEventListener('click', () => {
      switchClientSubview('explore');
      
      // Reactivar pestaña de inicio
      const homeTab = document.querySelector('#client-nav-bar .nav-tab[data-subview="explore"]');
      if (homeTab) {
        homeTab.classList.remove('text-slate-500');
        homeTab.classList.add('text-brand-gold-500', 'active');
      }
    });
  }

  const clientSosSelect = document.getElementById('client-sos-request-category');
  const btnClientSubmitSos = document.getElementById('btn-client-submit-sos');
  if (clientSosSelect && btnClientSubmitSos) {
    clientSosSelect.addEventListener('change', () => {
      btnClientSubmitSos.disabled = (clientSosSelect.value === '');
    });
  }

  if (btnClientSubmitSos) {
    btnClientSubmitSos.addEventListener('click', () => {
      const selectedCategory = clientSosSelect.value;
      const detail = document.getElementById('client-sos-request-detail').value.trim();
      
      // Filtrar profesionales de este rubro que estén en línea (activos)
      const candidates = state.professionals.filter(p => p.active && matchCategory(p.category, selectedCategory));
      
      state.activeSosRequest = {
        category: selectedCategory,
        detail: detail || "Asistencia de urgencia requerida.",
        candidates: candidates,
        currentIndex: 0,
        clientName: state.currentUser ? state.currentUser.name : "Cliente Arkantos",
        clientEmail: state.currentUser ? state.currentUser.email : "guest@arkantos.com",
        timer: null,
        countdown: 15
      };

      const modal = document.getElementById('client-sos-searching-modal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }

      triggerNextSosCandidate();
    });
  }

  const btnCancelSosSearch = document.getElementById('btn-cancel-sos-search');
  if (btnCancelSosSearch) {
    btnCancelSosSearch.addEventListener('click', () => {
      endSosSearch(true);
    });
  }

  document.getElementById('btn-close-booking').addEventListener('click', closeBookingSheet);
  document.getElementById('btn-confirm-booking').addEventListener('click', confirmBooking);

  document.getElementById('booking-sheet').addEventListener('click', (e) => {
    if (e.target.id === 'booking-sheet') closeBookingSheet();
  });

  document.querySelectorAll('#client-nav-bar .nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#client-nav-bar .nav-tab').forEach(t => {
        t.classList.remove('text-brand-gold-500', 'active');
        t.classList.add('text-slate-500');
      });
      tab.classList.remove('text-slate-500');
      tab.classList.add('text-brand-gold-500', 'active');
      
      const subview = tab.getAttribute('data-subview');
      switchClientSubview(subview);
    });
  });

  // Listeners del Chat de Cliente
  document.getElementById('btn-client-back-to-chat-list').addEventListener('click', () => {
    document.getElementById('client-active-chat-box').classList.add('hidden');
    document.getElementById('client-chat-list-container').classList.remove('hidden');
    state.activeClientChatId = null;
    renderClientChatsList();
  });

  document.getElementById('btn-client-send-chat-msg').addEventListener('click', sendClientChatMessage);
  document.getElementById('client-chat-input-text').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendClientChatMessage();
  });

  // Listener para el botón de Soporte Cliente
  document.getElementById('btn-client-support').addEventListener('click', () => {
    openSupportChat('client');
  });

  // --- CARGA DE FOTO DE PERFIL DEL CLIENTE ---
  const btnTriggerClientAvatarFile = document.getElementById('btn-trigger-client-avatar-file');
  const clientFileAvatarInput = document.getElementById('client-file-avatar-input');
  const clientContactAvatarPreview = document.getElementById('client-contact-avatar-preview');

  if (btnTriggerClientAvatarFile && clientFileAvatarInput) {
    btnTriggerClientAvatarFile.addEventListener('click', () => {
      clientFileAvatarInput.click();
    });

    clientFileAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        runImageSafetyScan(file.name).then(() => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            const base64Img = evt.target.result;
            pendingClientAvatarImage = base64Img;
            if (clientContactAvatarPreview) {
              clientContactAvatarPreview.src = base64Img;
            }
            showToast(
              "📸 Foto Preparada",
              "La foto de perfil pasó la verificación de seguridad y está lista para guardarse.",
              "success"
            );
          };
          reader.readAsDataURL(file);
        }).catch(() => {
          clientFileAvatarInput.value = '';
          pendingClientAvatarImage = null;
        });
      }
    });
  }

  // --- FORMULARIO DE EDICIÓN DEL CLIENTE ---
  const clientContactForm = document.getElementById('client-contact-form');
  const btnClientSaveContact = document.getElementById('btn-client-save-contact');

  if (clientContactForm) {
    clientContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const inputFirstName = document.getElementById('client-edit-firstname');
      const inputLastName = document.getElementById('client-edit-lastname');
      const inputPhone = document.getElementById('client-edit-phone');
      const inputEmail = document.getElementById('client-edit-email');

      if (!clientProfileEditing) {
        // Entrar en modo edición
        clientProfileEditing = true;
        
        if (inputFirstName) inputFirstName.removeAttribute('disabled');
        if (inputLastName) inputLastName.removeAttribute('disabled');
        if (inputPhone) inputPhone.removeAttribute('disabled');
        if (inputEmail) inputEmail.removeAttribute('disabled');

        if (btnClientSaveContact) {
          btnClientSaveContact.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> <span>Guardar Datos de Contacto</span>`;
          lucide.createIcons();
        }
      } else {
        // Guardar cambios
        if (!state.currentUser) return;

        const fName = inputFirstName ? inputFirstName.value.trim() : '';
        const lName = inputLastName ? inputLastName.value.trim() : '';
        const phone = inputPhone ? inputPhone.value.trim() : '';
        const email = inputEmail ? inputEmail.value.trim() : '';

        if (!fName || !lName || !phone || !email) {
          showToast("⚠️ Error", "Todos los campos de contacto son obligatorios.", "error");
          return;
        }

        // Actualizar datos del usuario actual
        state.currentUser.name = `${fName} ${lName}`;
        state.currentUser.phone = phone;
        state.currentUser.email = email;

        if (pendingClientAvatarImage) {
          state.currentUser.avatar = pendingClientAvatarImage;
          pendingClientAvatarImage = null;
        }

        // Sincronizar en la lista global de usuarios
        const userInDb = state.users.find(u => u.email === state.currentUser.email || u.phone === state.currentUser.phone);
        if (userInDb) {
          userInDb.name = state.currentUser.name;
          userInDb.phone = state.currentUser.phone;
          userInDb.email = state.currentUser.email;
          if (state.currentUser.avatar) {
            userInDb.avatar = state.currentUser.avatar;
          }
        }

        saveToLocalStorage();

        // Salir de modo edición
        clientProfileEditing = false;
        
        if (inputFirstName) inputFirstName.setAttribute('disabled', 'true');
        if (inputLastName) inputLastName.setAttribute('disabled', 'true');
        if (inputPhone) inputPhone.setAttribute('disabled', 'true');
        if (inputEmail) inputEmail.setAttribute('disabled', 'true');

        if (btnClientSaveContact) {
          btnClientSaveContact.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4"></i> <span>Modificar Datos de Contacto</span>`;
          lucide.createIcons();
        }

        renderClientProfile();
        showToast("✅ Perfil Guardado", "Tus datos de contacto han sido actualizados.", "success");
      }
    });
  }

  document.getElementById('btn-client-logout').addEventListener('click', () => {
    logoutUser();
  });

  const reviewModal = document.getElementById('client-review-modal');
  const btnCloseReviewModal = document.getElementById('btn-close-review-modal');
  const btnSubmitReview = document.getElementById('btn-submit-review');
  const reviewCommentInput = document.getElementById('review-comment-input');

  document.querySelectorAll('#review-stars-quality .review-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.getAttribute('data-score'));
      state.pendingQualityRating = score;
      
      document.querySelectorAll('#review-stars-quality .review-star-btn').forEach((b, idx) => {
        b.className = idx < score ? "review-star-btn text-brand-gold-500 text-2xl" : "review-star-btn text-slate-655 text-2xl";
      });
    });
  });

  document.querySelectorAll('#review-stars-acceptance .accept-star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const score = parseInt(btn.getAttribute('data-score'));
      state.pendingAcceptanceRating = score;
      
      document.querySelectorAll('#review-stars-acceptance .accept-star-btn').forEach((b, idx) => {
        b.className = idx < score ? "accept-star-btn text-brand-gold-500 text-2xl" : "accept-star-btn text-slate-655 text-2xl";
      });
    });
  });

  btnCloseReviewModal.addEventListener('click', () => {
    reviewModal.classList.add('hidden');
    reviewModal.classList.remove('flex');
  });

  btnSubmitReview.addEventListener('click', () => {
    const bId = state.activeReviewBookingId;
    const booking = state.bookings.find(b => b.id === bId);
    if (!booking) return;

    const pro = state.professionals.find(p => p.id === booking.proId);
    if (!pro) return;

    const qualityScore = state.pendingQualityRating;

    pro.reviewsCount++;
    pro.rating = ((pro.rating * (pro.reviewsCount - 1)) + qualityScore) / pro.reviewsCount;
    
    if (qualityScore >= 4) {
      pro.positiveReviewsPercent = Math.min(100, Math.round(pro.positiveReviewsPercent + (100 - pro.positiveReviewsPercent) * 0.1));
    } else {
      pro.positiveReviewsPercent = Math.max(20, Math.round(pro.positiveReviewsPercent - 5));
    }

    booking.status = "Calificado";
    saveToLocalStorage();

    reviewModal.classList.add('hidden');
    reviewModal.classList.remove('flex');
    reviewCommentInput.value = '';

    showToast(
      "⭐ Calificación Registrada",
      `Gracias por tu reseña para ${pro.name}. Se ha actualizado su reputación.`,
      "success"
    );

    renderProfessionals();
    renderClientBookings();
    updateDashboardMetrics();
    renderProCalendar();
  });

  // Oyentes de modal de perfil de profesional y verificación
  const btnCloseProProfileModal = document.getElementById('btn-close-pro-profile-modal');
  const proProfileModal = document.getElementById('client-pro-profile-modal');
  if (btnCloseProProfileModal && proProfileModal) {
    btnCloseProProfileModal.addEventListener('click', () => {
      proProfileModal.classList.add('hidden');
      proProfileModal.classList.remove('flex');
    });
  }

  const btnCloseVerificationModal = document.getElementById('btn-close-verification-modal');
  const verificationModal = document.getElementById('verification-info-modal');
  if (btnCloseVerificationModal && verificationModal) {
    btnCloseVerificationModal.addEventListener('click', () => {
      verificationModal.classList.add('hidden');
      verificationModal.classList.remove('flex');
    });
  }

  const btnModalProVerified = document.getElementById('btn-modal-pro-verified');
  if (btnModalProVerified) {
    btnModalProVerified.addEventListener('click', () => {
      openVerificationModal();
    });
  }
}

function switchClientSubview(subview) {
  state.activeClientSubview = subview;
  
  document.querySelectorAll('.client-subview').forEach(v => {
    v.classList.add('hidden');
  });

  if (subview === 'explore') {
    document.getElementById('client-subview-explore').classList.remove('hidden');
    setTimeout(() => {
      if (typeof map !== 'undefined' && map) map.invalidateSize();
    }, 100);
  } else if (subview === 'bookings') {
    document.getElementById('client-subview-bookings').classList.remove('hidden');
    renderClientBookings();
  } else if (subview === 'chat') {
    document.getElementById('client-subview-chat').classList.remove('hidden');
    document.getElementById('client-chat-list-container').classList.remove('hidden');
    document.getElementById('client-active-chat-box').classList.add('hidden');
    renderClientChatsList();
  } else if (subview === 'maps') {
    document.getElementById('client-subview-maps').classList.remove('hidden');
    renderClientMapsView();
  } else if (subview === 'profile') {
    document.getElementById('client-subview-profile').classList.remove('hidden');
    renderClientProfile();
  }
  updateChatBadges();
  checkForUnratedBookings();
}

function renderClientProfile() {
  if (!state.currentUser) return;
  document.getElementById('client-profile-name').innerText = state.currentUser.name;
  document.getElementById('client-profile-email').innerText = state.currentUser.email;
  document.getElementById('client-profile-phone').innerText = state.currentUser.phone;
  
  const avatarContainer = document.getElementById('client-profile-avatar');
  if (state.currentUser.avatar) {
    avatarContainer.innerHTML = `<img src="${state.currentUser.avatar}" class="w-full h-full rounded-full object-cover">`;
  } else {
    avatarContainer.innerText = state.currentUser.name.charAt(0).toUpperCase();
  }

  const avatarPreview = document.getElementById('client-contact-avatar-preview');
  if (avatarPreview) {
    avatarPreview.src = state.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120&h=120';
  }

  const nameParts = state.currentUser.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const inputFirstName = document.getElementById('client-edit-firstname');
  const inputLastName = document.getElementById('client-edit-lastname');
  const inputPhone = document.getElementById('client-edit-phone');
  const inputEmail = document.getElementById('client-edit-email');

  if (inputFirstName) inputFirstName.value = firstName;
  if (inputLastName) inputLastName.value = lastName;
  if (inputPhone) inputPhone.value = state.currentUser.phone || '';
  if (inputEmail) inputEmail.value = state.currentUser.email || '';
}

function renderClientBookings() {
  const container = document.getElementById('client-bookings-list');
  if (!container) return;
  container.innerHTML = '';

  if (!state.currentUser) return;
  const list = state.bookings.filter(b => b.clientEmail && b.clientEmail.toLowerCase() === state.currentUser.email.toLowerCase());

  if (list.length === 0) {
    container.innerHTML = `
      <div class="text-center text-xs text-slate-550 py-8 italic">No has agendado servicios aún.</div>
    `;
    return;
  }

  list.forEach(b => {
    const pro = state.professionals.find(p => p.id === b.proId);
    const card = document.createElement('div');
    card.className = "bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3 shadow-md";

    let badgeClass = "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (b.status === "Aceptado") badgeClass = "bg-green-500/10 text-green-400 border-green-500/20";
    if (b.status === "Finalizado") badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (b.status === "Rechazado") badgeClass = "bg-red-500/10 text-red-400 border-red-500/20";
    if (b.status === "Calificado") badgeClass = "bg-brand-gold-500/10 text-brand-gold-500 border-brand-gold-500/20";

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <img src="${pro ? pro.avatar : ''}" class="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-955">
          <div>
            <h4 class="font-bold text-sm text-white">${b.proName}</h4>
            <span class="text-[9px] text-slate-455 uppercase block font-semibold">${b.category}</span>
          </div>
        </div>
        <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 border rounded-full ${badgeClass}">
          ${b.status === 'Aceptado' ? 'Confirmado' : (b.status === 'Finalizado' ? 'Completado' : b.status)}
        </span>
      </div>

      <div class="bg-slate-950/50 p-2.5 rounded-xl border border-slate-850/60 flex justify-between text-xs text-slate-400">
        <div>
          <span>Día: <strong class="text-white">${formatBookingDate(b.date)}</strong></span>
          <span class="mx-1.5">•</span>
          <span>Hora: <strong class="text-white">${b.time} hs</strong></span>
        </div>
        <span class="font-bold text-white">$${b.total.toLocaleString('es-AR')}</span>
      </div>

      ${(b.status === "Aceptado" || b.status === "Finalizado") ? `
        <button class="w-full bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-950 font-bold py-2 rounded-xl text-xs transition btn-trigger-review" data-booking-id="${b.id}">
          Calificar Servicio Recibido
        </button>
      ` : ''}
      
      ${b.status === "Calificado" ? `
        <div class="text-center text-[10px] text-brand-gold-500 font-bold bg-brand-gold-500/5 py-1.5 rounded-lg border border-brand-gold-500/10 flex items-center justify-center gap-1">
          <i data-lucide="check-square" class="w-3.5 h-3.5"></i> Servicio Calificado
        </div>
      ` : ''}
    `;

    container.appendChild(card);
  });

  lucide.createIcons();

  document.querySelectorAll('.btn-trigger-review').forEach(btn => {
    btn.addEventListener('click', () => {
      const bId = parseInt(btn.getAttribute('data-booking-id'));
      state.activeReviewBookingId = bId;

      state.pendingQualityRating = 5;
      state.pendingAcceptanceRating = 5;
      document.querySelectorAll('#review-stars-quality .review-star-btn').forEach(b => {
        b.className = "review-star-btn text-brand-gold-500 text-2xl";
      });
      document.querySelectorAll('#review-stars-acceptance .accept-star-btn').forEach(b => {
        b.className = "accept-star-btn text-brand-gold-500 text-2xl";
      });

      const modal = document.getElementById('client-review-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  });
}

function switchView(view) {
  state.activeView = view;
  const clientScreen = document.getElementById('client-screen');
  const proScreen = document.getElementById('professional-screen');
  const clientNavBar = document.getElementById('client-nav-bar');

  if (view === 'client') {
    clientScreen.classList.remove('hidden');
    proScreen.classList.add('hidden');
    clientNavBar.classList.remove('hidden');
    
    switchClientSubview('explore');
  } else {
    clientScreen.classList.add('hidden');
    proScreen.classList.remove('hidden');
    clientNavBar.classList.add('hidden');
    
    document.querySelectorAll('.pro-nav-tab').forEach(t => {
      t.classList.remove('text-brand-gold-500', 'active');
      t.classList.add('text-slate-500');
    });
    const firstTab = document.querySelector('.pro-nav-tab[data-view="dashboard"]');
    firstTab.classList.remove('text-slate-500');
    firstTab.classList.add('text-brand-gold-500', 'active');
    
    switchProSubView('dashboard');
  }
  updateChatBadges();
  checkForUnratedBookings();
  checkIncomingEmergency();
}

function logoutUser() {
  state.currentUser = null;
  state.isAuthenticated = false;
  state.dniFrontImage = null;
  state.dniBackImage = null;

  const dniFrontPreview = document.getElementById('dni-front-preview');
  const dniFrontPlaceholder = document.getElementById('dni-front-placeholder');
  const dniBackPreview = document.getElementById('dni-back-preview');
  const dniBackPlaceholder = document.getElementById('dni-back-placeholder');

  if (dniFrontPreview) {
    dniFrontPreview.src = '';
    dniFrontPreview.classList.add('hidden');
  }
  if (dniFrontPlaceholder) {
    dniFrontPlaceholder.classList.remove('hidden');
  }
  if (dniBackPreview) {
    dniBackPreview.src = '';
    dniBackPreview.classList.add('hidden');
  }
  if (dniBackPlaceholder) {
    dniBackPlaceholder.classList.remove('hidden');
  }
  // Limpiar previews y variables de portafolio
  pendingPortfolioImage = null;
  const portFileImage = document.getElementById('port-file-image');
  if (portFileImage) portFileImage.value = '';
  const portImagePreviewContainer = document.getElementById('port-image-preview-container');
  if (portImagePreviewContainer) portImagePreviewContainer.classList.add('hidden');
  const btnRemovePortfolioFile = document.getElementById('btn-remove-portfolio-file');
  if (btnRemovePortfolioFile) btnRemovePortfolioFile.classList.add('hidden');

  saveToLocalStorage(); // Guardar deslogueo

  const authScreen = document.getElementById('auth-screen');
  authScreen.classList.remove('fade-out-custom', 'hidden');
  
  document.getElementById('form-login').reset();
  document.getElementById('form-register').reset();

  document.getElementById('client-screen').classList.add('hidden');
  document.getElementById('professional-screen').classList.add('hidden');
  document.getElementById('client-nav-bar').classList.add('hidden');

  showToast("Sesión Cerrada", "Has salido de tu cuenta de forma segura.", "info");
}

// --- UTILERÍA: TOAST ---
function showToast(title, message, type = "success") {
  const toast = document.getElementById('toast');
  const tIconBg = document.getElementById('toast-icon-bg');
  const tIcon = document.getElementById('toast-icon');
  
  document.getElementById('toast-title').innerText = title;
  document.getElementById('toast-message').innerText = message;

  if (type === "success") {
    tIconBg.className = "w-8 h-8 rounded-full flex items-center justify-center bg-brand-gold-500/20";
    tIcon.className = "w-5 h-5 text-brand-gold-500";
    tIcon.setAttribute('data-lucide', 'check-circle');
  } else if (type === "warning") {
    tIconBg.className = "w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20";
    tIcon.className = "w-5 h-5 text-amber-500";
    tIcon.setAttribute('data-lucide', 'alert-triangle');
  } else {
    tIconBg.className = "w-8 h-8 rounded-full flex items-center justify-center bg-brand-gold-500/25";
    tIcon.className = "w-5 h-5 text-brand-gold-500";
    tIcon.setAttribute('data-lucide', 'info');
  }

  lucide.createIcons();

  toast.classList.remove('-translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('-translate-y-24', 'opacity-0');
  }, 5000);
}

// --- ESCÁNER DE SEGURIDAD AI (FILTRO CENSURA / NSFW) ---
function runImageSafetyScan(fileName) {
  return new Promise((resolve, reject) => {
    const modal = document.getElementById('ai-safety-scan-modal');
    const bar = document.getElementById('safety-progress-bar');
    const lbl = document.getElementById('safety-status-lbl');
    
    if (!modal) {
      resolve(true);
      return;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    bar.style.width = '0%';
    lbl.innerText = "Análisis de Desnudez...";

    setTimeout(() => {
      bar.style.width = '40%';
      lbl.innerText = "Analizando Violencia/Gore...";
    }, 300);

    setTimeout(() => {
      bar.style.width = '80%';
      lbl.innerText = "Verificando Políticas...";
    }, 700);

    setTimeout(() => {
      bar.style.width = '100%';
    }, 1000);

    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      
      const nameLower = fileName.toLowerCase();
      const isForbidden = nameLower.includes('nsfw') || 
                          nameLower.includes('nude') || 
                          nameLower.includes('desnudo') || 
                          nameLower.includes('sex') || 
                          nameLower.includes('gore') || 
                          nameLower.includes('sangre') || 
                          nameLower.includes('indecente') || 
                          nameLower.includes('sexy');
                           
      if (isForbidden) {
        showToast("⚠️ Imagen Rechazada", "Se detectó contenido explícito o inapropiado (desnudez o violencia) en el archivo.", "warning");
        reject(new Error("NSFW Detected"));
      } else {
        resolve(true);
      }
    }, 1200);
  });
}

// --- VISUALIZACIÓN, EDICIÓN Y ELIMINACIÓN DETALLADA DE PORTAFOLIO ---
function openPortfolioDetailModal(workId) {
  const pro = getCurrentPro();
  const work = (pro.portfolio || []).find(w => w.id === workId);
  if (!work) return;

  activePortfolioWorkId = workId;
  pendingEditPortfolioImage = work.img;

  // Restablecer vistas del modal
  document.getElementById('port-detail-view-mode').classList.remove('hidden');
  document.getElementById('port-detail-edit-mode').classList.add('hidden');

  // Cargar datos en modo vista
  document.getElementById('port-detail-title').innerText = work.title;
  document.getElementById('port-detail-desc').innerText = work.desc;

  const imgContainer = document.getElementById('port-detail-img-container');
  if (work.img) {
    imgContainer.innerHTML = `<img id="port-detail-img" src="${work.img}" class="w-full h-full object-cover">`;
  } else {
    imgContainer.innerHTML = `
      <div class="flex flex-col items-center justify-center gap-1.5 text-brand-gold-500/50">
        <i data-lucide="briefcase" class="w-8 h-8 text-brand-gold-500/70 animate-pulse"></i>
        <span class="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Publicación Narrativa (Sin Imagen)</span>
      </div>
    `;
  }

  // Abrir modal
  const modal = document.getElementById('pro-portfolio-detail-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  lucide.createIcons();
}

function initPortfolioDetailListeners() {
  const modal = document.getElementById('pro-portfolio-detail-modal');
  const btnClose = document.getElementById('btn-close-portfolio-detail');
  const btnDelete = document.getElementById('btn-port-delete-work');
  const btnTriggerEdit = document.getElementById('btn-port-trigger-edit');
  const btnEditCancel = document.getElementById('btn-port-edit-cancel');

  const viewMode = document.getElementById('port-detail-view-mode');
  const editMode = document.getElementById('port-detail-edit-mode');

  const editTitleInput = document.getElementById('port-edit-title');
  const editDescInput = document.getElementById('port-edit-desc');
  const editFileInput = document.getElementById('port-edit-file-image');
  const btnTriggerEditFile = document.getElementById('btn-trigger-port-edit-file');
  const btnRemoveEditFile = document.getElementById('btn-remove-port-edit-file');
  const editPreviewContainer = document.getElementById('port-edit-image-preview-container');
  const editPreviewImg = document.getElementById('port-edit-image-preview');

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      activePortfolioWorkId = null;
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (!activePortfolioWorkId) return;
      const confirmDelete = confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este trabajo de tu galería?");
      if (!confirmDelete) return;

      const pro = getCurrentPro();
      pro.portfolio = (pro.portfolio || []).filter(w => w.id !== activePortfolioWorkId);
      saveToLocalStorage();

      modal.classList.add('hidden');
      modal.classList.remove('flex');
      activePortfolioWorkId = null;

      renderPortfolioGallery();
      showToast("🗑️ Trabajo Eliminado", "La publicación ha sido removida de tu galería de trabajos.", "info");
    });
  }

  if (btnTriggerEdit) {
    btnTriggerEdit.addEventListener('click', () => {
      const pro = getCurrentPro();
      const work = (pro.portfolio || []).find(w => w.id === activePortfolioWorkId);
      if (!work) return;

      // Cargar campos en formulario
      editTitleInput.value = work.title;
      editDescInput.value = work.desc;
      pendingEditPortfolioImage = work.img;

      if (work.img) {
        editPreviewImg.src = work.img;
        editPreviewContainer.classList.remove('hidden');
        btnRemoveEditFile.classList.remove('hidden');
      } else {
        editPreviewImg.src = '';
        editPreviewContainer.classList.add('hidden');
        btnRemoveEditFile.classList.add('hidden');
      }

      viewMode.classList.add('hidden');
      editMode.classList.remove('hidden');
    });
  }

  if (btnEditCancel) {
    btnEditCancel.addEventListener('click', () => {
      editMode.classList.add('hidden');
      viewMode.classList.remove('hidden');
    });
  }

  if (btnTriggerEditFile) {
    btnTriggerEditFile.addEventListener('click', () => editFileInput.click());
  }

  if (editFileInput) {
    editFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        runImageSafetyScan(file.name).then(() => {
          const reader = new FileReader();
          reader.onload = function(evt) {
            pendingEditPortfolioImage = evt.target.result;
            editPreviewImg.src = evt.target.result;
            editPreviewContainer.classList.remove('hidden');
            btnRemoveEditFile.classList.remove('hidden');
            showToast("📸 Nueva Foto Cargada", "La imagen pasó el filtro AI de seguridad y está lista.", "success");
          };
          reader.readAsDataURL(file);
        }).catch(() => {
          editFileInput.value = '';
          pendingEditPortfolioImage = null;
          editPreviewContainer.classList.add('hidden');
          btnRemoveEditFile.classList.add('hidden');
        });
      }
    });
  }

  if (btnRemoveEditFile) {
    btnRemoveEditFile.addEventListener('click', () => {
      pendingEditPortfolioImage = null;
      editFileInput.value = '';
      editPreviewContainer.classList.add('hidden');
      btnRemoveEditFile.classList.add('hidden');
      showToast("🗑️ Foto Removida", "Se quitó la foto de este trabajo.", "info");
    });
  }

  if (editMode) {
    editMode.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activePortfolioWorkId) return;

      const pro = getCurrentPro();
      const work = (pro.portfolio || []).find(w => w.id === activePortfolioWorkId);
      if (!work) return;

      work.title = editTitleInput.value.trim();
      work.desc = editDescInput.value.trim();
      work.img = pendingEditPortfolioImage;

      saveToLocalStorage();

      modal.classList.add('hidden');
      modal.classList.remove('flex');
      activePortfolioWorkId = null;

      renderPortfolioGallery();
      showToast("🎉 Cambios Guardados", "Tu trabajo fue modificado y actualizado en tu galería.", "success");
    });
  }
}

function openVerificationModal() {
  const modal = document.getElementById('verification-info-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
  }
}

window.openProProfileModal = function(proId) {
  const pro = state.professionals.find(p => p.id === proId);
  if (!pro) return;

  const modal = document.getElementById('client-pro-profile-modal');
  if (!modal) return;

  // Rellenar datos
  document.getElementById('modal-pro-avatar').src = pro.avatar;
  document.getElementById('modal-pro-name').innerText = pro.name;
  document.getElementById('modal-pro-specialty').innerText = pro.specialty;
  
  const categoryEl = document.getElementById('modal-pro-category');
  categoryEl.innerText = pro.category;

  document.getElementById('modal-pro-phone').innerText = pro.phone || "No especificado";
  
  const addressContainer = document.getElementById('modal-pro-address-container');
  const addressText = document.getElementById('modal-pro-address-text');
  if (addressContainer && addressText) {
    if (pro.hasLocal && pro.address) {
      addressText.innerText = pro.address;
      addressContainer.classList.remove('hidden');
    } else {
      addressContainer.classList.add('hidden');
    }
  }

  document.getElementById('modal-pro-bio').innerText = pro.bio || "Este profesional no ha escrito una biografía todavía.";

  // Online Badge
  const onlineBadge = document.getElementById('modal-pro-online-badge');
  if (onlineBadge) {
    if (pro.active) {
      onlineBadge.classList.remove('hidden');
    } else {
      onlineBadge.classList.add('hidden');
    }
  }

  // Verified Badge en Cabecera
  const verifiedBadge = document.getElementById('btn-modal-pro-verified');
  if (verifiedBadge) {
    if (pro.verified) {
      verifiedBadge.classList.remove('hidden');
    } else {
      verifiedBadge.classList.add('hidden');
    }
  }

  // Modalidad de Atención
  const modalityContainer = document.getElementById('modal-pro-modality-container');
  if (modalityContainer) {
    if (pro.atHome) {
      modalityContainer.innerHTML = `
        <span class="text-[9px] font-bold text-brand-gold-500 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
          <i data-lucide="truck" class="w-3 h-3"></i>
          🏠 Servicio a domicilio disponible
        </span>
      `;
    } else {
      modalityContainer.innerHTML = `
        <span class="text-[9px] font-bold text-slate-455 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-full flex items-center gap-1">
          <i data-lucide="map-pin" class="w-3 h-3 text-slate-500"></i>
          🏢 Solo atención en local / consultorio
        </span>
      `;
    }
  }

  // Renderizar Portafolio
  const gallery = document.getElementById('modal-pro-portfolio-gallery');
  const countEl = document.getElementById('modal-pro-portfolio-count');
  
  if (gallery && countEl) {
    gallery.innerHTML = '';
    const portfolio = pro.portfolio || [];
    countEl.innerText = `${portfolio.length} publicaciones`;

    if (portfolio.length === 0) {
      gallery.innerHTML = `
        <p class="col-span-2 text-center text-[10px] text-slate-500 py-6">Este profesional no tiene trabajos publicados en su portafolio.</p>
      `;
    } else {
      portfolio.forEach(work => {
        const card = document.createElement('div');
        card.className = "bg-slate-900/40 border border-slate-850/60 rounded-xl overflow-hidden flex flex-col";
        
        const mediaHTML = work.img 
          ? `<img src="${work.img}" class="w-full h-20 object-cover border-b border-slate-900">`
          : `<div class="w-full h-20 bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center gap-1 border-b border-slate-900 text-brand-gold-500/40">
               <i data-lucide="briefcase" class="w-4 h-4"></i>
             </div>`;
             
        card.innerHTML = `
          ${mediaHTML}
          <div class="p-2 flex flex-col gap-0.5">
            <h4 class="font-bold text-[10px] text-white truncate">${work.title}</h4>
            <p class="text-[8.5px] text-slate-400 line-clamp-2 leading-snug">${work.desc}</p>
          </div>
        `;
        gallery.appendChild(card);
      });
    }
  }

  // Mostrar Modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  lucide.createIcons();
};

function initProEditMap(pro) {
  if (proEditMap) {
    proEditMap.invalidateSize();
    const lat = pro.location.lat || -27.3670;
    const lng = pro.location.lng || -55.8960;
    proEditMap.setView([lat, lng], 14);
    if (proEditMarker) {
      proEditMarker.setLatLng([lat, lng]);
    } else {
      proEditMarker = L.marker([lat, lng], { draggable: true }).addTo(proEditMap);
    }
    return;
  }

  const container = document.getElementById('pro-edit-map');
  if (!container) return;

  const initialLat = pro.location.lat || -27.3670;
  const initialLng = pro.location.lng || -55.8960;

  proEditMap = L.map('pro-edit-map', {
    zoomControl: false
  }).setView([initialLat, initialLng], 14);

  L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: 'Google Maps'
  }).addTo(proEditMap);

  proEditMarker = L.marker([initialLat, initialLng], {
    draggable: true
  }).addTo(proEditMap);

  proEditMarker.on('dragend', function() {
    const latLng = proEditMarker.getLatLng();
    document.getElementById('pro-edit-lat').value = latLng.lat.toFixed(6);
    document.getElementById('pro-edit-lng').value = latLng.lng.toFixed(6);
  });

  proEditMap.on('click', function(e) {
    if (!profileEditing) return;
    proEditMarker.setLatLng(e.latlng);
    document.getElementById('pro-edit-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('pro-edit-lng').value = e.latlng.lng.toFixed(6);
  });
}

function renderClientMapsView() {
  const select = document.getElementById('client-maps-profession-select');
  const emptyState = document.getElementById('client-maps-empty-state');
  const detailsCard = document.getElementById('client-maps-details-card');
  const mapContainer = document.getElementById('client-bookings-map-container');

  if (!select) return;

  const defaultLat = -27.3670;
  const defaultLng = -55.8960;

  // Inicializar mapa si no existe
  if (!clientBookingsMap) {
    clientBookingsMap = L.map('client-bookings-map-container', {
      zoomControl: false
    }).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: 'Google Maps'
    }).addTo(clientBookingsMap);
  } else {
    setTimeout(() => {
      clientBookingsMap.invalidateSize();
    }, 100);
  }

  function updateProfessionMarkers() {
    // Limpiar marcadores viejos
    clientMapMarkers.forEach(m => clientBookingsMap.removeLayer(m));
    clientMapMarkers = [];

    const selectedProfession = select.value;
    const prosToShow = state.professionals.filter(pro => {
      return pro.hasLocal && pro.address && matchCategory(pro.category, selectedProfession);
    });

    if (prosToShow.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (detailsCard) detailsCard.classList.add('hidden');
      clientBookingsMap.setView([defaultLat, defaultLng], 13);
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    prosToShow.forEach(pro => {
      const proIcon = L.divIcon({
        className: 'custom-pro-marker-div',
        html: `
          <div class="relative w-11 h-11 rounded-full border-2 border-brand-gold-500 bg-slate-900 shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <img src="${pro.avatar}" class="w-full h-full object-cover">
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-slate-950 rounded-full"></span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([pro.location.lat, pro.location.lng], { icon: proIcon }).addTo(clientBookingsMap);
      
      marker.bindTooltip(`<b class="text-[10px] text-white uppercase">${pro.name}</b><br><span class="text-[8px] text-slate-400 font-semibold">${pro.specialty}</span>`, {
        direction: 'top',
        className: '!bg-slate-950/95 !border-slate-800 !text-white rounded-xl px-2.5 py-1.5 shadow-2xl !opacity-100 font-sans'
      });

      marker.on('click', () => {
        // Rellenar ficha inferior de la dirección
        document.getElementById('client-maps-pro-avatar-initial').innerText = pro.name.charAt(0);
        document.getElementById('client-maps-pro-name').innerText = pro.name;
        document.getElementById('client-maps-pro-specialty').innerText = pro.specialty;
        document.getElementById('client-maps-address-text').innerText = pro.address;
        if (detailsCard) detailsCard.classList.remove('hidden');

        const btnExternal = document.getElementById('btn-client-maps-external');
        if (btnExternal) {
          btnExternal.onclick = (e) => {
            e.stopPropagation();
            window.open(`https://www.google.com/maps/search/?api=1&query=${pro.location.lat},${pro.location.lng}`, '_blank');
          };
        }

        // Abrir perfil detallado del profesional
        window.openProProfileModal(pro.id);
      });

      clientMapMarkers.push(marker);
    });

    // Ajustar zoom y encuadre del mapa
    if (prosToShow.length === 1) {
      clientBookingsMap.setView([prosToShow[0].location.lat, prosToShow[0].location.lng], 15);
    } else {
      const group = new L.LatLngBounds(prosToShow.map(p => [p.location.lat, p.location.lng]));
      clientBookingsMap.fitBounds(group, { padding: [50, 50], maxZoom: 16 });
    }
  }

  select.onchange = updateProfessionMarkers;
  updateProfessionMarkers(); // Cargar marcadores iniciales
  lucide.createIcons();
}

function updateChatBadges() {
  const clientBadge = document.getElementById('client-chat-badge');
  const proBadge = document.getElementById('pro-chat-badge');

  if (clientBadge) {
    if (state.currentUser) {
      const emailLower = state.currentUser.email.toLowerCase();
      const clientUnreadCount = state.chats.filter(c => {
        const matchEmail = c.clientEmail && c.clientEmail.toLowerCase() === emailLower;
        return matchEmail && !c.clientDeleted && c.unreadByClient;
      }).length;
      
      if (clientUnreadCount > 0) {
        clientBadge.innerText = clientUnreadCount;
        clientBadge.classList.remove('hidden');
        clientBadge.style.display = 'flex';
      } else {
        clientBadge.classList.add('hidden');
        clientBadge.style.display = 'none';
      }
    } else {
      clientBadge.classList.add('hidden');
      clientBadge.style.display = 'none';
    }
  }

  if (proBadge) {
    if (state.currentUser) {
      const emailLower = state.currentUser.email.toLowerCase();
      const pro = state.professionals.find(p => p.email.toLowerCase() === emailLower);
      if (pro) {
        const proUnreadCount = state.chats.filter(c => c.proId === pro.id && !c.proDeleted && c.unreadByPro).length;
        if (proUnreadCount > 0) {
          proBadge.innerText = proUnreadCount;
          proBadge.classList.remove('hidden');
          proBadge.style.display = 'flex';
        } else {
          proBadge.classList.add('hidden');
          proBadge.style.display = 'none';
        }
      } else {
        proBadge.classList.add('hidden');
        proBadge.style.display = 'none';
      }
    } else {
      proBadge.classList.add('hidden');
      proBadge.style.display = 'none';
    }
  }
}

function openBookingReview(bId) {
  state.activeReviewBookingId = parseInt(bId);
  state.pendingQualityRating = 5;
  state.pendingAcceptanceRating = 5;
  
  document.querySelectorAll('#review-stars-quality .review-star-btn').forEach(b => {
    b.className = "review-star-btn text-brand-gold-500 text-2xl";
  });
  document.querySelectorAll('#review-stars-acceptance .accept-star-btn').forEach(b => {
    b.className = "accept-star-btn text-brand-gold-500 text-2xl";
  });

  const modal = document.getElementById('client-review-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function checkForUnratedBookings() {
  if (!state.currentUser || state.activeView !== 'client') return;
  
  const emailLower = state.currentUser.email.toLowerCase();
  const unrated = state.bookings.find(b => 
    b.clientEmail && 
    b.clientEmail.toLowerCase() === emailLower && 
    b.status === "Finalizado"
  );

  if (unrated) {
    openBookingReview(unrated.id);
  }
}

window.toggleFavorite = (proId) => {
  const id = parseInt(proId);
  const index = state.favorites.indexOf(id);
  if (index === -1) {
    state.favorites.push(id);
    showToast("❤️ Guardado", "Agregado a tus favoritos.", "success");
  } else {
    state.favorites.splice(index, 1);
    showToast("💔 Removido", "Quitado de tus favoritos.", "info");
  }
  saveToLocalStorage();
  renderProfessionals();
};

function renderClientSosList() {
  const container = document.getElementById('client-sos-list');
  if (!container) return;
  container.innerHTML = '';

  const activePros = state.professionals.filter(p => p.active);

  if (activePros.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center py-12 px-4 text-slate-500">
        <i data-lucide="bell-off" class="w-12 h-12 mb-3 text-slate-800"></i>
        <h4 class="text-sm font-bold text-slate-400">No hay prestadores de emergencia activos</h4>
        <p class="text-xs max-w-[240px] mt-1">En este momento ningún profesional tiene activado su radar de urgencias en la zona.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  activePros.forEach(pro => {
    const distance = calculateDistance(
      state.userLocation.lat,
      state.userLocation.lng,
      pro.location.lat,
      pro.location.lng
    );
    const eta = Math.max(5, Math.round(distance * 3)); // ~3 min por km, min 5 min

    const card = document.createElement('div');
    card.className = "bg-slate-900 border border-red-950/20 rounded-2xl p-4 flex flex-col gap-3 shadow-lg relative overflow-hidden";
    card.innerHTML = `
      <div class="absolute -right-8 -top-8 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <div class="relative w-12 h-12 rounded-full border border-slate-700 bg-slate-955 flex-shrink-0">
            <img src="${pro.avatar}" class="w-full h-full rounded-full object-cover">
            <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border border-black rounded-full animate-ping"></span>
            <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 border border-black rounded-full"></span>
          </div>
          <div>
            <h4 class="font-bold text-sm text-white flex items-center gap-1.5">
              ${pro.name}
              ${pro.verified ? '<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-green-400 fill-green-950/20"></i>' : ''}
            </h4>
            <span class="text-[9px] text-brand-gold-500 uppercase font-extrabold px-1.5 py-0.5 rounded bg-brand-gold-500/10 border border-brand-gold-500/15 inline-block mt-0.5">${pro.category}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[9px] text-red-400 font-extrabold uppercase bg-red-500/10 border border-red-500/15 px-2 py-0.5 rounded-full">Al Instante</span>
        </div>
      </div>

      <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-850/60 flex justify-between items-center text-xs text-slate-400">
        <div class="flex flex-col">
          <span>Ubicación: <strong class="text-white">${pro.location.neighborhood}</strong></span>
          <span class="text-[10px] text-slate-550 mt-0.5">A ${distance.toFixed(1)} km de ti</span>
        </div>
        <div class="text-right flex flex-col items-end">
          <span class="text-red-400 font-extrabold text-[13px] flex items-center gap-0.5">
            <i data-lucide="clock" class="w-3.5 h-3.5"></i> ~${eta} min
          </span>
          <span class="text-[8px] text-slate-500 uppercase font-semibold">Tiempo Estimado</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 mt-1">
        <button onclick="window.instantCallProvider('${pro.name}')" class="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/10">
          <i data-lucide="phone" class="w-3.5 h-3.5"></i>
          <span>Llamar SOS</span>
        </button>
        <button class="btn-chat-with-pro bg-slate-850 border border-slate-800 text-slate-200 hover:border-brand-gold-500/40 hover:text-brand-gold-500 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5" data-pro-id="${pro.id}">
          <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
          <span>Chatear</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  lucide.createIcons();

  container.querySelectorAll('.btn-chat-with-pro').forEach(btn => {
    btn.addEventListener('click', () => {
      const proId = parseInt(btn.getAttribute('data-pro-id'));
      openClientChat(proId);
    });
  });
}

window.promptProposePrice = () => {
  const priceStr = prompt("Ingresa el monto del presupuesto propuesto ($):");
  if (!priceStr) return;
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
  if (isNaN(price) || price <= 0) {
    alert("Por favor ingresa un monto válido.");
    return;
  }

  const chat = state.chats.find(c => c.id === state.activeChatId);
  if (!chat) return;

  chat.messages.push({
    id: Date.now(),
    sender: 'pro',
    text: `Propuesta de Presupuesto: $${price.toLocaleString('es-AR')}`,
    type: 'offer',
    price: price,
    status: 'pending'
  });

  chat.unreadByClient = true;
  chat.clientDeleted = false;
  chat.proDeleted = false;

  saveToLocalStorage();
  renderChatMessages();
};

window.respondToOffer = (chatId, msgIndex, response) => {
  const chat = state.chats.find(c => String(c.id) === String(chatId));
  if (!chat) return;

  const msg = chat.messages[msgIndex];
  if (!msg) return;

  msg.status = response;
  
  if (response === 'accepted') {
    chat.messages.push({
      sender: 'client',
      text: `✅ He aceptado el presupuesto de $${msg.price.toLocaleString('es-AR')}.`
    });
    chat.unreadByPro = true;
    showToast("Presupuesto Aceptado", "Has aceptado la propuesta de precio.", "success");
    try {
      syncAgreedPriceToBookings(chat, msg.price);
    } catch (e) {
      console.error("Error al sincronizar presupuesto a facturación:", e);
    }
  } else {
    chat.messages.push({
      sender: 'client',
      text: `❌ He rechazado el presupuesto de $${msg.price.toLocaleString('es-AR')}.`
    });
    chat.unreadByPro = true;
    showToast("Presupuesto Rechazado", "Has rechazado la propuesta de precio.", "info");
  }

  saveToLocalStorage();
  renderClientChatMessages();
};

window.promptCounterOffer = (chatId, offerMsgIndex) => {
  const chat = state.chats.find(c => String(c.id) === String(chatId));
  if (!chat) return;

  const originalOffer = chat.messages[offerMsgIndex];
  if (!originalOffer) return;

  const priceStr = prompt(`El profesional ofreció $${originalOffer.price.toLocaleString('es-AR')}.\nIngresa el precio de tu contrapuesta ($):`);
  if (!priceStr) return;
  const price = parseInt(priceStr.replace(/[^0-9]/g, ''));
  if (isNaN(price) || price <= 0) {
    alert("Por favor ingresa un monto válido.");
    return;
  }

  // Marcar la oferta original del profesional como "contrapuesta" para que se desactiven los botones
  originalOffer.status = 'countered';

  // Añadir la contrapuesta del cliente
  chat.messages.push({
    id: Date.now(),
    sender: 'client',
    text: `Contrapuesta de Presupuesto: $${price.toLocaleString('es-AR')}`,
    type: 'counteroffer',
    price: price,
    status: 'pending'
  });

  chat.unreadByPro = true;
  chat.clientDeleted = false;
  chat.proDeleted = false;

  saveToLocalStorage();
  renderClientChatMessages();
};

window.respondToCounterOffer = (chatId, msgIndex, response) => {
  const chat = state.chats.find(c => String(c.id) === String(chatId));
  if (!chat) return;

  const msg = chat.messages[msgIndex];
  if (!msg) return;

  msg.status = response;
  
  if (response === 'accepted') {
    chat.messages.push({
      sender: 'pro',
      text: `✅ He aceptado tu contrapuesta de $${msg.price.toLocaleString('es-AR')}.`
    });
    chat.unreadByClient = true;
    showToast("Contrapuesta Aceptada", "Has aceptado la contrapuesta del cliente.", "success");
    try {
      syncAgreedPriceToBookings(chat, msg.price);
    } catch (e) {
      console.error("Error al sincronizar contrapuesta a facturación:", e);
    }
  } else {
    chat.messages.push({
      sender: 'pro',
      text: `❌ He rechazado tu contrapuesta de $${msg.price.toLocaleString('es-AR')}.`
    });
    chat.unreadByClient = true;
    showToast("Contrapuesta Rechazada", "Has rechazado la contrapuesta del cliente.", "info");
  }

  saveToLocalStorage();
  renderChatMessages();
};

function syncAgreedPriceToBookings(chat, price) {
  const emailLower = chat.clientEmail.toLowerCase();
  
  // Buscar reserva existente para el profesional y el cliente
  let booking = state.bookings.find(b => 
    b.proId === chat.proId && 
    b.clientEmail && 
    b.clientEmail.toLowerCase() === emailLower && 
    b.status !== "Rechazado"
  );

  if (booking) {
    booking.price = price;
    booking.total = price;
    booking.status = "Finalizado";
  } else {
    const pro = state.professionals.find(p => p.id === chat.proId);
    booking = {
      id: Date.now(),
      proId: chat.proId,
      proName: chat.proName,
      clientEmail: chat.clientEmail,
      clientName: chat.clientName,
      category: pro ? pro.category : "Servicios",
      price: price,
      total: price,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      status: "Finalizado"
    };
    state.bookings.push(booking);
  }

  saveToLocalStorage();
  updateDashboardMetrics();
  renderProCalendar();
  renderClientBookings();
}

function triggerNextSosCandidate() {
  const req = state.activeSosRequest;
  if (!req) return;
  
  if (req.currentIndex >= req.candidates.length) {
    // Si no hay candidatos humanos activos, simulamos que responde un BOT de guardia
    // después de 5 segundos para que la demo fluya sola si no cambian de portal.
    document.getElementById('lbl-sos-searching-status').innerText = "Buscando en red de respaldo de guardia...";
    
    // Crear un profesional bot para la simulación
    const mockBotPro = {
      id: 9999,
      name: `Guardia de ${req.category} (Respaldo)`,
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=80&h=80",
      category: req.category,
      email: `guardia-${req.category.toLowerCase()}@arkantos.com`
    };

    req.timer = setTimeout(() => {
      // Auto-aceptar la emergencia usando el bot
      state.receivedEmergency = {
        proId: mockBotPro.id,
        clientName: req.clientName,
        clientEmail: req.clientEmail,
        detail: req.detail,
        category: req.category
      };
      
      // Crear un profesional temporal en la lista global si no existe para que el chat funcione
      if (!state.professionals.find(p => p.id === mockBotPro.id)) {
        state.professionals.push({
          id: mockBotPro.id,
          name: mockBotPro.name,
          avatar: mockBotPro.avatar,
          category: mockBotPro.category,
          email: mockBotPro.email,
          specialty: "Guardia de Emergencia 24hs",
          location: { lat: -27.3670, lng: -55.8960, neighborhood: "Centro" },
          price: 15000,
          rating: 4.9,
          reviewsCount: 42,
          positiveReviewsPercent: 98,
          acceptancePercent: 100,
          verified: true,
          active: true
        });
      }
      
      acceptEmergencyRequest();
    }, 5000);
    return;
  }

  const candidate = req.candidates[req.currentIndex];
  document.getElementById('lbl-sos-searching-status').innerText = `Notificando a: ${candidate.name} (Tasa Acep: ${candidate.acceptancePercent}%)...`;

  // Animación del progreso de búsqueda de este candidato
  const progBar = document.getElementById('bar-sos-searching-progress');
  if (progBar) {
    progBar.style.transition = 'none';
    progBar.style.width = '100%';
    setTimeout(() => {
      progBar.style.transition = 'width 15s linear';
      progBar.style.width = '0%';
    }, 50);
  }

  sendEmergencyToPro(candidate, req);

  // Programar expiración a los 15s
  req.countdown = 15;
  if (req.timer) clearInterval(req.timer);
  
  req.timer = setInterval(() => {
    req.countdown--;
    if (req.countdown <= 0) {
      clearInterval(req.timer);
      rejectEmergencyRequest();
    }
  }, 1000);
}

function sendEmergencyToPro(pro, req) {
  state.receivedEmergency = {
    proId: pro.id,
    clientName: req.clientName,
    clientEmail: req.clientEmail,
    detail: req.detail,
    category: req.category
  };
  saveToLocalStorage();

  // Si es el profesional actual logueado y está en portal profesional, mostrar el bottom sheet
  const currentPro = getCurrentPro();
  if (state.activeView === 'professional' && currentPro && currentPro.id === pro.id) {
    showProEmergencyBottomSheet(state.receivedEmergency);
  } else {
    // Si es el profesional pero está en el portal cliente, notificar por Toast
    if (currentPro && currentPro.id === pro.id) {
      showToast("🚨 Guardia SOS Pendiente", "Tienes una emergencia entrante. ¡Ve a 'Soy Prestador' para responder!", "warning");
    }
  }
}

function checkIncomingEmergency() {
  const currentPro = getCurrentPro();
  if (state.activeView === 'professional' && currentPro && state.receivedEmergency && state.receivedEmergency.proId === currentPro.id) {
    showProEmergencyBottomSheet(state.receivedEmergency);
  } else {
    hideProEmergencyBottomSheet();
  }
}

function showProEmergencyBottomSheet(emerg) {
  const sheet = document.getElementById('pro-emergency-bottom-sheet');
  if (!sheet) return;

  document.getElementById('pro-emergency-client-name').innerText = emerg.clientName;
  document.getElementById('pro-emergency-job-detail').innerText = `"${emerg.detail}"`;

  sheet.classList.remove('translate-y-full');
  sheet.classList.add('translate-y-0');

  let countdown = 15;
  const lbl = document.getElementById('lbl-pro-emergency-timer');
  const bar = document.getElementById('bar-pro-emergency-timer');

  if (lbl) lbl.innerText = `${countdown}s`;
  if (bar) {
    bar.style.transition = 'none';
    bar.style.width = '100%';
    setTimeout(() => {
      bar.style.transition = 'width 15s linear';
      bar.style.width = '0%';
    }, 50);
  }

  if (window.proEmergencyInterval) clearInterval(window.proEmergencyInterval);
  window.proEmergencyInterval = setInterval(() => {
    countdown--;
    if (lbl) lbl.innerText = `${countdown}s`;
    if (countdown <= 0) {
      clearInterval(window.proEmergencyInterval);
      hideProEmergencyBottomSheet();
    }
  }, 1000);

  // Registrar listeners únicos de botones
  const btnAccept = document.getElementById('btn-pro-accept-emergency');
  const btnReject = document.getElementById('btn-pro-reject-emergency');

  // Clonar para limpiar event listeners previos
  const newAccept = btnAccept.cloneNode(true);
  const newReject = btnReject.cloneNode(true);
  btnAccept.parentNode.replaceChild(newAccept, btnAccept);
  btnReject.parentNode.replaceChild(newReject, btnReject);

  newAccept.addEventListener('click', acceptEmergencyRequest);
  newReject.addEventListener('click', rejectEmergencyRequest);
}

function hideProEmergencyBottomSheet() {
  const sheet = document.getElementById('pro-emergency-bottom-sheet');
  if (sheet) {
    sheet.classList.remove('translate-y-0');
    sheet.classList.add('translate-y-full');
  }
  if (window.proEmergencyInterval) clearInterval(window.proEmergencyInterval);
}

function rejectEmergencyRequest() {
  if (window.proEmergencyInterval) clearInterval(window.proEmergencyInterval);
  hideProEmergencyBottomSheet();

  state.receivedEmergency = null;
  saveToLocalStorage();

  const req = state.activeSosRequest;
  if (req) {
    if (req.timer) clearInterval(req.timer);
    req.currentIndex++;
    triggerNextSosCandidate();
  }
}

function acceptEmergencyRequest() {
  if (window.proEmergencyInterval) clearInterval(window.proEmergencyInterval);
  hideProEmergencyBottomSheet();

  const emerg = state.receivedEmergency;
  if (!emerg) return;

  const pro = state.professionals.find(p => p.id === emerg.proId);

  // Crear conversación de chat
  let chat = state.chats.find(c => c.proId === emerg.proId && c.clientEmail.toLowerCase() === emerg.clientEmail.toLowerCase());
  if (!chat) {
    chat = {
      id: Date.now(),
      proId: emerg.proId,
      proName: pro ? pro.name : "Prestador de Guardia",
      clientEmail: emerg.clientEmail,
      clientName: emerg.clientName,
      messages: [
        {
          sender: 'client',
          text: `🚨 SOS URGENCIA REQUERIDA: ${emerg.detail}`
        },
        {
          sender: 'pro',
          text: `¡Hola! Acepté tu solicitud de emergencia. Ya estoy al tanto del problema. ¿Podrías darme más detalles así coordinamos el precio?`
        }
      ],
      unreadByClient: true,
      unreadByPro: false,
      clientDeleted: false,
      proDeleted: false
    };
    state.chats.push(chat);
  } else {
    chat.messages.push({
      sender: 'client',
      text: `🚨 SOS URGENCIA REQUERIDA: ${emerg.detail}`
    });
    chat.messages.push({
      sender: 'pro',
      text: `¡Hola! Acepté tu solicitud de emergencia. Ya estoy al tanto del problema. ¿Podrías darme más detalles así coordinamos el precio?`
    });
    chat.unreadByClient = true;
    chat.clientDeleted = false;
    chat.proDeleted = false;
  }

  state.receivedEmergency = null;
  state.activeSosRequest = null;
  saveToLocalStorage();

  showToast("🚨 Trabajo Aceptado", "Guardia de emergencia aceptada con éxito.", "success");

  // Redirigir ambos a la sección de chat
  // Primero redirigimos la vista activa actual del profesional al chat
  switchProSubView('chat');
  state.activeChatId = chat.id;
  renderChatMessages();

  // Simular la transición del cliente al chat
  setTimeout(() => {
    switchView('client');
    switchClientSubview('chat');
    openClientChatWindow(chat);

    const searchingModal = document.getElementById('client-sos-searching-modal');
    if (searchingModal) {
      searchingModal.classList.add('hidden');
    }
  }, 1000);
}

function endSosSearch(cancelled, message) {
  const req = state.activeSosRequest;
  if (req && req.timer) {
    clearInterval(req.timer);
    clearTimeout(req.timer);
  }

  state.activeSosRequest = null;
  state.receivedEmergency = null;
  saveToLocalStorage();

  const modal = document.getElementById('client-sos-searching-modal');
  if (modal) {
    modal.classList.add('hidden');
  }

  if (cancelled) {
    showToast("Búsqueda Cancelada", "Has cancelado la solicitud de guardia SOS.", "info");
  } else if (message) {
    alert(message);
  }
}
