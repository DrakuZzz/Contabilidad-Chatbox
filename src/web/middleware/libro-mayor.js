// Función global para el botón onclick
window.cargarLibroMayor = function() {
    console.log('Cargando libro mayor...');
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (!fechaInicio || !fechaFin) {
        document.getElementById('libroMayor').innerHTML = '<p>Por favor, selecciona un rango de fechas válido.</p>';
        return;
    }
    
    const params = new URLSearchParams();
    params.append('fechaInicio', fechaInicio);
    params.append('fechaFin', fechaFin);
    const url = `/api/reportes/libro-mayor?${params.toString()}`;
    
    console.log('URL:', url);
    
    const contenedor = document.getElementById('libroMayor');
    contenedor.innerHTML = '<p>Cargando...</p>'; // Indicador de carga
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            if (!data.success || !data.data || data.data.length === 0) {
                contenedor.innerHTML = '<p>No hay movimientos en el período seleccionado.</p>';
                return;
            }
            
            let html = '<div class="libro-mayor-contenedor">';
            
            data.data.forEach(cuenta => {
                if (parseFloat(cuenta.saldo_inicial.monto) === 0 && 
                    cuenta.movimientos_debe.length === 0 && 
                    cuenta.movimientos_haber.length === 0) {
                    return;
                }
                
                cuenta.movimientos_debe.sort((a, b) => new Date(a.fecha_original || a.fecha) - new Date(b.fecha_original || b.fecha));
                cuenta.movimientos_haber.sort((a, b) => new Date(a.fecha_original || a.fecha) - new Date(b.fecha_original || b.fecha));
                
                html += `
                    <div class="cuenta-section">
                        <h3>Cuenta: ${cuenta.nombre_cuenta} (ID: ${cuenta.id_cuenta})</h3>
                        <table class="libro-mayor-table">
                            <thead>
                                <tr>
                                    <th>Debe (Movimientos Deudor)</th>
                                    <th>Haber (Movimientos Acreedor)</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                let totalDebe = 0;
                let totalHaber = 0;
                
                let debeHtml = '<ul>';
                if (cuenta.saldo_inicial.tipo === 'debe') {
                    debeHtml += `<li><strong>Saldo Inicial</strong> - ${parseFloat(cuenta.saldo_inicial.monto).toFixed(2)}</li>`;
                    totalDebe += parseFloat(cuenta.saldo_inicial.monto);
                }
                cuenta.movimientos_debe.forEach(mov => {
                    debeHtml += `<li>Factura #${mov.id_factura || 'N/A'} - ${mov.descripcion || 'N/A'} - ${parseFloat(mov.monto).toFixed(2)}</li>`;
                    totalDebe += parseFloat(mov.monto);
                });
                debeHtml += '</ul>';
                
                let haberHtml = '<ul>';
                if (cuenta.saldo_inicial.tipo === 'haber') {
                    const montoAbs = Math.abs(parseFloat(cuenta.saldo_inicial.monto));
                    haberHtml += `<li><strong>Saldo Inicial</strong> - ${montoAbs.toFixed(2)}</li>`;
                    totalHaber += montoAbs;
                }
                cuenta.movimientos_haber.forEach(mov => {
                    haberHtml += `<li>Factura #${mov.id_factura || 'N/A'} - ${mov.descripcion || 'N/A'} - ${parseFloat(mov.monto).toFixed(2)}</li>`;
                    totalHaber += parseFloat(mov.monto);
                });
                haberHtml += '</ul>';
                
                html += `
                                <tr>
                                    <td>${debeHtml}</td>
                                    <td>${haberHtml}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td><strong>Total Debe: ${totalDebe.toFixed(2)}</strong></td>
                                    <td><strong>Total Haber: ${totalHaber.toFixed(2)}</strong></td>
                                </tr>
                                <tr>
                                    <td colspan="2">
                                        <strong>Saldo Final: ${parseFloat(cuenta.saldo_final.monto).toFixed(2)} - ${(cuenta.saldo_final.tipo ? cuenta.saldo_final.tipo.toUpperCase() : 'N/A')}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                `;
            });
            
            html += '</div>';
            contenedor.innerHTML = html;
        })
        .catch(error => {
            console.error('Error al cargar libro mayor:', error);
            contenedor.innerHTML = `<p>Error al cargar datos: ${error.message}. Verifica la consola para más detalles.</p>`;
        });
};

// El resto de tu código (DOMContentLoaded, etc.) permanece igual.

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM cargado para libro mayor');
    
    // Fechas por defecto: Año actual
    const hoy = new Date();
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    document.getElementById('fechaInicio').value = inicioAnio.toISOString().split('T')[0];
    document.getElementById('fechaFin').value = hoy.toISOString().split('T')[0];
    
    // Carga inicial
    window.cargarLibroMayor();
});