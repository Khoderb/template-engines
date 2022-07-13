
import fs from 'fs';
import express from 'express'
import  { Container } from './container.js'


const { Router } = express
const app = express()
const router = Router()

const products = new Container('products')

router.use(express.json())
router.use(express.urlencoded({extended:true}))

const PORT = process.env.PORT || 8080

app.use(express.static('public'));

//-------Get Products and save them on products array-------->

const bufferReader = async () => {
    const data = await fs.promises.readFile('products.json','utf-8')
    const productsArray = JSON.parse(data)  

    productsArray.forEach(product => products.save(product))
}
bufferReader()

const writer = async ()=>{
    try {
        await fs.promises.writeFile('products.json', JSON.stringify(products.getAll(), null, 2));
        console.log('Products Saved');
    } catch (error) {     
        throw new Error(`Writing error ${error}`);
    }
}

setInterval(() => {
    writer()
},30000)

app.set('views','./views')
app.set('view engine', 'pug')
//--------API NO-REST---------

router.get('/', (req, res) => {
    res.render('index',
        {
            products:products.getAll()
        })
})
//GET ONE 
router.get('/:id', (req, res) => {
    const id = req.params.id
    const product = products.getById(id)
    const error = new Error('Product not found')
    product ? res.json(product) 
    : res.json({ error: error.message })
})

//POST for POSTMAN
// router.post('/', auth, (req, res) => {
//     const product = req.body
//     products.save(product)
//     res.send(product)    

// })

//POST form
router.post('/', productAuth, (req, res) => {

    const { name, price, thumbnail } = req.body
    
    const product = {
        name,
        price:Number(price),
        thumbnail
    }

    products.save(product)

    setTimeout(() => res.redirect('/api/products'), 800)
})

//PUT
router.put('/:id', (req, res) => {
    const id = req.params.id
    const product = req.body
    
    if(!products.getById(id)){
        const error = new Error('Product not found')
        res.json({ error: error.message })
        return
    }
    if(!product){
        const error = new Error('Product not found')
        return res.status(404).json({ error: error.message })
    }
    const updatedProduct = products.updateOne(id, product)
    res.json(updatedProduct)
})

//DELETE
router.delete('/:id', (req, res) => {
    const id = req.params.id
    if(!products.getById(id)){
        const error = new Error('Product not found')
        return res.status(404).json({ error: error.message })
    }
    products.deleteOne(id)
    res.json(products.getAll())
})


// ---------------------Middleware --------------------
    function productAuth(req, res, next) {
        if(req.body.name !== "" && req.body.thumbnail !== "" && req.body.price !== "") {
            next() //acceso a la ruta y a listar
        } else{
            const error= new Error(`Error : Missing data, please complete all fields`)
            error.httpStatusCode = 404
            return next(error)
    }
}

app.use('/api/products', router)

const server = app.listen(PORT, () => {
    console.log(`The Magic PORT Is The ${server.address().port}`)
})

server.on('error', (err) => {
    console.log(err)
})
