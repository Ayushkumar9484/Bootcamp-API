const express = require('express')
const path = require('path')
const dotenv = require('dotenv')
const morgan = require('morgan')
const colors = require('colors')
const errorHandler = require('./middleware/error')
const fileupload = require('express-fileupload')

// Route files
dotenv.config({ path : './config/config.env'});
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const authentication = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')
const logger = require('./middleware/logger')
const connectDb = require("./config/db")
const cookieParser = require('cookie-parser')
const mongoSanitizer = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

// Load env variables
const app = express()

// Body Parser
app.use(express.json())

//cookie Parser
app.use(cookieParser())

// Connect To Database
connectDb()


// Dev logging middleware
if(process.env.NODE_ENV === 'developement')
{
    app.use(morgan('dev'))
}

// File Upload
app.use(fileupload())

// Sanitize data
app.use(mongoSanitizer())

// Add header values for security
app.use(helmet())

// Prevent XSS attack
app.use(xss())

// Rate limiting
const limiter = rateLimit({
    windowMs:10 * 60 * 1000,  // 10 minutes
    max:100
})
app.use(limiter)

// Prevent hppt param pollution
app.use(hpp())

// Enable cors
app.use(cors())

// Set static folder
app.use(express.static(path.join(__dirname,'public')))

// Mount routers
app.use('/api/v1/bootcamps',bootcamps)
app.use('/api/v1/courses',courses)
app.use('/api/v1/auth',authentication)
app.use('/api/v1/users',users)
app.use('/api/v1/reviews',reviews)

app.use(errorHandler)

const PORT = process.env.PORT || 4000

const server = app.listen(PORT,()=>{
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold)
})


// Handle unhandled promise rejections
process.on('unhandledRejection',(err,promise) => {
    console.log(`Error : ${err.message}`.red.bold)
    server.close(()=>{
        process.exit(1)
    });
})




// npm run dev : to run development mode
// npm start : to run production mode