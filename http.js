const http = require('http');
let todos = [
    {name :"Ayush", age : 21},
    {name :"Devender", age : 21},
    {name :"Ashish", age : 21},
    {name :"Kshyap", age : 21},
]
const server = http.createServer((req,res)=>{
    console.log("PIYUSH")
    const {method, url}=req
    let body = [];
    
    req.on('data',(chunk)=>{
        body.push(chunk)
    })
    .on('end',()=>{
        body = Buffer.concat(body).toString()
        console.log(body)

        let status = 404;
        let response = {
            success:false,
            data:null,
            error:null
        };

        if(method === 'GET' && url === '/todos')
        {
            status = 200;
            response.success = true;
            response.data = todos;
        }
        else if(method === 'POST' && url === '/todos')
        {
            const {name, age} = JSON.parse(body)
            let duplicate_data = false;
            todos.forEach((todo)=>{
                if(todo.name === name && todo.age === age)
                {
                    duplicate_data = true
                }
            })
            if(!name || !age)
            {
                status = 400
                response.error = 'Please add name and age'
            }
            else if(duplicate_data)
            {
                status = 400
                response.error = "DUPLICATE DATA"
            }
            else{
                todos.push({name, age})
                status = 201
                response.success = true;
                response.data = todos
            }
        }
        res.writeHead(status,{
            'Content-Type':'application/json',
            'X-Powered-By':'Node.js'
        })
        
        res.end(JSON.stringify(response))
    })
    
});

const PORT = 4000
server.listen(PORT,()=>{
    console.log(`server running on ${PORT}`)
})