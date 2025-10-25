// Función global para el botón onclick
window.cargarBalanza = function() {
    console.log('Cargando balanza de comprobación...');  // Log mínimo (opcional)
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (!fechaFin) {
        document.getElementById('balanza').innerHTML = '<p>Por favor, selecciona una fecha límite válida.</p>';
        return;
    }
    
    const params = new URLSearchParams();
    params.append('fechaFin', fechaFin);
    const url = `/api/reportes/balanza-comprobacion?${params.toString()}`;
    
    console.log('URL:', url);  // Log mínimo
    
    const contenedor = document.getElementById('balanza');
    contenedor.innerHTML = '<p>Cargando balanza...</p>';  // Indicador de carga
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);  // Log mínimo
            if (!data.success || !data.data || data.data.length === 0) {
                contenedor.innerHTML = '<p>No hay datos hasta la fecha seleccionada.</p>';
                return;
            }
            
            // Calcular totales por columna
            let totalMovDeudor = 0;
            let totalMovAcreedor = 0;
            let totalSaldoDeudor = 0;
            let totalSaldoAcreedor = 0;
            data.data.forEach(item => {
                totalMovDeudor += parseFloat(item.mov_deudor || 0);
                totalMovAcreedor += parseFloat(item.mov_acreedor || 0);
                totalSaldoDeudor += parseFloat(item.saldo_deudor || 0);
                totalSaldoAcreedor += parseFloat(item.saldo_acreedor || 0);
            });
            
            let html = `
                <table class="reporte-table">
                    <thead>
                        <tr>
                            <th>ID Cuenta</th>
                            <th>Cuenta</th>
                            <th>Mov. Deudor</th>
                            <th>Mov. Acreedor</th>
                            <th>Saldo Deudor</th>
                            <th>Saldo Acreedor</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.data.forEach(item => {
                html += `
                    <tr>
                        <td>${item.id_cuenta || ''}</td>
                        <td>${item.nombre_cuenta || ''}</td>
                        <td class="text-right">${item.mov_deudor}</td>
                        <td class="text-right">${item.mov_acreedor}</td>
                        <td class="text-right">${item.saldo_deudor}</td>
                        <td class="text-right">${item.saldo_acreedor}</td>
                    </tr>
                `;
            });
            html += `
                    <tr class="total">
                        <td colspan="2">TOTAL</td>
                        <td class="text-right">${totalMovDeudor.toFixed(2)}</td>
                        <td class="text-right">${totalMovAcreedor.toFixed(2)}</td>
                        <td class="text-right">${totalSaldoDeudor.toFixed(2)}</td>
                        <td class="text-right">${totalSaldoAcreedor.toFixed(2)}</td>
                    </tr>
                    </tbody>
                </table>
                <div class="equilibrio">
                    <p><strong>Equilibrio:</strong> ${Math.abs(totalSaldoDeudor - totalSaldoAcreedor) < 0.01 ? '<span class="equilibrio-ok">✓ Sí (Deudor = Acreedor)</span>' : '<span class="equilibrio-error">✗ No (Diferencia: ' + (totalSaldoDeudor - totalSaldoAcreedor).toFixed(2) + ')</span>'}</p>
                    <p><em>Nota: Incluye todas las cuentas del catálogo. Saldo Deudor/Acreedor basado en saldo neto (Apertura + Mov. Deudor - Mov. Acreedor).</em></p>
                </div>
            `;
            contenedor.innerHTML = html;
        })
        .catch(error => {
            console.error('Error al cargar balanza:', error);
            contenedor.innerHTML = `<p>Error al cargar datos: ${error.message}</p>`;
        });
};

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM cargado para balanza de comprobación');  // Log mínimo (opcional)
    
    // Fecha por defecto: Hoy
    const hoy = new Date();
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];
    
    // Carga inicial
    window.cargarBalanza();
});