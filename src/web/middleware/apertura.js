document.addEventListener("DOMContentLoaded", async () => {
    const select = document.getElementById("cuentasSelect");
    const tbody = document.querySelector("#tablaApertura tbody");

    // ✅ Función para crear fila en la tabla
    function crearFila(id, nombre, monto = 0) {
        const tr = document.createElement("tr");
        tr.dataset.id = id;

        tr.innerHTML = `
            <td>${nombre}</td>
            <td>${id}</td>
            <td><input type="number" min="0" step="0.01" class="montoInput" value="${monto}" /></td>
            <td><button class="cancelBtn">Eliminar</button></td>
        `;

        // Botón eliminar con backend
        tr.querySelector(".cancelBtn").addEventListener("click", async () => {
            if (confirm(`¿Seguro que deseas eliminar la cuenta "${nombre}"?`)) {
                try {
                    // Si la fila tenía monto registrado, asumimos que está en la BD
                    if (monto > 0) {
                        const res = await fetch(`/apertura/${id}`, { method: "DELETE" });
                        const data = await res.json();

                        if (!res.ok || !data.success) {
                            alert("❌ Error al eliminar en BD: " + (data.message || "No se pudo eliminar"));
                            return;
                        }
                    }

                    // Quitar del DOM
                    tr.remove();
                } catch (err) {
                    console.error("Error al eliminar cuenta:", err);
                    alert("❌ Error de conexión con el servidor.");
                }
            }
        });

        tbody.appendChild(tr);
    }

    // 1️⃣ Cargar todas las cuentas desde el backend para el select
    async function cargarCuentas() {
        try {
            const res = await fetch("/catalogo/cuentas");
            const cuentas = await res.json();

            cuentas.forEach(c => {
                const option = document.createElement("option");
                option.value = c.id_cuenta;
                option.textContent = `${c.Cuenta} (${c.Categoria} / ${c.Subcategoria})`;
                select.appendChild(option);
            });
        } catch (err) {
            console.error("Error al cargar cuentas:", err);
        }
    }

    // 2️⃣ Cargar asiento inicial ya guardado en BD
    async function cargarAsiento() {
        try {
            const res = await fetch("/apertura/datos");
            const data = await res.json();

            if (data.success) {
                tbody.innerHTML = "";
                data.data.forEach(item => {
                    crearFila(item.id_cuenta, item.Cuenta, item.Monto);
                });
            }
        } catch (err) {
            console.error("Error al cargar asiento:", err);
        }
    }

    // 3️⃣ Agregar cuenta seleccionada manualmente
    document.getElementById("agregarBtn").addEventListener("click", () => {
        const selectedId = select.value;
        const selectedText = select.options[select.selectedIndex].text;

        if (!selectedId) return;

        // Evitar duplicados
        if ([...tbody.querySelectorAll("tr")].some(tr => tr.dataset.id === selectedId)) {
            alert("Esta cuenta ya está agregada.");
            return;
        }

        crearFila(selectedId, selectedText);
    });

    // 4️⃣ Guardar apertura en BD
    document.getElementById("guardarBtn").addEventListener("click", async () => {
        const filas = [...tbody.querySelectorAll("tr")];
        const datos = filas.map(tr => {
            const id_cuenta = tr.dataset.id;
            const monto = parseFloat(tr.querySelector(".montoInput").value) || 0;
            return { id_cuenta, Monto: monto };
        }).filter(d => d.Monto > 0);

        if (datos.length === 0) {
            alert("Ingrese al menos un monto válido.");
            return;
        }

        try {
            const res = await fetch("/apertura/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datos)
            });

            const data = await res.json();

            if (res.ok) {
                alert("✅ Apertura registrada con éxito");
                await cargarAsiento(); // refresca tabla después de guardar
            } else {
                alert("❌ Error: " + (data.message || "No se pudo guardar"));
            }
        } catch (err) {
            console.error("Error al guardar apertura:", err);
            alert("❌ Error de conexión con el servidor.");
        }
    });

    // Inicializar todo
    await cargarCuentas();
    await cargarAsiento();
});
