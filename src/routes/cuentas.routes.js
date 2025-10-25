import { Router } from 'express';
import { getCuentas, addCuentas} from '../controllers/cuentascontroller.js';

const router = Router();
router.get('/cuentas', getCuentas);

router.post('/add', addCuentas);


export default router;