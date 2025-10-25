// Función principal (sin logs en pantalla)
function cargarLibroDiario() {
    console.log('Cargando libro diario...');  // Log mínimo en consola (opcional, quítalo si no lo quieres)

    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;

    if (!fechaInicio || !fechaFin) {
        // Establece fechas por defecto si están vacías
        const hoy = new Date();
        const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        const inicioStr = hace30Dias.toISOString().split('T')[0];
        const finStr = hoy.toISOString().split('T')[0];
        document.getElementById('fechaInicio').value = inicioStr;
        document.getElementById('fechaFin').value = finStr;
        // Reintenta después de setear
        setTimeout(cargarLibroDiario, 100);
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
        document.getElementById('libroDiario').innerHTML = '<p>La fecha de inicio no puede ser posterior a la fecha fin.</p>';
        return;
    }

    const params = new URLSearchParams();
    params.append('fechaInicio', fechaInicio);
    params.append('fechaFin', fechaFin);
    const url = `/api/reportes/libro-diario?${params.toString()}`;
    console.log('URL:', url);  // Log mínimo en consola (opcional)

    const contenedor = document.getElementById('libroDiario');
    contenedor.innerHTML = '<p>Cargando transacciones...</p>';

    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);  // Log mínimo
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);  // Log mínimo para verificar datos
            if (!data || !data.success || !data.data || data.data.length === 0) {
                contenedor.innerHTML = '<p>No hay transacciones en el período seleccionado.</p>';
                return;
            }

            let html = `
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>ID Factura</th>
                                    <th>Tipo</th>
                                    <th>Cuenta</th>
                                    <th>Debe/Haber</th>
                                    <th>Monto</th>
                                    <th>Descripción</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
            data.data.forEach(transaccion => {
                html += `
                            <tr>
                                <td>${transaccion.fecha || ''}</td>
                                <td>${transaccion.id_factura || ''}</td>
                                <td>${transaccion.tipo || ''}</td>
                                <td>${transaccion.cuenta || ''}</td>
                                <td>${transaccion.tipo_movimiento ? transaccion.tipo_movimiento.toUpperCase() : ''}</td>
                                <td>${parseFloat(transaccion.monto || 0).toFixed(2)}</td>
                                <td>${transaccion.descripcion || ''}</td>
                            </tr>
                        `;
            });
            html += '</tbody></table>';
            contenedor.innerHTML = html;
        })
        .catch(error => {
            console.error('Error en fetch:', error);  // Log de error en consola
            contenedor.innerHTML = `<p>Error al cargar datos: ${error.message}</p>`;
        });
}

// Inicialización (sin logs en pantalla)
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM cargado para libro diario');  // Log mínimo (opcional)

    // Fechas por defecto: Fecha inicio fija en 1/1/25, fecha fin en hoy
    document.getElementById('fechaInicio').value = '2025-01-01';
    const hoy = new Date();
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];

    // Carga inicial automática (con delay para asegurar DOM)
    setTimeout(() => {
        cargarLibroDiario();
    }, 500);
});