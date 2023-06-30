const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')
const crypto = require('crypto')
const { reset } = require('nodemon')

// @desc    Register User
// @route   GET /api/v1/auth/register
// @access  Public

exports.register = asyncHandler(async (req,res,next) => {
    const {name, email, password, role} = req.body

    const user = await User.create({
        name,
        email,
        password,
        role
    })

    // Create Token
    // const token = user.getSignedJwtToken()
    // res.status(200).json({
    //     success:true,
    //     token:token
    // })
    sendTokenResponse(user,200,res)
}) 

// @desc    Login User
// @route   POST /api/v1/auth/login
// @access  Public

exports.login = asyncHandler(async (req,res,next) => {
    const { email, password} = req.body

    // validate email & password
    if(!email || !password)
    {
        return next(new ErrorResponse('Please provide an email and password',400))
    }

    // Check for user
    const user = await User.findOne({email}).select('+password');
    if (!user)
    {
        return next(new ErrorResponse('Invalid Credentials',401))
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)

    if(!isMatch)
    {
        return next(new ErrorResponse('Invalid Credentials',401))
    }
    // const token = user.getSignedJwtToken()
    // res.status(200).json({
    //     success:true,
    //     token:token
    // })
    sendTokenResponse(user,200,res)
})

// @desc    Log user out/ clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private

exports.logout = asyncHandler( async (req,res,next) =>{
    
    res.cookie('token','',{
        expires: new Date(Date.now()+10*1000),
        httpOnly:true
    })
    res.status(200).json({
        success:true,
        data:{}
    })
})


// @desc    Get current logged in user
// @route   POST /api/v1/auth/me
// @access  Private

exports.getMe = asyncHandler( async (req,res,next) =>{
    const user = await User.findById(req.user.id)
    res.status(200).json({
        success:true,
        data:user
    })
})


// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private

exports.updateDetails = asyncHandler( async (req,res,next) =>{
    const fieldToUpdate = {
        name:req.body.name,
        email:req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id,fieldToUpdate,{
        new:true,
        runValidators:true
    })
    res.status(200).json({
        success:true,
        data:user
    })
})


// @desc    Update Password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private

exports.updatePassword = asyncHandler( async (req,res,next) =>{
    const user = await User.findById(req.user.id).select('+password')

    // Check current password
    if(!(await user.matchPassword(req.body.currentPassword)))
    {
        return next(new ErrorResponse(`Enter corret current password`,401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user,200,res)
})

// @desc    Forget password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public

exports.forgotPassword = asyncHandler( async (req,res,next) =>{
    const user = await User.findOne({email:req.body.email})

    if(!user)
    {
        next(new ErrorResponse(`There is no User with that email`,404))
    }

    // get reset token
    const resetToken = user.getResetPasswordToken()
    
    await user.save({validateBeforeSave:false})
    
    // Create reset url
    const resetUrl = `${req.protocol}://${req.get('host')}/ap1/v1/auth/resetpassword/${resetToken}`
    
    const message = `You are receiving this email because you (or someone else) has requested the reset password. Please make a PUT request to:\n\n ${resetUrl}`

    try{
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        })
        return res.status(200).json({
            success:true,
            data:`An Email was sent to your account`
            })
    }
    catch(err)
    {
        console.log(err);
        user.resetpasswordToken = undefined
        user.resetPasswordExpired = undefined

        await user.save({validateBeforeSave:false})

        return next(new ErrorResponse(`email could not be sent`,500))
    }

    res.status(200).json({
        success:true,
        data:user
    })
})

// @desc    Reset Password
// @route   POST /api/v1/auth/resetpassword/:resettoken
// @access  Public

exports.resetPassword = asyncHandler( async (req,res,next) =>{

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex')

    const user = await User.findOne({
        resetpasswordToken:resetPasswordToken,
        resetPasswordExpired:{$gt:Date.now()
    }})

    if(!user)
    {
        return next(new ErrorResponse(`Token is Expired `,400))
    }

    user.password = req.body.password
    user.resetpasswordToken = undefined
    user.resetPasswordExpired = undefined

    await user.save()
    sendTokenResponse(user,200,res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user,statusCode,res) =>{
    // Create Token
    const token = user.getSignedJwtToken()
    const options = {
        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true,
    }

    if(process.env.NODE_ENV === 'production')
    {
        options.secure = true
    }
    res
        .status(statusCode)
        .cookie('token',token,options)
        .json({
            success:true,
            token
        }) 
}