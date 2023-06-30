const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err,req,res,next) => {
    let error = { ...err }
    error.message = err.message
    // Log the error
    console.log(err)

    // Mongoose bad ObjectId
    if(err.name === 'CastError')
    {
        const message = `Resource not found`
        error = new ErrorResponse(message,404)
    }

    // Mongoose duplicate key
    if(error.code === 11000)
    {
        const message = 'Duplicate field value enetered'
        error = new ErrorResponse(message,404)
    }

    // Mongoose Validation error
    if(err.name === 'ValidationError')
    {
        const message =  Object.values(err.errors).map(val => val.message)
        error = new ErrorResponse(message,404)
    }
    res.status(error.statusCode || 500).json({
        success:false,
        error:error.message || 'Server Error'
    })   
}

module.exports = errorHandler