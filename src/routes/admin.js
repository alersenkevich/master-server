import { Router } from 'express'
import { adminController } from '../controllers'


const router = Router()

router.get('/', (req, res) => res.redirect('/admin/spectators'))
router.post('/spectators/delete', adminController.deleteSpectator)
router.get('/get-subdivisions', adminController.getSubdivisions)
router.post('/get-salepoints', adminController.getSalePoints)
router.post('/save-spectator', adminController.saveSpectator)
router.get('/spectators', adminController.getSpectators)
router.get('/slaves', adminController.getSlaves)
// router.get('/slaves', adminController.getSlaves)

export default router
