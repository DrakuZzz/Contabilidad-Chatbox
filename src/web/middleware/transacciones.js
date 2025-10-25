document.addEventListener("DOMContentLoaded", () => {
    mostrarCuentas();
    mostrarAsiento();
    mostrarFacturas();  // <-- nueva función llamada aquí
});

// === ELEMENTOS DEL CHAT ===
const toggleChatboxBtn = document.getElementById("toggleChatbox");
const chatbox = document.getElementById("chatbox");
const chatboxClose = document.getElementById("chatbox-close");
const sendMessageBtn = document.getElementById("sendMessage");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatbox-messages");
const preguntasColumna = document.getElementById("preguntas-columna");

// === MOSTRAR / OCULTAR CHATBOX ===
toggleChatboxBtn.addEventListener("click", () => {
    chatbox.style.display = chatbox.style.display === "none" ? "flex" : "none";
});

chatboxClose.addEventListener("click", () => {
    chatbox.style.display = "none";
});

// === PREGUNTAS DISPONIBLES ===
const preguntas = [
    "¿Qué es la Sustancia económica?",
    "¿Qué es la Entidad económica?",
    "¿Qué es el Negocio en marcha?",
    "¿Qué es la Devengación contable?",
    "¿Qué es la Asociación de costos y gastos con ingresos?",
    "¿Qué es la Valuación?",
    "¿Qué es la Dualidad económica?",
    "¿Qué es la Consistencia?",
    "¿Qué asume el Negocio en marcha?"
];

// === AGREGAR PREGUNTAS A LA COLUMNA IZQUIERDA ===
preguntas.forEach(p => {
    const btn = document.createElement("button");
    btn.textContent = p;
    btn.addEventListener("click", () => {
        chatInput.value = p;
        sendMessageBtn.click();
    });
    preguntasColumna.appendChild(btn);
});

// === ENVIAR MENSAJE ===
sendMessageBtn.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message) {
        // Mostrar mensaje del usuario
        const userMessage = document.createElement("p");
        userMessage.innerHTML = `<strong>Tú:</strong> ${message}`;
        chatMessages.appendChild(userMessage);
        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Generar respuesta automática
        setTimeout(() => {
            let response = "";
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes("sustancia económica")) {
                response = "<strong>Soporte:</strong> El registro de las transacciones de una organización debe captar la esencia económica de ésta y estar de acuerdo con su realidad económica y no sólo con la forma jurídica.";
            } else if (lowerMessage.includes("entidad económica")) {
                response = "<strong>Soporte:</strong> Establece que las operaciones y la contabilidad de una empresa son independientes a las de sus accionistas, acreedores o deudores, y a las de cualquier otra organización.";
            } else if (lowerMessage.includes("negocio en marcha") && !lowerMessage.includes("qué asume")) {
                response = "<strong>Soporte:</strong> Asume que la permanencia de la organización económica no tendrá límite o fin, con excepción de las entidades en liquidación.";
            } else if (lowerMessage.includes("devengación contable")) {
                response = "<strong>Soporte:</strong> Determina el momento preciso en que las transacciones de una entidad deben reconocerse contablemente.";
            } else if (lowerMessage.includes("asociación de costos y gastos con ingresos")) {
                response = "<strong>Soporte:</strong> Los costos y gastos de una entidad deben identificarse con los ingresos que generen en el mismo periodo.";
            } else if (lowerMessage.includes("valuación")) {
                response = "<strong>Soporte:</strong> En el registro contable de una transacción se debe captar el valor económico más objetivo. En un reconocimiento inicial, el valor económico más objetivo es el valor original de pago. En el reconocimiento posterior, dicho valor puede modificarse en caso de que cambien las características o la naturaleza del elemento a ser valuado.";
            } else if (lowerMessage.includes("dualidad económica")) {
                response = "<strong>Soporte:</strong> Todo recurso que posea una entidad tiene una fuente que lo ha generado.";
            } else if (lowerMessage.includes("consistencia")) {
                response = "<strong>Soporte:</strong> Ante la existencia de operaciones similares en una entidad, debe corresponder un tratamiento contable semejante, el cual debe permanecer a través del tiempo, en tanto no cambie la esencia económica de las operaciones.";
            } else if (lowerMessage.includes("asume el negocio en marcha")) {
                response = "<strong>Soporte:</strong> Este postulado asume que la permanencia del negocio en el mercado no tendrá límite, por lo que resulta válido usar valores de liquidación al cuantificar sus recursos y obligaciones.";
            } else {
                response = "<strong>Soporte:</strong> Gracias por tu mensaje. Estoy procesando tu consulta.";
            }

            // Mostrar respuesta
            const supportMessage = document.createElement("p");
            supportMessage.innerHTML = response;
            chatMessages.appendChild(supportMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 800);
    }
});

// === ENVIAR CON ENTER ===
chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessageBtn.click();
});



async function mostrarCuentas() {
    try {
        const res = await fetch("/catalogo/cuentas");
        const cuentas = await res.json();
        const container = document.getElementById("Cuentas");

        const table = document.createElement("table");
        table.border = "1";
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";

        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>ID Cuenta</th>
                <th>Cuenta</th>
                <th>Tipo</th>
                <th>Subtipo</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        cuentas.forEach((cue) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${cue.id_cuenta}</td>
                <td>${cue.Cuenta}</td>
                <td>${cue.Categoria}</td>
                <td>${cue.Subcategoria ?? "—"}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.innerHTML = "";
        container.appendChild(table);

    } catch (error) {
        console.error("Error al obtener cuentas:", error);
    }
}

async function mostrarAsiento() {
    const div = document.getElementById("Asiento");

    try {
        const res = await fetch("/apertura/asiento");
        const data = await res.json();

        if (!data.success) {
            div.innerHTML = "<p>Error al cargar asiento</p>";
            return;
        }

        let html = `
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>LO QUE LA EMPRESA TIENE</th>
                    <th>MONTO</th>
                    <th>POR QUÉ LO TIENE</th>
                    <th>MONTO</th>
                </tr>
        `;

        data.data.forEach(item => {
            html += `
                <tr>
                    <td>${item.Cuenta}</td>
                    <td>$${Number(item.Monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        });

        html += `
                <tr>
                    <td></td>
                    <td></td>
                    <td>CAPITAL SOCIAL</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                    <td>TOTAL ACTIVO</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                    <td>TOTAL CAPITAL</td>
                    <td>$${Number(data.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                </tr>
            </table>
        `;

        div.innerHTML = html;
    } catch (err) {
        console.error(err);
        div.innerHTML = "<p>Error de conexión con el servidor</p>";
    }
}

async function mostrarFacturas() {
    const div = document.getElementById("Facturas");
    if (!div) return;

    try {
        const res = await fetch("/facturas/saldos");
        const data = await res.json();

        if (!data.success || data.data.length === 0) {
            div.innerHTML = "<p>No hay facturas registradas.</p>";
            return;
        }

        div.innerHTML = "";

        const facturasMap = new Map();
        data.data.forEach(row => {
            if (!facturasMap.has(row.id_factura)) {
                facturasMap.set(row.id_factura, {
                    info: {
                        id_factura: row.id_factura,
                        tipo: row.tipo,
                        fecha: row.fecha,
                        subtotal: row.subtotal,
                        iva: row.iva,
                        total: row.total,
                        descripcion: row.descripcion || ""
                    },
                    cuentas: []
                });
            }
            facturasMap.get(row.id_factura).cuentas.push(row);
        });

        for (const [id, factura] of facturasMap.entries()) {
            const activos = factura.cuentas.filter(c => c.id_categoria === 1);
            const pasivos = factura.cuentas.filter(c => c.id_categoria === 2);

            const sumaSaldos = arr => arr.reduce((acc, cur) => acc + Number(cur.saldo), 0);

            const totalActivos = sumaSaldos(activos);
            const totalPasivos = pasivos.reduce((acc, cur) => acc + Math.abs(Number(cur.saldo)), 0);
            const totalCapital = totalActivos - totalPasivos;
            const totalPasivoCapital = totalPasivos + totalCapital;

            let html = `
                <h3>Factura ID: ${factura.info.id_factura} - Tipo: ${factura.info.tipo}</h3>
                <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
                    <thead>
                        <tr>
                            <th colspan="2" style="text-align: center; font-style: italic;">${factura.info.descripcion || "Sin descripción"}</th>
                        </tr>
                        <tr>
                            <th colspan="2" style="text-align: center; font-style: italic;">Fecha: ${factura.info.fecha}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="vertical-align: top; width: 50%;">
                                <strong>ACTIVO</strong>
                                <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                    <tbody>
            `;

            activos.forEach(c => {
                html += `<tr><td>${c.Cuenta}</td><td style="text-align:right;">$${Number(c.saldo).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`;
            });

            html += `
                                    <tr style="border-top: 1px solid black; font-weight: bold;">
                                        <td>TOTAL ACTIVO</td>
                                        <td style="text-align:right;">$${totalActivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td style="vertical-align: top; width: 50%;">
                                <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                    <tr>
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>PASIVO</strong>
                                            <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                                <tbody>
                `;

            pasivos.forEach(c => {
                html += `<tr><td>${c.Cuenta}</td><td style="text-align:right;">$${Math.abs(Number(c.saldo)).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td></tr>`;
            });

            html += `
                                                <tr style="border-top: 1px solid black; font-weight: bold;">
                                                    <td>TOTAL PASIVO</td>
                                                    <td style="text-align:right;">$${totalPasivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                        <td style="width: 50%; vertical-align: top;">
                                            <strong>CAPITAL SOCIAL</strong>
                                            <table border="0" cellpadding="3" cellspacing="0" style="width: 100%;">
                                                <tbody>
                                                    <tr>
                                                        <td>Capital Social</td>
                                                        <td style="text-align:right;">$${totalCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                    <tr style="border-top: 1px solid black; font-weight: bold;">
                                                        <td>Total Capital</td>
                                                        <td style="text-align:right;">$${totalCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right;">TOTAL ACTIVO</td>
                            <td style="font-weight: bold; text-align: right;">TOTAL PASIVO + CAPITAL</td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; text-align: right;">$${totalActivos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            <td style="font-weight: bold; text-align: right;">$${totalPasivoCapital.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>

                <button onclick="toggleDetalles(${factura.info.id_factura})" style="margin-bottom: 10px;">Mostrar/Ocultar Detalles Completos</button>
                <div id="detalles-${factura.info.id_factura}" style="display:none; padding: 10px; margin-bottom: 30px;">
                    <em>Cargando detalles...</em>
                </div>
            `;

            div.innerHTML += html;
        }

    } catch (error) {
        console.error("Error al mostrar facturas con balance:", error);
        div.innerHTML = "<p>Error al cargar facturas con balance.</p>";
    }
}

// Función para mostrar/ocultar detalles completos y cargarlos si es necesario
async function toggleDetalles(id_factura) {
    const contenedor = document.getElementById(`detalles-${id_factura}`);
    if (!contenedor) return;

    if (contenedor.style.display === "none") {
        // Mostrar contenedor
        contenedor.style.display = "block";

        // Si ya tiene contenido distinto a "Cargando detalles...", no recargar
        if (!contenedor.dataset.cargado) {
            contenedor.innerHTML = "<em>Cargando detalles...</em>";
            try {
                const res = await fetch(`/facturas/${id_factura}/detalles`);
                const data = await res.json();

                if (data.success && data.data.length > 0) {
                    let detallesHtml = `<table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <th>Cuenta</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                    `;

                    data.data.forEach(det => {
                        detallesHtml += `
                            <tr>
                                <td>${det.Cuenta}</td>
                                <td style="text-align:right;">$${Number(det.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                            </tr>
                        `;
                    });

                    detallesHtml += "</tbody></table>";
                    contenedor.innerHTML = detallesHtml;
                    contenedor.dataset.cargado = "true";
                } else {
                    contenedor.innerHTML = "<p>No hay detalles para esta factura.</p>";
                }
            } catch (err) {
                console.error("Error al cargar detalles:", err);
                contenedor.innerHTML = "<p>Error al cargar detalles.</p>";
            }
        }
    } else {
        // Ocultar contenedor
        contenedor.style.display = "none";
    }
}

document.getElementById("loadBalanceBtn").addEventListener("click", function () {
    const balanceTable = `
            <table>
                <tr>
                    <th colspan="5">Restaurante "El Ayuno"<br>Balance general al 7 de octubre de 2025</th>
                </tr>
                <tr>
                    <td colspan="5" class="section-title">Activo</td>
                </tr>
                <tr>
                    <td colspan="3" class="section-title">Activo circulante</td>
                    <td></td>
                    <td></td>
                </tr>
                <tr><td>Caja</td><td>$2,701.28</td><td></td><td></td><td></td></tr>
                <tr><td>Banco</td><td>$148,271.00</td><td></td><td></td><td></td></tr>
                <tr><td>Mercancía</td><td>$141,292.00</td><td></td><td></td><td></td></tr>
                <tr><td>Clientes</td><td>$37,120.00</td><td></td><td></td><td></td></tr>
                <tr><td>IVA acreditable</td><td>$3,406.72</td><td></td><td></td><td></td></tr>
                <tr><td>IVA por acreditar</td><td>$4,480.00</td><td></td><td></td><td></td></tr>
                <tr><td>Papelería y útiles</td><td>$22,000.00</td><td>$359,271.00</td><td></td><td></td></tr>

                <tr><td colspan="3" class="section-title">Activo no circulante</td><td></td><td></td></tr>
                <tr><td>Edificio</td><td>$1,500,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Edificio</td><td>$6,250.00</td><td>$1,493,750.00</td><td></td><td></td></tr>
                <tr><td>Terreno</td><td></td><td>$300,000.00</td><td></td><td></td></tr>
                <tr><td>Mobiliario y equipo</td><td>$140,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Mob. y Eq. Admón.</td><td>$1,166.66</td><td>$138,833.34</td><td></td><td></td></tr>
                <tr><td>Equipo de cómputo</td><td>$100,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Eq. Cómputo</td><td>$2,500.00</td><td>$97,500.00</td><td></td><td></td></tr>
                <tr><td>Equipo de entrega y reparto</td><td>$140,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Eq. Entrega y Reparto</td><td>$2,916.66</td><td>$137,083.34</td><td></td><td></td></tr>
                <tr><td>Equipo de transporte</td><td>$500,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Eq. Transporte</td><td>$10,416.66</td><td>$489,583.34</td><td></td><td></td></tr>
                <tr><td>Gastos de instalación</td><td>$30,000.00</td><td></td><td></td><td></td></tr>
                <tr><td>Dep. Gastos de instalación</td><td>$125.00</td><td>$29,875.00</td><td></td><td></td></tr>
                <tr><td colspan="3"></td><td>$2,686,625.02</td><td></td></tr>
                <tr><td colspan="3" class="section-title">Total Activo</td><td></td><td>$3,045,896.02</td></tr>

                <tr><td colspan="5" class="section-title">Pasivo</td></tr>
                <tr><td colspan="4" class="section-title">Pasivos a largo plazo</td><td></td></tr>
                <tr><td>Acreedores</td><td></td><td>$32,480.00</td><td></td><td></td></tr>
                <tr><td>IVA trasladado</td><td></td><td>$13,120.00</td><td></td><td></td></tr>
                <tr><td>IVA x trasladar</td><td></td><td>$5,120.00</td><td></td><td></td></tr>
                <tr><td>ISR por pagar</td><td></td><td>$18,765.30</td><td></td><td></td></tr>
                <tr><td>PTU por pagar</td><td></td><td>$6,255.10</td><td>$75,740.40</td><td></td></tr>

                <tr><td colspan="4" class="section-title">Total Pasivo</td><td>$75,740.40</td></tr>
                <tr><td colspan="4" class="section-title">Capital Contribuido</td><td></td></tr>
                <tr><td>Capital Social</td><td></td><td>$2,950,000.00</td><td></td><td></td></tr>
                <tr><td>Utilidad neta</td><td></td><td>$20,155.62</td><td>$2,970,155.62</td><td></td></tr>

                <tr><td colspan="4" class="section-title">Total pasivo y capital</td><td>$3,045,896.02</td></tr>
            </table>`;

    document.getElementById("balanceTable").innerHTML = balanceTable;
});