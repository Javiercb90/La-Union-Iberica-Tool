console.log("[ControlPuntos] cargado");

(function () {

  const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzmIVtJIrCC8m8Q7BQ-UitE7Kl2G7Q4MzRvpAsNPJmoOz-5SxrtikzN6WlE_IW4v_iNaA/exec";

  function isAlliancePage() {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") === "alliance";
}

function isAllianceMemberList() {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") === "alliance" && params.get("mode") === "memberList";
}


  function createFixedPanel() {
    if (document.getElementById("alliance-fixed-panel")) return;

    const panel = document.createElement("div");
    panel.id = "alliance-fixed-panel";

    Object.assign(panel.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "340px",
      background: "rgba(0,0,0,0.85)",
      color: "white",
      padding: "12px",
      borderRadius: "6px",
      border: "1px solid #555",
      zIndex: "999999",
      fontFamily: "Arial",
      fontSize: "10px"
    });

    panel.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px;">LA UNIÓN IBÉRICA</div>
      <button id="extract-btn"
        style="width:100%; padding:6px; background:#1e88e5; color:white; border:none; border-radius:4px; cursor:pointer; margin-bottom:6px;">
        Estadisticas Alianza
      </button>
      <div id="extract-output" style="margin-top:4px; max-height:300px; overflow:auto; background:black; padding:6px; border-radius:4px; font-size:10px;"></div>
    `;

    document.body.appendChild(panel);

    document.getElementById("extract-btn").addEventListener("click", obtenerTabla);
  }

  // ===== GET usando xhttp =====
  function obtenerTabla() {
    const output = document.getElementById("extract-output");
    if (output) output.textContent = "Cargando datos...";

    chrome.runtime.sendMessage(
      {
        action: "xhttp",
        method: "GET",
        url: WEBAPP_URL
      },
      function (response) {
        if (!response || !response.responseText) {
          output.textContent = "Sin respuesta";
          return;
        }

        let data;
        try {
          data = JSON.parse(response.responseText);
        } catch {
          output.textContent = "Respuesta inválida";
          return;
        }

        const rows = data.rows || [];
        if (rows.length === 0) {
          output.textContent = "No hay datos.";
          return;
        }

        let html = `
          <table style="width:100%; border-collapse:collapse; font-size:10px; table-layout:fixed;">
            <tr>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Δ</th>
              <th>Cargo</th>
              <th>Coords</th>
              <th>Últ. conexión</th>
            </tr>
        `;

        rows.forEach(r => {

          const coords = r.coords || "";
          let coordsLink = coords;
        
          // Crear hipervínculo si viene tipo 1:2:7
          if (coords && coords.includes(":")) {
            const partes = coords.split(":");
            const g = partes[0];
            const s = partes[1];
            const p = partes[2];
        
            const urlGaleria = `https://pr0game.com/uni6/game.php?page=galaxy&galaxy=${g}&system=${s}&position=${p}`;
        
            coordsLink = `<a href="${urlGaleria}" target="_blank" style="color:#4fc3f7;">${coords}</a>`;
          }
        
          html += `
            <tr>
              <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:3px;">${r.name || ""}</td>
              <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:3px;">${r.puntosTexto || ""}</td>
              <td style="white-space:nowrap; padding:3px; text-align:center;">${r.diferencia || ""}</td>
              <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:3px;">${r.cargo || ""}</td>
              <td style="white-space:nowrap; padding:3px;">${coordsLink}</td>
              <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding:3px;">${r.lastConnection || ""}</td>
            </tr>
          `;
        });
        
        html += `</table>`;
        output.innerHTML = html;
      }
    );
  }

  // ===== POST automático usando xhttp =====
  function enviarMiembros(members) {
    chrome.runtime.sendMessage({
      action: "xhttp",
      method: "POST",
      url: WEBAPP_URL,
      //data: JSON.stringify(members)
      data: "payload=" + encodeURIComponent(JSON.stringify(members))
    });
  }

  function parseAllianceTable() {
    const table = document.querySelector("#memberList");
    if (!table) return [];

    const rows = Array.from(table.querySelectorAll("tr")).filter(r => !r.querySelector("th"));
    const members = [];

    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 8) continue;

      const name = cells[1].textContent.trim();
      const cargo = cells[3]?.textContent.trim() || "";
      const points = Number(cells[4]?.textContent.replace(/\./g, "").trim() || 0);
      const coords = cells[5]?.textContent.trim() || "";
      const lastConnection = cells[cells.length - 1].textContent.trim();

      members.push({ name, points, cargo, coords, lastConnection });
    }

    return members;
  }

    function start() {

    // ✅ El botón aparece en TODA la alianza
    if (isAlliancePage()) {
      createFixedPanel();
    }

    // ✅ El envío SOLO se hace en la lista de miembros
    if (isAllianceMemberList()) {
      setTimeout(() => {
        const members = parseAllianceTable();
        if (members.length > 0) enviarMiembros(members);
      }, 1000);
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    start();
  } else {
    window.addEventListener("DOMContentLoaded", start, { once: true });
  }

})();

