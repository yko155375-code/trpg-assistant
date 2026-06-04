function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export const publicInfoFields = [
  { key: "scene", label: "目前場景", rows: 2 },
  { key: "publicClues", label: "公開線索", rows: 4 },
  { key: "objectives", label: "任務目標", rows: 4 },
  { key: "announcement", label: "DM 公告", rows: 3 },
];

export function normalizeSession(session = {}) {
  const fear = Number.isFinite(Number(session.fear)) ? Number(session.fear) : 0;

  return {
    scene: session.scene || "",
    publicInfo: session.publicInfo || "",
    gmNotes: session.gmNotes || "",
    fear: Math.min(12, Math.max(0, fear)),
    hopePool: Number.isFinite(Number(session.hopePool)) ? Number(session.hopePool) : 0,
    publicClues: session.publicClues || "",
    objectives: session.objectives || "",
    announcement: session.announcement || "",
  };
}

export function updatePublicInfoField(state, field, value) {
  return {
    ...state,
    session: {
      ...normalizeSession(state.session),
      [field]: value,
    },
  };
}

export function renderPublicInfoEditor(state) {
  const session = normalizeSession(state.session);

  return `
    <section class="editor-panel public-info-panel">
      <div class="editor-heading">
        <h3>公開資訊管理</h3>
      </div>
      ${publicInfoFields
        .map(
          (field) => `
            <label class="form-field form-field-full">
              <span>${field.label}</span>
              <textarea data-public-info-field="${field.key}" rows="${field.rows}">${escapeHtml(session[field.key])}</textarea>
            </label>
          `,
        )
        .join("")}
    </section>
  `;
}

export function renderPublicInfoView(state) {
  const session = normalizeSession(state.session);

  return `
    <section class="public-info-view" aria-label="公開資訊">
      ${publicInfoFields
        .map(
          (field) => `
            <article class="public-info-card">
              <h3>${field.label}</h3>
              <p>${escapeHtml(session[field.key] || "尚未公開")}</p>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}
