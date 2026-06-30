const STORAGE_KEY = "sigem-emg-state-v1";

const users = [
  { id: "u1", name: "Dra. Laura Medina", role: "Emergentóloga de planta", roleKey: "emergentologist" },
  { id: "u2", name: "Dr. Pablo Ríos", role: "Residente", roleKey: "resident" },
  { id: "u3", name: "Enf. Sofía Castro", role: "Enfermería", roleKey: "nursing" },
  { id: "u4", name: "Marina López", role: "Administrativo", roleKey: "administrative" },
  { id: "u5", name: "Dr. Hernán Suárez", role: "Jefe de unidad", roleKey: "chief" },
  { id: "u6", name: "Aud. Valeria Campos", role: "Auditor", roleKey: "auditor" },
  { id: "u7", name: "Lucía Fernández", role: "Facturación", roleKey: "billing" },
  { id: "u8", name: "Admin SiGEM", role: "Administrador", roleKey: "admin" },
];

const rolePermissions = {
  emergentologist: {
    views: ["dashboard", "new-patient", "patient-detail", "reports"],
    tabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    editTabs: ["admission", "initial", "evolutions", "orders", "studies", "consults", "discharge"],
    canCreatePatient: true,
  },
  resident: {
    views: ["dashboard", "new-patient", "patient-detail", "reports"],
    tabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    editTabs: ["admission", "initial", "evolutions", "orders", "studies", "consults", "discharge"],
    canCreatePatient: true,
  },
  nursing: {
    views: ["dashboard", "patient-detail", "reports"],
    tabs: ["admission", "initial", "orders", "nursing", "studies", "discharge"],
    editTabs: ["nursing"],
    canCreatePatient: false,
  },
  administrative: {
    views: ["dashboard", "new-patient", "patient-detail"],
    tabs: ["admission", "discharge"],
    editTabs: ["admission"],
    canCreatePatient: true,
  },
  chief: {
    views: ["dashboard", "patient-detail", "reports", "audit"],
    tabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    editTabs: [],
    canCreatePatient: false,
  },
  auditor: {
    views: ["dashboard", "patient-detail", "reports", "audit"],
    tabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    editTabs: [],
    canCreatePatient: false,
  },
  billing: {
    views: ["dashboard", "patient-detail", "reports"],
    tabs: ["admission", "studies", "discharge"],
    editTabs: [],
    canCreatePatient: false,
  },
  admin: {
    views: ["dashboard", "new-patient", "patient-detail", "reports", "audit"],
    tabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    editTabs: ["admission", "initial", "evolutions", "orders", "nursing", "studies", "consults", "discharge"],
    canCreatePatient: true,
  },
};

let state = loadState();
let activeView = "dashboard";
let selectedPatientId = null;
let selectedTab = "admission";
let currentUserId = state.isLoggedIn ? state.currentUserId : null;
let medicationReportDate = todayInputValue();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const viewTitles = {
  dashboard: "Tablero de pacientes",
  "new-patient": "Nuevo paciente",
  "patient-detail": "Ficha clínica",
  reports: "Reportes básicos",
  audit: "Auditoría básica",
};

const tabTitles = {
  admission: "Admisión",
  initial: "Evaluación inicial",
  evolutions: "Evoluciones médicas",
  orders: "Indicaciones",
  nursing: "Hoja de enfermería",
  studies: "Laboratorio y estudios complementarios",
  consults: "Interconsultas",
  discharge: "Alta / egreso",
};

const locationOptions = ["Shock room", "Consultorio", "Observación", "Sala de espera", "Pasillo / camilla", "Guardia B", "VNI"];
const responsibleOptions = ["Emergentología", "Guardia B", "Cirugía", "Traumatología", "Toxicología", "Cardiología"];

const orderCatalog = [
  {
    title: "Cuidados generales",
    type: "Cuidado de enfermería",
    items: [
      "Cabecera 45°",
      "Oxigenoterapia",
      "Barandas elevadas",
      "Monitoreo continuo",
      "CSV por turno",
      "Balance hídrico por turno",
      "Rotar cada 3 hs",
      "Miniexamen neurológico horario. Avisar si cambios.",
    ],
  },
  {
    title: "Endovenoso - infusión continua",
    type: "Infusión continua",
    items: [
      "PHP Dx 5% en SF a 14 g/min.",
      "Midazolam 150 mg en 100 ml SF a 7 ml/h",
      "Dexmedetomidina 2 amp (400 mcg)/50 ml a regular",
      "Propofol 4 amp (800 mg)/80 ml a regular",
      "Noradrenalina 16 mg en 100 ml Dx 5% a regular para TAM 60-70 mmHg",
      "Insulina 100 UI en 100 ml SF a regular",
    ],
  },
  {
    title: "Endovenoso - intermitente",
    type: "Medicación EV",
    items: [
      "Vía intermitente",
      "Expansión con solución fisiológica según indicación médica",
      "Expansión con Ringer Lactato según indicación médica",
      "AMS 1.5 g c/6 hs",
      "Ceftriaxona 1 g c/12 hs",
      "Ceftriaxona 2 g c/12 hs",
      "Metronidazol 500 mg c/8 hs",
      "Piperacilina tazobactam 4.5 g c/6 hs",
      "Vancomicina 1 g cada 12 hs",
      "Omeprazol 40 mg/día",
      "Diclofenac 75 mg c/12 hs",
      "Si vómitos: 1 amp de Reliveran",
    ],
  },
  {
    title: "Subcutánea",
    type: "Medicación SC",
    items: [
      "Enoxaparina 40 mg/d a las 20 hs",
      "Heparina sódica 5000 UI según indicación",
      "HGT precomidas y correcciones según tabla",
      "HGT cada 4 hs y correcciones según tabla",
      "HGT horario",
      "Vitamina K 10 mg",
    ],
  },
  {
    title: "Vía oral / enteral",
    type: "VO / enteral",
    items: [
      "Nada vía oral",
      "Tolerancia a líquidos",
      "Sólo medicación",
      "Dieta blanda",
      "Dieta general",
      "Dieta hiposódica",
      "Dieta para diabéticos",
      "AAS 100 mg/d",
      "Atorvastatina 40 mg/d",
      "Paracetamol según dolor o fiebre",
    ],
  },
  {
    title: "Terapias inhaladas",
    type: "Terapia inhalada",
    items: [
      "Nebulizaciones según indicación",
      "Puff según indicación",
    ],
  },
  {
    title: "Otras indicaciones",
    type: "Procedimiento / cuidado",
    items: [
      "Colocar sonda nasogástrica (SNG)",
      "Colocar sonda vesical (SV)",
      "Colocar 2 vía periférica",
      "Control de débito de drenajes y sondas",
      "Realizar electrocardiograma (ECG)",
      "Suero y vacuna antitetánica (SAT y VAT)",
      "Mantener collar cervical",
      "Rotar en bloque",
      "Anticoagulado. No punciones arteriales.",
    ],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  setupLogin();
  setupUsers();
  setupNavigation();
  setupPatientForm();
  setupFilters();
  setupAdmissionTypeToggle();
  setupOtherSelects();
  $("#seed-demo").addEventListener("click", seedDemoData);
  $("#logout-button").addEventListener("click", logout);
  render();
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { patients: [], audit: [], currentUserId: users[0].id };
  }
  try {
    return JSON.parse(saved);
  } catch {
    return { patients: [], audit: [], currentUserId: users[0].id };
  }
}

function saveState() {
  state.currentUserId = currentUserId;
  state.isLoggedIn = Boolean(currentUserId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setupLogin() {
  const loginSelect = $("#login-user");
  loginSelect.innerHTML = users.map((user) => `<option value="${user.id}">${user.name} - ${user.role}</option>`).join("");
  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const password = $("#login-password").value;
    if (password !== "demo") {
      alert("Clave incorrecta para la maqueta. Usá: demo");
      return;
    }
    currentUserId = loginSelect.value;
    activeView = "dashboard";
    selectedTab = "admission";
    saveState();
    render();
  });
}

function setupUsers() {
  const select = $("#current-user");
  select.innerHTML = users.map((user) => `<option value="${user.id}">${user.name}</option>`).join("");
  select.disabled = true;
}

function setupNavigation() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
  $$("[data-view-trigger]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewTrigger));
  });
}

function setupPatientForm() {
  $("#patient-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!getPermissions().canCreatePatient) {
      alert("Tu rol no tiene permiso para crear pacientes.");
      return;
    }
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const now = new Date().toISOString();
    const fullName = formatPatientName(data.familyName, data.givenName);
    const patient = {
      id: createId(),
      createdAt: now,
      updatedAt: now,
      familyName: data.familyName.trim(),
      givenName: data.givenName.trim(),
      fullName,
      documentId: data.documentId.trim(),
      age: data.age,
      sex: data.sex,
      phone: data.phone.trim(),
      emergencyContact: data.emergencyContact.trim(),
      clinicalRecord: data.clinicalRecord.trim(),
      episodeNumber: data.episodeNumber.trim() || createEpisodeNumber(),
      coverage: data.coverage.trim(),
      coveragePlan: data.coveragePlan.trim(),
      affiliateNumber: data.affiliateNumber.trim(),
      chiefComplaint: data.chiefComplaint.trim(),
      priority: data.priority,
      status: data.status,
      admissionDateTime: data.admissionDateTime ? new Date(data.admissionDateTime).toISOString() : now,
      admissionType: data.admissionType,
      internalTransferFrom: data.admissionType === "Traslado interno" ? data.internalTransferFrom : "",
      location: selectedOrOther(data.locationOption, data.locationOther),
      responsible: selectedOrOther(data.responsibleOption, data.responsibleOther),
      initial: null,
      evolutions: [],
      orders: [],
      nursing: createEmptyNursing(),
      studies: [],
      consults: [],
      discharge: null,
    };
    state.patients.unshift(patient);
    addAudit("Creó paciente", patient.fullName, patient.id);
    saveState();
    form.reset();
    setupOtherSelects(form);
    selectedPatientId = patient.id;
    selectedTab = "admission";
    showView("patient-detail");
  });
}

function setupFilters() {
  $("#patient-search").addEventListener("input", renderDashboard);
  $("#status-filter").addEventListener("change", renderDashboard);
}

function showView(view) {
  if (!canView(view)) {
    alert("Tu rol no tiene permiso para acceder a esta sección.");
    view = "dashboard";
  }
  activeView = view;
  $$(".view").forEach((section) => section.classList.remove("active"));
  $(`#${view}-view`)?.classList.add("active");
  $$(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  $("#view-title").textContent = viewTitles[view] || "SiGEM-EMG";
  render();
}

function render() {
  renderAuthState();
  if (!currentUserId) return;
  const user = getCurrentUser();
  $("#current-user").value = currentUserId;
  $("#current-role").textContent = user.role;
  renderPermissions();
  renderDashboard();
  renderReports();
  renderAudit();
  if (activeView === "patient-detail") renderPatientDetail();
}

function renderAuthState() {
  const loggedIn = Boolean(currentUserId);
  $("#login-screen").classList.toggle("hidden", loggedIn);
  $("#app-shell").classList.toggle("hidden", !loggedIn);
}

function renderPermissions() {
  $$(".nav-item").forEach((button) => {
    button.hidden = !canView(button.dataset.view);
  });
  $$("[data-view-trigger='new-patient']").forEach((button) => {
    button.hidden = !getPermissions().canCreatePatient;
  });
  if (!canView(activeView)) showView("dashboard");
}

function logout() {
  currentUserId = null;
  state.isLoggedIn = false;
  saveState();
  render();
}

function renderDashboard() {
  const search = $("#patient-search").value.toLowerCase().trim();
  const status = $("#status-filter").value;
  const patients = state.patients.filter((patient) => {
    const matchesSearch = [patient.familyName, patient.givenName, patient.fullName, patient.documentId, patient.clinicalRecord, patient.episodeNumber, patient.chiefComplaint]
      .join(" ")
      .toLowerCase()
      .includes(search);
    const matchesStatus = status === "all" || patient.status === status;
    return matchesSearch && matchesStatus;
  });

  $("#metric-active").textContent = state.patients.filter((p) => p.status !== "Egresado").length;
  $("#metric-observation").textContent = state.patients.filter((p) => p.status === "Observación").length;
  $("#metric-pending").textContent = state.patients.filter((p) => p.status.includes("Pendiente")).length;
  $("#metric-discharged").textContent = state.patients.filter((p) => p.status === "Egresado" && isToday(p.updatedAt)).length;

  $("#patient-table").innerHTML = patients.length
    ? patients.map(renderPatientRow).join("")
    : `<tr><td colspan="7"><div class="empty-state">Todavía no hay pacientes para mostrar.</div></td></tr>`;

  $$("tr[data-patient-id]").forEach((row) => {
    row.addEventListener("click", () => {
      selectedPatientId = row.dataset.patientId;
      selectedTab = "admission";
      showView("patient-detail");
    });
  });
}

function renderPatientRow(patient) {
  return `
    <tr data-patient-id="${patient.id}">
      <td>
        <div class="patient-name">${escapeHtml(patient.fullName)}</div>
        <div class="subtext">DNI/ID ${escapeHtml(patient.documentId)} · HCI ${escapeHtml(patient.clinicalRecord || "s/d")} · Episodio ${escapeHtml(patient.episodeNumber || "s/d")}</div>
      </td>
      <td>${escapeHtml(patient.chiefComplaint)}</td>
      <td><span class="badge priority-${patient.priority}">${patient.priority}</span></td>
      <td><span class="badge">${patient.status}</span></td>
      <td>${escapeHtml(patient.location)}</td>
      <td>${formatDateTime(patient.admissionDateTime || patient.createdAt)}</td>
      <td>${escapeHtml(patient.responsible)}</td>
    </tr>
  `;
}

function renderPatientDetail() {
  const patient = getSelectedPatient();
  const target = $("#patient-detail");
  if (!patient) {
    target.innerHTML = `<div class="empty-state">Seleccioná un paciente desde el tablero.</div>`;
    return;
  }

  const allowedTabs = getPermissions().tabs;
  if (!allowedTabs.includes(selectedTab)) selectedTab = allowedTabs[0] || "initial";
  const template = $("#clinical-template").content.cloneNode(true);
  $(".patient-summary", template).innerHTML = renderPatientSummary(patient);
  const panel = $(".clinical-panel", template);
  $$(".tab", panel).forEach((tab) => {
    if (!allowedTabs.includes(tab.dataset.tab)) {
      tab.remove();
      return;
    }
    tab.classList.toggle("active", tab.dataset.tab === selectedTab);
    tab.addEventListener("click", () => {
      selectedTab = tab.dataset.tab;
      renderPatientDetail();
    });
  });
  $(".tab-body", panel).innerHTML = allowedTabs.length
    ? renderTab(patient, selectedTab)
    : emptyState("Tu rol no tiene secciones habilitadas en esta ficha.");
  target.innerHTML = "";
  target.appendChild(template);
  setupClinicalForms(patient);
}

function renderPatientSummary(patient) {
  return `
    <h3>${escapeHtml(patient.fullName)}</h3>
    <p class="subtext">DNI/ID ${escapeHtml(patient.documentId)} · ${escapeHtml(patient.age)} años · ${escapeHtml(patient.sex)}</p>
    <div class="summary-list">
      <div><strong>HCI</strong>${escapeHtml(patient.clinicalRecord || "Pendiente")}</div>
      <div><strong>Episodio</strong>${escapeHtml(patient.episodeNumber || "No generado")}</div>
      <div><strong>Motivo</strong>${escapeHtml(patient.chiefComplaint)}</div>
      <div><strong>Estado actual</strong><span class="badge">${patient.status}</span></div>
      <div><strong>Prioridad</strong><span class="badge priority-${patient.priority}">${patient.priority}</span></div>
      <div><strong>Ubicación</strong>${escapeHtml(patient.location)}</div>
      <div><strong>Responsable</strong>${escapeHtml(patient.responsible)}</div>
      <div><strong>Ingreso</strong>${formatDateTime(patient.admissionDateTime || patient.createdAt)}</div>
      <div><strong>Tipo de ingreso</strong>${escapeHtml(formatAdmissionType(patient))}</div>
    </div>
    <div class="summary-actions">
      <button class="secondary-button" id="back-dashboard">Volver al tablero</button>
      <button class="primary-button" id="print-summary">Generar resumen PDF</button>
    </div>
  `;
}

function renderTab(patient, tab) {
  const renderers = {
    admission: renderAdmissionTab,
    initial: renderInitialTab,
    evolutions: renderEvolutionsTab,
    orders: renderOrdersTab,
    nursing: renderNursingTab,
    studies: renderStudiesTab,
    consults: renderConsultsTab,
    discharge: renderDischargeTab,
  };
  return `
    <div class="section-heading">
      <h3>${tabTitles[tab]}</h3>
      <p>Fecha, hora y usuario quedan registrados automáticamente.</p>
    </div>
    ${renderers[tab](patient)}
  `;
}

function renderAdmissionTab(patient) {
  if (!canEditTab("admission")) return renderAdmissionReadOnly(patient);
  const names = getPatientNames(patient);
  const locationSelection = optionSelection(patient.location, locationOptions);
  const responsibleSelection = optionSelection(patient.responsible, responsibleOptions);
  return `
    <form class="entry-form" data-admission-form>
      <label>Apellido <input required name="familyName" value="${escapeHtml(names.familyName)}" autocomplete="family-name" /></label>
      <label>Nombre <input required name="givenName" value="${escapeHtml(names.givenName)}" autocomplete="given-name" /></label>
      <label>DNI / Identificador <input required name="documentId" value="${escapeHtml(patient.documentId || "")}" /></label>
      <label>Edad <input required name="age" type="number" min="0" max="130" value="${escapeHtml(patient.age || "")}" /></label>
      <label>Sexo
        <select name="sex">
          ${["Femenino", "Masculino", "Otro / no consignado"].map((option) => `<option ${patient.sex === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label>Teléfono / contacto <input name="phone" value="${escapeHtml(patient.phone || "")}" /></label>
      <label>Contacto de emergencia <input name="emergencyContact" value="${escapeHtml(patient.emergencyContact || "")}" /></label>
      <label>N° historia clínica / HCI <input name="clinicalRecord" value="${escapeHtml(patient.clinicalRecord || "")}" placeholder="Puede quedar pendiente al ingreso" /></label>
      <label>N° episodio / atención <input name="episodeNumber" value="${escapeHtml(patient.episodeNumber || "")}" /></label>
      <label>Cobertura / obra social <input name="coverage" value="${escapeHtml(patient.coverage || "")}" /></label>
      <label>Plan <input name="coveragePlan" value="${escapeHtml(patient.coveragePlan || "")}" /></label>
      <label>N° de afiliado <input name="affiliateNumber" value="${escapeHtml(patient.affiliateNumber || "")}" /></label>
      <label>Fecha y hora de ingreso <input name="admissionDateTime" type="datetime-local" value="${dateTimeLocalValue(patient.admissionDateTime || patient.createdAt)}" /></label>
      <label>Tipo de ingreso
        <select name="admissionType" data-admission-type>
          ${["Propios medios", "Derivado", "Ambulancia privada", "SAME/107", "Traslado interno"].map((option) => `<option ${patient.admissionType === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label data-internal-transfer-field>Origen si es traslado interno
        <select name="internalTransferFrom">
          ${["", "Guardia B", "Clínica", "Traumatología", "Cirugía", "Quirófano", "VNI", "Ginecología"].map((option) => `<option value="${escapeHtml(option)}" ${patient.internalTransferFrom === option ? "selected" : ""}>${option || "No corresponde"}</option>`).join("")}
        </select>
      </label>
      <label class="full">Motivo de consulta <textarea required name="chiefComplaint">${escapeHtml(patient.chiefComplaint || "")}</textarea></label>
      <label>Prioridad
        <select name="priority">
          ${["Roja", "Naranja", "Amarilla", "Verde", "Azul"].map((option) => `<option ${patient.priority === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label>Estado
        <select name="status">
          ${["Espera", "En evaluación", "Observación", "Pendiente de estudios", "Pendiente de interconsulta", "Egresado"].map((option) => `<option ${patient.status === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label>Ubicación inicial / actual
        <select name="locationOption" data-other-select="location-other-admission">
          ${[...locationOptions, "Otros"].map((option) => `<option ${locationSelection.option === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label id="location-other-admission" ${locationSelection.option === "Otros" ? "" : "hidden"}>Otra ubicación
        <input name="locationOther" value="${escapeHtml(locationSelection.other)}" />
      </label>
      <label>Responsable inicial
        <select name="responsibleOption" data-other-select="responsible-other-admission">
          ${[...responsibleOptions, "Otros"].map((option) => `<option ${responsibleSelection.option === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label id="responsible-other-admission" ${responsibleSelection.option === "Otros" ? "" : "hidden"}>Otro responsable
        <input name="responsibleOther" value="${escapeHtml(responsibleSelection.other)}" />
      </label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar admisión</button></div>
    </form>
    ${renderAdmissionReadOnly(patient)}
  `;
}

function renderAdmissionReadOnly(patient) {
  return `
    <div class="nursing-header">
      <div><strong>Paciente</strong><span>${escapeHtml(patient.fullName)} · ${escapeHtml(patient.age)} años · ${escapeHtml(patient.sex)}</span></div>
      <div><strong>DNI / ID</strong><span>${escapeHtml(patient.documentId)}</span></div>
      <div><strong>HCI</strong><span>${escapeHtml(patient.clinicalRecord || "Pendiente")}</span></div>
      <div><strong>Episodio</strong><span>${escapeHtml(patient.episodeNumber || "No generado")}</span></div>
      <div><strong>Ingreso</strong><span>${formatDateTime(patient.admissionDateTime || patient.createdAt)}</span></div>
      <div><strong>Tipo de ingreso</strong><span>${escapeHtml(formatAdmissionType(patient))}</span></div>
      <div><strong>Cobertura</strong><span>${escapeHtml(formatCoverage(patient))}</span></div>
      <div><strong>Contacto de emergencia</strong><span>${escapeHtml(patient.emergencyContact || "No consignado")}</span></div>
      <div><strong>Ubicación</strong><span>${escapeHtml(patient.location || "No consignada")}</span></div>
      <div><strong>Responsable inicial</strong><span>${escapeHtml(patient.responsible || "No consignado")}</span></div>
      <div class="full"><strong>Motivo de consulta</strong><span>${escapeHtml(patient.chiefComplaint || "No consignado")}</span></div>
    </div>
  `;
}

function renderInitialTab(patient) {
  if (getCurrentUser().roleKey === "nursing") return renderNursingInitialSummary(patient);
  const data = patient.initial || {};
  const automaticNursingSummary = buildNursingSummary(data.syndromicDiagnosis, data.diagnosticImpression);
  if (!canEditTab("initial")) {
    return data.createdAt ? renderEntry(data, ["currentIllness", "vitals", "syndromicDiagnosis", "nursingSummary", "diagnosticImpression", "initialPlan"]) : emptyState("Sin evaluación inicial registrada.");
  }
  return `
    <form class="entry-form" data-clinical-form="initial">
      <label class="full">Enfermedad actual <textarea name="currentIllness">${escapeHtml(data.currentIllness || "")}</textarea></label>
      <label>Signos vitales <input name="vitals" value="${escapeHtml(data.vitals || "")}" placeholder="TA, FC, FR, SatO2, T" /></label>
      <label>Alergias <input name="allergies" value="${escapeHtml(data.allergies || "")}" /></label>
      <label>Diagnóstico sindromático / problema activo <input name="syndromicDiagnosis" value="${escapeHtml(data.syndromicDiagnosis || "")}" /></label>
      <label>Precauciones / aislamiento <input name="precautions" value="${escapeHtml(data.precautions || "")}" /></label>
      <label class="full">Antecedentes relevantes <textarea name="history">${escapeHtml(data.history || "")}</textarea></label>
      <label class="full">Examen físico <textarea name="physicalExam">${escapeHtml(data.physicalExam || "")}</textarea></label>
      <label class="full">Resumen operativo para enfermería (automático)
        <textarea name="nursingSummary" readonly>${escapeHtml(automaticNursingSummary)}</textarea>
      </label>
      <label>Impresión diagnóstica <input name="diagnosticImpression" value="${escapeHtml(data.diagnosticImpression || "")}" /></label>
      <label>Conducta inicial <input name="initialPlan" value="${escapeHtml(data.initialPlan || "")}" /></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar evaluación</button></div>
    </form>
    ${data.createdAt ? renderEntry(data, ["currentIllness", "vitals", "syndromicDiagnosis", "nursingSummary", "diagnosticImpression", "initialPlan"]) : emptyState("Sin evaluación inicial registrada.")}
  `;
}

function renderNursingInitialSummary(patient) {
  const data = patient.initial || {};
  return `
    <div class="nursing-header">
      <div>
        <strong>Motivo de consulta</strong>
        <span>${escapeHtml(patient.chiefComplaint)}</span>
      </div>
      <div>
        <strong>Alergias</strong>
        <span>${escapeHtml(data.allergies || "No consignadas")}</span>
      </div>
      <div>
        <strong>Diagnóstico sindromático / problema activo</strong>
        <span>${escapeHtml(data.syndromicDiagnosis || data.diagnosticImpression || "No consignado")}</span>
      </div>
      <div>
        <strong>Precauciones / aislamiento</strong>
        <span>${escapeHtml(data.precautions || "No consignado")}</span>
      </div>
      <div class="full">
        <strong>Resumen operativo para enfermería</strong>
        <span>${escapeHtml(data.nursingSummary || "No consignado")}</span>
      </div>
    </div>
  `;
}

function renderEvolutionsTab(patient) {
  if (!canEditTab("evolutions")) return renderEntryList(patient.evolutions, ["problem", "note", "plan"]);
  return `
    <form class="entry-form" data-clinical-form="evolutions">
      <label>Problema / diagnóstico <input name="problem" required /></label>
      <label>Conducta <input name="plan" required /></label>
      <label class="full">Evolución <textarea name="note" required></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Agregar evolución</button></div>
    </form>
    ${renderEntryList(patient.evolutions, ["problem", "note", "plan"])}
  `;
}

function renderOrdersTab(patient) {
  if (!canEditTab("orders")) {
    return `
      <div class="nursing-actions">
        <button class="secondary-button" id="print-orders">Imprimir hoja de indicaciones</button>
      </div>
      <section class="order-print-sheet">
        ${renderOrderHeader(patient)}
        ${renderOrderPreview(patient)}
      </section>
    `;
  }
  return `
    <div class="nursing-actions">
      <button class="secondary-button" id="print-orders">Imprimir hoja de indicaciones</button>
    </div>
    <section class="order-print-sheet">
      ${renderOrderHeader(patient)}
      <form class="order-builder" data-orders-form>
        ${orderCatalog.map(renderOrderCategory).join("")}
        <div class="form-actions full">
          <button class="primary-button" type="submit">Guardar hoja de indicaciones</button>
        </div>
      </form>
      ${renderOrderPreview(patient)}
    </section>
  `;
}

function renderOrderHeader(patient) {
  const allergies = patient.initial?.allergies || "No consignadas";
  return `
    <div class="nursing-header order-header">
      <div>
        <strong>Paciente</strong>
        <span>${escapeHtml(patient.fullName)} · ${escapeHtml(patient.age)} años · DNI/ID ${escapeHtml(patient.documentId)}</span>
      </div>
      <div>
        <strong>Fecha y hora</strong>
        <span>${formatDateTime(new Date().toISOString())}</span>
      </div>
      <div>
        <strong>Motivo de ingreso</strong>
        <span>${escapeHtml(patient.chiefComplaint)}</span>
      </div>
      <div>
        <strong>Historia clínica</strong>
        <span>${escapeHtml(patient.clinicalRecord || "No consignada")}</span>
      </div>
      <div>
        <strong>Alergias</strong>
        <span>${escapeHtml(allergies)}</span>
      </div>
      <div>
        <strong>Médico/residente</strong>
        <span>${escapeHtml(getCurrentUser().name)}</span>
      </div>
    </div>
  `;
}

function renderOrderCategory(category, index) {
  const categoryId = `cat-${index}`;
  return `
    <fieldset class="order-category">
      <legend>${escapeHtml(category.title)}</legend>
      <div class="order-options">
        ${category.items.map((item) => `
          <label class="check-row">
            <input type="checkbox" name="templates" value="${escapeHtml(item)}" data-type="${escapeHtml(category.type)}" />
            <span>${escapeHtml(item)}</span>
          </label>
        `).join("")}
      </div>
      <label class="other-order">
        Otras de ${escapeHtml(category.title.toLowerCase())}
        <textarea name="other_${categoryId}" data-other-type="${escapeHtml(category.type)}" placeholder="Separar cada indicación con coma. Ej: control de dolor, avisar si fiebre"></textarea>
      </label>
    </fieldset>
  `;
}

function renderOrderPreview(patient) {
  const activeOrders = patient.orders.filter((order) => order.status !== "Suspendida");
  if (!activeOrders.length) return emptyState("Todavía no hay indicaciones activas.");
  return `
    <div class="order-print-grid">
      <div class="table-wrap order-sheet-table">
        <table>
          <thead>
            <tr>
              <th>Indicaciones</th>
              <th>12-18 hs</th>
              <th>18-24 hs</th>
              <th>24-06 hs</th>
              <th>06-12 hs</th>
            </tr>
          </thead>
          <tbody>
            ${activeOrders.map((order, index) => `
              <tr>
                <td><strong>${index + 1})</strong> ${escapeHtml(order.description)}<div class="subtext">${escapeHtml(order.type)} · ${escapeHtml(order.user || "")}</div></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      ${renderGlucosePrintBox()}
    </div>
    <div class="signature-strip">
      <span>Firma y sello médico</span>
      <span>Firma y sello 12-18</span>
      <span>Firma y sello 18-24</span>
      <span>Firma y sello 24-06</span>
      <span>Firma y sello 06-12</span>
    </div>
  `;
}

function renderGlucosePrintBox() {
  return `
    <div class="glucose-box">
      <h4>Tabla de correcciones de glucemia</h4>
      <table>
        <tbody>
          <tr><th>HGT</th><th>UI</th><th>HGT</th><th>UI</th></tr>
          <tr><td>151-200</td><td>3</td><td>251-300</td><td>9</td></tr>
          <tr><td>201-250</td><td>6</td><td>&gt;300</td><td>10 y avisar</td></tr>
        </tbody>
      </table>
      <h4>Registro HGT</h4>
      <table>
        <tbody>
          <tr><th>Hora</th><th>Valor</th><th>UI</th></tr>
          <tr><td></td><td></td><td></td></tr>
          <tr><td></td><td></td><td></td></tr>
          <tr><td></td><td></td><td></td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function collectOrderEntries(form) {
  const entries = [];
  $$('input[name="templates"]:checked', form).forEach((input) => {
    entries.push({
      type: input.dataset.type || "Indicación",
      description: input.value,
      status: "Activa",
    });
  });
  $$("textarea[data-other-type]", form).forEach((textarea) => {
    splitOtherOrders(textarea.value).forEach((description) => {
      entries.push({
        type: textarea.dataset.otherType || "Otra",
        description,
        status: "Activa",
      });
    });
  });
  return entries;
}

function splitOtherOrders(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function saveOrderSheet(patientId, entries) {
  if (!canEditTab("orders")) {
    alert("Tu rol puede ver indicaciones, pero no modificarlas.");
    return;
  }
  if (!entries.length) {
    alert("Seleccioná al menos una indicación o escribí una en Otras.");
    return;
  }
  const patient = state.patients.find((item) => item.id === patientId);
  const timestamp = new Date().toISOString();
  entries.reverse().forEach((item) => {
    patient.orders.unshift({
      ...item,
      id: createId(),
      createdAt: timestamp,
      user: getCurrentUser().name,
      role: getCurrentUser().role,
    });
  });
  patient.updatedAt = timestamp;
  addAudit(`Guardó hoja de indicaciones (${entries.length})`, patient.fullName, patient.id);
  saveState();
  render();
}

function saveAdmission(patientId, data) {
  if (!canEditTab("admission")) {
    alert("Tu rol no tiene permiso para modificar admisión.");
    return;
  }
  const patient = state.patients.find((item) => item.id === patientId);
  const timestamp = new Date().toISOString();
  const fullName = formatPatientName(data.familyName, data.givenName);
  Object.assign(patient, {
    familyName: data.familyName.trim(),
    givenName: data.givenName.trim(),
    fullName,
    documentId: data.documentId.trim(),
    age: data.age,
    sex: data.sex,
    phone: data.phone.trim(),
    emergencyContact: data.emergencyContact.trim(),
    clinicalRecord: data.clinicalRecord.trim(),
    episodeNumber: data.episodeNumber.trim() || patient.episodeNumber || createEpisodeNumber(),
    coverage: data.coverage.trim(),
    coveragePlan: data.coveragePlan.trim(),
    affiliateNumber: data.affiliateNumber.trim(),
    admissionDateTime: data.admissionDateTime ? new Date(data.admissionDateTime).toISOString() : patient.admissionDateTime,
    admissionType: data.admissionType,
    internalTransferFrom: data.admissionType === "Traslado interno" ? data.internalTransferFrom : "",
    chiefComplaint: data.chiefComplaint.trim(),
    priority: data.priority,
    status: data.status,
    location: selectedOrOther(data.locationOption, data.locationOther),
    responsible: selectedOrOther(data.responsibleOption, data.responsibleOther),
    updatedAt: timestamp,
  });
  addAudit("Actualizó admisión", patient.fullName, patient.id);
  saveState();
  render();
}

function renderLegacyOrdersTab(patient) {
  return `
    <form class="entry-form" data-clinical-form="orders">
      <label>Tipo <select name="type"><option>Medicación</option><option>Hidratación</option><option>Control</option><option>Dieta</option><option>Oxígeno</option><option>Cuidado de enfermería</option></select></label>
      <label>Estado <select name="status"><option>Activa</option><option>Cumplida</option><option>Suspendida</option></select></label>
      <label class="full">Indicación <textarea name="description" required></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Agregar indicación</button></div>
    </form>
    ${renderEntryList(patient.orders, ["type", "description", "status"])}
  `;
}

function renderNursingTab(patient) {
  ensureNursing(patient);
  const summary = calculateNursingBalance(patient);
  const editable = canEditTab("nursing");
  return `
    <div class="nursing-actions">
      <button class="secondary-button" id="print-nursing">Imprimir hoja de enfermería</button>
    </div>
    <section class="nursing-print-sheet">
      ${renderNursingHeader(patient)}
      ${editable ? renderNursingShiftForm() : ""}
      ${renderNursingBalanceSummary(summary)}
      <div class="nursing-grid">
        <article class="nursing-card">
          <h4>Signos vitales y controles</h4>
          ${editable ? renderNursingVitalsForm() : ""}
          ${renderNursingTable(patient.nursing.vitals, ["shift", "time", "bp", "hr", "rr", "sat", "temp", "pain", "hgt", "sensorium"])}
        </article>
        <article class="nursing-card">
          <h4>Medicación administrada</h4>
          ${editable ? renderNursingMedicationForm(patient) : ""}
          ${renderNursingTable(patient.nursing.medications, ["shift", "scheduledTime", "actualTime", "medication", "quantity", "unit", "status", "note"])}
          ${renderPatientMedicationConsumption(patient)}
        </article>
        <article class="nursing-card">
          <h4>Balance hídrico</h4>
          ${editable ? renderNursingBalanceForm() : ""}
          ${renderNursingTable(patient.nursing.balance, ["shift", "time", "movement", "category", "volume", "note"])}
        </article>
        <article class="nursing-card">
          <h4>Cuidados y dispositivos</h4>
          ${editable ? renderNursingCareForm() : ""}
          ${renderNursingTable(patient.nursing.cares, ["shift", "time", "careType", "note"])}
        </article>
        <article class="nursing-card full">
          <h4>Pase de turno</h4>
          ${editable ? renderNursingHandoffForm() : ""}
          ${renderNursingTable(patient.nursing.handoffs, ["shift", "pending", "alerts", "changes"])}
        </article>
      </div>
    </section>
  `;
}

function renderNursingHeader(patient) {
  const syndrome = patient.initial?.syndromicDiagnosis || patient.initial?.diagnosticImpression || "No consignado";
  const allergies = patient.initial?.allergies || "No consignadas";
  return `
    <div class="nursing-header">
      <div>
        <strong>Paciente</strong>
        <span>${escapeHtml(patient.fullName)} · ${escapeHtml(patient.age)} años · DNI/ID ${escapeHtml(patient.documentId)}</span>
      </div>
      <div>
        <strong>Ubicación</strong>
        <span>${escapeHtml(patient.location)} · ${escapeHtml(patient.status)}</span>
      </div>
      <div>
        <strong>Problema activo</strong>
        <span>${escapeHtml(syndrome)}</span>
      </div>
      <div>
        <strong>Alergias</strong>
        <span>${escapeHtml(allergies)}</span>
      </div>
    </div>
  `;
}

function renderNursingShiftForm() {
  return `
    <form class="entry-form compact-form" data-nursing-form="shifts">
      <label>Fecha <input name="date" type="date" value="${todayInputValue()}" required /></label>
      <label>Turno ${renderShiftSelect()}</label>
      <label>Enfermero/a responsable <input name="nurse" value="${escapeHtml(getCurrentUser().role === "Enfermería" ? getCurrentUser().name : "")}" required /></label>
      <label>Tipo de turno
        <select name="shiftType">
          <option>Semana - 6 horas</option>
          <option>Fin de semana - 12 horas</option>
        </select>
      </label>
      <label class="full">Observación de inicio/cierre <textarea name="note"></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar turno</button></div>
    </form>
  `;
}

function renderNursingVitalsForm() {
  return `
    <form class="entry-form compact-form" data-nursing-form="vitals">
      <label>Turno ${renderShiftSelect()}</label>
      <label>Hora <input name="time" type="time" value="${timeInputValue()}" required /></label>
      <label>TA <input name="bp" placeholder="120/80" /></label>
      <label>FC <input name="hr" type="number" min="0" /></label>
      <label>FR <input name="rr" type="number" min="0" /></label>
      <label>SatO2 <input name="sat" placeholder="98%" /></label>
      <label>Temperatura <input name="temp" placeholder="36.8" /></label>
      <label>Dolor <input name="pain" placeholder="0-10" /></label>
      <label>HGT <input name="hgt" placeholder="mg/dL" /></label>
      <label>Sensorio / Glasgow <input name="sensorium" /></label>
      <label class="full">Observación <textarea name="note"></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar control</button></div>
    </form>
  `;
}

function renderNursingMedicationForm(patient) {
  const activeOrders = patient.orders.filter((order) => order.status !== "Suspendida");
  return `
    <form class="entry-form compact-form" data-nursing-form="medications">
      <label>Turno ${renderShiftSelect()}</label>
      <label>Horario indicado <input name="scheduledTime" type="time" /></label>
      <label>Hora real <input name="actualTime" type="time" value="${timeInputValue()}" required /></label>
      <label>Estado
        <select name="status">
          <option>Administrada</option>
          <option>No administrada</option>
          <option>Suspendida</option>
          <option>Paciente rechaza</option>
          <option>Sin stock</option>
          <option>Sin vía permeable</option>
        </select>
      </label>
      <label class="full">Medicación / indicación
        <select name="medication">
          <option value="">Seleccionar o escribir abajo</option>
          ${activeOrders.map((order) => `<option>${escapeHtml(order.description)}</option>`).join("")}
        </select>
      </label>
      <label class="full">Otra medicación o detalle <textarea name="freeText"></textarea></label>
      <label>Cantidad utilizada <input name="quantity" type="number" min="0.01" step="0.01" value="1" required /></label>
      <label>Unidad
        <select name="unit">
          <option>unidad</option>
          <option>ampolla</option>
          <option>frasco</option>
          <option>comprimido</option>
          <option>jeringa</option>
          <option>bolsa</option>
          <option>ml</option>
          <option>mg</option>
        </select>
      </label>
      <label class="full">Observación <textarea name="note"></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Registrar medicación</button></div>
    </form>
  `;
}

function renderPatientMedicationConsumption(patient) {
  const rows = patient.nursing.medications.filter((entry) => entry.status === "Administrada");
  if (!rows.length) return `<div class="consumption-note">Aún no hay consumo de medicación para reposición.</div>`;
  const medications = new Set(rows.map((entry) => entry.medication.trim().toLowerCase()));
  return `
    <div class="consumption-note">
      <strong>Consumo para reposición de este episodio:</strong>
      ${rows.length} administraciones · ${medications.size} medicamentos diferentes
    </div>
  `;
}

function renderNursingBalanceForm() {
  return `
    <form class="entry-form compact-form" data-nursing-form="balance">
      <label>Turno ${renderShiftSelect()}</label>
      <label>Hora <input name="time" type="time" value="${timeInputValue()}" required /></label>
      <label>Movimiento
        <select name="movement">
          <option>Ingreso</option>
          <option>Egreso</option>
        </select>
      </label>
      <label>Categoría
        <select name="category">
          <option>VO</option>
          <option>EV</option>
          <option>Enteral</option>
          <option>Diuresis</option>
          <option>Catarsis</option>
          <option>Vómitos</option>
          <option>Drenaje</option>
          <option>SNG/SNE</option>
          <option>Otros</option>
        </select>
      </label>
      <label>Volumen en ml <input name="volume" type="number" min="0" required /></label>
      <label class="full">Observación <textarea name="note"></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Agregar al balance</button></div>
    </form>
  `;
}

function renderNursingCareForm() {
  return `
    <form class="entry-form compact-form" data-nursing-form="cares">
      <label>Turno ${renderShiftSelect()}</label>
      <label>Hora <input name="time" type="time" value="${timeInputValue()}" required /></label>
      <label>Tipo de cuidado
        <select name="careType">
          <option>Vía periférica</option>
          <option>Vía central</option>
          <option>Sonda vesical</option>
          <option>Sonda nasogástrica</option>
          <option>Drenaje</option>
          <option>Oxígeno</option>
          <option>Curación</option>
          <option>Cambio de decúbito</option>
          <option>Riesgo de caída</option>
          <option>Aislamiento</option>
          <option>Higiene y confort</option>
          <option>Otro</option>
        </select>
      </label>
      <label class="full">Detalle <textarea name="note" required></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar cuidado</button></div>
    </form>
  `;
}

function renderNursingHandoffForm() {
  return `
    <form class="entry-form compact-form" data-nursing-form="handoffs">
      <label>Turno ${renderShiftSelect()}</label>
      <label class="full">Pendientes para el próximo turno <textarea name="pending"></textarea></label>
      <label class="full">Alertas <textarea name="alerts"></textarea></label>
      <label class="full">Cambios relevantes <textarea name="changes"></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar pase</button></div>
    </form>
  `;
}

function renderNursingBalanceSummary(summary) {
  const rows = summary.byShift.map((item) => `
    <tr>
      <td>${escapeHtml(item.shift)}</td>
      <td>${escapeHtml(item.nurse || "Sin asignar")}</td>
      <td>${item.input} ml</td>
      <td>${item.output} ml</td>
      <td class="${item.balance < 0 ? "negative" : "positive"}">${formatSignedMl(item.balance)}</td>
    </tr>
  `).join("");
  return `
    <div class="table-wrap nursing-summary">
      <table>
        <thead>
          <tr>
            <th>Turno</th>
            <th>Enfermero/a</th>
            <th>Ingresos</th>
            <th>Egresos</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr class="total-row">
            <td>Total 24 h</td>
            <td></td>
            <td>${summary.totalInput} ml</td>
            <td>${summary.totalOutput} ml</td>
            <td class="${summary.totalBalance < 0 ? "negative" : "positive"}">${formatSignedMl(summary.totalBalance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderNursingTable(entries, fields) {
  if (!entries.length) return emptyState("Sin registros cargados.");
  return `
    <div class="table-wrap compact-table">
      <table>
        <thead>
          <tr>
            ${fields.map((field) => `<th>${labelFor(field)}</th>`).join("")}
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => `
            <tr>
              ${fields.map((field) => `<td>${escapeHtml(entry[field] || "No consignado")}</td>`).join("")}
              <td>${escapeHtml(entry.user || "")}<div class="subtext">${formatDateTime(entry.createdAt)}</div></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderStudiesTab(patient) {
  if (!canEditTab("studies")) return renderEntryList(patient.studies, ["type", "result", "status"]);
  return `
    <form class="entry-form" data-clinical-form="studies">
      <label>Tipo de estudio <select name="type"><option>Laboratorio</option><option>Radiografía</option><option>Ecografía</option><option>Tomografía</option><option>ECG</option><option>Otro</option></select></label>
      <label>Estado <select name="status"><option>Solicitado</option><option>Pendiente</option><option>Recibido</option></select></label>
      <label class="full">Solicitud / resultado <textarea name="result" required></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Guardar estudio</button></div>
    </form>
    ${renderEntryList(patient.studies, ["type", "result", "status"])}
  `;
}

function renderConsultsTab(patient) {
  if (!canEditTab("consults")) return renderEntryList(patient.consults, ["service", "status"]);
  return `
    <form class="entry-form" data-clinical-form="consults">
      <label>Servicio <input name="service" required placeholder="Clínica, cirugía, UTI..." /></label>
      <label>Estado <select name="status"><option>Pendiente</option><option>Respondida</option><option>Cancelada</option></select></label>
      <label class="full">Motivo / respuesta <textarea name="description" required></textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Registrar interconsulta</button></div>
    </form>
    ${renderEntryList(patient.consults, ["service", "description", "status"])}
  `;
}

function renderDischargeTab(patient) {
  const data = patient.discharge || {};
  if (!canEditTab("discharge")) {
    return data.createdAt ? renderEntry(data, ["destination", "finalDiagnosis", "instructions"]) : emptyState("Sin egreso registrado.");
  }
  return `
    <form class="entry-form" data-clinical-form="discharge">
      <label>Destino final
        <select name="destination">
          ${["Alta", "Internación", "Derivación", "Óbito", "Observación"].map((option) => `<option ${data.destination === option ? "selected" : ""}>${option}</option>`).join("")}
        </select>
      </label>
      <label>Diagnóstico final <input name="finalDiagnosis" value="${escapeHtml(data.finalDiagnosis || "")}" required /></label>
      <label class="full">Indicaciones al egreso <textarea name="instructions">${escapeHtml(data.instructions || "")}</textarea></label>
      <div class="form-actions full"><button class="primary-button" type="submit">Registrar egreso</button></div>
    </form>
    ${data.createdAt ? renderEntry(data, ["destination", "finalDiagnosis", "instructions"]) : emptyState("Sin egreso registrado.")}
  `;
}

function setupClinicalForms(patient) {
  $("#back-dashboard")?.addEventListener("click", () => showView("dashboard"));
  $("#print-summary")?.addEventListener("click", () => {
    addAudit("Generó resumen PDF", patient.fullName, patient.id);
    saveState();
    window.print();
  });
  $("#print-nursing")?.addEventListener("click", () => {
    addAudit("Imprimió hoja de enfermería", patient.fullName, patient.id);
    saveState();
    window.print();
  });
  $("#print-orders")?.addEventListener("click", () => {
    addAudit("Imprimió hoja de indicaciones", patient.fullName, patient.id);
    saveState();
    printMode("printing-orders");
  });
  $("[data-orders-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveOrderSheet(patient.id, collectOrderEntries(event.currentTarget));
  });
  $("[data-admission-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAdmission(patient.id, Object.fromEntries(new FormData(event.currentTarget).entries()));
  });
  setupAdmissionTypeToggle();
  setupOtherSelects();
  setupAutomaticNursingSummary();
  $$("[data-clinical-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = form.dataset.clinicalForm;
      const data = Object.fromEntries(new FormData(form).entries());
      saveClinicalEntry(patient.id, type, data);
    });
  });
  $$("[data-nursing-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = form.dataset.nursingForm;
      const data = Object.fromEntries(new FormData(form).entries());
      saveNursingEntry(patient.id, type, data);
    });
  });
}

function saveClinicalEntry(patientId, type, data) {
  if (!canEditTab(type)) {
    alert("Tu rol puede ver esta sección, pero no modificarla.");
    return;
  }
  const patient = state.patients.find((item) => item.id === patientId);
  const timestamp = new Date().toISOString();
  if (type === "initial") {
    data.nursingSummary = buildNursingSummary(data.syndromicDiagnosis, data.diagnosticImpression);
  }
  const entry = {
    ...data,
    id: createId(),
    createdAt: timestamp,
    user: getCurrentUser().name,
    role: getCurrentUser().role,
  };

  if (type === "initial") {
    patient.initial = entry;
    patient.status = patient.status === "Espera" ? "En evaluación" : patient.status;
    addAudit("Registró evaluación inicial", patient.fullName, patient.id);
  } else if (type === "discharge") {
    patient.discharge = entry;
    patient.status = entry.destination === "Observación" ? "Observación" : "Egresado";
    addAudit("Registró alta/egreso", patient.fullName, patient.id);
  } else {
    patient[type].unshift(entry);
    const actionNames = {
      evolutions: "Agregó evolución",
      orders: "Agregó indicación",
      studies: "Registró estudio",
      consults: "Registró interconsulta",
    };
    if (type === "studies" && entry.status !== "Recibido") patient.status = "Pendiente de estudios";
    if (type === "consults" && entry.status === "Pendiente") patient.status = "Pendiente de interconsulta";
    addAudit(actionNames[type], patient.fullName, patient.id);
  }

  patient.updatedAt = timestamp;
  saveState();
  render();
}

function saveNursingEntry(patientId, type, data) {
  if (!canEditTab("nursing")) {
    alert("Tu rol no tiene permiso para registrar datos de enfermería.");
    return;
  }
  const patient = state.patients.find((item) => item.id === patientId);
  ensureNursing(patient);
  const timestamp = new Date().toISOString();
  const entry = {
    ...data,
    id: createId(),
    createdAt: timestamp,
    user: getCurrentUser().name,
    role: getCurrentUser().role,
  };

  if (type === "medications") {
    entry.medication = data.medication || data.freeText || "No consignada";
    entry.quantity = Number(data.quantity || 1);
    entry.unit = data.unit || "unidad";
  }

  patient.nursing[type].unshift(entry);
  patient.updatedAt = timestamp;

  const actionNames = {
    shifts: "Asignó turno de enfermería",
    vitals: "Registró control de enfermería",
    medications: "Registró medicación administrada",
    balance: "Registró balance hídrico",
    cares: "Registró cuidado de enfermería",
    handoffs: "Registró pase de turno",
  };
  addAudit(actionNames[type], patient.fullName, patient.id);
  saveState();
  render();
}

function renderEntryList(entries, fields) {
  if (!entries.length) return emptyState("Todavía no hay registros en esta sección.");
  return `<div class="entry-list">${entries.map((entry) => renderEntry(entry, fields)).join("")}</div>`;
}

function renderEntry(entry, fields) {
  return `
    <article class="entry">
      <header>
        <span>${formatDateTime(entry.createdAt)}</span>
        <span>${escapeHtml(entry.user || "")} · ${escapeHtml(entry.role || "")}</span>
      </header>
      ${fields.map((field) => `<p><strong>${labelFor(field)}:</strong> ${escapeHtml(entry[field] || "No consignado")}</p>`).join("")}
    </article>
  `;
}

function renderReports() {
  const todayPatients = state.patients.filter((patient) => isToday(patient.createdAt));
  const rows = [
    ["Ingresos de hoy", todayPatients.length],
    ["Pacientes activos", state.patients.filter((p) => p.status !== "Egresado").length],
    ["Pendientes de estudios", state.patients.filter((p) => p.status === "Pendiente de estudios").length],
    ["Pendientes de interconsulta", state.patients.filter((p) => p.status === "Pendiente de interconsulta").length],
  ];
  $("#daily-report").innerHTML = rows.map(([label, value]) => `<div class="report-row"><strong>${label}</strong><span>${value}</span></div>`).join("");

  const destinations = ["Alta", "Internación", "Derivación", "Óbito", "Observación"];
  $("#destination-report").innerHTML = destinations
    .map((destination) => {
      const value = state.patients.filter((p) => p.discharge?.destination === destination).length;
      return `<div class="report-row"><strong>${destination}</strong><span>${value}</span></div>`;
    })
    .join("");

  renderMedicationConsumptionReport();
}

function renderMedicationConsumptionReport() {
  const target = $("#medication-consumption-report");
  if (!target) return;
  const { start, end } = getWeekBounds(medicationReportDate);
  const administrations = state.patients.flatMap((patient) => {
    ensureNursing(patient);
    return patient.nursing.medications
      .filter((entry) => entry.status === "Administrada" && isWithinRange(entry.createdAt, start, end))
      .map((entry) => ({ ...entry, patient }));
  });
  const grouped = new Map();
  administrations.forEach((entry) => {
    const unit = entry.unit || "unidad";
    const key = `${entry.medication.trim().toLowerCase()}|${unit}`;
    const current = grouped.get(key) || {
      medication: entry.medication,
      unit,
      quantity: 0,
      administrations: 0,
      patients: new Set(),
      episodes: new Set(),
      lastAt: entry.createdAt,
    };
    current.quantity += Number(entry.quantity || 1);
    current.administrations += 1;
    current.patients.add(entry.patient.id);
    current.episodes.add(entry.patient.episodeNumber || entry.patient.id);
    if (new Date(entry.createdAt) > new Date(current.lastAt)) current.lastAt = entry.createdAt;
    grouped.set(key, current);
  });
  const rows = Array.from(grouped.values()).sort((a, b) => a.medication.localeCompare(b.medication, "es"));
  target.innerHTML = `
    <div class="report-toolbar">
      <label>Semana que contiene el día
        <input id="medication-report-date" type="date" value="${medicationReportDate}" />
      </label>
      <button class="secondary-button" id="print-medication-report">Imprimir informe semanal</button>
    </div>
    <p class="subtext">Período: ${formatWeekRange(medicationReportDate)}. Sólo suma registros con estado “Administrada”.</p>
    ${rows.length ? `
      <div class="table-wrap">
        <table class="consumption-table">
          <thead><tr><th>Medicación</th><th>Cantidad</th><th>Administraciones</th><th>Pacientes</th><th>Episodios</th><th>Último registro</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.medication)}</td>
                <td><strong>${formatQuantity(row.quantity)} ${escapeHtml(row.unit)}</strong></td>
                <td>${row.administrations}</td>
                <td>${row.patients.size}</td>
                <td>${row.episodes.size}</td>
                <td>${formatDateTime(row.lastAt)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    ` : emptyState("No hay medicación administrada durante esta semana.")}
  `;
  $("#medication-report-date")?.addEventListener("change", (event) => {
    medicationReportDate = event.currentTarget.value || todayInputValue();
    renderMedicationConsumptionReport();
  });
  $("#print-medication-report")?.addEventListener("click", () => {
    addAudit("Imprimió informe semanal de medicación", formatWeekRange(medicationReportDate));
    saveState();
    printMode("printing-medication-report");
  });
}

function getWeekBounds(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function isWithinRange(value, start, end) {
  const date = new Date(value);
  return date >= start && date < end;
}

function formatWeekRange(dateValue) {
  const { start, end } = getWeekBounds(dateValue);
  const lastDay = new Date(end);
  lastDay.setDate(end.getDate() - 1);
  return `${start.toLocaleDateString("es-AR")} al ${lastDay.toLocaleDateString("es-AR")}`;
}

function formatQuantity(value) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

function renderAudit() {
  $("#audit-list").innerHTML = state.audit.length
    ? state.audit.map((item) => `
      <div class="audit-item">
        <div>
          <strong>${escapeHtml(item.action)}</strong>
          <div class="subtext">${escapeHtml(item.target)}</div>
        </div>
        <div class="subtext">${formatDateTime(item.createdAt)}<br />${escapeHtml(item.user)}</div>
      </div>
    `).join("")
    : `<div class="empty-state">La auditoría se completará automáticamente al registrar acciones.</div>`;
}

function seedDemoData() {
  if (state.patients.length && !confirm("Esto agregará pacientes de ejemplo a los datos actuales. ¿Continuar?")) return;
  const now = new Date();
  const demo = [
    {
      familyName: "Torres",
      givenName: "Ana Belén",
      fullName: "Ana Belén Torres",
      documentId: "32988441",
      age: "48",
      sex: "Femenino",
      phone: "11 5555-0182",
      emergencyContact: "Carlos Torres, esposo, 11 5555-7711",
      clinicalRecord: "HCI-104522",
      episodeNumber: createEpisodeNumber(),
      coverage: "OSDE",
      coveragePlan: "210",
      affiliateNumber: "88772103",
      chiefComplaint: "Dolor torácico de 40 minutos de evolución",
      admissionDateTime: new Date(now.getTime() - 18 * 60000).toISOString(),
      admissionType: "SAME/107",
      internalTransferFrom: "",
      priority: "Roja",
      status: "En evaluación",
      location: "Shock room",
      responsible: "Emergentología",
    },
    {
      familyName: "Salvatierra",
      givenName: "Miguel Ángel",
      fullName: "Miguel Ángel Salvatierra",
      documentId: "18776520",
      age: "71",
      sex: "Masculino",
      phone: "11 5555-9134",
      emergencyContact: "Laura Salvatierra, hija, 11 5555-1828",
      clinicalRecord: "",
      episodeNumber: createEpisodeNumber(),
      coverage: "PAMI",
      coveragePlan: "",
      affiliateNumber: "18776520/00",
      chiefComplaint: "Disnea y fiebre",
      admissionDateTime: new Date(now.getTime() - 65 * 60000).toISOString(),
      admissionType: "Propios medios",
      internalTransferFrom: "",
      priority: "Naranja",
      status: "Pendiente de estudios",
      location: "Observación 2",
      responsible: "Emergentología",
    },
  ].map((patient, index) => ({
    ...patient,
    id: createId(),
    createdAt: new Date(now.getTime() - index * 42 * 60000).toISOString(),
    updatedAt: new Date(now.getTime() - index * 25 * 60000).toISOString(),
    initial: null,
    evolutions: [],
    orders: [],
    nursing: createEmptyNursing(),
    studies: [],
    consults: [],
    discharge: null,
  }));
  state.patients.unshift(...demo);
  demo.forEach((patient) => addAudit("Cargó paciente de ejemplo", patient.fullName, patient.id));
  saveState();
  showView("dashboard");
}

function createEmptyNursing() {
  return {
    shifts: [],
    vitals: [],
    medications: [],
    balance: [],
    cares: [],
    handoffs: [],
  };
}

function ensureNursing(patient) {
  if (!patient.nursing) patient.nursing = createEmptyNursing();
  Object.keys(createEmptyNursing()).forEach((key) => {
    if (!Array.isArray(patient.nursing[key])) patient.nursing[key] = [];
  });
}

function renderShiftSelect() {
  return `
    <select name="shift" required>
      <option>06-12</option>
      <option>12-18</option>
      <option>18-24</option>
      <option>24-06</option>
      <option>06-18</option>
      <option>18-06</option>
    </select>
  `;
}

function calculateNursingBalance(patient) {
  ensureNursing(patient);
  const shifts = ["06-12", "12-18", "18-24", "24-06", "06-18", "18-06"];
  const byShift = shifts.map((shift) => {
    const shiftRows = patient.nursing.balance.filter((entry) => entry.shift === shift);
    const input = sumBalanceRows(shiftRows, "Ingreso");
    const output = sumBalanceRows(shiftRows, "Egreso");
    const latestShift = patient.nursing.shifts.find((entry) => entry.shift === shift);
    return {
      shift,
      nurse: latestShift?.nurse || "",
      input,
      output,
      balance: input - output,
    };
  });
  const totalInput = byShift.reduce((sum, item) => sum + item.input, 0);
  const totalOutput = byShift.reduce((sum, item) => sum + item.output, 0);
  return {
    byShift,
    totalInput,
    totalOutput,
    totalBalance: totalInput - totalOutput,
  };
}

function sumBalanceRows(rows, movement) {
  return rows
    .filter((entry) => entry.movement === movement)
    .reduce((sum, entry) => sum + Number(entry.volume || 0), 0);
}

function formatSignedMl(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value} ml`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function timeInputValue() {
  return new Date().toTimeString().slice(0, 5);
}

function addAudit(action, target, entityId) {
  state.audit.unshift({
    id: createId(),
    action,
    target,
    entityId,
    user: `${getCurrentUser().name} (${getCurrentUser().role})`,
    createdAt: new Date().toISOString(),
  });
}

function getCurrentUser() {
  return users.find((user) => user.id === currentUserId) || users[0];
}

function getPermissions() {
  const roleKey = getCurrentUser().roleKey;
  return rolePermissions[roleKey] || rolePermissions.resident;
}

function canView(view) {
  if (view === "patient-detail") return getPermissions().views.includes("patient-detail");
  return getPermissions().views.includes(view);
}

function canEditTab(tab) {
  return getPermissions().editTabs.includes(tab);
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEpisodeNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = String(now.getTime()).slice(-5);
  const random = Math.floor(Math.random() * 90 + 10);
  return `EMG-${date}-${suffix}${random}`;
}

function getSelectedPatient() {
  return state.patients.find((patient) => patient.id === selectedPatientId);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function dateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatAdmissionType(patient) {
  if (!patient.admissionType) return "No consignado";
  if (patient.admissionType === "Traslado interno" && patient.internalTransferFrom) {
    return `${patient.admissionType} desde ${patient.internalTransferFrom}`;
  }
  return patient.admissionType;
}

function formatCoverage(patient) {
  const parts = [patient.coverage, patient.coveragePlan, patient.affiliateNumber ? `Afiliado ${patient.affiliateNumber}` : ""].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No consignada";
}

function setupAdmissionTypeToggle() {
  $$("[data-admission-type]").forEach((select) => {
    const container = select.closest("form") || document;
    const field = $("[data-internal-transfer-field]", container);
    if (!field) return;
    const update = () => {
      field.hidden = select.value !== "Traslado interno";
    };
    select.addEventListener("change", update);
    update();
  });
}

function setupOtherSelects(root = document) {
  $$("[data-other-select]", root).forEach((select) => {
    const field = document.getElementById(select.dataset.otherSelect);
    if (!field) return;
    const update = () => {
      const showOther = select.value === "Otros";
      field.hidden = !showOther;
      const input = $("input", field);
      if (input) input.required = showOther;
    };
    if (!select.dataset.otherSelectReady) {
      select.addEventListener("change", update);
      select.dataset.otherSelectReady = "true";
    }
    update();
  });
}

function setupAutomaticNursingSummary() {
  const form = $("[data-clinical-form='initial']");
  if (!form) return;
  const syndrome = $("[name='syndromicDiagnosis']", form);
  const impression = $("[name='diagnosticImpression']", form);
  const summary = $("[name='nursingSummary']", form);
  if (!syndrome || !impression || !summary) return;
  const update = () => {
    summary.value = buildNursingSummary(syndrome.value, impression.value);
  };
  syndrome.addEventListener("input", update);
  impression.addEventListener("input", update);
  update();
}

function buildNursingSummary(syndromicDiagnosis, diagnosticImpression) {
  const parts = [];
  const syndrome = String(syndromicDiagnosis || "").trim();
  const impression = String(diagnosticImpression || "").trim();
  if (syndrome) parts.push(`Diagnóstico sindromático: ${syndrome}.`);
  if (impression) parts.push(`Impresión diagnóstica: ${impression}.`);
  return parts.join(" ");
}

function selectedOrOther(option, other) {
  const value = option === "Otros" ? String(other || "").trim() : String(option || "").trim();
  return value || "No consignado";
}

function optionSelection(value, options) {
  const current = String(value || "").trim();
  if (options.includes(current)) return { option: current, other: "" };
  return { option: "Otros", other: current === "No consignado" || current === "No consignada" ? "" : current };
}

function formatPatientName(familyName, givenName) {
  return `${String(familyName || "").trim()}, ${String(givenName || "").trim()}`.replace(/^, |, $/g, "");
}

function getPatientNames(patient) {
  if (patient.familyName || patient.givenName) {
    return {
      familyName: patient.familyName || "",
      givenName: patient.givenName || "",
    };
  }
  const fullName = String(patient.fullName || "").trim();
  if (fullName.includes(",")) {
    const [familyName, ...givenParts] = fullName.split(",");
    return { familyName: familyName.trim(), givenName: givenParts.join(",").trim() };
  }
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    familyName: parts.length > 1 ? parts.pop() : fullName,
    givenName: parts.length > 1 || parts[0] !== fullName ? parts.join(" ") : "",
  };
}

function printMode(className) {
  document.body.classList.add(className);
  window.print();
  setTimeout(() => document.body.classList.remove(className), 500);
}

function labelFor(field) {
  const labels = {
    currentIllness: "Enfermedad actual",
    vitals: "Signos vitales",
    allergies: "Alergias",
    syndromicDiagnosis: "Diagnóstico sindromático",
    nursingSummary: "Resumen operativo para enfermería",
    precautions: "Precauciones",
    history: "Antecedentes",
    physicalExam: "Examen físico",
    diagnosticImpression: "Impresión diagnóstica",
    initialPlan: "Conducta inicial",
    problem: "Problema",
    note: "Evolución",
    plan: "Conducta",
    type: "Tipo",
    description: "Descripción",
    status: "Estado",
    result: "Solicitud / resultado",
    service: "Servicio",
    destination: "Destino final",
    finalDiagnosis: "Diagnóstico final",
    instructions: "Indicaciones",
    clinicalRecord: "HCI",
    episodeNumber: "Episodio",
    emergencyContact: "Contacto de emergencia",
    coveragePlan: "Plan",
    affiliateNumber: "N° afiliado",
    admissionDateTime: "Fecha/hora ingreso",
    admissionType: "Tipo de ingreso",
    internalTransferFrom: "Origen traslado interno",
    shift: "Turno",
    date: "Fecha",
    nurse: "Enfermero/a",
    shiftType: "Tipo de turno",
    time: "Hora",
    bp: "TA",
    hr: "FC",
    rr: "FR",
    sat: "SatO2",
    temp: "Temp.",
    pain: "Dolor",
    hgt: "HGT",
    sensorium: "Sensorio/Glasgow",
    scheduledTime: "Horario indicado",
    actualTime: "Hora real",
    medication: "Medicación",
    quantity: "Cantidad",
    unit: "Unidad",
    freeText: "Texto libre",
    movement: "Movimiento",
    category: "Categoría",
    volume: "Volumen",
    careType: "Cuidado",
    pending: "Pendientes",
    alerts: "Alertas",
    changes: "Cambios",
  };
  return labels[field] || field;
}

function emptyState(text) {
  return `<div class="empty-state">${text}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
