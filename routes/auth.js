const express = require('express')
const router = express.Router()
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    logout
} = require('../controllers/auth')
const { protect } = require('../middleware/auth')
const users = require('./users')

// router.use('/users',users)

router
    .route('/register')
    .post(register)

router
    .route('/login')
    .post(login)

router
    .route('/me')
    .get(protect, getMe)

router
    .route('/forgotpassword')
    .post(forgotPassword)

router
    .route('/resetpassword/:resettoken')
    .put(resetPassword)

router
    .route('/updatedetails')
    .put(protect, updateDetails)

router
    .route('/updatepassword')
    .put(protect, updatePassword)

router
    .route('/logout')
    .get(logout)


// router.put('/updatepassword', protect,updatePassword)     # ANOTHER WAY

module.exports = router