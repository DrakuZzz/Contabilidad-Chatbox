import express from "express";
import { 
  addFactura, 
  getFacturas, 
  getDetallesFactura, 
  guardarSaldosDespuesFactura, 
  getSaldosPorFactura 
} from "../controllers/facturascontroller.js";

const router = express.Router();

router.post("/facturas/add", addFactura);
router.get("/facturas", getFacturas);
router.get("/facturas/:id_factura/detalles", getDetallesFactura);

// Ruta para ejecutar el procedimiento almacenado que guarda saldos después de una factura
router.post("/facturas/:id_factura/guardar_saldos", guardarSaldosDespuesFactura);

// Ruta para obtener saldos por factura (unión Facturas + Saldos_Por_Factura + catalogo_cuentas)
router.get("/facturas/saldos", getSaldosPorFactura);

export default router;
