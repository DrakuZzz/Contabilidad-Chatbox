const detallesContainer = document.getElementById("detallesContainer");
const subtotalInput = document.getElementById("subtotal");
const ivaInput = document.getElementById("iva");
const totalInput = document.getElementById("total");

// Calcular total automáticamente
function calcularTotal() {
    const subtotal = parseFloat(subtotalInput.value) || 0;
    const iva = parseFloat(ivaInput.value) || 0;
    totalInput.value = (subtotal + iva).toFixed(2);
}
subtotalInput.addEventListener("input", calcularTotal);
ivaInput.addEventListener("input", calcularTotal);

// Cargar cuentas para selects
let cuentas = [];
async function cargarCuentas() {
    const res = await fetch("/catalogo/cuentas");
    cuentas = await res.json();
}
cargarCuentas();

// Crear fila detalle con porcentaje y monto calculado
function crearDetalleRow() {
    const div = document.createElement("div");
    div.style.marginBottom = "10px";

    // Cuenta
    const selectCuenta = document.createElement("select");
    cuentas.forEach(c => {
        const option = document.createElement("option");
        option.value = c.id_cuenta;
        option.textContent = `${c.Cuenta} (${c.Categoria} / ${c.Subcategoria})`;
        selectCuenta.appendChild(option);
    });

    // Modo ingreso: monto o porcentaje
    const selectModo = document.createElement("select");
    ["monto", "porcentaje"].forEach(modo => {
        const option = document.createElement("option");
        option.value = modo;
        option.textContent = modo === "monto" ? "Monto" : "Porcentaje";
        selectModo.appendChild(option);
    });

    // Base para porcentaje (solo visible si modo = porcentaje)
    const selectBase = document.createElement("select");
    ["total", "subtotal", "iva"].forEach(base => {
        const option = document.createElement("option");
        option.value = base;
        option.textContent = base.charAt(0).toUpperCase() + base.slice(1);
        selectBase.appendChild(option);
    });
    selectBase.style.display = "none";

    // Input porcentaje
    const inputPorcentaje = document.createElement("input");
    inputPorcentaje.type = "number";
    inputPorcentaje.step = "0.01";
    inputPorcentaje.min = "0";
    inputPorcentaje.max = "100";
    inputPorcentaje.placeholder = "Porcentaje %";
    inputPorcentaje.style.width = "100px";
    inputPorcentaje.title = "Porcentaje";
    inputPorcentaje.style.display = "none";

    // Input monto
    const inputMonto = document.createElement("input");
    inputMonto.type = "number";
    inputMonto.step = "0.01";
    inputMonto.min = "0";
    inputMonto.placeholder = "Monto";
    inputMonto.style.width = "120px";
    inputMonto.title = "Monto";

    // Tipo movimiento
    const selectTipo = document.createElement("select");
    ["debe", "haber"].forEach(t => {
        const option = document.createElement("option");
        option.value = t;
        option.textContent = t.toUpperCase();
        selectTipo.appendChild(option);
    });

    // Botón eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.onclick = () => div.remove();

    // Actualizar visibilidad y valores según modo
    function actualizarModo() {
        if (selectModo.value === "porcentaje") {
            selectBase.style.display = "inline-block";
            inputPorcentaje.style.display = "inline-block";
            inputMonto.readOnly = true;
            inputMonto.value = "";
            calcularMonto();
        } else {
            selectBase.style.display = "none";
            inputPorcentaje.style.display = "none";
            inputMonto.readOnly = false;
        }
    }

    // Calcular monto según porcentaje y base
    function calcularMonto() {
        if (selectModo.value !== "porcentaje") return;
        const porcentaje = parseFloat(inputPorcentaje.value) || 0;
        let baseValor = 0;
        switch (selectBase.value) {
            case "subtotal":
                baseValor = parseFloat(subtotalInput.value) || 0;
                break;
            case "iva":
                baseValor = parseFloat(ivaInput.value) || 0;
                break;
            case "total":
            default:
                baseValor = parseFloat(totalInput.value) || 0;
                break;
        }
        const montoCalc = (porcentaje / 100) * baseValor;
        inputMonto.value = montoCalc.toFixed(2);
    }

    selectModo.addEventListener("change", actualizarModo);
    selectBase.addEventListener("change", calcularMonto);
    inputPorcentaje.addEventListener("input", calcularMonto);
    subtotalInput.addEventListener("input", calcularMonto);
    ivaInput.addEventListener("input", calcularMonto);
    totalInput.addEventListener("input", calcularMonto);

    actualizarModo();

    div.appendChild(selectCuenta);
    div.appendChild(selectModo);
    div.appendChild(selectBase);
    div.appendChild(inputPorcentaje);
    div.appendChild(inputMonto);
    div.appendChild(selectTipo);
    div.appendChild(btnEliminar);

    detallesContainer.appendChild(div);
}

document.getElementById("addDetalleBtn").addEventListener("click", crearDetalleRow);

// Enviar formulario
document.getElementById("facturaForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const fecha = document.getElementById("fecha").value;
    const subtotal = parseFloat(subtotalInput.value);
    const iva = parseFloat(ivaInput.value);
    const total = parseFloat(totalInput.value);
    const descripcion = document.getElementById("descripcion").value;

    if (!tipo || !fecha || isNaN(subtotal) || isNaN(iva) || isNaN(total)) {
        alert("Complete todos los campos correctamente.");
        return;
    }

    const detallesDivs = detallesContainer.querySelectorAll("div");
    if (detallesDivs.length === 0) {
        alert("Agregue al menos un detalle.");
        return;
    }

    const detalles = [];
    for (const div of detallesDivs) {
        const selectCuenta = div.querySelector("select");
        const selectModo = div.querySelectorAll("select")[1];
        const selectBase = div.querySelectorAll("select")[2];
        const inputPorcentaje = div.querySelector("input[type=number][placeholder='Porcentaje %']");
        const inputMonto = div.querySelector("input[type=number][placeholder='Monto']");
        const selectTipo = div.querySelectorAll("select")[3];

        const id_cuenta = selectCuenta.value;
        const modo = selectModo.value;
        const base = modo === "porcentaje" ? selectBase.value : null;
        const porcentaje = modo === "porcentaje" ? parseFloat(inputPorcentaje.value) : null;
        const monto = parseFloat(inputMonto.value);
        const tipo_movimiento = selectTipo.value;

        if (!id_cuenta || isNaN(monto) || monto <= 0) {
            alert("Complete correctamente los detalles.");
            return;
        }
        if (modo === "porcentaje") {
            if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
                alert("Ingrese un porcentaje válido (0-100).");
                return;
            }
        }

        detalles.push({ id_cuenta, modo, base, porcentaje, monto, tipo_movimiento });
    }

    // **No se valida suma de porcentajes**

    try {
        const res = await fetch("/facturas/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo, fecha, subtotal, iva, total, descripcion, detalles })
        });

        const data = await res.json();

        if (data.success) {
            alert("Factura registrada con éxito");
            document.getElementById("facturaForm").reset();
            detallesContainer.innerHTML = "";
            totalInput.value = "";
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        alert("Error al conectar con el servidor");
        console.error(err);
    }
});


document.getElementById("addDetalleBtn").addEventListener("click", crearDetalleRow);

// Enviar formulario
document.getElementById("facturaForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const tipo = document.getElementById("tipo").value;
    const fecha = document.getElementById("fecha").value;
    const subtotal = parseFloat(subtotalInput.value);
    const iva = parseFloat(ivaInput.value);
    const total = parseFloat(totalInput.value);
    const descripcion = document.getElementById("descripcion").value;

    if (!tipo || !fecha || isNaN(subtotal) || isNaN(iva) || isNaN(total)) {
        alert("Complete todos los campos correctamente.");
        return;
    }

    const detallesDivs = detallesContainer.querySelectorAll("div");
    if (detallesDivs.length === 0) {
        alert("Agregue al menos un detalle.");
        return;
    }

    const detalles = [];
    for (const div of detallesDivs) {
        const selectCuenta = div.querySelector("select");
        const selectModo = div.querySelectorAll("select")[1];
        const selectBase = div.querySelectorAll("select")[2];
        const inputPorcentaje = div.querySelector("input[type=number][placeholder='Porcentaje %']");
        const inputMonto = div.querySelector("input[type=number][placeholder='Monto']");
        const selectTipo = div.querySelectorAll("select")[3];

        const id_cuenta = selectCuenta.value;
        const modo = selectModo.value;
        const base = modo === "porcentaje" ? selectBase.value : null;
        const porcentaje = modo === "porcentaje" ? parseFloat(inputPorcentaje.value) : null;
        const monto = parseFloat(inputMonto.value);
        const tipo_movimiento = selectTipo.value;

        // Validaciones
        if (!id_cuenta || isNaN(monto) || monto <= 0) {
            alert("Complete correctamente los detalles.");
            return;
        }
        if (modo === "porcentaje") {
            if (isNaN(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
                alert("Ingrese un porcentaje válido (0-100).");
                return;
            }
        }

        detalles.push({ id_cuenta, modo, base, porcentaje, monto, tipo_movimiento });
    }


    // Validar que suma de porcentajes sea 100%
    const sumaPorcentajes = detalles.reduce((acc, d) => acc + d.porcentaje, 0);
    if (Math.abs(sumaPorcentajes - 100) > 0.01) {
        alert("La suma de los porcentajes debe ser 100%");
        return;
    }

    try {
        const res = await fetch("/facturas/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo, fecha, subtotal, iva, total, descripcion, detalles })
        });

        const data = await res.json();

        if (data.success) {
            alert("Factura registrada con éxito");
            document.getElementById("facturaForm").reset();
            detallesContainer.innerHTML = "";
            totalInput.value = "";
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        alert("Error al conectar con el servidor");
        console.error(err);
    }
});
